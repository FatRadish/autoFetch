/**
 * 通用 API 响应接口
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
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
