import { useTheme } from '../hooks/useTheme.tsx';

type Theme = 'light' | 'dark' | 'system';

/**
 * 主题切换按钮组件
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => setTheme('light')}
        className={`btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`}
        title="浅色模式"
      >
        <span className="i-carbon-sun text-lg" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`btn-sm ${theme === 'system' ? 'btn-primary' : 'btn-ghost'}`}
        title="跟随系统"
      >
        <span className="i-carbon-laptop text-lg" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`}
        title="深色模式"
      >
        <span className="i-carbon-moon text-lg" />
      </button>
    </div>
  );
}

/**
 * 简单的主题切换开关（light <-> dark）
 */
export function ThemeSwitch() {
  const { toggleTheme, actualTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="btn-ghost btn-sm"
      title={`切换到${actualTheme === 'light' ? '深色' : '浅色'}模式`}
    >
      {actualTheme === 'light' ? (
        <span className="i-carbon-moon text-xl" />
      ) : (
        <span className="i-carbon-sun text-xl" />
      )}
    </button>
  );
}

/**
 * 主题选择下拉菜单
 */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes: Array<{ value: Theme; label: string; icon: string }> = [
    { value: 'light', label: '浅色', icon: 'i-carbon-sun' },
    { value: 'dark', label: '深色', icon: 'i-carbon-moon' },
    { value: 'system', label: '跟随系统', icon: 'i-carbon-laptop' },
  ];

  return (
    <div className="relative inline-block">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        className="input pr-10 appearance-none cursor-pointer"
      >
        {themes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <span className="i-carbon-chevron-down" />
      </span>
    </div>
  );
}
