import type { ExecutionContext, ExecutionResult } from '../types/index.js';
import logger from '../utils/logger.js';

/**
 * 平台适配器基类
 * 所有平台适配器都应继承此类
 */
export abstract class BasePlatformAdapter {
  abstract readonly name: string;

  /**
   * 执行任务的核心方法
   * 子类必须实现此方法
   */
  abstract execute(context: ExecutionContext): Promise<ExecutionResult>;

  /**
   * 统一的错误处理
   */
  protected handleError(error: unknown): ExecutionResult {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error(`Platform adapter error [${this.name}]`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      message: 'Execution failed',
      error: errorMessage,
    };
  }

  /**
   * 验证执行上下文
   */
  protected validateContext(context: ExecutionContext): void {
    if (!context.account) {
      throw new Error('Account information is missing');
    }
    if (!context.task) {
      throw new Error('Task information is missing');
    }
    if (!context.platform) {
      throw new Error('Platform information is missing');
    }
  }

  /**
   * 获取配置值
   */
  protected getConfig<T>(
    context: ExecutionContext,
    key: string,
    defaultValue?: T
  ): T {
    const value =
      context.task.config[key] ?? context.platform.config[key] ?? defaultValue;
    if (value === undefined) {
      throw new Error(`Config key "${key}" is required but not found`);
    }
    return value as T;
  }

  /**
   * 日志辅助方法
   */
  protected log(
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: unknown
  ): void {
    logger[level](`[${this.name}] ${message}`, data);
  }
}
