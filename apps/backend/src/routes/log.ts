import { Router, type Router as RouterType } from 'express';
import { LogsService } from '../services/LogsService.js';
import { asyncHandler } from '../middleware/error.js';
import { authMiddleware } from '../middleware/auth.js';

const router: RouterType = Router();

/**
 * GET /api/accounts
 * 获取所有账号
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const taskId = req.query.taskId as string | undefined;
    const user = req.user!;
    const accounts = await LogsService.getAll(user, taskId);

    res.json({
      success: true,
      data: accounts,
    });
  })
);

export default router;
