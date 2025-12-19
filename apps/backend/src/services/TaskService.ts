import prisma from '../lib/prisma.js';
import { JwtPayload, NotFoundError, ValidationError } from '../types/index.js';
import { scheduler } from '../scheduler/index.js';

export class TaskService {
  /**
   * 获取所有任务
   */
  static async getAll(data: {
    accountId?: string;
    taskName?: string;
    user: JwtPayload;
  }) {
    const { accountId, taskName } = data;
    const tasks = await prisma.task.findMany({
      where: {
        userId: data.user.userId,
        ...(accountId ? { accountId } : {}),
        ...(taskName ? { name: { contains: taskName } } : {}),
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            cookies: true,
            headers: true,
            proxy: true,
            userAgent: true,
            platformId: true,
            platform: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
        platformTask: {
          select: {
            name: true,
            key: true,
          },
        },
        _count: {
          select: { logs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasks;
  }

  /**
   * 根据 ID 获取任务
   */
  static async getById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            cookies: true,
            headers: true,
            proxy: true,
            userAgent: true,
            platformId: true,
            platform: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        platformTask: {
          select: {
            name: true,
            key: true,
            id: true,
          },
        },
        _count: {
          select: { logs: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return task;
  }

  /**
   * 创建任务
   */
  static async create(
    data: {
      accountId: string;
      name: string;
      schedule: string;
      config?: Record<string, unknown>;
      retryTimes?: number;
      timeout?: number;
      platformTaskId?: string;
    },
    user: JwtPayload
  ) {
    const account = await prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      throw new NotFoundError('没有找到对应的账号！');
    }

    const existingTask = await prisma.task.findUnique({
      where: { name: data.name },
    });

    if (existingTask) {
      throw new ValidationError('任务名称已存在！');
    }

    const task = await prisma.task.create({
      data: {
        userId: user.userId,
        accountId: data.accountId,
        name: data.name,
        schedule: data.schedule,
        config: data.config ? JSON.stringify(data.config) : undefined,
        retryTimes: data.retryTimes,
        timeout: data.timeout,
        platformTaskId: data.platformTaskId,
      },
    });

    // 同步到调度器
    scheduler.schedule(task.id, task.schedule);

    return task;
  }

  /**
   * 更新任务
   */
  static async update(
    taskId: string,
    data: {
      accountId?: string;
      platformTaskId?: string;
      name?: string;
      schedule?: string;
      enabled?: boolean;
      retryTimes?: number;
      timeout?: number;
      config?: Record<string, unknown>;
    }
  ) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // 如果要更新名称，检查是否已存在
    if (data.name && data.name !== task.name) {
      const existing = await prisma.task.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        throw new ValidationError('任务名称已存在！');
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        accountId: data.accountId,
        platformTaskId: data.platformTaskId,
        name: data.name,
        schedule: data.schedule,
        enabled: data.enabled,
        retryTimes: data.retryTimes,
        timeout: data.timeout,
        config: data.config ? JSON.stringify(data.config) : undefined,
      },
    });

    // 同步到调度器（启用状态或 schedule 变化时重新调度）
    await scheduler.reschedule(updated.id);

    return updated;
  }

  /**
   * 删除任务
   */
  static async delete(id: string) {
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // 取消调度
    scheduler.cancel(id);

    await prisma.task.delete({ where: { id } });
  }
}
