import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config/index.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { apiLimiter } from './middleware/ratelimit.js';

// 导入路由
import authRoutes from './routes/auth.js';
import platformRoutes from './routes/platforms.js';
import accountRoutes from './routes/accounts.js';

// 设置开发环境标志
__DEV__ = process.env.NODE_ENV !== 'production';

const app: Express = express();

// 中间件
app.use(helmet()); // 安全头
app.use(cors(config.cors)); // CORS
app.use(express.json()); // JSON 解析
app.use(express.urlencoded({ extended: true })); // URL 编码解析
app.use(cookieParser()); // Cookie 解析

// 日志中间件
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// API 限流
app.use('/api', apiLimiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API 路由
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'AutoFetch API',
    version: '0.1.0',
  });
});

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/accounts', accountRoutes);

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
const server = app.listen(config.server.port, config.server.host, () => {
  logger.info(`Server is running on http://${config.server.host}:${config.server.port}`);
  logger.info(`Environment: ${config.server.env}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
