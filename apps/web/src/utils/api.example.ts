import request from '../utils/request.ts';
import type { ApiResponse, PaginationParams, PaginationResponse } from '../utils/types.ts';

/**
 * 用户信息接口
 */
interface User {
  id: number;
  name: string;
  email: string;
}

/**
 * 用户 API
 */
export const userApi = {
  /**
   * 获取用户列表
   */
  getUserList: (params: PaginationParams) => {
    return request.get<PaginationResponse<User>>('/users', { params });
  },

  /**
   * 获取用户详情
   */
  getUserById: (id: number) => {
    return request.get<User>(`/users/${id}`);
  },

  /**
   * 创建用户
   */
  createUser: (data: Omit<User, 'id'>) => {
    return request.post<User>('/users', data);
  },

  /**
   * 更新用户
   */
  updateUser: (id: number, data: Partial<User>) => {
    return request.put<User>(`/users/${id}`, data);
  },

  /**
   * 删除用户
   */
  deleteUser: (id: number) => {
    return request.delete<void>(`/users/${id}`);
  },
};

/**
 * 登录参数接口
 */
interface LoginParams {
  username: string;
  password: string;
}

/**
 * 登录响应接口
 */
interface LoginResponse {
  token: string;
  userInfo: User;
}

/**
 * 认证 API
 */
export const authApi = {
  /**
   * 用户登录
   */
  login: (data: LoginParams) => {
    return request.post<LoginResponse>('/auth/login', data);
  },

  /**
   * 用户登出
   */
  logout: () => {
    return request.post<void>('/auth/logout');
  },
};
