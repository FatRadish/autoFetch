import { Router, type Router as RouterType } from 'express';
import { AccountService } from '../services/AccountService.js';
import { asyncHandler } from '../middleware/error.js';
import { authMiddleware } from '../middleware/auth.js';
import { createLimiter } from '../middleware/ratelimit.js';
import { validate, schemas } from '../utils/validator.js';

const router: RouterType = Router();

/**
 * GET /api/accounts
 * 获取所有账号
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const platformId = req.query.platformId as string | undefined;
    const accounts = await AccountService.getAll(platformId);

    res.json({
      success: true,
      data: accounts,
    });
  })
);

/**
 * GET /api/accounts/:id
 * 获取单个账号
 */
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const includeCookies = req.query.includeCookies === 'true';
    const account = await AccountService.getById(req.params.id!, includeCookies);

    res.json({
      success: true,
      data: account,
    });
  })
);

/**
 * POST /api/accounts
 * 创建账号
 */
router.post(
  '/',
  authMiddleware,
  createLimiter,
  asyncHandler(async (req, res) => {
    const data = validate(schemas.createAccount, req.body);

    const account = await AccountService.create(data);

    res.status(201).json({
      success: true,
      data: account,
      message: 'Account created successfully',
    });
  })
);

/**
 * PATCH /api/accounts/:id
 * 更新账号
 */
router.patch(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = validate(schemas.updateAccount, req.body);

    const account = await AccountService.update(req.params.id!, data);

    res.json({
      success: true,
      data: account,
      message: 'Account updated successfully',
    });
  })
);

/**
 * DELETE /api/accounts/:id
 * 删除账号
 */
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await AccountService.delete(req.params.id!);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  })
);

export default router;
