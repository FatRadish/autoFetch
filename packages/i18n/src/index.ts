/**
 * 核心 i18n 初始化和工具函数
 * 可在前端和后端共用
 */

import i18next, { type i18n, type TFunction, type InitOptions } from 'i18next';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import {
  type SupportedLanguage,
  type TranslationKey,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from './types/index.js';

// 资源配置
const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
} as const;

// 默认配置
const defaultOptions: InitOptions = {
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    escapeValue: false, // React 已经做了 XSS 防护
  },
  returnNull: false,
  returnEmptyString: false,
};

/**
 * 创建一个新的 i18n 实例
 * 适用于服务端或需要独立实例的场景
 */
export function createI18nInstance(options?: Partial<InitOptions>): i18n {
  const instance = i18next.createInstance();
  instance.init({
    ...defaultOptions,
    ...options,
  });
  return instance;
}

/**
 * 初始化全局 i18n 实例
 * 适用于客户端单例模式
 */
export async function initI18n(options?: Partial<InitOptions>): Promise<i18n> {
  if (!i18next.isInitialized) {
    await i18next.init({
      ...defaultOptions,
      ...options,
    });
  }
  return i18next;
}

/**
 * 获取当前语言
 */
export function getCurrentLanguage(): SupportedLanguage {
  return (i18next.language as SupportedLanguage) || DEFAULT_LANGUAGE;
}

/**
 * 切换语言
 */
export async function changeLanguage(lng: SupportedLanguage): Promise<TFunction> {
  return i18next.changeLanguage(lng);
}

/**
 * 检查是否是支持的语言
 */
export function isSupportedLanguage(lng: string): lng is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lng as SupportedLanguage);
}

/**
 * 翻译函数 - 使用全局实例
 */
export function t(key: TranslationKey, options?: Record<string, unknown>): string {
  return i18next.t(key, options);
}

/**
 * 获取翻译函数 - 指定语言
 */
export function getFixedT(lng: SupportedLanguage): TFunction {
  return i18next.getFixedT(lng);
}

// 导出 i18next 实例供高级用法
export { i18next };

// 导出类型
export * from './types/index.js';

// 导出资源（用于动态加载或 SSR）
export { resources, zhCN, enUS };
