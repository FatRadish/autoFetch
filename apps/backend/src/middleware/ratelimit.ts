import rateLimit from 'express-rate-limit';

/**
 * 通用 API 限流
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制 100 次请求
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 登录限流（更严格）
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 50, // 限制 5 次登录尝试
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
  },
  skipSuccessfulRequests: true, // 成功的请求不计入限流
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 创建任务限流
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10, // 限制 10 次创建请求
  message: {
    success: false,
    error: 'Too many create requests, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 严格限流（用于敏感操作）
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 10, // 限制 10 次请求
  message: {
    success: false,
    error: 'Rate limit exceeded for this operation',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
