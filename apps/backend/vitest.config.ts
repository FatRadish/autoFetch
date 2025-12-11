import { defineConfig } from 'vitest/config';

/**
 * 单元测试配置
 *
 * 【适用范围】
 * - 工具函数测试（utils/*.test.ts）
 * - 中间件测试（middleware/*.test.ts）
 * - 纯函数测试（不依赖数据库的函数）
 *
 * 【特点】
 * - 使用 Mock，不连接真实数据库
 * - 测试速度快，适合 TDD 开发
 * - 专注于单个函数的逻辑正确性
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // 只包含工具类和中间件的单元测试，排除路由测试
    include: [
      'src/utils/**/*.test.ts',
      'src/middleware/**/*.test.ts',
      'src/lib/**/*.test.ts',
    ],
    // 排除集成测试
    exclude: ['src/**/*.integration.test.ts', 'src/routes/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/utils/**/*.ts',
        'src/middleware/**/*.ts',
        'src/lib/**/*.ts',
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.integration.test.ts',
      ],
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
