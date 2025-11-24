import { defineConfig, presetAttributify, presetIcons, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3({
      dark: 'class', // 使用 class 模式切换主题
    }),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],

  // 主题配置
  theme: {
    colors: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
      background: 'var(--color-background)',
      foreground: 'var(--color-foreground)',
      muted: 'var(--color-muted)',
      border: 'var(--color-border)',
    },
  },

  // 快捷类名
  shortcuts: {
    // 按钮基础样式
    'btn': 'px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50',
    'btn-sm': 'btn px-3 py-1.5 text-sm',
    'btn-lg': 'btn px-6 py-3 text-lg',

    // 按钮变体
    'btn-primary': 'btn bg-primary text-white hover:bg-primary-600 active:bg-primary-700',
    'btn-secondary': 'btn bg-secondary text-white hover:bg-secondary-600 active:bg-secondary-700',
    'btn-success': 'btn bg-success text-white hover:bg-success-dark',
    'btn-warning': 'btn bg-warning text-white hover:bg-warning-dark',
    'btn-error': 'btn bg-error text-white hover:bg-error-dark',
    'btn-outline': 'btn border-2 border-primary text-primary hover:bg-primary hover:text-white',
    'btn-ghost': 'btn hover:bg-gray-100 dark:hover:bg-gray-800',

    // 卡片样式
    'card': 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700',
    'card-hover': 'card transition-shadow hover:shadow-lg',

    // 输入框样式
    'input': 'px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary',

    // 容器
    'container-center': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

    // 文字样式
    'text-primary': 'text-gray-900 dark:text-gray-100',
    'text-secondary': 'text-gray-600 dark:text-gray-400',
    'text-muted': 'text-gray-500 dark:text-gray-500',

    // 布局
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',

    // 动画
    'transition-base': 'transition-all duration-200 ease-in-out',
    'transition-slow': 'transition-all duration-300 ease-in-out',
  },

})
