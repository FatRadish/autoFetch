/**
 * 集成测试全局设置（在测试进程启动前运行）
 *
 * 这个文件会在 vitest 主进程中运行，在测试文件加载之前执行
 * 用于创建测试数据库
 */

import { execSync } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// 测试数据库文件路径
// 使用文件所在目录推导 backend 根目录，避免依赖运行时 cwd
const ROOT_DIR = fileURLToPath(new URL('../..', import.meta.url));
const TEST_DB_PATH = join(ROOT_DIR, 'test.db');

export async function setup() {
  // 设置环境变量
  process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;
  process.env.NODE_ENV = 'test';

  // 删除旧的测试数据库（如果存在）
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
  }

  // 使用 db push 创建数据库表结构(不需要迁移历史)
  try {
    execSync('pnpm exec prisma db push --accept-data-loss', {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: `file:${TEST_DB_PATH}`,
        NODE_ENV: 'test',
      },
    });
    console.log('✅ 测试数据库初始化完成');
  } catch (error) {
    console.error('❌ 测试数据库初始化失败:', error);
    throw error;
  }
}

export async function teardown() {
  // 清理测试数据库文件
  if (existsSync(TEST_DB_PATH)) {
    try {
      unlinkSync(TEST_DB_PATH);
      console.log('✅ 测试完成，测试数据库已清理');
    } catch {
      console.log('⚠️ 测试数据库清理失败（可能正在使用中）');
    }
  }
}
