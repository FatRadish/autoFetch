import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/client';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 处理 SQLite 数据库路径
let connectionString = process.env.DATABASE_URL || 'file:./dev.db';

// 如果是 file: 协议的相对路径，转换为绝对路径
if (connectionString.startsWith('file:./')) {
  const relativePath = connectionString.replace('file:./', '');
  const absolutePath = path.join(__dirname, '../..', relativePath);
  connectionString = `file:${absolutePath}`;
}

const adapter = new PrismaBetterSqlite3({ url: connectionString });

// 创建 Prisma 客户端实例
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  adapter,
});

// 连接事件监听
prisma
  .$connect()
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch((error) => {
    logger.error('Failed to connect to database', error);
    console.error('Database connection error:', error);
    process.exit(1);
  });

// 优雅关闭
process.on('SIGINT', async () => {
  await prisma.$disconnect();
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});

export default prisma;
