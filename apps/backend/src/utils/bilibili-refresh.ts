import crypto from 'crypto';
import axios from 'axios';
import type { ParsedCookie } from '../types/index.js';
import { parseCookies, cookiesToObject } from './cookie.js';

type LogLevel = 'info' | 'warn' | 'error';
type LoggerFn = (level: LogLevel, message: string, ...meta: unknown[]) => void;

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const BILIBILI_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDLgd2OAkcGVtoE3ThUREbio0Eg
Uc/prcajMKXvkCKFCWhJYJcLkcM2DKKcSeFpD/j6Boy538YXnR6VhcuUJOhH2x71
nzPjfdTcqMz7djHum0qSZA0AyCBDABUqCrfNgCiJ00Ra7GmRj+YCK1NJEuewlb40
JNrRuoEUXpabUzGB8QIDAQAB
-----END PUBLIC KEY-----`;

interface CookieRefreshCheckResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    refresh: boolean;
    timestamp: number;
  };
}

interface CookieRefreshResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    status: number;
    message: string;
    refresh_token: string;
  };
}

interface CookieConfirmResponse {
  code: number;
  message: string;
  ttl: number;
}

export interface PerformRefreshOptions {
  force?: boolean;
  logger?: LoggerFn;
}

export interface PerformRefreshResult {
  success: boolean;
  refreshed: boolean;
  updatedCookies?: ParsedCookie[];
  newRefreshToken?: string;
  error?: string;
}

function ensureLogger(logger?: LoggerFn): LoggerFn {
  if (logger) {
    return logger;
  }
  return (level, message, ...meta) => {
    const metaString = meta.length ? ` ${meta.map((m) => JSON.stringify(m)).join(' ')}` : '';
    console[level === 'error' ? 'error' : level](`[BilibiliRefresh] ${message}${metaString}`);
  };
}

function toCookieArray(cookies: string | ParsedCookie[]): ParsedCookie[] {
  if (typeof cookies === 'string') {
    return parseCookies(cookies);
  }
  return cookies;
}

export function formatCookiesForHeader(cookies: string | ParsedCookie[]): string {
  if (typeof cookies === 'string') {
    if (!cookies.includes('\n') && !cookies.includes('\t')) {
      return cookies.trim();
    }
  }

  const cookieArray = toCookieArray(cookies);
  return cookieArray.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}

function parseCookiesFromSetCookie(headers: string | string[] | undefined): ParsedCookie[] {
  if (!headers) {
    return [];
  }

  const headerList = Array.isArray(headers) ? headers : [headers];
  const cookies: ParsedCookie[] = [];

  for (const header of headerList) {
    const [firstPart] = header.split(';');
    if (!firstPart) continue;

    const [name, value] = firstPart.split('=');
    if (!name || value === undefined) continue;

    cookies.push({
      name: name.trim(),
      value: value.trim(),
    });
  }

  return cookies;
}

export async function checkIfNeedsRefresh(
  cookies: string | ParsedCookie[],
  logger?: LoggerFn
): Promise<{ needsRefresh: boolean; timestamp?: number }> {
  const log = ensureLogger(logger);

  try {
    const cookieObj = cookiesToObject(toCookieArray(cookies));
    const csrf = cookieObj.bili_jct;

    if (!csrf) {
      log('warn', 'bili_jct cookie not found, cannot check refresh status');
      return { needsRefresh: false };
    }

    const response = await axios.get<CookieRefreshCheckResponse>(
      'https://passport.bilibili.com/x/passport-login/web/cookie/info',
      {
        params: { csrf },
        headers: {
          Cookie: formatCookiesForHeader(cookies),
          'User-Agent': DEFAULT_UA,
        },
        timeout: 10000,
      }
    );

    if (response.data.code === 0) {
      const needsRefresh = response.data.data.refresh;
      const timestamp = response.data.data.timestamp;
      log('info', `Cookie refresh check result: ${needsRefresh ? 'needs refresh' : 'no refresh'}`);
      return { needsRefresh, timestamp };
    }

    if (response.data.code === -101) {
      log('error', 'Account not logged in when checking cookie status');
      return { needsRefresh: false };
    }

    log('warn', `Unexpected response when checking cookie status: ${response.data.message}`);
    return { needsRefresh: false };
  } catch (error) {
    log('error', 'Failed to check cookie refresh status', error);
    return { needsRefresh: false };
  }
}

export async function generateCorrespondPath(timestamp: number): Promise<string> {
  const publicKey = crypto.createPublicKey({ key: BILIBILI_PUBLIC_KEY, format: 'pem' });
  const message = Buffer.from(`refresh_${timestamp}`);

  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    message
  );

  return encrypted.toString('hex');
}

export async function getRefreshCsrf(
  correspondPath: string,
  cookies: string | ParsedCookie[],
  logger?: LoggerFn
): Promise<string | null> {
  const log = ensureLogger(logger);

  try {
    const response = await axios.get(`https://www.bilibili.com/correspond/1/${correspondPath}`, {
      headers: {
        Cookie: formatCookiesForHeader(cookies),
        'User-Agent': DEFAULT_UA,
      },
      timeout: 10000,
    });

    const match = response.data?.match?.(/<div id="1-name">([^<]+)<\/div>/);
    if (match && match[1]) {
      const token = match[1].trim();
      log('info', `refresh_csrf obtained (${token.substring(0, 8)}...)`);
      return token;
    }

    log('warn', 'refresh_csrf not found in correspond response');
    return null;
  } catch (error) {
    log('error', 'Failed to retrieve refresh_csrf', error);
    return null;
  }
}

