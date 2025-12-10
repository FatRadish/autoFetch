import { toast } from 'sonner';
import { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * React Query 全局错误处理 Hook
 * 在组件挂载时设置错误拦截器
 * 
 * 如果需要禁用某个请求的错误提示，在 useQuery 中设置：
 * meta: { hideErrorToast: true }
 */
export function useQueryErrorHandler(queryClient: QueryClient) {
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Query 错误通过 'updated' 事件传递，需要检查 action.type === 'error'
      if (event.type === 'updated' && event.action?.type === 'error') {
        const error = event.action.error as Error | null;
        const hideErrorToast = (event.query?.meta as any)?.hideErrorToast;
        
        if (error && !hideErrorToast) {
          toast.error(error.message || '请求失败，请稍后重试');
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient]);
}

/**
 * Mutation 错误处理 Hook
 */
export function useMutationErrorHandler(queryClient: QueryClient) {
  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      // Mutation 错误通过 'updated' 事件传递，需要检查 action.type === 'error'
      if (event.type === 'updated' && event.action?.type === 'error') {
        const error = event.action.error as Error | null;
        const hideErrorToast = (event.mutation?.meta as any)?.hideErrorToast;
        
        if (error && !hideErrorToast) {
          toast.error(error.message || '操作失败，请稍后重试');
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient]);
}
