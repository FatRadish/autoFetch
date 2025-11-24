import { Router, type Router as RouterType } from 'express';
import { AuthService } from '../services/AuthService.js';
import { asyncHandler } from '../middleware/error.js';
import { authMiddleware } from '../middleware/auth.js';
import { authLimiter } from '../middleware/ratelimit.js';
import { validate, schemas } from '../utils/validator.js';

const router: RouterType = Router();

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { username, password } = validate(schemas.login, req.body);

    const result = await AuthService.login(username, password);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = validate(schemas.createUser, req.body);

    const user = await AuthService.createUser(data);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  })
);

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await AuthService.getUserById(req.user!.userId);

    res.json({
      success: true,
      data: user,
    });
  })
);

export default router;
