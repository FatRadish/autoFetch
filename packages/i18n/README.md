# @auto-fetch/i18n

AutoFetch 项目的国际化（i18n）共享包，支持前端和后端使用。

## 特性

- 🌍 支持中文（zh-CN）和英文（en-US）
- 🔧 基于 i18next 构建
- 📦 前后端共享翻译资源
- 🎯 完整的 TypeScript 类型支持
- ⚛️ React hooks 封装

## 安装

在项目中添加依赖：

```bash
# 在 apps/web 中
pnpm add @auto-fetch/i18n react-i18next

# 在 apps/backend 中
pnpm add @auto-fetch/i18n
```

## 使用方式

### 前端（React）

```tsx
// main.tsx - 初始化
import { initReactI18n } from '@auto-fetch/i18n/react';

await initReactI18n();

// 组件中使用
import { useTranslation, useLanguage } from '@auto-fetch/i18n/react';

function MyComponent() {
  const { t } = useTranslation();
  const { language, changeLanguage, languageNames } = useLanguage();

  return (
    <div>
      <h1>{t('common.loading')}</h1>
      <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
        {Object.entries(languageNames).map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
    </div>
  );
}
```

### 后端（Node.js/Express）

```ts
import { createI18nInstance, t, changeLanguage } from '@auto-fetch/i18n';

// 方式 1: 使用全局实例
await initI18n();
console.log(t('common.success')); // "操作成功"

// 方式 2: 创建独立实例（推荐用于服务端）
const i18n = createI18nInstance({ lng: 'en-US' });
console.log(i18n.t('common.success')); // "Operation successful"

// Express 中间件示例
function i18nMiddleware(req, res, next) {
  const lang = req.headers['accept-language'] || 'zh-CN';
  req.t = getFixedT(lang);
  next();
}
```

## 添加新翻译

1. 编辑 `src/locales/zh-CN.json` 和 `src/locales/en-US.json`
2. 类型会自动推导

## 开发

```bash
# 构建
pnpm build

# 监听模式
pnpm dev
```
