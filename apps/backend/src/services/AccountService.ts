import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../types/index.js';
import { encrypt, decrypt } from '../utils/encrypt.js';
import { validateCookies } from '../utils/cookie.js';
import config from '../config/index.js';
import { type JwtPayload } from '../types/index.js';
export class AccountService {
  /**
   * 获取所有账号
   */
  static async getAll(data:{
    platformId?:string,
    user:JwtPayload
  }) {
    const { platformId,user } = data
    const accounts = await prisma.account.findMany({
      where: platformId ? { platformId,userId:user.userId } : {userId:user.userId},
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 解密 cookies 并解析 JSON 字段
    return accounts.map((account: typeof accounts[number]) => ({
      ...account,
      cookies: '***', // 不返回敏感信息
      headers: account.headers ? JSON.parse(account.headers) : {},
      proxy: account.proxy ? JSON.parse(account.proxy) : null,
      taskCount: account._count.tasks,
      refreshToken: account.refreshToken ? '***' : null,
      lastRefreshTime: account.lastRefreshTime,
    }));
  }

  /**
   * 根据 ID 获取账号
   */
  static async getById(id: string, user: JwtPayload ,includeCookies = false) {
    const account = await prisma.account.findUnique({
      where: { id ,userId:user.userId},
      include: {
        platform: true,
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    return {
      ...account,
      cookies: includeCookies ? decrypt(account.cookies, config.encryption.secret) : '***',
      headers: account.headers ? JSON.parse(account.headers) : {},
      proxy: account.proxy ? JSON.parse(account.proxy) : null,
      refreshToken: includeCookies ? account.refreshToken : account.refreshToken ? '***' : null,
      lastRefreshTime: account.lastRefreshTime,
      platform: {
        ...account.platform,
        config: JSON.parse(account.platform.config),
      },
      taskCount: account._count.tasks,
    };
  }

  /**
   * 创建账号
   */
  static async create(data: {
    platformId: string;
    name: string;
    cookies: string;
    userAgent: string;
    headers?: Record<string, string>;
    proxy?: { enabled: boolean; host?: string; port?: number; username?: string; password?: string };
    refreshToken?: string;
    user?: JwtPayload
  }) {
    const existingAccount = await prisma.account.findUnique({
      where: { name: data.name }
    })

    if(existingAccount){
      throw new ValidationError('Account name already exists');
    }
    // 验证平台是否存在
    const platform = await prisma.platform.findUnique({
      where: { id: data.platformId },
    });

    if (!platform) {
      throw new NotFoundError('Platform not found');
    }

    // 验证 cookies 格式
    const cookieValidation = validateCookies(data.cookies);
    if (!cookieValidation.valid) {
      throw new ValidationError(`Invalid cookies: ${cookieValidation.error}`);
    }

    // 加密 cookies
    const encryptedCookies = encrypt(data.cookies, config.encryption.secret);

    const account = await prisma.account.create({
      data: {
        platformId: data.platformId,
        userId:data.user!.userId,
        name: data.name,
        cookies: encryptedCookies,
        userAgent: data.userAgent,
        headers: data.headers ? JSON.stringify(data.headers) : '{}',
        proxy: data.proxy ? JSON.stringify(data.proxy) : '{}',
        refreshToken: data.refreshToken,
      },
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    return {
      ...account,
      cookies: '***',
      headers: account.headers ? JSON.parse(account.headers) : {},
      proxy: account.proxy ? JSON.parse(account.proxy) : null,
      refreshToken: account.refreshToken ? '***' : null,
      lastRefreshTime: account.lastRefreshTime,
    };
  }

  /**
   * 更新账号
   */
  static async update(
    id: string,
    data: {
      name?: string;
      cookies?: string;
      userAgent?: string;
      headers?: Record<string, string>;
      proxy?: { enabled: boolean; host?: string; port?: number; username?: string; password?: string };
      enabled?: boolean;
      refreshToken?: string | null;
      lastRefreshTime?: Date | null;
    }
  ) {
    const account = await prisma.account.findUnique({ where: { id } });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    // 如果要更新 cookies，验证格式并加密
    let encryptedCookies: string | undefined;
    if (data.cookies) {
      const cookieValidation = validateCookies(data.cookies);
      if (!cookieValidation.valid) {
        throw new ValidationError(`Invalid cookies: ${cookieValidation.error}`);
      }
      encryptedCookies = encrypt(data.cookies, config.encryption.secret);
    }

    const updated = await prisma.account.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(encryptedCookies && { cookies: encryptedCookies }),
        ...(data.userAgent && { userAgent: data.userAgent }),
        ...(data.headers && { headers: JSON.stringify(data.headers) }),
        ...(data.proxy !== undefined && { proxy: JSON.stringify(data.proxy) }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.refreshToken !== undefined && { refreshToken: data.refreshToken || null }),
        ...(data.lastRefreshTime !== undefined && { lastRefreshTime: data.lastRefreshTime }),
      },
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    return {
      ...updated,
      cookies: '***',
      headers: updated.headers ? JSON.parse(updated.headers) : {},
      proxy: updated.proxy ? JSON.parse(updated.proxy) : null,
      refreshToken: updated.refreshToken ? '***' : null,
      lastRefreshTime: updated.lastRefreshTime,
    };
  }

  /**
   * 删除账号
   */
  static async delete(id: string) {
    const account = await prisma.account.findUnique({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    if (account._count.tasks > 0) {
      throw new ValidationError('Cannot delete account with associated tasks. Delete tasks first.');
    }

    await prisma.account.delete({ where: { id } });

    return { success: true };
  }
}
