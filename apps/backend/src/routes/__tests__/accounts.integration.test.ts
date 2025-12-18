/**
 * Accounts 路由集成测试
 *
 * 【测试原理】
 *
 * 1. 使用真实数据库：不 Mock Prisma，真实执行数据库操作
 * 2. 隔离环境：每个测试使用独立的内存 SQLite 数据库
 * 3. 完整流程测试：HTTP 请求 → 路由 → Service → Prisma → 数据库
 *
 * 【与单元测试的区别】
 * - 单元测试：Mock Service，只测试路由逻辑
 * - 集成测试：真实 Service，测试整个流程是否能正确交互
 *
 * 【优势】
 * - 发现数据库相关的 bug
 * - 验证完整的业务流程
 * - 使用内存数据库，不影响真实数据
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
} from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import accountsRouter from '../../routes/accounts';
import prisma from '../../lib/prisma';
import { errorHandler, notFoundHandler } from '../../middleware/error';
/**
 * 【集成测试套件】
 * 与单元测试的最大区别：
 * - 不使用 vi.mock()
 * - 使用真实的 Express app + 所有中间件
 * - 真实连接数据库
 */
describe('Accounts Routes - Integration Tests', () => {
  let app: Express;

  /**
   * 【全局前置】运行一次
   * 由 integration.setup.ts 负责数据库迁移
   */
  beforeAll(async () => {
    console.log('开始运行集成测试...');
    // 确保数据库已连接
    await prisma.$connect();
  });

  /**
   * 【全局后置】运行一次
   */
  afterAll(async () => {
    await prisma.$disconnect();
    console.log('集成测试完成');
  });

  /**
   * 【每个测试前置】
   * 1. 创建 Express app
   * 2. 清空数据库（确保测试隔离）
   */
  beforeEach(async () => {
    // 创建新的 Express 应用实例
    app = express();
    app.use(express.json());

    // 挂载实际的路由（带所有真实中间件）
    // 但需要在 app 中添加实际的 authMiddleware 等
    // 这里为了简化，我们创建一个带有模拟认证的 app
    app.use((req, res, next) => {
      // 模拟认证中间件（在集成测试中注入测试用户）
      req.user = {
        userId: 'test_user_id',
        username: 'testuser',
        role: 'user',
      };
      next();
    });

    app.use('/api/accounts', accountsRouter);

    app.use(notFoundHandler);
    app.use(errorHandler);

    // 清空所有数据，确保测试隔离
    // 按照外键依赖顺序删除
    await prisma.platformTask.deleteMany();
    await prisma.task.deleteMany();
    await prisma.account.deleteMany();
    await prisma.platform.deleteMany();
    await prisma.user.deleteMany();

    // 创建测试用户（用于外键关联）
    await prisma.user.create({
      data: {
        id: 'test_user_id',
        username: 'testuser',
        password: 'hashed_password', // 集成测试中不需要真实密码
        role: 'user',
      },
    });
  });

  /**
   * 【每个测试后置】
   * 清空该测试创建的数据（额外保险）
   */
  afterEach(async () => {
    await prisma.platformTask.deleteMany();
    await prisma.task.deleteMany();
    await prisma.account.deleteMany();
    await prisma.platform.deleteMany();
  });

  describe('GET /api/accounts', () => {
    /**
     * 【测试用例】获取空列表
     */
    it('should return empty list when no accounts exist', async () => {
      const response = await request(app).get('/api/accounts');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [],
      });
    });

    /**
     * 【测试用例】获取创建的账号
     * 这是真实的数据库操作！
     */
    it('should return all accounts from database', async () => {
      // 步骤1：先在真实数据库中创建测试数据
      const platform = await prisma.platform.create({
        data: {
          name: 'Test Platform',
          icon: '🔧',
          description: 'Test',
          adapterType: 'http',
          config: JSON.stringify({}),
          enabled: true,
        },
      });
      const account = await prisma.account.create({
        data: {
          platformId: platform.id,
          userId: 'test_user_id', // 与认证用户匹配
          name: 'Test Account',
          cookies: 'encrypted_test=cookie',
          userAgent: 'Test Agent',
          headers: '{}',
          proxy: '{}',
          enabled: true,
        },
      });

      // 步骤2：发送请求
      const response = await request(app).get('/api/accounts');

      // 步骤3：验证返回的是从数据库读取的真实数据
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(account.id);
      expect(response.body.data[0].name).toBe('Test Account');
      expect(response.body.data[0].platformId).toBe(platform.id);
    });

    /**
     * 【测试用例】按平台过滤
     */
    it('should filter accounts by platformId', async () => {
      // 创建两个平台
      const platform1 = await prisma.platform.create({
        data: {
          name: 'Platform 1',
          icon: '1️⃣',
          description: 'Platform 1',
          adapterType: 'http',
          config: '{}',
          enabled: true,
        },
      });

      const platform2 = await prisma.platform.create({
        data: {
          name: 'Platform 2',
          icon: '2️⃣',
          description: 'Platform 2',
          adapterType: 'http',
          config: '{}',
          enabled: true,
        },
      });
      await request(app).post(`/api/accounts/`).send({
        platformId: platform1.id,
        name: 'Account 1',
        cookies:
          'buvid3=392113AD; b_nut=1756525273; _uuid=CC535FF10-61B4-B696-5F103-868BA63B82F1073979infoc;',
        userAgent: 'Test Agent',
      });

      await request(app).post(`/api/accounts/`).send({
        platformId: platform2.id,
        name: 'Test Account',
        cookies:
          'buvid3=392113AD; b_nut=1756525273; _uuid=CC535FF10-61B4-B696-5F103-868BA63B82F1073979infoc;',
        userAgent: 'Test Agent',
      });

      // 只查询 platform1 的账号
      const response = await request(app).get(
        `/api/accounts?platformId=${platform1.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Account 1');
      expect(response.body.data[0].platformId).toBe(platform1.id);
    });

    /**
     * 【测试用例】只返回当前用户的账号
     * 验证用户隔离逻辑
     */
    it('should only return accounts of current user', async () => {
      const platform = await prisma.platform.create({
        data: {
          name: 'Shared Platform',
          icon: '🔧',
          description: 'Shared',
          adapterType: 'http',
          config: '{}',
          enabled: true,
        },
      });

      // 创建账号只属于当前登录的用户，和传入Userid 不想关
      await prisma.account.create({
        data: {
          platformId: platform.id,
          userId: 'test_user_id',
          name: 'My Account',
          cookies: 'encrypted_my',
          userAgent: 'My Agent',
          headers: '{}',
          proxy: '{}',
          enabled: true,
        },
      });

      // 创建其他用户
      await prisma.user.create({
        data: {
          id: 'cmimy6koa0000tr3hldoiq4oe',
          username: 'otheruser',
          password: 'hashed_password',
          role: 'user',
        },
      });

      // 创建其他用户的账号
      await prisma.account.create({
        data: {
          platformId: platform.id,
          userId: 'cmimy6koa0000tr3hldoiq4oe',
          name: 'Other Account',
          cookies: 'encrypted_other',
          userAgent: 'Other Agent',
          headers: '{}',
          proxy: '{}',
          enabled: true,
        },
      });

      const response = await request(app).get('/api/accounts');

      // 验证只返回了当前用户的账号
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('My Account');
    });
  });

  describe('GET /api/accounts/:id', () => {
    /**
     * 【测试用例】获取单个账号
     */
    it('should retrieve account by id', async () => {
      const platform = await prisma.platform.create({
        data: {
          name: 'Test Platform',
          icon: '🔧',
          description: 'Test',
          adapterType: 'http',
          config: '{}',
          enabled: true,
        },
      });

      const account = await prisma.account.create({
        data: {
          platformId: platform.id,
          userId: 'test_user_id',
          name: 'Test Account',
          cookies: 'encrypted_test=cookie',
          userAgent: 'Test Agent',
          headers: '{"X-Custom": "value"}',
          proxy: '{}',
          enabled: true,
        },
      });

      // 发送请求获取账号

      const response = await request(app).get(`/api/accounts/${account.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(account.id);
      expect(response.body.data.name).toBe('Test Account');
      // Cookie 默认被隐藏
      expect(response.body.data.cookies).toBe('***');
      // Headers 被正确解析为对象
      expect(response.body.data.headers).toEqual({ 'X-Custom': 'value' });
    });

    /**
     * 【测试用例】包含 Cookie 的请求
     * 验证 includeCookies=true 时能返回真实的 cookie
     */
    it('should return encrypted cookie when includeCookies=true', async () => {
      const platform = await prisma.platform.create({
        data: {
          name: 'Test Platform',
          icon: '🔧',
          description: 'Test',
          adapterType: 'http',
          config: '{}',
          enabled: true,
        },
      });

      const account = await request(app).post(`/api/accounts/`).send({
        platformId: platform.id,
        name: 'Test Account',
        cookies:
          'buvid3=392113AD; b_nut=1756525273; _uuid=CC535FF10-61B4-B696-5F103-868BA63B82F1073979infoc;',
        userAgent: 'Test Agent',
      });

      const response = await request(app).get(
        `/api/accounts/${account.body.data.id}?includeCookies=true`
      );

      expect(response.status).toBe(200);
      // 应该返回解密后的 cookie（在真实场景中）
      // 注意：这里的 decrypt 函数会做真实的解密操作
      expect(response.body.data.cookies).not.toBe('***');
    });

    /**
     * 【测试用例】账号不存在
     */
    it('should return 404 when account not found', async () => {
      const response = await request(app).get('/api/accounts/non-existent-id');

      expect(response.status).toBe(404);
    });

    /**
     * 【测试用例】访问其他用户的账号被拒绝
     */
    it('should not allow access to other users accounts', async () => {
      const platform = await prisma.platform.create({
        data: {
          name: 'Test Platform',
          icon: '🔧',
          description: 'Test',
          adapterType: 'http',
          config: '{}',
          enabled: true,
        },
      });

      // 创建另一个用户
      await prisma.user.create({
        data: {
          id: 'test_user_id11',
          username: 'anotheruser',
          password: 'hashed_password',
          role: 'user',
        },
      });

      // 创建属于其他用户的账号

      const account = await prisma.account.create({
        data: {
          platformId: platform.id,
          userId: 'test_user_id11', // 不同的用户
          name: 'Other User Account',
          cookies: 'encrypted_other',
          userAgent: 'Other Agent',
          headers: '{}',
          proxy: '{}',
          enabled: true,
        },
      });

      // 当前用户尝试访问
      const response = await request(app).get(`/api/accounts/${account.id}`);

      // 应该返回 404
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/accounts', () => {
    /**
     * 【测试用例】成功创建账号
     */
    it('should create account in database', async () => {
      const platform = await prisma.platform.create({
        data: {
          name: 'Test Platform',
          icon: '🔧',
          description: 'Test',
          adapterType: 'http',
          config: '{}',
          enabled: true,
        },
      });

      const createData = {
        platformId: platform.id,
        name: 'New Account',
        cookies: 'new_cookie=value',
        userAgent: 'Test Browser',
      };

      const response = await request(app)
        .post('/api/accounts')
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Account');

      // 验证数据确实被写入数据库
      const accountInDb = await prisma.account.findUnique({
        where: { id: response.body.data.id },
      });

      expect(accountInDb).not.toBeNull();
      expect(accountInDb?.name).toBe('New Account');
      expect(accountInDb?.platformId).toBe(platform.id);
      expect(accountInDb?.userId).toBe('test_user_id');
    });

    /**
     * 【测试用例】重复的账号名会失败
     */
    it('should fail when account name already exists', async () => {
      const platform = await prisma.platform.create({
        data: {
          name: 'Test Platform',
          icon: '🔧',
          description: 'Test',
          adapterType: 'http',
          config: '{}',
          enabled: true,
        },
      });
      await request(app).post(`/api/accounts/`).send({
        platformId: platform.id,
        name: 'Duplicate Name',
        cookies:
          'buvid3=392113AD; b_nut=1756525273; _uuid=CC535FF10-61B4-B696-5F103-868BA63B82F1073979infoc;',
        userAgent: 'Test Agent',
      });

      // 尝试创建同名账号
      const response = await request(app).post('/api/accounts').send({
        platformId: platform.id,
        name: 'Duplicate Name',
        cookies: 'new_cookie=value',
        userAgent: 'Agent 2',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });

    /**
     * 【测试用例】平台不存在会失败
     */
    it('should fail when platform does not exist', async () => {
      const response = await request(app).post('/api/accounts').send({
        platformId: 'non-existent-platform',
        name: 'Test Account',
        cookies: 'test=cookie',
        userAgent: 'Test Agent',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/accounts/:id', () => {
    /**
     * 【测试用例】更新账号字段
     */
    it('should update account in database', async () => {
      const platform = await prisma.platform.create({
        data: {
          name: 'Test Platform',
          icon: '🔧',
          description: 'Test',
          adapterType: 'http',
          config: '{}',
          enabled: true,
        },
      });
      const account = await request(app).post(`/api/accounts/`).send({
        platformId: platform.id,
        name: 'Original Name',
        cookies:
          'buvid3=392113AD; b_nut=1756525273; _uuid=CC535FF10-61B4-B696-5F103-868BA63B82F1073979infoc;',
        userAgent: 'Test Agent',
      });

      const response = await request(app)
        .patch(`/api/accounts/${account.body.data.id}`)
        .send({
          name: 'Updated Name',
          enabled: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.enabled).toBe(false);

      // 验证数据库中的数据也被更新了
      const updatedInDb = await prisma.account.findUnique({
        where: { id: account.body.data.id },
      });

      expect(updatedInDb?.name).toBe('Updated Name');
      expect(updatedInDb?.enabled).toBe(false);
    });

    /**
     * 【测试用例】更新不存在的账号
     */
    it('should fail when updating non-existent account', async () => {
      const response = await request(app)
        .patch('/api/accounts/non-existent-id')
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    /**
     * 【测试用例】成功删除账号
     */
    it('should delete account from database', async () => {
      const platform = await prisma.platform.create({
        data: {
          name: 'Test Platform',
          icon: '🔧',
          description: 'Test',
          adapterType: 'http',
          config: '{}',
          enabled: true,
        },
      });

      const account = await prisma.account.create({
        data: {
          platformId: platform.id,
          userId: 'test_user_id',
          name: 'Account to Delete',
          cookies: 'encrypted_delete',
          userAgent: 'Delete Agent',
          headers: '{}',
          proxy: '{}',
          enabled: true,
        },
      });

      const response = await request(app).delete(`/api/accounts/${account.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // 验证数据库中确实被删除了
      const deletedFromDb = await prisma.account.findUnique({
        where: { id: account.id },
      });

      expect(deletedFromDb).toBeNull();
    });

    /**
     * 【测试用例】删除有关联任务的账号会失败
     */
    it('should fail when deleting account with associated tasks', async () => {
      const platform = await prisma.platform.create({
        data: {
          name: 'Test Platform',
          icon: '🔧',
          description: 'Test',
          adapterType: 'http',
          config: '{}',
          enabled: true,
        },
      });

      const account = await prisma.account.create({
        data: {
          platformId: platform.id,
          userId: 'test_user_id',
          name: 'Account with Tasks',
          cookies: 'encrypted_task',
          userAgent: 'Task Agent',
          headers: '{}',
          proxy: '{}',
          enabled: true,
        },
      });

      // 创建一个关联的任务
      await prisma.task.create({
        data: {
          userId: 'test_user_id',
          accountId: account.id,
          name: 'Associated Task',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      // 尝试删除
      const response = await request(app).delete(`/api/accounts/${account.id}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('associated tasks');

      // 验证账号仍然存在
      const stillExists = await prisma.account.findUnique({
        where: { id: account.id },
      });

      expect(stillExists).not.toBeNull();
    });
  });
});
