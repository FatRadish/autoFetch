import { HttpAdapter } from '../http.js';
import type { ExecutionContext, ExecutionResult } from '../../types/index.js';

/**
 * 京东平台适配器示例
 * 这是一个基础模板，实际使用时需要根据京东的API进行调整
 */
export class JDAdapter extends HttpAdapter {
  readonly name = 'jd';

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    try {
      this.validateContext(context);

      this.log('info', 'Starting JD check-in');

      // 从配置获取 URL
      const checkInUrl = this.getConfig<string>(
        context,
        'checkInUrl',
        'https://api.m.jd.com/client.action'
      );

      // 执行签到请求
      const response = await this.post(
        checkInUrl,
        {
          functionId: 'signBeanAct',
          body: JSON.stringify({ fp: '-1', shshshfp: '-1', shshshfpb: '-1' }),
          appid: 'ld',
        },
        context
      );

      // 解析响应
      const result = this.parseJSON<{
        code: string;
        data?: { dailyAward?: { beanAward?: { beanCount?: number } } };
        msg?: string;
      }>(response);

      // 判断签到是否成功
      if (result.code === '0') {
        const beans = result.data?.dailyAward?.beanAward?.beanCount || 0;
        return {
          success: true,
          message: `签到成功，获得 ${beans} 京豆`,
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.msg || '签到失败',
          data: result,
        };
      }
    } catch (error) {
      return this.handleError(error);
    }
  }
}
