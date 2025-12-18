import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../types/index.js';
import { adapterRegistry } from '../adapters/registry.js';

export class PlatformService {
  /**
   * 获取指定平台下的所有任务模板
   */
  static async getPlatformTasks(platformId: string) {
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      throw new NotFoundError('Platform not found');
    }

    const tasks = await prisma.platformTask.findMany({
      where: { platformId },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((task) => ({
      id: task.id,
      name: task.name,
    }));
  }

  /**
   * 获取所有平台
   */
  static async getAll(includeDisabled = false) {
    return prisma.platform.findMany({
      where: includeDisabled ? undefined : { enabled: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 根据 ID 获取平台
   */
  static async getById(id: string) {
    const platform = await prisma.platform.findUnique({
      where: { id },
      include: {
        _count: {
          select: { accounts: true },
        },
      },
    });

    if (!platform) {
      throw new NotFoundError('Platform not found');
    }

    return {
      ...platform,
      config: JSON.parse(platform.config),
      accountCount: platform._count.accounts,
    };
  }

  /**
   * 创建平台
   */
  static async create(data: {
    name: string;
    icon?: string;
    description?: string;
    adapterType: string;
    config?: Record<string, unknown>;
  }) {
    // 检查平台名称是否已存在
    const existing = await prisma.platform.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ValidationError('Platform name already exists');
    }

    // 检查适配器是否存在（如果是 http 类型）
    if (data.adapterType === 'http') {
      const hasAdapter = adapterRegistry.has(data.name);
      if (!hasAdapter) {
        throw new ValidationError(
          `No adapter found for platform "${data.name}". Available adapters: ${adapterRegistry.list().join(', ')}`
        );
      }
    }

    const platform = await prisma.platform.create({
      data: {
        name: data.name,
        icon: data.icon,
        description: data.description,
        adapterType: data.adapterType,
        config: JSON.stringify(data.config || {}),
      },
    });

    return {
      ...platform,
      config: JSON.parse(platform.config),
    };
  }

  /**
   * 更新平台
   */
  static async update(
    id: string,
    data: {
      name?: string;
      icon?: string;
      description?: string;
      enabled?: boolean;
      adapterType?: string;
      config?: Record<string, unknown>;
    }
  ) {
    const platform = await prisma.platform.findUnique({ where: { id } });

    if (!platform) {
      throw new NotFoundError('Platform not found');
    }

    // 如果要更新名称，检查是否已存在
    if (data.name && data.name !== platform.name) {
      const existing = await prisma.platform.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        throw new ValidationError('Platform name already exists');
      }
    }

    const updated = await prisma.platform.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.adapterType && { adapterType: data.adapterType }),
        ...(data.config && { config: JSON.stringify(data.config) }),
      },
    });

    return {
      ...updated,
      config: JSON.parse(updated.config),
    };
  }

  /**
   * 删除平台
   */
  static async delete(id: string) {
    const platform = await prisma.platform.findUnique({
      where: { id },
      include: { _count: { select: { accounts: true } } },
    });

    if (!platform) {
      throw new NotFoundError('Platform not found');
    }

    if (platform._count.accounts > 0) {
      throw new ValidationError(
        'Cannot delete platform with associated accounts. Delete accounts first.'
      );
    }

    await prisma.platform.delete({ where: { id } });

    return { success: true };
  }

  /**
   * 获取可用的适配器列表
   */
  static getAvailableAdapters() {
    return adapterRegistry.list();
  }
}
