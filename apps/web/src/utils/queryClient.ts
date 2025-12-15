import { QueryClient } from '@tanstack/react-query';

/**
 * React Query 全局配置
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据过期时间（1分钟）
      staleTime: 1 * 60 * 1000,
      // 缓存时间（5分钟）
      gcTime: 5 * 60 * 1000,
      // 失败后重试次数
      retry: 1,
      // 重试延迟
      retryDelay: 1000,
      // 窗口获得焦点时重新获取数据
      refetchOnWindowFocus: true,
      // 网络重连时重新获取数据
      refetchOnReconnect: true,
    },
    mutations: {
      // mutation 失败后重试次数
      retry: 0,
    },
  },
});
