import axios, { type AxiosRequestConfig } from 'axios';
import { BasePlatformAdapter } from './base.js';
import type { ExecutionContext, ExecutionResult, RequestOptions } from '../types/index.js';
import { cookiesToHeaderString, parseCookies } from '../utils/cookie.js';

/**
 * HTTP 请求适配器
 * 用于基于 HTTP 请求的平台签到
 */
export abstract class HttpAdapter extends BasePlatformAdapter {
  /**
   * 发送 HTTP 请求
   */
  protected async makeRequest(options: RequestOptions): Promise<unknown> {
    const {
      url,
      method = 'GET',
      headers = {},
      cookies,
      userAgent,
      data,
      timeout = 30000,
      proxy,
    } = options;

    // 准备请求头
    const requestHeaders: Record<string, string> = {
      'User-Agent': userAgent || 'Mozilla/5.0',
      ...headers,
    };

    // 添加 Cookie
    if (cookies) {
      const parsedCookies = parseCookies(cookies);
      requestHeaders['Cookie'] = cookiesToHeaderString(parsedCookies);
    }

    // 准备请求配置
    const config: AxiosRequestConfig = {
      url,
      method,
      headers: requestHeaders,
      data,
      timeout,
      validateStatus: () => true, // 不自动抛出错误
    };

    // 配置代理
    if (proxy?.enabled && proxy.host && proxy.port) {
      config.proxy = {
        host: proxy.host,
        port: proxy.port,
        ...(proxy.username &&
          proxy.password && {
            auth: {
              username: proxy.username,
              password: proxy.password,
            },
          }),
      };
    }

    this.log('info', 'Making HTTP request', {
      url,
      method,
      hasProxy: !!config.proxy,
    });

    try {
      const response = await axios(config);

      this.log('info', 'HTTP request completed', {
        status: response.status,
        statusText: response.statusText,
      });

      // 检查响应状态
      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response
          ? `HTTP ${error.response.status}: ${error.response.statusText}`
          : error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * 执行 GET 请求
   */
  protected async get(url: string, context: ExecutionContext): Promise<unknown> {
    return this.makeRequest({
      url,
      method: 'GET',
      cookies: context.account.cookies,
      userAgent: context.account.userAgent,
      headers: context.account.headers,
      proxy: context.account.proxy,
      timeout: context.task.timeout,
    });
  }

  /**
   * 执行 POST 请求
   */
  protected async post(url: string, data: unknown, context: ExecutionContext): Promise<unknown> {
    return this.makeRequest({
      url,
      method: 'POST',
      data,
      cookies: context.account.cookies,
      userAgent: context.account.userAgent,
      headers: context.account.headers,
      proxy: context.account.proxy,
      timeout: context.task.timeout,
    });
  }

  /**
   * 解析 JSON 响应
   */
  protected parseJSON<T = unknown>(response: unknown): T {
    if (typeof response === 'string') {
      return JSON.parse(response) as T;
    }
    return response as T;
  }
}
