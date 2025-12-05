import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import platformsRouter from '../../routes/platforms';
import prisma from '../../lib/prisma';
import { errorHandler, notFoundHandler } from '../../middleware/error';

describe('Platforms Routes - Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    console.log('开始运行 Platforms 集成测试...');
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    console.log('Platforms 集成测试完成');
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
    
    app.use('/api/platforms', platformsRouter);
    
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

    await prisma.user.create({
      data: {
        id: 'admin_user_id',
        username: 'adminuser',
        password: 'hashed_password',
        role: 'admin',
      },
    });
  });

  afterEach(async () => {
    await prisma.platformTask.deleteMany();
    await prisma.task.deleteMany();
    await prisma.account.deleteMany();
    await prisma.platform.deleteMany();
  });

  describe('GET /api/platforms', () => {
    it('should return empty list when no platforms exist', async () => {
      const response = await request(app).get('/api/platforms');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: [],
      });
    });

    it('should return all enabled platforms by default', async () => {
      await prisma.platform.createMany({
        data: [
          {
            name: 'Enabled Platform 1',
            icon: '✅',
            description: 'Enabled',
            adapterType: 'http',
            config: '{}',
            enabled: true,
          },
          {
            name: 'Enabled Platform 2',
            icon: '✅',
            description: 'Enabled',
            adapterType: 'http',
            config: '{}',
            enabled: true,
          },
          {
            name: 'Disabled Platform',
            icon: '❌',
            description: 'Disabled',
            adapterType: 'http',
            config: '{}',
            enabled: false,
          },
        ],
      });

      const response = await request(app).get('/api/platforms');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((p: any) => p.enabled)).toBe(true);
    });

    it('should return all platforms when includeDisabled=true', async () => {
      await prisma.platform.createMany({
        data: [
          {
            name: 'Enabled Platform',
            icon: '✅',
            description: 'Enabled',
            adapterType: 'http',
            config: '{}',
            enabled: true,
          },
          {
            name: 'Disabled Platform',
            icon: '❌',
            description: 'Disabled',
            adapterType: 'http',
            config: '{}',
            enabled: false,
          },
        ],
      });

      const response = await request(app).get('/api/platforms?includeDisabled=true');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/platforms/adapters', () => {
    it('should return available adapters list', async () => {
      const response = await request(app).get('/api/platforms/adapters');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/platforms/:id', () => {
    it('should retrieve platform by id', async () => {
      const platform = await prisma.platform.create({
        data: {
          name: 'Test Platform',
          icon: '🔧',
          description: 'Test Description',
          adapterType: 'http',
          config: JSON.stringify({ baseUrl: 'https://api.test.com' }),
          enabled: true,
        },
      });

      const response = await request(app).get(`/api/platforms/${platform.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(platform.id);
      expect(response.body.data.name).toBe('Test Platform');
      expect(response.body.data.description).toBe('Test Description');
    });

    it('should return 404 when platform not found', async () => {
      const response = await request(app).get('/api/platforms/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  // describe('POST /api/platforms', () => {
  //   it('should create platform with admin role', async () => {
  //     app.use((req, res, next) => {
  //       req.user = {
  //         userId: 'admin_user_id',
  //         username: 'adminuser',
  //         role: 'admin',
  //       };
  //       next();
  //     });

  //     const createData = {
  //       name: 'New Platform',
  //       icon: '🆕',
  //       description: 'New platform for testing',
  //       adapterType: 'http',
  //       config: { baseUrl: 'https://new.platform.com' },
  //     };

  //     const response = await request(app)
  //       .post('/api/platforms')
  //       .send(createData);

  //     expect(response.status).toBe(201);
  //     expect(response.body.success).toBe(true);
  //     expect(response.body.data.name).toBe('New Platform');
  //     expect(response.body.message).toBe('Platform created successfully');

  //     const platformInDb = await prisma.platform.findUnique({
  //       where: { id: response.body.data.id },
  //     });

  //     expect(platformInDb).not.toBeNull();
  //     expect(platformInDb?.name).toBe('New Platform');
  //   });

  //   it('should fail when non-admin user tries to create platform', async () => {
  //     const createData = {
  //       name: 'New Platform',
  //       icon: '🆕',
  //       description: 'Test',
  //       adapterType: 'http',
  //       config: {},
  //     };

  //     const response = await request(app)
  //       .post('/api/platforms')
  //       .send(createData);

  //     expect(response.status).toBe(403);
  //   });

  //   it('should fail when platform name already exists', async () => {
  //     await prisma.platform.create({
  //       data: {
  //         name: 'Duplicate Platform',
  //         icon: '🔁',
  //         description: 'Test',
  //         adapterType: 'http',
  //         config: '{}',
  //         enabled: true,
  //       },
  //     });

  //     app.use((req, res, next) => {
  //       req.user = {
  //         userId: 'admin_user_id',
  //         username: 'adminuser',
  //         role: 'admin',
  //       };
  //       next();
  //     });

  //     const response = await request(app)
  //       .post('/api/platforms')
  //       .send({
  //         name: 'Duplicate Platform',
  //         icon: '🔁',
  //         description: 'Duplicate',
  //         adapterType: 'http',
  //         config: {},
  //       });

  //     expect(response.status).toBe(400);
  //     expect(response.body.error).toContain('already exists');
  //   });
  // });

  // describe('PATCH /api/platforms/:id', () => {
  //   it('should update platform with admin role', async () => {
  //     const platform = await prisma.platform.create({
  //       data: {
  //         name: 'Original Name',
  //         icon: '📝',
  //         description: 'Original',
  //         adapterType: 'http',
  //         config: '{}',
  //         enabled: true,
  //       },
  //     });

  //     app.use((req, res, next) => {
  //       req.user = {
  //         userId: 'admin_user_id',
  //         username: 'adminuser',
  //         role: 'admin',
  //       };
  //       next();
  //     });

  //     const response = await request(app)
  //       .patch(`/api/platforms/${platform.id}`)
  //       .send({
  //         name: 'Updated Name',
  //         description: 'Updated description',
  //         enabled: false,
  //       });

  //     expect(response.status).toBe(200);
  //     expect(response.body.data.name).toBe('Updated Name');
  //     expect(response.body.data.description).toBe('Updated description');
  //     expect(response.body.data.enabled).toBe(false);

  //     const updatedInDb = await prisma.platform.findUnique({
  //       where: { id: platform.id },
  //     });

  //     expect(updatedInDb?.name).toBe('Updated Name');
  //     expect(updatedInDb?.enabled).toBe(false);
  //   });

  //   it('should fail when non-admin user tries to update platform', async () => {
  //     const platform = await prisma.platform.create({
  //       data: {
  //         name: 'Test Platform',
  //         icon: '🔧',
  //         description: 'Test',
  //         adapterType: 'http',
  //         config: '{}',
  //         enabled: true,
  //       },
  //     });

  //     const response = await request(app)
  //       .patch(`/api/platforms/${platform.id}`)
  //       .send({ name: 'Updated Name' });

  //     expect(response.status).toBe(403);
  //   });

  //   it('should fail when updating non-existent platform', async () => {
  //     app.use((req, res, next) => {
  //       req.user = {
  //         userId: 'admin_user_id',
  //         username: 'adminuser',
  //         role: 'admin',
  //       };
  //       next();
  //     });

  //     const response = await request(app)
  //       .patch('/api/platforms/non-existent-id')
  //       .send({ name: 'New Name' });

  //     expect(response.status).toBe(404);
  //   });
  // });

  // describe('DELETE /api/platforms/:id', () => {
  //   it('should delete platform with admin role', async () => {
  //     const platform = await prisma.platform.create({
  //       data: {
  //         name: 'Platform to Delete',
  //         icon: '🗑️',
  //         description: 'Will be deleted',
  //         adapterType: 'http',
  //         config: '{}',
  //         enabled: true,
  //       },
  //     });

  //     app.use((req, res, next) => {
  //       req.user = {
  //         userId: 'admin_user_id',
  //         username: 'adminuser',
  //         role: 'admin',
  //       };
  //       next();
  //     });

  //     const response = await request(app).delete(`/api/platforms/${platform.id}`);

  //     expect(response.status).toBe(200);
  //     expect(response.body.success).toBe(true);
  //     expect(response.body.message).toBe('Platform deleted successfully');

  //     const deletedFromDb = await prisma.platform.findUnique({
  //       where: { id: platform.id },
  //     });

  //     expect(deletedFromDb).toBeNull();
  //   });

  //   it('should fail when non-admin user tries to delete platform', async () => {
  //     const platform = await prisma.platform.create({
  //       data: {
  //         name: 'Test Platform',
  //         icon: '🔧',
  //         description: 'Test',
  //         adapterType: 'http',
  //         config: '{}',
  //         enabled: true,
  //       },
  //     });

  //     const response = await request(app).delete(`/api/platforms/${platform.id}`);

  //     expect(response.status).toBe(403);
  //   });

  //   it('should fail when deleting platform with associated accounts', async () => {
  //     const platform = await prisma.platform.create({
  //       data: {
  //         name: 'Platform with Accounts',
  //         icon: '👥',
  //         description: 'Has accounts',
  //         adapterType: 'http',
  //         config: '{}',
  //         enabled: true,
  //       },
  //     });

  //     await prisma.account.create({
  //       data: {
  //         platformId: platform.id,
  //         userId: 'test_user_id',
  //         name: 'Test Account',
  //         cookies: 'encrypted_test',
  //         userAgent: 'Test Agent',
  //         headers: '{}',
  //         proxy: '{}',
  //         enabled: true,
  //       },
  //     });

  //     app.use((req, res, next) => {
  //       req.user = {
  //         userId: 'admin_user_id',
  //         username: 'adminuser',
  //         role: 'admin',
  //       };
  //       next();
  //     });

  //     const response = await request(app).delete(`/api/platforms/${platform.id}`);

  //     expect(response.status).toBe(400);
  //     expect(response.body.error).toContain('associated accounts');

  //     const stillExists = await prisma.platform.findUnique({
  //       where: { id: platform.id },
  //     });

  //     expect(stillExists).not.toBeNull();
  //   });
  // });
});
