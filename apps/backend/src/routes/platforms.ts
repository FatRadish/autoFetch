import { Router, type Router as RouterType } from 'express';
import { PlatformService } from '../services/PlatformService.js';
import { asyncHandler } from '../middleware/error.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validate, schemas } from '../utils/validator.js';

const router: RouterType = Router();

/**
 * GET /api/platforms
 * 获取所有平台
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const includeDisabled = req.query.includeDisabled === 'true';
    const platforms = await PlatformService.getAll(includeDisabled);

    res.json({
      success: true,
      data: platforms,
    });
  })
);

/**
 * GET /api/platforms/adapters
 * 获取可用的适配器列表
 */
router.get(
  '/adapters',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const adapters = PlatformService.getAvailableAdapters();

    res.json({
      success: true,
      data: adapters,
    });
  })
);

/**
 * GET /api/platforms/:id
 * 获取单个平台
 */
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const platform = await PlatformService.getById(req.params.id!);

    res.json({
      success: true,
      data: platform,
    });
  })
);

/**
 * POST /api/platforms
 * 创建平台
 */
router.post(
  '/',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = validate(schemas.createPlatform, req.body);

    const platform = await PlatformService.create(data);

    res.status(201).json({
      success: true,
      data: platform,
      message: 'Platform created successfully',
    });
  })
);

/**
 * PATCH /api/platforms/:id
 * 更新平台
 */
router.patch(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = validate(schemas.updatePlatform, req.body);

    const platform = await PlatformService.update(req.params.id!, data);

    res.json({
      success: true,
      data: platform,
      message: 'Platform updated successfully',
    });
  })
);

/**
 * DELETE /api/platforms/:id
 * 删除平台
 */
router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    await PlatformService.delete(req.params.id!);

    res.json({
      success: true,
      message: 'Platform deleted successfully',
    });
  })
);

export default router;
