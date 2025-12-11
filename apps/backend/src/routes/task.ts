import { Router, type Router as RouterType } from 'express';
import { TaskService } from '../services/TaskService.js';
import { asyncHandler } from '../middleware/error.js';
import { authMiddleware } from '../middleware/auth.js';
import { createLimiter } from '../middleware/ratelimit.js';
import { validate, schemas } from '../utils/validator.js';
import { scheduler } from '../scheduler/index.js';

const router: RouterType = Router();

/**
 * GET /api/tasks
 * 获取当前账号下所有任务
 */
router.get(
  '/:accountId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const tasks = await TaskService.getAll({
      accountId: req.params.accountId!,
    });

    res.json({
      success: true,
      data: tasks,
    });
  })
);

/**
 * GET /api/tasks/:id
 * 获取单个任务
 */
router.get(
  '/task/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const task = await TaskService.getById(req.params.id!);

    res.json({
      success: true,
      data: task,
    });
  })
);

/**
 * POST /api/tasks
 * 创建任务
 */
router.post(
  '/',
  authMiddleware,
  createLimiter,
  asyncHandler(async (req, res) => {
    const data = validate(schemas.createTask, req.body);

    const task = await TaskService.create(data);

    res.json({
      success: true,
      data: task,
    });
  })
);

/**
 * PATCH /api/tasks/:id
 * 更新任务
 */
router.patch(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = validate(schemas.updateTask, req.body);

    const task = await TaskService.update(req.params.id!, data);

    res.json({
      success: true,
      data: task,
    });
  })
);

/**
 * DELETE /api/tasks/:id
 * 删除任务
 */
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await TaskService.delete(req.params.id!);

    res.json({
      success: true,
      message: '任务删除成功',
    });
  })
);

/**
 * POST /api/tasks/:id/run
 * 手动触发任务执行
 */
router.post(
  '/:id/run',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await scheduler.trigger(req.params.id!);

    res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  })
);

/**
 * GET /api/tasks/scheduler/status
 * 获取调度器状态
 */
router.get(
  '/scheduler/status',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const status = scheduler.getStatus();

    res.json({
      success: true,
      data: status,
    });
  })
);

export default router;
