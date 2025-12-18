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
import taskRouter from '../../routes/task';
import prisma from '../../lib/prisma';
import { errorHandler, notFoundHandler } from '../../middleware/error';

describe('Task Routes - Integration Tests', () => {
  let app: Express;
  let testAccountId: string;
  let testPlatformId: string;

  beforeAll(async () => {
    console.log('开始运行 Task 集成测试...');
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    console.log('Task 集成测试完成');
  });

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    app.use((req, res, next) => {
      req.user = {
        userId: 'test_user_id',
        username: 'testuser',
        role: 'user',
      };
      next();
    });

    app.use('/api/tasks', taskRouter);

    app.use(notFoundHandler);
    app.use(errorHandler);

    await prisma.platformTask.deleteMany();
    await prisma.task.deleteMany();
    await prisma.account.deleteMany();
    await prisma.platform.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        id: 'test_user_id',
        username: 'testuser',
        password: 'hashed_password',
        role: 'user',
      },
    });

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
    testPlatformId = platform.id;

    const account = await prisma.account.create({
      data: {
        platformId: platform.id,
        userId: 'test_user_id',
        name: 'Test Account',
        cookies: 'encrypted_test',
        userAgent: 'Test Agent',
        headers: '{}',
        proxy: '{}',
        enabled: true,
      },
    });
    testAccountId = account.id;
  });

  afterEach(async () => {
    await prisma.platformTask.deleteMany();
    await prisma.task.deleteMany();
    await prisma.account.deleteMany();
    await prisma.platform.deleteMany();
  });

  describe('GET /api/tasks/', () => {
    it('should return empty list when no tasks exist', async () => {
      const response = await request(app).get(`/api/tasks`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [],
      });
    });

    it('should return all tasks for specific account', async () => {
      await prisma.task.createMany({
        data: [
          {
            userId: 'test_user_id',
            accountId: testAccountId,
            name: 'Task 1',
            schedule: '0 0 * * *',
            enabled: true,
          },
          {
            userId: 'test_user_id',
            accountId: testAccountId,
            name: 'Task 2',
            schedule: '0 12 * * *',
            enabled: true,
          },
        ],
      });

      const response = await request(app).get(
        `/api/tasks/?accountId=${testAccountId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Task 1');
      expect(response.body.data[1].name).toBe('Task 2');
    });

    it('should not return tasks from other accounts', async () => {
      const otherAccount = await prisma.account.create({
        data: {
          platformId: testPlatformId,
          userId: 'test_user_id',
          name: 'Other Account',
          cookies: 'encrypted_other',
          userAgent: 'Test Agent',
          headers: '{}',
          proxy: '{}',
          enabled: true,
        },
      });

      await prisma.task.create({
        data: {
          userId: 'test_user_id',
          accountId: testAccountId,
          name: 'My Task',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      await prisma.task.create({
        data: {
          userId: 'test_user_id',
          accountId: otherAccount.id,
          name: 'Other Task',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      const response = await request(app).get(
        `/api/tasks/?accountId=${testAccountId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('My Task');
    });

    it('should return user-specific tasks only', async () => {
      await prisma.user.create({
        data: {
          id: 'other_user_id',
          username: 'otheruser',
          password: 'hashed_password',
          role: 'user',
        },
      });

      await prisma.task.create({
        data: {
          userId: 'test_user_id',
          accountId: testAccountId,
          name: 'My Task',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      await prisma.task.create({
        data: {
          userId: 'other_user_id',
          accountId: testAccountId,
          name: 'Other User Task',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      const response = await request(app).get(`/api/tasks`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('My Task');
    });

    it('should filter tasks by name', async () => {
      await prisma.task.createMany({
        data: [
          {
            userId: 'test_user_id',
            accountId: testAccountId,
            name: 'Morning Task',
            schedule: '0 8 * * *',
            enabled: true,
          },
          {
            userId: 'test_user_id',
            accountId: testAccountId,
            name: 'Evening Task',
            schedule: '0 20 * * *',
            enabled: true,
          },
        ],
      });

      const response = await request(app).get(`/api/tasks/?taskName=Morning`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Morning Task');
    });
  });

  describe('GET /api/tasks/task/:id', () => {
    it('should retrieve task by id', async () => {
      const task = await prisma.task.create({
        data: {
          userId: 'test_user_id',
          accountId: testAccountId,
          name: 'Test Task',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      const response = await request(app).get(`/api/tasks/task/${task.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(task.id);
      expect(response.body.data.name).toBe('Test Task');
      expect(response.body.data.schedule).toBe('0 0 * * *');
    });

    it('should return 404 when task not found', async () => {
      const response = await request(app).get(
        '/api/tasks/task/non-existent-id'
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create task successfully', async () => {
      const createData = {
        accountId: testAccountId,
        name: 'New Task',
        schedule: '0 0 * * *',
        enabled: true,
      };

      const response = await request(app).post('/api/tasks').send(createData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Task');
      expect(response.body.data.schedule).toBe('0 0 * * *');

      const taskInDb = await prisma.task.findUnique({
        where: { id: response.body.data.id },
      });

      expect(taskInDb).not.toBeNull();
      expect(taskInDb?.name).toBe('New Task');
      expect(taskInDb?.accountId).toBe(testAccountId);
    });

    it('should fail when account does not exist', async () => {
      const response = await request(app).post('/api/tasks').send({
        accountId: 'non-existent-account',
        name: 'Test Task',
        schedule: '0 0 * * *',
      });

      expect(response.status).toBe(400);
    });

    it('should fail when task name is duplicate for same account', async () => {
      await prisma.task.create({
        data: {
          userId: 'test_user_id',
          accountId: testAccountId,
          name: 'Duplicate Task',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      const response = await request(app).post('/api/tasks').send({
        userId: 'test_user_id',
        accountId: testAccountId,
        name: 'Duplicate Task',
        schedule: '0 12 * * *',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('任务名称已存在！');
    });

    it('should fail when required fields are missing', async () => {
      const response = await request(app).post('/api/tasks').send({
        accountId: testAccountId,
      });

      expect(response.status).toBe(400);
    });

    it('should fail with invalid cron schedule', async () => {
      const response = await request(app).post('/api/tasks').send({
        accountId: testAccountId,
        name: 'Invalid Task',
        schedule: 'invalid cron',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should update task successfully', async () => {
      const task = await prisma.task.create({
        data: {
          userId: 'test_user_id',
          accountId: testAccountId,
          name: 'Original Task',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      const response = await request(app).patch(`/api/tasks/${task.id}`).send({
        name: 'Updated Task',
        schedule: '0 12 * * *',
        enabled: false,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Task');
      expect(response.body.data.schedule).toBe('0 12 * * *');
      expect(response.body.data.enabled).toBe(false);

      const updatedInDb = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(updatedInDb?.name).toBe('Updated Task');
      expect(updatedInDb?.schedule).toBe('0 12 * * *');
      expect(updatedInDb?.enabled).toBe(false);
    });

    it('should fail when updating non-existent task', async () => {
      const response = await request(app)
        .patch('/api/tasks/non-existent-id')
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
    });

    it('should allow partial updates', async () => {
      const task = await prisma.task.create({
        data: {
          userId: 'test_user_id',
          accountId: testAccountId,
          name: 'Original Task',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .send({ enabled: false });

      expect(response.status).toBe(200);
      expect(response.body.data.enabled).toBe(false);
      expect(response.body.data.name).toBe('Original Task');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task successfully', async () => {
      const task = await prisma.task.create({
        data: {
          userId: 'test_user_id',
          accountId: testAccountId,
          name: 'Task to Delete',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      const response = await request(app).delete(`/api/tasks/${task.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('任务删除成功');

      const deletedFromDb = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(deletedFromDb).toBeNull();
    });

    it('should fail when deleting non-existent task', async () => {
      const response = await request(app).delete('/api/tasks/non-existent-id');

      expect(response.status).toBe(404);
    });

    it('should cascade delete related platform tasks', async () => {
      const task = await prisma.task.create({
        data: {
          userId: 'test_user_id',
          accountId: testAccountId,
          name: 'Task with Platform Tasks',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      await prisma.platformTask.create({
        data: {
          platformId: testPlatformId,
          name: 'Platform Task',
          key: 'platform_task_key',
        },
      });

      const response = await request(app).delete(`/api/tasks/${task.id}`);

      expect(response.status).toBe(200);

      const platformTasksInDb = await prisma.platformTask.findMany({
        where: { platformId: task.id },
      });

      expect(platformTasksInDb).toHaveLength(0);
    });
  });

  describe('POST /api/tasks/:id/run', () => {
    it('should manually trigger task execution', async () => {
      const task = await prisma.task.create({
        data: {
          userId: 'test_user_id',
          accountId: testAccountId,
          name: 'Task to Run',
          schedule: '0 0 * * *',
          enabled: true,
        },
      });

      const response = await request(app).post(`/api/tasks/${task.id}/run`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });

    it('should fail when triggering non-existent task', async () => {
      const response = await request(app).post(
        '/api/tasks/non-existent-id/run'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Task not found or disabled');
    });
  });

  describe('GET /api/tasks/scheduler/status', () => {
    it('should return scheduler status', async () => {
      const response = await request(app).get('/api/tasks/scheduler/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});
