import prisma from '../lib/prisma.js';
import { decrypt, encrypt } from '../utils/encrypt.js';
import config from '../config/index.js';
import type { JwtPayload } from '../types/index.js';
import { performCookieRefresh, formatCookiesForHeader, type PerformRefreshOptions } from '../utils/bilibili-refresh.js';
import { NotFoundError } from '../types/index.js';

export interface AccountRefreshResult {
  success: boolean;
  message: string;
  accountId: string;
  refreshed: boolean;
  updatedCookies?: string;
  updatedRefreshToken?: string;
  nextSuggestedRefresh?: Date;
  error?: string;
}

type LoggerFn = (level: 'info' | 'warn' | 'error', message: string, ...meta: unknown[]) => void;

function ensureLogger(logger?: LoggerFn): LoggerFn {
  if (logger) {
    return logger;
  }
  return (level, message, ...meta) => {
    const metaText = meta.length ? ` ${meta.map((item) => JSON.stringify(item)).join(' ')}` : '';
    const record = `[AccountRefresh] ${message}${metaText}`;
    if (level === 'error') {
      console.error(record);
    } else if (level === 'warn') {
      console.warn(record);
    } else {
      console.info(record);
    }
  };
}

export class AccountRefreshService {
  // 刷新指定账号的 Cookie （仅限 B 站）
  static async refreshAccountCookie(
    accountId: string,
    options: PerformRefreshOptions & { logger?: LoggerFn } = {}
  ): Promise<AccountRefreshResult> {
    const log = ensureLogger(options.logger);

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { platform: true },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    if (account.platform.name.toLowerCase() !== 'bilibili') {
      return {
        success: false,
        message: 'Platform does not support automatic cookie refresh',
        accountId,
        refreshed: false,
        error: 'Unsupported platform',
      };
    }

    if (!account.refreshToken) {
      return {
        success: false,
        message: 'No refresh token stored for this account',
        accountId,
        refreshed: false,
        error: 'Missing refresh token',
      };
    }

    const decryptedCookies = decrypt(account.cookies, config.encryption.secret);

    log('info', `Refreshing cookies for account ${account.name}`);

    const refreshResult = await performCookieRefresh(decryptedCookies, account.refreshToken, {
      force: options.force,
      logger: (level, msg, ...meta) => log(level, msg, ...meta),
    });

    if (!refreshResult.success) {
      const errorMsg = refreshResult.error ?? 'Unknown refresh error';
      log('warn', `Cookie refresh failed: ${errorMsg}`);
      return {
        success: false,
        message: `Cookie refresh failed: ${errorMsg}`,
        accountId,
        refreshed: false,
        error: errorMsg,
      };
    }

    if (!refreshResult.refreshed || !refreshResult.updatedCookies) {
      log('info', 'Cookie refresh not required - current cookies remain valid');
      return {
        success: true,
        message: 'Cookie refresh not required',
        accountId,
        refreshed: false,
      };
    }

    const updatedCookieHeader = formatCookiesForHeader(refreshResult.updatedCookies);
    const encryptedCookies = encrypt(updatedCookieHeader, config.encryption.secret);

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: {
        cookies: encryptedCookies,
        refreshToken: refreshResult.newRefreshToken ?? account.refreshToken,
        lastRefreshTime: new Date(),
      },
    });

    log('info', `Cookie refresh succeeded for account ${account.name}`);

    const nextSuggest = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      success: true,
      message: 'Cookie refreshed successfully',
      accountId: updated.id,
      refreshed: true,
      updatedCookies: updatedCookieHeader,
      updatedRefreshToken: refreshResult.newRefreshToken ?? account.refreshToken,
      nextSuggestedRefresh: nextSuggest,
    };
  }

  static async updateRefreshToken(
    accountId: string,
    refreshToken: string,
    user: JwtPayload
  ): Promise<boolean> {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: user.userId },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    await prisma.account.update({
      where: { id: accountId },
      data: { refreshToken },
    });

    return true;
  }
}
