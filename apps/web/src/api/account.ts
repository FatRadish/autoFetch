import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import request from '@/utils/request';

export interface CreateAccountPayload {
  cookies: string;
  headers?: string;
  id?: string;
  name: string;
  platformId: string;
  proxy?: string;
  userAgent: string;
  userId?: string;
}

export interface ResPonsePlatForm {
  id: string;
  name: string;
  icon: string;
}

export type ResPonseAccount = Required<CreateAccountPayload> & {
  createdAt: string;
  updatedAt: string;
  platform: ResPonsePlatForm;
};

/**
 * 获取所有账户列表
 * @param filters - 可选的筛选参数
 */
export function useGetAllAccounts(filters?: { accountName?: string }) {
  return useQuery({
    queryKey: ['accounts', 'list', filters],
    queryFn: () =>
      request.get<ResPonseAccount[]>('/accounts', { params: filters }),
    meta: {
      hideErrorToast: false, // 显示错误提示
    },
  });
}

/**
 * 根据 ID 获取单个账户
 * @param id - 账户 ID
 */
export function useGetAccountById(id: string) {
  return useQuery({
    queryKey: ['accounts', 'detail', id],
    queryFn: () =>
      request.get<ResPonseAccount>(`/accounts/${id}?includeCookies=true`),
    enabled: !!id, // 只有 id 存在时才执行查询
    meta: {
      hideErrorToast: false,
    },
  });
}

/**
 * 根据平台id获取该平台下的所有账户
 * @param platformId - 平台 ID
 */
export function useGetAccountsByPlatformId(platformId: string) {
  return useQuery({
    queryKey: ['accounts', 'byPlatform', platformId],
    queryFn: () =>
      request.get<ResPonseAccount[]>(`/accounts`, {
        params: { platformId },
      }),
    enabled: !!platformId, // 只有 platformId 存在时才执行查询
    meta: {
      hideErrorToast: false,
    },
  });
}
/**
 * 创建新账户
 * @param payload - 账户创建数据
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountPayload) =>
      request.post<ResPonseAccount>('/accounts', data),
    onSuccess: () => {
      // 创建成功后，刷新账户列表缓存
      queryClient.invalidateQueries({ queryKey: ['accounts', 'list'] });
    },
    meta: {
      hideErrorToast: false, // 显示错误提示
    },
  });
}

/**
 * 更新账户信息
 * @param id - 账户 ID
 * @param payload - 账户更新数据
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreateAccountPayload>) =>
      request.patch<ResPonseAccount>(`/accounts/${data.id}`, data),
    onSuccess: (data) => {
      // 更新成功后，刷新账户详情和列表缓存
      queryClient.invalidateQueries({
        queryKey: ['accounts', 'detail', data.id],
      });
      queryClient.invalidateQueries({ queryKey: ['accounts', 'list'] });
    },
    meta: {
      hideErrorToast: false, // 显示错误提示
    },
  });
}

/**
 * 删除账户
 * @param id - 账户 ID
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      request.delete<{ success: boolean }>(`/accounts/${id}`),
    onSuccess: () => {
      // 删除成功后，刷新账户列表缓存
      queryClient.invalidateQueries({ queryKey: ['accounts', 'list'] });
    },
    meta: {
      hideErrorToast: false, // 显示错误提示
    },
  });
}
