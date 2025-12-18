import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import request from '@/utils/request';

export interface CreateTaskPayload {
  accountId: string;
  name: string;
  platformTaskId: string;
  schedule: string;
}

export interface ResPonsePlatForm {
  id: string;
  name: string;
  icon: string;
}

export type ResPonseTask = Required<CreateTaskPayload> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    name: string;
    platformId: string;
    platform: ResPonsePlatForm;
  };
  nextRunAt: string | null;
  lastRunAt: string | null;
};

/**
 * 获取所有账户列表
 * @param filters - 可选的筛选参数
 */
export function useGetAllTasks(filters?: { taskName?: string }) {
  return useQuery({
    queryKey: ['tasks', 'list', filters],
    queryFn: () => request.get<ResPonseTask[]>('/tasks', { params: filters }),
    meta: {
      hideErrorToast: false, // 显示错误提示
    },
  });
}

/**
 * 根据 ID 获取单个任务
 * @param id - 任务 ID
 */
export function useGetTaskById(id: string) {
  return useQuery({
    queryKey: ['tasks', 'detail', id],
    queryFn: () => request.get<ResPonseTask>(`/tasks/task/${id}`),
    enabled: !!id, // 只有 id 存在时才执行查询
    meta: {
      hideErrorToast: false,
    },
  });
}

/**
 * 创建新任务
 * @param payload - 任务创建数据
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) =>
      request.post<ResPonseTask>('/tasks', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] });
    },
    meta: {
      hideErrorToast: false,
    },
  });
}

/**
 * 删除任务
 * @param id - 任务 ID
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => request.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] });
    },
    meta: {
      hideErrorToast: false,
    },
  });
}

/**
 * 更新任务信息
 * @param id - 任务 ID
 * @param payload - 任务更新数据
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateTaskPayload>;
    }) => request.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] });
    },
    meta: {
      hideErrorToast: false, // 显示错误提示
    },
  });
}
