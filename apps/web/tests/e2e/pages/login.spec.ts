import { test, expect } from '@playwright/test';
import { initLanguage } from '../helpers';

test.describe('login page test', () => {
  // 在每个测试前初始化语言为中文
  test.beforeEach(async ({ page }) => {
    await initLanguage(page, 'zh-CN');
  });

  test.describe('successful login scenarios', () => {
    test('logging in with correct credentials should navigate to dashboard', async ({
      page,
    }) => {
      await page.goto('http://localhost:5173/#/login');

      await expect(page.locator('#root')).toMatchAriaSnapshot(`
        - img "AutoFetch Logo"
        - text: 登录 用户名
        - textbox "用户名"
        - text: 密码
        - textbox "密码"
        - button "登录"
      `);

      await page.getByRole('textbox', { name: '用户名' }).click();
      await page.getByRole('textbox', { name: '用户名' }).fill('admin');
      await page.getByRole('textbox', { name: '密码' }).click();
      await page.getByRole('textbox', { name: '密码' }).fill('admin123');

      // 点击登录按钮并等待导航
      await Promise.all([
        page.waitForURL('**/dashboard', { timeout: 5000 }), // 等待URL变化
        page.getByRole('button', { name: '登录' }).click(), // 点击登录
      ]);

      // 验证跳转成功
      expect(page.url()).toBe('http://localhost:5173/#/dashboard');

      // 可选：验证 dashboard 页面加载成功（验证页面内容）
      // await expect(page.locator('#root')).toContainText('仪表板'); // 根据实际页面内容调整
    });
  });

  test.describe('failed login scenarios', () => {
    test('using incorrect credentials should stay on login page', async ({
      page,
    }) => {
      await page.goto('http://localhost:5173/#/login');

      await page.getByRole('textbox', { name: '用户名' }).fill('wrong_user');
      await page.getByRole('textbox', { name: '密码' }).fill('wrong_password');
      await page.getByRole('button', { name: '登录' }).click();

      // 等待一下看是否有错误提示
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('listitem')).toHaveText('账号或者密码错误');
      // await page.waitForTimeout(1000);
      // 验证仍在登录页面
      expect(page.url()).toContain('/login');
    });
  });
});
