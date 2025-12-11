import { defineConfig } from 'vitest/config';
import { join } from 'path';
import { fileURLToPath } from 'url';

// 确保无论在哪个工作目录下运行，路径都指向 backend 包根目录
const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));
// 测试数据库文件路径
const TEST_DB_PATH = join(ROOT_DIR, 'test.db');

/**
 * 集成测试配置
 *
 * 【特点】
 * - 使用测试用 SQLite 数据库文件
 * - 不 Mock Prisma，使用真实的数据库操作
 * - 会真实运行迁移，确保数据库结构完整
 * - 每个测试文件独立的数据库实例
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.test.ts'], // 只运行集成测试
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.integration.test.ts',
      ],
    },
    // 在任何代码运行前设置环境变量
    env: {
      DATABASE_URL: `file:${TEST_DB_PATH}`,
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret',
    },
    // 使用 globalSetup 在所有测试之前创建数据库
    globalSetup: ['./src/__tests__/integration.globalSetup.ts'],
    // setupFiles 用于测试运行时的 hooks
    setupFiles: ['./src/__tests__/integration.setup.ts'],
    // 隔离每个测试，确保数据库不共享
    isolate: true,
    fileParallelism: false,
  },
});
