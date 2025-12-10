import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import request from '@/utils/request';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * 登录 Hook
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const loginStore = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginPayload) => request.post<LoginResponse>('/auth/login', data),
    onSuccess: (data) => {
      console.log("🚀 ~ useLogin ~ data:", data)
      // 登录成功，保存 token
      if (data?.token) {
        navigate('/');
        // 同步状态到 auth store
        const user = data.user;
        loginStore(
          {
            id: user.id,
            username: user.username,
            email: user.email ?? '',
            role: user.role,
          },
          data.token,
        );
      }
      // 清除登录状态查询缓存
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (_error: any) => {
      // 可以在此记录或上报错误
    },
    meta: {
      hideErrorToast: false, // 显示错误提示
    },
  });
}

/**
 * 获取当前用户信息 Hook
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      // 这里应该调用你的获取用户信息接口
      // const response = await request.get('/auth/me');
      // return response;
    },
    enabled: !!localStorage.getItem('token'), // 只在有 token 时才执行
    meta: {
      hideErrorToast: false,
    },
  });
}

/**
 * 登出 Hook
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const logoutStore = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      // 这里应该调用你的登出接口
      // return request.post('/auth/logout');
    },
    onSuccess: () => {
      // 登出成功，清空 token
      localStorage.removeItem('token');
      logoutStore();
      // 清除所有认证相关的查询缓
      queryClient.removeQueries({ queryKey: ['auth'] });
      // 清除用户相关的所有查询缓存
      queryClient.removeQueries({ queryKey: ['user'] });
    },
    meta: {
      hideErrorToast: false,
    },
  });
}
