import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse } from './types.ts';
import { useAuthStore } from '@/store/authStore';

// `useTranslation().t` 在类型上通常接受更具体的 key 联合类型并可接收可选的插值参数。
// 为了让它可被注入，我们将 `Translator` 定义为更通用的签名。
type Translator = (key: any, interpolation?: Record<string, any>) => string;
/**
 * Axios 封装类 - 专为 React Query 优化
 */
class Request {
  private instance: AxiosInstance;
  private translator?: Translator;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config);
    this.setupInterceptors();
  }

  /**
   * 在应用中注入翻译函数（例如在根组件中获得 `t` 后调用 `request.setTranslator(t)`）
   */
  setTranslator(fn: Translator) {
    this.translator = fn;
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const { token } = useAuthStore.getState();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器 - 直接返回 data.data，让 React Query 处理错误
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { data } = response;

        // 业务逻辑成功，直接返回数据
        if (data.success) {
          return data.data;
        }

        // 业务逻辑失败，抛出错误让 React Query 捕获
        throw new Error(data.message || '请求失败');
      },
      (error) => {
        // HTTP 错误处理
        if (error.response) {
          const { status, data } = error.response;

          // 统一错误消息
          const message = data?.message || this.getErrorMessage(status);

          // 401 特殊处理
          if (status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }

          throw new Error(message);
        } else if (error.request) {
          throw new Error('网络错误，请检查网络连接');
        } else {
          throw new Error(error.message || '请求配置错误');
        }
      }
    );
  }

  /**
   * 获取错误提示信息
   */
  private getErrorMessage(status: number): string {
    const t = this.translator;

    const messages: Record<number, string> = {
      400: t ? t('error.networkError') : '请求错误',
      401: t ? t('error.unauthorized') : '未授权',
      403: t ? t('error.forbidden') : '禁止访问',
      404: t ? t('error.notFound') : '未找到',
      500: t ? t('error.serverError') : '服务器错误',
      502: t ? t('error.networkError') : '网关错误',
      503: t ? t('error.serverError') : '服务不可用',
    };

    return messages[status] || `请求失败: ${status}`;
  }

  /**
   * GET 请求 - 直接返回数据，不包装 ApiResponse
   */
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  /**
   * POST 请求
   */
  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.instance.post(url, data, config);
  }

  /**
   * PUT 请求
   */
  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.instance.put(url, data, config);
  }

  /**
   * PATCH 请求
   */
  patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.instance.patch(url, data, config);
  }

  /**
   * DELETE 请求
   */
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }

  /**
   * 获取原始 axios 实例（用于高级场景）
   */
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

// 创建默认实例
const request = new Request({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default request;
export { Request };
