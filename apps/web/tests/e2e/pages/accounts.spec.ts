import { test, expect } from '@playwright/test';
import { initLanguage, login } from '../helpers';

test.describe('账号管理页面测试', () => {
  // 在每个测试前初始化语言并登录
  test.beforeEach(async ({ page }) => {
    await initLanguage(page, 'zh-CN');
    // 使用登录辅助函数
    await login(page);
  });

  test('should goto accounts page and normal page', async ({ page }) => {
    // 导航到账号管理页面
    await page.goto('http://localhost:5173/#/accounts');

    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - textbox "请输入账号名称"
    - button "添加账号"
    - table:
      - rowgroup:
        - row "账号名称 所属平台 userAgent 创建时间 操作":
          - cell "账号名称"
          - cell "所属平台"
          - cell "userAgent"
          - cell "创建时间"
          - cell "操作"
    `);
  });

  test('should add, edit, and delete an account', async ({ page }) => {
    // 导航到账号管理页面
    await page.goto('http://localhost:5173/#/accounts');

    await page.getByRole('button', { name: '添加账号' }).click();
    await page.getByRole('textbox', { name: '账号名称' }).click();
    await page.getByRole('textbox', { name: '账号名称' }).fill('测试');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'bilibili' }).click();
    await page.getByRole('textbox', { name: 'userAgent' }).click();
    await page
      .getByRole('textbox', { name: 'userAgent' })
      .fill(
        'Mozilla/5.0 (X11; Linux x86_64 AppleWebKit/531.1.2 (KHTML, like Gecko) Chrome/20.0.880.0 Safari/531.1.2'
      );
    await page.getByRole('textbox', { name: 'headers' }).click();
    await page.getByRole('textbox', { name: 'Cookies' }).click();
    await page.getByRole('textbox', { name: 'Cookies' }).fill('');
    await page
      .getByRole('textbox', { name: 'Cookies' })
      .fill(
        ` CURRENT_FNVAL=16; DedeUserID=17352735; DedeUserID__ckMd5=bbd3f6f3e2e4f4e3; SESSDATA=8f1bcb9a%2C1708217091%2C3e1f5%2A21; bili_jct=1c8e4f4e3b5c6d7e8f9a0b1c2d3e4f5g; sid=abcd1234`
      );
    await page.getByRole('textbox', { name: 'Refresh Token' }).click();
    await page.getByRole('button', { name: '确认' }).click();

    await expect(page.locator('tbody')).toMatchAriaSnapshot(`- cell "测试"`);
    await expect(page.locator('tbody')).toMatchAriaSnapshot(
      `- cell "bilibili"`
    );
    await expect(page.locator('tbody')).toMatchAriaSnapshot(
      `- cell /Mozilla\\/5\\.0 \\(X11; Linux x86_64 AppleWebKit\\/\\d+\\.\\d+\\.2 \\(KHTML, like Gecko\\) Chrome\\/\\d+\\.\\d+\\.\\d+\\.\\d+ Safari\\/\\d+\\.\\d+\\.2/`
    );
    await expect(page.locator('tbody')).toMatchAriaSnapshot(
      `- cell /\\d+-\\d+-\\d+ \\d+:\\d+:\\d+/`
    );
    await expect(page.locator('tbody')).toMatchAriaSnapshot(`
      - cell "编辑 删除":
        - button "编辑"
        - button "删除"
      `);
    await page.getByRole('button', { name: '编辑' }).first().click();

    await page.getByRole('textbox', { name: '账号名称' }).click();
    await page.getByRole('textbox', { name: '账号名称' }).fill('测试123');
    await page.getByRole('textbox', { name: 'Refresh Token' }).click();
    await page.getByRole('textbox', { name: 'Refresh Token' }).fill('213');
    await page.getByRole('button', { name: '确认' }).click();
    await expect(page.locator('tbody')).toMatchAriaSnapshot(
      `- cell /测试\\d+/`
    );
    await page.getByRole('button', { name: '删除' }).first().click();
    await expect(page.locator('tbody')).not.toMatchAriaSnapshot(
      `- cell /测试\\d+/`
    );
  });
});
