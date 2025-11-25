import { test, expect } from '@playwright/test';

test('homepage has correct title', async ({ page }) => {
  await page.goto('/');

  // 检查页面标题
  await expect(page).toHaveTitle(/AutoFetch/i);
});

test('basic navigation works', async ({ page }) => {
  await page.goto('/');

  // 示例：点击链接或按钮
  // await page.click('text=Login');
  // await expect(page).toHaveURL(/.*login/);
});
