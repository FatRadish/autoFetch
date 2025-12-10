/**
 * React i18n 绑定
 * 基于 react-i18next 封装，提供更好的类型支持
 */

import { useCallback, useEffect, useState } from 'react';
import {
  I18nextProvider,
  useTranslation as useI18nextTranslation,
  Trans as I18nextTrans,
  initReactI18next,
  type UseTranslationOptions,
} from 'react-i18next';
import type { i18n as I18nInstance } from 'i18next';
import i18next from 'i18next';
import {
  changeLanguage as changeLanguageCore,
  type SupportedLanguage,
  type TranslationKey,
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  DEFAULT_LANGUAGE,
  resources,
} from '../index.js';

// 定义返回类型
interface UseTranslationReturn {
  t: (key: TranslationKey, interpolation?: Record<string, unknown>) => string;
  i18n: I18nInstance;
  ready: boolean;
  language: SupportedLanguage;
}

interface UseLanguageReturn {
  language: SupportedLanguage;
  changeLanguage: (lng: SupportedLanguage) => Promise<void>;
  supportedLanguages: readonly SupportedLanguage[];
  languageNames: Record<SupportedLanguage, string>;
}

/**
 * 初始化 React i18n
 * 在应用入口处调用
 */
export async function initReactI18n(): Promise<void> {
  // 尝试从 localStorage 获取用户偏好语言
  const savedLanguage = typeof window !== 'undefined'
    ? (localStorage.getItem('i18n-language') as SupportedLanguage | null)
    : null;

  // 检测浏览器语言
  const browserLanguage = typeof navigator !== 'undefined'
    ? navigator.language
    : DEFAULT_LANGUAGE;

  // 确定初始语言
  const initialLanguage = savedLanguage
    || (SUPPORTED_LANGUAGES.includes(browserLanguage as SupportedLanguage)
      ? browserLanguage as SupportedLanguage
      : DEFAULT_LANGUAGE);

  // 使用 react-i18next 初始化
  await i18next
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGES,
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
      returnEmptyString: false,
    });
}

/**
 * 类型安全的 useTranslation hook
 */
export function useTranslation(options?: UseTranslationOptions<'translation'>): UseTranslationReturn {
  const { t: originalT, i18n, ready } = useI18nextTranslation('translation', options);

  // 包装 t 函数以提供更好的类型支持
  const t = useCallback(
    (key: TranslationKey, interpolation?: Record<string, unknown>): string => {
      return String(originalT(key, interpolation as never));
    },
    [originalT]
  );

  return {
    t,
    i18n,
    ready,
    language: i18n.language as SupportedLanguage,
  };
}

/**
 * 语言切换 hook
 */
export function useLanguage(): UseLanguageReturn {
  const { i18n } = useI18nextTranslation();
  const [language, setLanguageState] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || DEFAULT_LANGUAGE
  );

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguageState(lng as SupportedLanguage);
    };

    // 检查 i18n 是否已初始化并且有 on 方法
    if (i18n && typeof i18n.on === 'function') {
      i18n.on('languageChanged', handleLanguageChange);
      return () => {
        i18n.off('languageChanged', handleLanguageChange);
      };
    }
  }, [i18n]);

  const changeLanguage = useCallback(
    async (lng: SupportedLanguage) => {
      await changeLanguageCore(lng);
      setLanguageState(lng);
      // 保存到 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('i18n-language', lng);
      }
    },
    []
  );

  return {
    language,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    languageNames: LANGUAGE_NAMES,
  };
}

// 导出组件
export { I18nextProvider, i18next };

// Trans 组件用于复杂的内联翻译
export const Trans: typeof I18nextTrans = I18nextTrans;

// 重新导出类型和常量
export {
  type SupportedLanguage,
  type TranslationKey,
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  DEFAULT_LANGUAGE,
} from '../index.js';
