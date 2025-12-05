/**
 * 集成测试设置（在测试运行时的 hooks）
 * 
 * 注意：数据库创建在 integration.globalSetup.ts 中完成
 * 这个文件只负责测试运行时的生命周期钩子
 */

import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  console.log('开始运行集成测试...');
});

afterAll(async () => {
  console.log('集成测试完成');
});
