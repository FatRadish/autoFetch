import { Cron } from 'croner';
import prisma from '../lib/prisma.js';
import { adapterRegistry } from '../adapters/registry.js';
import type { ExecutionContext, ExecutionResult } from '../types/index.js';
import logger from '../utils/logger.js';
import { encrypt, decrypt } from '../utils/encrypt.js';
import { validateCookies } from '../utils/cookie.js';
import config from '../config/index.js';
/**
 * 任务执行器
 */
class TaskRunner {
  /**
   * 执行单个任务
   */
  static async run(taskId: string): Promise<ExecutionResult> {
    logger.info(`[Scheduler] Starting task: ${taskId}`);

    // 1. 获取任务及关联数据
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        account: {
          include: { platform: true },
        },
        platformTask: true,
      },
    });

    if (!task || !task.enabled) {
      logger.warn(`[Scheduler] Task ${taskId} not found or disabled`);
      return { success: false, message: 'Task not found or disabled' };
    }

    // 2. 创建执行日志
    const log = await prisma.log.create({
      data: {
        taskId,
        status: 'running',
        startedAt: new Date(),
      },
    });

    try {
      // 3. 构建执行上下文
      const context: ExecutionContext = {
        account: {
          id: task.account.id,
          name: task.account.name,
          cookies: decrypt(task.account.cookies, config.encryption.secret),
          userAgent: task.account.userAgent,
          headers: JSON.parse(task.account.headers || '{}'),
          proxy: JSON.parse(task.account.proxy || '{}'),
          refreshToken: task.account.refreshToken,
          lastRefreshTime: task.account.lastRefreshTime,
        },
        task: {
          id: task.id,
          name: task.name,
          config: JSON.parse(task.config || '{}'),
          retryTimes: task.retryTimes,
          timeout: task.timeout,
        },
        platform: {
          id: task.account.platform.id,
          name: task.account.platform.name,
          adapterType: task.account.platform.adapterType as 'http' | 'browser',
          config: JSON.parse(task.account.platform.config || '{}'),
        },
        platformTask: {
          id: task.platformTask?.id,
          name: task.platformTask?.name,
          key: task.platformTask?.key,
        },
      };

      // 4. 获取适配器
      const adapter = adapterRegistry.get(task.account.platform.icon!);
      if (!adapter) {
        throw new Error(`Adapter not found: ${task.account.platform.icon!}`);
      }

      // 5. 执行任务（带重试）
      const result = await this.executeWithRetry(
        () => adapter.execute(context),
        task.retryTimes,
        task.timeout
      );

      // 6. 更新日志
      await prisma.log.update({
        where: { id: log.id },
        data: {
          status: result.success ? 'success' : 'failed',
          message: result.message,
          details: JSON.stringify(result.data || {}),
          finishedAt: new Date(),
        },
      });

      // 7. 更新任务的 lastRunAt
      await prisma.task.update({
        where: { id: taskId },
        data: {
          lastRunAt: new Date(),
          nextRunAt: scheduler.getNextRun(taskId),
        },
      });

      logger.info(
        `[Scheduler] Task ${taskId} completed: ${result.success ? 'success' : 'failed'}`
      );
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // 更新日志为失败状态
      await prisma.log.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          message: errorMessage,
          finishedAt: new Date(),
        },
      });

      logger.error(`[Scheduler] Task ${taskId} failed:`, error);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * 带重试和超时的执行
   */
  private static async executeWithRetry(
    fn: () => Promise<ExecutionResult>,
    retries: number,
    timeout: number
  ): Promise<ExecutionResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // 超时控制
        const result = await Promise.race([
          fn(),
          new Promise<ExecutionResult>((_, reject) =>
            setTimeout(() => reject(new Error('Execution timeout')), timeout)
          ),
        ]);

        if (result.success) {
          return result;
        }

        // 任务返回失败但没抛异常，记录并重试
        lastError = new Error(result.message || 'Task failed');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.warn(
          `[Scheduler] Attempt ${attempt + 1} failed: ${lastError.message}`
        );
      }

      // 等待后重试（指数退避）
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt))
        );
      }
    }

    return {
      success: false,
      message: `All ${retries + 1} attempts failed: ${lastError?.message}`,
    };
  }
}

/**
 * Cron 调度管理器
 */
class Scheduler {
  private jobs: Map<string, Cron> = new Map();
  private initialized = false;

  /**
   * 初始化调度器，加载所有已启用的任务
   */
  async init(): Promise<void> {
    if (this.initialized) {
      logger.warn('[Scheduler] Already initialized');
      return;
    }

    logger.info('[Scheduler] Initializing...');

    const tasks = await prisma.task.findMany({
      where: { enabled: true },
    });

    for (const task of tasks) {
      this.schedule(task.id, task.schedule);
    }

    this.initialized = true;
    logger.info(`[Scheduler] Initialized with ${tasks.length} tasks`);
  }

  /**
   * 调度单个任务
   */
  schedule(taskId: string, cronExpr: string): void {
    // 先取消旧的调度
    this.cancel(taskId);

    try {
      const job = new Cron(cronExpr, async () => {
        await TaskRunner.run(taskId);
      });

      this.jobs.set(taskId, job);
      logger.info(
        `[Scheduler] Scheduled task ${taskId} with cron: ${cronExpr}`
      );
    } catch (error) {
      logger.error(`[Scheduler] Failed to schedule task ${taskId}:`, error);
    }
  }

  /**
   * 取消任务调度
   */
  cancel(taskId: string): void {
    const job = this.jobs.get(taskId);
    if (job) {
      job.stop();
      this.jobs.delete(taskId);
      logger.info(`[Scheduler] Cancelled task ${taskId}`);
    }
  }

  /**
   * 重新调度任务
   */
  async reschedule(taskId: string): Promise<void> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      this.cancel(taskId);
      return;
    }

    if (task.enabled) {
      this.schedule(taskId, task.schedule);
    } else {
      this.cancel(taskId);
    }
  }

  /**
   * 获取任务的下次运行时间
   */
  getNextRun(taskId: string): Date | null {
    const job = this.jobs.get(taskId);
    if (!job) return null;
    return job.nextRun() || null;
  }

  /**
   * 手动触发任务执行
   */
  async trigger(taskId: string): Promise<ExecutionResult> {
    return TaskRunner.run(taskId);
  }

  /**
   * 停止所有调度
   */
  stop(): void {
    logger.info('[Scheduler] Stopping all jobs...');
    for (const [taskId, job] of this.jobs) {
      job.stop();
      logger.info(`[Scheduler] Stopped task ${taskId}`);
    }
    this.jobs.clear();
    this.initialized = false;
    logger.info('[Scheduler] All jobs stopped');
  }

  /**
   * 获取调度器状态
   */
  getStatus(): { taskId: string; nextRun: Date | null }[] {
    return Array.from(this.jobs.entries()).map(([taskId, job]) => ({
      taskId,
      nextRun: job.nextRun() || null,
    }));
  }
}

// 导出单例
export const scheduler = new Scheduler();
export { TaskRunner };
