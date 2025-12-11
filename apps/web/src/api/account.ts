import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import request from '@/utils/request';
import { toast } from 'sonner';

export interface CreateAccountPayload {
  cookies: string;
  headers?: string;
  id: string;
  name: string;
  platformId: string;
  proxy?: string;
  userAgent: string;
  userId: string;
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
 * 获取所有用户账户信息
 */
export function useAccounts() {
  const queryClient = useQueryClient();

  const getAllAccounts = useQuery({
    queryKey: ['accounts'],
    queryFn: () => request.get<ResPonseAccount[]>('/accounts'),
    meta: {
      hideErrorToast: false, // 显示错误提示
    },
  });

  return {
    getAllAccounts,
  };
}
