/**
 * i18n 类型定义
 */

import type zhCN from '../locales/zh-CN.json';

// 使用中文资源作为类型基础
export type TranslationResources = typeof zhCN;

// 支持的语言
export type SupportedLanguage = 'zh-CN' | 'en-US';

// 默认语言
export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-CN';

// 支持的语言列表
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['zh-CN', 'en-US'];

// 语言显示名称
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
};

// 嵌套对象的键路径类型
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}` | K
          : K
        : never;
    }[keyof T]
  : never;

// 翻译键类型
export type TranslationKey = NestedKeyOf<TranslationResources>;
