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
      const messages = error.issues.map(
        (err: any) => `${err.path.join('.')}: ${err.message}`
      );
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
    const messages = result.error.issues.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );
    return { success: false, error: messages.join('; ') };
  }
}

/**
 * 简单的 cron 表达式校验器，支持常见的 5 或 6 字段表达式（空格分隔）
 * - 5 字段: minute hour day month weekday
 * - 6 字段: second minute hour day month weekday
 * 此校验器使用宽松的字段模式，允许 '*', 数字, 范围, 步进和逗号列表。
 */
function isValidCron(expr: unknown): boolean {
  if (typeof expr !== 'string') return false;
  const s = expr.trim();
  if (!s) return false;
  const parts = s.split(/\s+/);
  if (!(parts.length === 5 || parts.length === 6)) return false;

  // 每一段允许: '*' 或 数字 或 数字-数字 (range)，可选 /step，段之间可用逗号分隔的多个子段
  const fieldRegex = /^(\*|\d+|\d+-\d+)(\/\d+)?(,(\*|\d+|\d+-\d+)(\/\d+)?)*$/;

  // 允许一些额外的符号组合（例如在某些实现中支持的 L,W,#,?）
  const extraRegex = /^[*\d,\-/?LW#]+$/i;

  return parts.every((p) => fieldRegex.test(p) || extraRegex.test(p));
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
    config: z.record(z.string(), z.unknown()).default({}),
  }),

  updatePlatform: z.object({
    name: z.string().min(1).optional(),
    icon: z.string().optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    adapterType: z.enum(['http', 'browser']).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  }),

  // 账号相关
  createAccount: z.object({
    platformId: z.string().cuid(),
    name: z.string().min(1, 'Account name is required'),
    cookies: z.string().min(1, 'Cookies are required'),
    userAgent: z.string().min(1, 'User agent is required'),
    headers: z.record(z.string(), z.string()).optional(),
    proxy: z
      .object({
        enabled: z.boolean(),
        host: z.string().optional(),
        port: z.number().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      })
      .optional(),
    refreshToken: z.string().optional(),
  }),

  updateAccount: z.object({
    name: z.string().min(1).optional(),
    cookies: z.string().min(1).optional(),
    userAgent: z.string().min(1).optional(),
    headers: z.record(z.string(), z.string()).optional(),
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
    refreshToken: z.string().min(1).nullable().optional(),
    lastRefreshTime: z.coerce.date().nullable().optional(),
  }),

  // 任务相关
  createTask: z.object({
    accountId: z.string().cuid(),
    name: z.string().min(1, 'Task name is required'),
    schedule: z
      .string()
      .min(1, 'Schedule is required')
      .refine((val) => isValidCron(val), {
        message: 'Invalid cron expression',
      }),
    retryTimes: z.number().min(0).max(10).default(3),
    timeout: z.number().min(1000).max(300000).default(30000),
    config: z.record(z.string(), z.unknown()).optional(),
    platformTaskId: z.string().cuid().optional(),
  }),

  updateTask: z.object({
    accountId: z.string().cuid().optional(),
    name: z.string().min(1).optional(),
    schedule: z
      .string()
      .min(1)
      .optional()
      .refine((val) => val === undefined || isValidCron(val), {
        message: 'Invalid cron expression',
      }),
    enabled: z.boolean().optional(),
    retryTimes: z.number().min(0).max(10).optional(),
    timeout: z.number().min(1000).max(300000).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    platformTaskId: z.string().cuid().optional(),
  }),

  // 分页查询
  pagination: z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(20),
  }),
};
