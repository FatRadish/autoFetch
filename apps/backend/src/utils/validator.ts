import { z } from 'zod';
import { ValidationError } from '../types/index.js';

/**
 * 验证数据
 * @param schema Zod schema
 * @param data 要验证的数据
 * @throws ValidationError 如果验证失败
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      throw new ValidationError(messages.join('; '));
    }
    throw error;
  }
}

/**
 * 安全验证数据（返回结果而不是抛出异常）
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const messages = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    return { success: false, error: messages.join('; ') };
  }
}

// 常用验证 schemas
export const schemas = {
  // 用户相关
  login: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),

  createUser: z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6).max(100),
    email: z.string().email().optional(),
    role: z.enum(['admin', 'user']).default('user'),
  }),

  // 平台相关
  createPlatform: z.object({
    name: z.string().min(1, 'Platform name is required'),
    icon: z.string().optional(),
    description: z.string().optional(),
    adapterType: z.enum(['http', 'browser']),
    config: z.record(z.unknown()).default({}),
  }),

  updatePlatform: z.object({
    name: z.string().min(1).optional(),
    icon: z.string().optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    adapterType: z.enum(['http', 'browser']).optional(),
    config: z.record(z.unknown()).optional(),
  }),

  // 账号相关
  createAccount: z.object({
    platformId: z.string().cuid(),
    name: z.string().min(1, 'Account name is required'),
    cookies: z.string().min(1, 'Cookies are required'),
    userAgent: z.string().min(1, 'User agent is required'),
    headers: z.record(z.string()).optional(),
    proxy: z
      .object({
        enabled: z.boolean(),
        host: z.string().optional(),
        port: z.number().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      })
      .optional(),
  }),

  updateAccount: z.object({
    name: z.string().min(1).optional(),
    cookies: z.string().min(1).optional(),
    userAgent: z.string().min(1).optional(),
    headers: z.record(z.string()).optional(),
    proxy: z
      .object({
        enabled: z.boolean(),
        host: z.string().optional(),
        port: z.number().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      })
      .optional(),
    enabled: z.boolean().optional(),
  }),

  // 任务相关
  createTask: z.object({
    accountId: z.string().cuid(),
    name: z.string().min(1, 'Task name is required'),
    schedule: z.string().min(1, 'Schedule is required'),
    retryTimes: z.number().min(0).max(10).default(3),
    timeout: z.number().min(1000).max(300000).default(30000),
    config: z.record(z.unknown()).optional(),
  }),

  updateTask: z.object({
    name: z.string().min(1).optional(),
    schedule: z.string().min(1).optional(),
    enabled: z.boolean().optional(),
    retryTimes: z.number().min(0).max(10).optional(),
    timeout: z.number().min(1000).max(300000).optional(),
    config: z.record(z.unknown()).optional(),
  }),

  // 分页查询
  pagination: z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(20),
  }),
};
