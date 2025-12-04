// 适配器相关类型
export interface ExecutionContext {
  account: {
    id: string;
    name: string;
    cookies: string;
    userAgent: string;
    headers: Record<string, string>;
    proxy?: ProxyConfig;
  };
  task: {
    id: string;
    name: string;
    config: Record<string, unknown>;
    retryTimes: number;
    timeout: number;
  };
  platform: {
    id: string;
    name: string;
    adapterType: 'http' | 'browser';
    config: Record<string, unknown>;
  };
  platformTask?: {
    id?: string;
    name?: string;
    key?: string;
  };
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  cookies?: string;
  userAgent?: string;
  data?: unknown;
  timeout?: number;
  proxy?: ProxyConfig;
}

export interface ProxyConfig {
  enabled: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

// Cookie 相关类型
export interface ParsedCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

// 任务调度相关类型
export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  accountId: string;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export interface TaskExecutionLog {
  taskId: string;
  status: 'success' | 'failed' | 'running';
  message?: string;
  details?: Record<string, unknown>;
  startedAt: Date;
  finishedAt?: Date;
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 认证相关类型
export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email?: string;
    role: string;
  };
}

// 平台配置类型
export interface PlatformConfig {
  checkInUrl?: string;
  pointsUrl?: string;
  apiEndpoint?: string;
  selectors?: Record<string, string>;
  [key: string]: unknown;
}

// 通知配置类型
export interface NotificationConfig {
  type: 'email' | 'webhook';
  enabled: boolean;
  email?: EmailConfig;
  webhook?: WebhookConfig;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  to: string[];
}

export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  template?: string;
}

// 错误类型
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}
