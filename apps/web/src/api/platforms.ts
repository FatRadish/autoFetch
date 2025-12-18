import { useQuery } from '@tanstack/react-query';
import request from '@/utils/request';

export interface PlatformPayload {
  id: string;
  name: string;
}

export interface PlatformTaskPayload {
  id: string;
  name: string;
}

/**
 * 获取所有平台列表
 * @param filters - 可选的筛选参数
 */
export function useGetAllPlatforms() {
  return useQuery({
    queryKey: ['platforms', 'list'],
    queryFn: () => request.get<PlatformPayload[]>('/platforms'),
    meta: {
      hideErrorToast: false, // 显示错误提示
    },
  });
}

/**
 * 获取指定平台下的所有任务模板
 * @param platformId - 平台 ID
 */
export function useGetPlatformTasks(platformId: string) {
  return useQuery({
    queryKey: ['platforms', platformId, 'tasks'],
    queryFn: () =>
      request.get<PlatformTaskPayload[]>(`/platforms/${platformId}/tasks`),
    enabled: !!platformId, // 只有 platformId 存在时才执行查询
    meta: {
      hideErrorToast: false,
    },
  });
}
