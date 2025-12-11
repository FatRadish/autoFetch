import type { ParsedCookie } from '../types/index.js';

/**
 * 解析 Cookie 字符串为对象数组
 * 支持多种格式：
 * - Netscape format (每行一个 cookie)
 * - JSON format
 * - Header format (key=value; key2=value2)
 */
export function parseCookies(cookieString: string): ParsedCookie[] {
  const cookies: ParsedCookie[] = [];

  if (!cookieString || cookieString.trim() === '') {
    return cookies;
  }

  // 尝试解析 JSON 格式
  if (
    cookieString.trim().startsWith('[') ||
    cookieString.trim().startsWith('{')
  ) {
    try {
      const parsed = JSON.parse(cookieString);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === 'object') {
        return Object.entries(parsed).map(([name, value]) => ({
          name,
          value: String(value),
        }));
      }
    } catch {
      // 继续尝试其他格式
    }
  }

  // Netscape 格式（每行一个 cookie）
  if (cookieString.includes('\n')) {
    const lines = cookieString.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const parts = trimmed.split('\t');
      if (parts.length >= 7) {
        // Netscape cookie file format
        cookies.push({
          name: parts[5]!,
          value: parts[6]!,
          domain: parts[0],
          path: parts[2],
          secure: parts[3] === 'TRUE',
          httpOnly: false,
        });
      } else if (trimmed.includes('=')) {
        // Simple name=value format
        const [name, ...valueParts] = trimmed.split('=');
        cookies.push({
          name: name!.trim(),
          value: valueParts.join('=').trim(),
        });
      }
    }
    return cookies;
  }

  // Header 格式 (key=value; key2=value2)
  const pairs = cookieString.split(';');
  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const name = trimmed.substring(0, eqIndex).trim();
      const value = trimmed.substring(eqIndex + 1).trim();
      cookies.push({ name, value });
    }
  }

  return cookies;
}

/**
 * 将 Cookie 对象数组转换为 Header 格式字符串
 */
export function cookiesToHeaderString(cookies: ParsedCookie[]): string {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}

/**
 * 将 Cookie 对象数组转换为 JSON 字符串
 */
export function cookiesToJSON(cookies: ParsedCookie[]): string {
  return JSON.stringify(cookies, null, 2);
}

/**
 * 从对象创建 Cookie 数组
 */
export function cookiesFromObject(obj: Record<string, string>): ParsedCookie[] {
  return Object.entries(obj).map(([name, value]) => ({ name, value }));
}

/**
 * 将 Cookie 数组转换为对象
 */
export function cookiesToObject(
  cookies: ParsedCookie[]
): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const cookie of cookies) {
    obj[cookie.name] = cookie.value;
  }
  return obj;
}

/**
 * 合并多个 Cookie 数组（后面的覆盖前面的）
 */
export function mergeCookies(
  ...cookieArrays: ParsedCookie[][]
): ParsedCookie[] {
  const cookieMap = new Map<string, ParsedCookie>();

  for (const cookies of cookieArrays) {
    for (const cookie of cookies) {
      cookieMap.set(cookie.name, cookie);
    }
  }

  return Array.from(cookieMap.values());
}

/**
 * 验证 Cookie 是否有效（基本格式检查）
 */
export function validateCookies(cookieString: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const cookies = parseCookies(cookieString);
    if (cookies.length === 0) {
      return { valid: false, error: 'No valid cookies found' };
    }

    // 检查每个 cookie 是否有 name 和 value
    for (const cookie of cookies) {
      if (!cookie.name || cookie.value === undefined) {
        return {
          valid: false,
          error: 'Invalid cookie format: missing name or value',
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 检查 Cookie 是否过期
 */
export function isCookieExpired(cookie: ParsedCookie): boolean {
  if (!cookie.expires) return false;
  return new Date(cookie.expires) < new Date();
}

/**
 * 过滤掉已过期的 Cookie
 */
export function filterExpiredCookies(cookies: ParsedCookie[]): ParsedCookie[] {
  return cookies.filter((cookie) => !isCookieExpired(cookie));
}
