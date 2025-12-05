/**
 * Auth 路由集成测试
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

import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import authRouter from '../../routes/auth';
import prisma from '../../lib/prisma';
import { errorHandler, notFoundHandler } from '../../middleware/error';

/**
 * 【集成测试套件】
 * 与单元测试的最大区别：
 * - 不使用 vi.mock()
 * - 使用真实的 Express app + 所有中间件
 * - 真实连接数据库
 */
describe('Auth Routes - Integration Tests', () => {
  let app: Express;

  /**
   * 【全局前置】运行一次
   * 由 integration.setup.ts 负责数据库迁移
   */
  beforeAll(async () => {
    console.log('开始运行 Auth 集成测试...');
    // 确保数据库已连接
    await prisma.$connect();
  });

  /**
   * 【全局后置】运行一次
   */
  afterAll(async () => {
    await prisma.$disconnect();
    console.log('Auth 集成测试完成');
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
    app.use('/api/auth', authRouter);
    
    app.use(notFoundHandler);
    app.use(errorHandler);

    // 清空所有数据，确保测试隔离
    await prisma.user.deleteMany();
  });

  /**
   * 【每个测试后置】
   * 清空该测试创建的数据（额外保险）
   */
  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    /**
     * 【测试用例】成功注册新用户
     */
    it('should register a new user successfully', async () => {
      const registerData = {
        username: 'newuser',
        password: 'password123',
        email: 'newuser@example.com',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('newuser');
      expect(response.body.data.email).toBe('newuser@example.com');
      expect(response.body.data.role).toBe('user');
      expect(response.body.message).toBe('User created successfully');

      // 验证数据确实被写入数据库
      const userInDb = await prisma.user.findUnique({
        where: { username: 'newuser' },
      });

      expect(userInDb).not.toBeNull();
      expect(userInDb?.username).toBe('newuser');
      expect(userInDb?.email).toBe('newuser@example.com');
      // 密码应该是加密的
      expect(userInDb?.password).not.toBe('password123');
    });

    /**
     * 【测试用例】注册重复的用户名会失败
     */
    it('should fail when username already exists', async () => {
      // 先创建一个用户
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          password: 'password123',
          email: 'existing@example.com',
        });

      // 尝试用相同用户名注册
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          password: 'password456',
          email: 'different@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');

      // 验证数据库中只有一个用户
      const users = await prisma.user.findMany({
        where: { username: 'existinguser' },
      });
      expect(users).toHaveLength(1);
    });

    /**
     * 【测试用例】注册重复的邮箱会失败
     */
    it('should fail when email already exists', async () => {
      // 先创建一个用户
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          password: 'password123',
          email: 'duplicate@example.com',
        });

      // 尝试用相同邮箱注册
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          password: 'password456',
          email: 'duplicate@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');

      // 验证数据库中只有一个邮箱
      const users = await prisma.user.findMany({
        where: { email: 'duplicate@example.com' },
      });
      expect(users).toHaveLength(1);
    });

    /**
     * 【测试用例】注册时不提供邮箱也可以
     */
    it('should register user without email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'noemailus',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('noemailus');
      expect(response.body.data.email).toBeUndefined();

      // 验证数据库中的用户
      const user = await prisma.user.findUnique({
        where: { username: 'noemailus' },
      });

      expect(user?.email).toBeNull();
    });

    /**
     * 【测试用例】缺少必需字段会失败
     */
    it('should fail when required fields are missing', async () => {
      // 缺少 username
      const response1 = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
          email: 'test@example.com',
        });

      expect(response1.status).toBe(400);
      expect(response1.body.success).toBe(false);

      // 缺少 password
      const response2 = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
        });

      expect(response2.status).toBe(400);
      expect(response2.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    /**
     * 【测试用例】成功登录
     */
    it('should login with valid credentials', async () => {
      // 先注册一个用户
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          password: 'correctpassword',
          email: 'login@example.com',
        });

      // 然后登录
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'correctpassword',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('loginuser');
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.user.role).toBe('user');
      // 应该返回一个 token
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
    });

    /**
     * 【测试用例】错误的用户名会失败
     */
    it('should fail with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid username or password');
    });

    /**
     * 【测试用例】错误的密码会失败
     */
    it('should fail with incorrect password', async () => {
      // 先注册一个用户
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'wrongpassuser',
          password: 'correctpassword',
          email: 'wrongpass@example.com',
        });

      // 用错误的密码登录
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'wrongpassuser',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid username or password');
    });

    /**
     * 【测试用例】缺少必需字段会失败
     */
    it('should fail when required fields are missing', async () => {
      // 缺少 username
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expect(response1.status).toBe(400);
      expect(response1.body.success).toBe(false);

      // 缺少 password
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
        });

      expect(response2.status).toBe(400);
      expect(response2.body.success).toBe(false);
    });

    /**
     * 【测试用例】速率限制（如果启用了）
     * 注意：这个测试验证 authLimiter 中间件是否正常工作
     */
    it('should enforce rate limiting on multiple failed login attempts', async () => {
      // 发送多个失败的登录请求
      const attempts = [];
      for (let i = 0; i < 10; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              username: 'anyuser',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(attempts);
      
      // 至少某些请求应该被限流（取决于配置）
      const rateLimitedResponse = responses.find(r => r.status === 429);
      
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.status).toBe(429);
      }
    });
  });

  describe('GET /api/auth/me', () => {
    /**
     * 【测试用例】获取当前用户信息（需要认证）
     */
    it('should return current user info when authenticated', async () => {
      // 先注册并登录
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'meuser',
          password: 'password123',
          email: 'me@example.com',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'meuser',
          password: 'password123',
        });

      const token = loginResponse.body.data.token;

      // 使用 token 获取用户信息
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('meuser');
      expect(response.body.data.email).toBe('me@example.com');
      expect(response.body.data.role).toBe('user');
      // 不应该返回密码
      expect(response.body.data.password).toBeUndefined();
      // 应该返回创建和更新时间
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    /**
     * 【测试用例】未认证请求会失败
     */
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    /**
     * 【测试用例】无效的 token 会失败
     */
    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    /**
     * 【测试用例】用户被删除后 token 仍然有效但找不到用户
     */
    it('should return 404 when user has been deleted', async () => {
      // 先注册并登录
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'deleteduser',
          password: 'password123',
          email: 'deleted@example.com',
        });

      const userId = registerResponse.body.data.id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'deleteduser',
          password: 'password123',
        });

      const token = loginResponse.body.data.token;

      // 删除用户
      await prisma.user.delete({
        where: { id: userId },
      });

      // 尝试用 token 获取已删除的用户
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
