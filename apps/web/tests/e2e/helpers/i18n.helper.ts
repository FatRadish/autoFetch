/**
 * E2E 测试 - i18n 辅助函数
 * 用于在 Playwright 测试中操作语言切换
 */

import { type Page, type Locator } from '@playwright/test';

/**
 * 支持的语言类型
 */
export type SupportedLanguage = 'zh-CN' | 'en-US';

/**
 * 语言显示名称映射
 */
export const LANGUAGE_DISPLAY_NAMES: Record<SupportedLanguage, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
};

/**
 * 通过点击语言切换按钮切换语言
 * @param page Playwright Page 对象
 * @param language 目标语言
 */
export async function changeLanguageByUI(
  page: Page,
  language: SupportedLanguage
): Promise<void> {
  // 找到语言切换按钮（通过 Languages 图标）
  const languageToggle = page.getByRole('button', {
    name: /切换语言|Toggle language/i,
  });

  // 点击语言切换按钮打开下拉菜单
  await languageToggle.click();

  // 点击目标语言选项
  const languageName = LANGUAGE_DISPLAY_NAMES[language];
  await page.getByRole('menuitem', { name: languageName }).click();

  // 等待语言切换完成（等待 localStorage 更新）
  await page.waitForTimeout(100);
}

/**
 * 通过 localStorage 直接设置语言（更快）
 * @param page Playwright Page 对象
 * @param language 目标语言
 */
export async function setLanguageByStorage(
  page: Page,
  language: SupportedLanguage
): Promise<void> {
  await page.evaluate((lang) => {
    localStorage.setItem('i18n-language', lang);
  }, language);

  // 刷新页面使语言设置生效
  await page.reload();
}

/**
 * 获取当前语言设置
 * @param page Playwright Page 对象
 * @returns 当前语言
 */
export async function getCurrentLanguage(
  page: Page
): Promise<SupportedLanguage> {
  const language = await page.evaluate(() => {
    return localStorage.getItem('i18n-language') || 'zh-CN';
  });

  return language as SupportedLanguage;
}

/**
 * 在测试开始前初始化语言设置
 * @param page Playwright Page 对象
 * @param language 初始语言（默认中文）
 */
export async function initLanguage(
  page: Page,
  language: SupportedLanguage = 'zh-CN'
): Promise<void> {
  // 使用 addInitScript 在页面加载前设置语言
  await page.addInitScript((lang) => {
    localStorage.setItem('i18n-language', lang);
  }, language);
}

/**
 * 语言切换辅助类（支持链式调用）
 */
export class LanguageHelper {
  constructor(private page: Page) {}

  /**
   * 切换到中文
   */
  async switchToChinese(): Promise<void> {
    await changeLanguageByUI(this.page, 'zh-CN');
  }

  /**
   * 切换到英文
   */
  async switchToEnglish(): Promise<void> {
    await changeLanguageByUI(this.page, 'en-US');
  }

  /**
   * 设置中文（通过 storage，更快）
   */
  async setChinese(): Promise<void> {
    await setLanguageByStorage(this.page, 'zh-CN');
  }

  /**
   * 设置英文（通过 storage，更快）
   */
  async setEnglish(): Promise<void> {
    await setLanguageByStorage(this.page, 'en-US');
  }

  /**
   * 获取当前语言
   */
  async getCurrent(): Promise<SupportedLanguage> {
    return getCurrentLanguage(this.page);
  }

  /**
   * 初始化语言
   */
  async init(language: SupportedLanguage = 'zh-CN'): Promise<void> {
    await initLanguage(this.page, language);
  }
}

/**
 * 创建语言辅助工具实例
 * @param page Playwright Page 对象
 * @returns LanguageHelper 实例
 */
export function createLanguageHelper(page: Page): LanguageHelper {
  return new LanguageHelper(page);
}
