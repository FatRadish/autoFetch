import { PropsWithChildren } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { useQueryErrorHandler, useMutationErrorHandler } from '@/hooks/useQueryErrorHandler';

interface GlobalErrorHandlerProps extends PropsWithChildren {
  queryClient: QueryClient;
}

/**
 * 全局错误处理组件
 * 在应用最顶层使用，确保所有页面都能捕获错误
 */
export function GlobalErrorHandler({ children, queryClient }: GlobalErrorHandlerProps) {
  // 激活全局错误处理
  useQueryErrorHandler(queryClient);
  useMutationErrorHandler(queryClient);

  return <>{children}</>;
}
