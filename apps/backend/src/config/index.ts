import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量（静默模式）
dotenv.config({
  path: path.join(__dirname, '../../.env'),
  debug: false, // 关闭调试信息输出
});

export const config = {
  // 服务器配置
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // 加密配置
  encryption: {
    secret:
      process.env.ENCRYPTION_SECRET ||
      'your-encryption-secret-change-in-production',
  },

  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // 任务调度配置
  scheduler: {
    enabled: process.env.SCHEDULER_ENABLED !== 'false',
    timezone: process.env.SCHEDULER_TIMEZONE || 'Asia/Shanghai',
  },
};

export default config;