export async function refreshCookie(
  refreshToken: string,
  refreshCsrf: string,
  cookies: string | ParsedCookie[],
  logger?: LoggerFn
): Promise<{ success: boolean; cookies?: ParsedCookie[]; newRefreshToken?: string; error?: string }> {
  const log = ensureLogger(logger);

  try {
    const cookieObj = cookiesToObject(toCookieArray(cookies));
    const csrf = cookieObj.bili_jct;

    if (!csrf) {
      log('error', 'Cannot refresh cookie because bili_jct is missing');
      return { success: false, error: 'Missing bili_jct' };
    }

    const response = await axios.post<CookieRefreshResponse>(
      'https://passport.bilibili.com/x/passport-login/web/cookie/refresh',
      new URLSearchParams({
        csrf,
        refresh_csrf: refreshCsrf,
        source: 'main_web',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          Cookie: formatCookiesForHeader(cookies),
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': DEFAULT_UA,
        },
        timeout: 10000,
      }
    );

    if (response.data.code === 0) {
      const setCookieHeaders = response.headers['set-cookie'];
      const parsedCookies = parseCookiesFromSetCookie(setCookieHeaders);
      const newRefreshToken = response.data.data.refresh_token;
      log('info', 'Cookie refresh API responded with success');
      return { success: true, cookies: parsedCookies, newRefreshToken };
    }

    const errorMsg = response.data.message || 'Unknown refresh error';
    log('warn', `Cookie refresh API returned error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  } catch (error) {
    log('error', 'Cookie refresh request failed', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function confirmCookieRefresh(
  previousRefreshToken: string,
  cookies: string | ParsedCookie[],
  logger?: LoggerFn
): Promise<boolean> {
  const log = ensureLogger(logger);

  try {
    const cookieObj = cookiesToObject(toCookieArray(cookies));
    const csrf = cookieObj.bili_jct;

    if (!csrf) {
      log('warn', 'Cannot confirm cookie refresh because bili_jct is missing');
      return false;
    }

    const response = await axios.post<CookieConfirmResponse>(
      'https://passport.bilibili.com/x/passport-login/web/confirm/refresh',
      new URLSearchParams({
        csrf,
        refresh_token: previousRefreshToken,
      }),
      {
        headers: {
          Cookie: formatCookiesForHeader(cookies),
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': DEFAULT_UA,
        },
        timeout: 10000,
      }
    );

    if (response.data.code === 0) {
      log('info', 'Cookie refresh confirmation succeeded');
      return true;
    }

    log('warn', `Cookie refresh confirmation returned ${response.data.code}: ${response.data.message}`);
    return false;
  } catch (error) {
    log('warn', 'Failed to confirm cookie refresh', error);
    return false;
  }
}

export function mergeCookieArrays(
  original: string | ParsedCookie[],
  updates: ParsedCookie[]
): ParsedCookie[] {
  const map = new Map<string, ParsedCookie>();

  for (const cookie of toCookieArray(original)) {
    map.set(cookie.name, cookie);
  }

  for (const cookie of updates) {
    map.set(cookie.name, cookie);
  }

  return Array.from(map.values());
}

export async function performCookieRefresh(
  cookies: string | ParsedCookie[],
  refreshToken: string,
  options: PerformRefreshOptions = {}
): Promise<PerformRefreshResult> {
  const log = ensureLogger(options.logger);

  try {
    if (!refreshToken) {
      log('warn', 'No refresh token available, skipping cookie refresh');
      return { success: false, refreshed: false, error: 'Missing refresh token' };
    }

    let timestamp = Date.now();
    let needsRefresh = true;

    if (!options.force) {
      const check = await checkIfNeedsRefresh(cookies, log);
      needsRefresh = check.needsRefresh;
      if (!needsRefresh) {
        log('info', 'Cookie does not need refresh');
        return { success: true, refreshed: false };
      }
      timestamp = check.timestamp ?? timestamp;
    }

    log('info', `Generating correspondPath with timestamp ${timestamp}`);
    const correspondPath = await generateCorrespondPath(timestamp);

    const refreshCsrf = await getRefreshCsrf(correspondPath, cookies, log);
    if (!refreshCsrf) {
      return { success: false, refreshed: false, error: 'Failed to obtain refresh_csrf' };
    }

    const refreshResult = await refreshCookie(refreshToken, refreshCsrf, cookies, log);
    if (!refreshResult.success || !refreshResult.cookies) {
      return {
        success: false,
        refreshed: false,
        error: refreshResult.error ?? 'Unknown refresh failure',
      };
    }

    const mergedCookies = mergeCookieArrays(cookies, refreshResult.cookies);

    await confirmCookieRefresh(refreshToken, mergedCookies, log);

    log('info', 'Cookie refresh completed');

    return {
      success: true,
      refreshed: true,
      updatedCookies: mergedCookies,
      newRefreshToken: refreshResult.newRefreshToken,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log('error', 'Cookie refresh process failed', errorMsg);
    return { success: false, refreshed: false, error: errorMsg };
  }
}
