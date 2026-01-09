/**
 * E2E 测试 - 认证辅助函数
 * 用于在 Playwright 测试中处理登录等认证操作
 */

import { type Page } from '@playwright/test';

/**
 * 登录凭证接口
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * 默认的登录凭证
 */
export const DEFAULT_CREDENTIALS: LoginCredentials = {
  username: 'admin',
  password: 'admin123',
};

/**
 * 执行登录操作
 * @param page Playwright Page 对象
 * @param credentials 登录凭证（可选，默认使用 admin/admin123）
 */
export async function login(
  page: Page,
  credentials: LoginCredentials = DEFAULT_CREDENTIALS
): Promise<void> {
  // 访问登录页面
  await page.goto('http://localhost:5173/#/login');

  // 填写用户名和密码
  await page
    .getByRole('textbox', { name: /用户名|username/i })
    .fill(credentials.username);
  await page
    .getByRole('textbox', { name: /密码|password/i })
    .fill(credentials.password);

  // 点击登录按钮并等待导航
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 5000 }),
    page.getByRole('button', { name: /登录|login/i }).click(),
  ]);
}

/**
 * 快速登录 - 通过设置认证状态（绕过 UI，更快）
 * 注意：需要根据你的应用实际的认证方式调整
 * @param page Playwright Page 对象
 * @param credentials 登录凭证
 */
export async function quickLogin(
  page: Page,
  credentials: LoginCredentials = DEFAULT_CREDENTIALS
): Promise<void> {
  // 方式1: 如果使用 localStorage 存储 token
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    // 这里需要根据实际的 token 设置方式调整
    // localStorage.setItem('authToken', 'your-token-here');
  });

  // 方式2: 使用真实登录流程（推荐）
  await login(page, credentials);
}

/**
 * 登出操作
 * @param page Playwright Page 对象
 */
export async function logout(page: Page): Promise<void> {
  // 查找并点击登出按钮
  // 根据你的应用调整选择器
  const logoutButton = page.getByRole('button', { name: /登出|退出|logout/i });

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    // 等待跳转到登录页
    await page.waitForURL('**/login', { timeout: 3000 });
  }
}

/**
 * 检查是否已登录
 * @param page Playwright Page 对象
 * @returns 是否已登录
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // 方式1: 检查 URL 是否不是登录页
  const url = page.url();
  if (url.includes('/login')) {
    return false;
  }

  // 方式2: 检查是否存在特定的已登录元素（根据实际调整）
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * 确保已登录（如果未登录则执行登录）
 * @param page Playwright Page 对象
 * @param credentials 登录凭证
 */
export async function ensureLoggedIn(
  page: Page,
  credentials: LoginCredentials = DEFAULT_CREDENTIALS
): Promise<void> {
  const loggedIn = await isLoggedIn(page);

  if (!loggedIn) {
    await login(page, credentials);
  }
}
