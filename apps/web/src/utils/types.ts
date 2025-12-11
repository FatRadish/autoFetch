/**
 * 通用 API 响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error: string;
}

/**
 * 分页参数接口
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * 分页响应接口
 */
export interface PaginationResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
