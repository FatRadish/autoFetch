import { useQuery } from '@tanstack/react-query';
import request from '@/utils/request';

export interface PlatformPayload {
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
