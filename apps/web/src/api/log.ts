import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import request from '@/utils/request';

export interface ResPonseLog {
  id: string;
  taskId: string;
  message: string;
  status: 'success' | 'running' | 'failed';
  startedAt: string;
  finishedAt: string;
}

/**
 * 获取所有日志列表
 * @param filters - 可选的筛选参数
 */
export function useGetAllLogs(filters?: { taskId?: string }) {
  return useQuery({
    queryKey: ['logs', 'list', filters],
    queryFn: () => request.get<ResPonseLog[]>('/logs', { params: filters }),
    meta: {
      hideErrorToast: false, // 显示错误提示
    },
  });
}
