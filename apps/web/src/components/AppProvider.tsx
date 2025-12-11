/**
 * 应用全局 Provider 配置
 *
 * 集成了：
 * - ThemeProvider: 主题切换
 * - QueryClientProvider: React Query
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../utils/queryClient.ts';
import { ThemeProvider } from '../hooks/useTheme.tsx';

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        {children}

        {/* 开发环境下显示 React Query DevTools */}
        {import.meta.env.DEV && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-right"
          />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
