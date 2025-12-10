/**
 * i18n 初始化配置
 */

import { initReactI18n } from '@auto-fetch/i18n/react';

/**
 * 初始化 i18n
 * 在应用启动时调用
 */
export async function setupI18n(): Promise<void> {
  await initReactI18n();
}

// 重新导出常用的 hooks 和工具
export {
  useTranslation,
  useLanguage,
  Trans,
  type SupportedLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
} from '@auto-fetch/i18n/react';
