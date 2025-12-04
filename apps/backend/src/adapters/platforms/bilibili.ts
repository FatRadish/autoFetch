import { BrowserAdapter } from '../browser.js';
import type { ExecutionContext, ExecutionResult } from '../../types/index.js';
import { Page } from 'playwright';
import { AccountRefreshService } from '../../services/AccountRefreshService.js';

/**
 * B站平台适配器
 * TODO: 实现更多任务
 */
export class BilibiliAdapter extends BrowserAdapter {
  readonly name = 'bilibili';
  page:Page | null = null;

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    try {
      this.validateContext(context);

      this.log('info', 'Starting Bilibili check-in');

      // 尝试刷新 Cookie（如果可能）
      if (context.account.refreshToken) {
        try {
          const refreshResult = await AccountRefreshService.refreshAccountCookie(context.account.id, {
            logger: (level, message, ...meta) =>
              this.log(level, message, meta.length ? meta : undefined),
          });

          if (refreshResult.success && refreshResult.refreshed && refreshResult.updatedCookies) {
            context.account.cookies = refreshResult.updatedCookies;
            context.account.refreshToken = refreshResult.updatedRefreshToken;
            this.log('info', 'Cookies refreshed before task execution');
          } else if (!refreshResult.success) {
            this.log('warn', `Cookie refresh skipped: ${refreshResult.message}`);
          }
        } catch (error) {
          this.log('warn', 'Cookie refresh attempt failed, proceeding with existing cookies', error);
        }
      } else {
        this.log('warn', 'No refresh token provided; automatic cookie refresh skipped');
      }

      // 初始化浏览器（使用非 headless 模式避免反爬虫检测）
      this.page = await this.initBrowser(context, {
        headless: false,
        baseUrl: 'https://www.bilibili.com',
      });

      // 获取配置
      // const checkInUrl = this.getConfig<string>(
      //   context,
      //   'checkInUrl',
      //   'https://www.bilibili.com'
      // );
      const checkInUrl = 'https://www.bilibili.com';

      // 访问 B站首页
      this.log('info', 'Navigating to Bilibili homepage');
      await this.page.goto(checkInUrl);

      // 检查是否已登录
      const isLoggedIn = await this.checkLoginStatus(this.page);

      if (!isLoggedIn) {
        await this.closeBrowser();
        return {
          success: false,
          message: '未登录，请检查 Cookies 是否有效',
        };
      }

      this.log('info', 'Login verified, proceeding with check-in');

      // 执行签到任务
      const result = await this.performCheckIn();

      // 关闭浏览器
      await this.closeBrowser();

      return result;
    } catch (error) {
      // 确保浏览器被关闭
      await this.closeBrowser();
      return this.handleError(error);
    }
  }

  /**
   * 检查登录状态
   */
  async checkLoginStatus(page: any): Promise<boolean> {
    try {
      // 等待页面网络空闲（所有资源加载完成）
      // await page.waitForLoadState('networkidle');

      // 验证 Cookies 是否已加载到页面
      const pageCookies = await page.context().cookies();
      this.log('info', `Page has ${pageCookies.length} cookies`);

      // 检查关键 Cookie 是否存在
      const keyCookieNames = ['SESSDATA', 'bili_jct', 'DedeUserID'];
      const foundKeyCookies = pageCookies
        .filter((c: any) => keyCookieNames.includes(c.name))
        .map((c: any) => c.name);

      if (foundKeyCookies.length === 0) {
        this.log('error', 'Critical cookies not found in page context');
      } else {
        this.log('info', `Found key cookies: ${foundKeyCookies.join(', ')}`);
      }

      // 获取页面基本信息用于调试
      const pageInfo = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          htmlLength: document.documentElement.outerHTML.length,
          bodyText: document.body?.innerText?.substring(0, 200) || '',
          // 检查页面 Cookie
          hasCookies: document.cookie.length > 0,
          cookiePreview: document.cookie.substring(0, 100),
        };
      });

      this.log('info', 'Page info:', pageInfo);

      // 检查是否跳转到登录页面
      if (pageInfo.url.includes('passport.bilibili.com/login')) {
        this.log('error', 'Redirected to login page - cookies may be invalid or expired');
        await this.screenshot('./debug-redirect-to-login.png');
        return false;
      }

      // 如果页面是空的，说明被反爬虫拦截了
      if (pageInfo.htmlLength < 500) {
        this.log('error', 'Page is empty, possible anti-bot detection');
        // 截图用于调试
        await this.screenshot('./debug-empty-page.png');
        return false;
      }

      // 截图用于调试
      await this.screenshot('./debug-login-check.png');

      // 尝试多种方式检查登录状态
      const loginStatus = await page.evaluate(() => {
        // 方法1: 检查用户头像元素
        const userAvatar = document.querySelector('.header-entry-mini');

        // 方法2: 检查是否有登录按钮（未登录时显示）
        const loginButton = document.querySelector('.header-login-entry');

        // 方法3: 检查页面数据
        const userData = (window as any).__INITIAL_STATE__?.userInfo;

        // 方法4: 检查是否有任何用户相关元素
        const headerUserFace = document.querySelector('.header-user-face');

        return {
          hasUserAvatar: !!userAvatar,
          hasLoginButton: !!loginButton,
          hasUserData: !!userData && userData.isLogin,
          hasHeaderUserFace: !!headerUserFace,
          debug: {
            userAvatarClass: userAvatar?.className,
            loginButtonText: loginButton?.textContent,
            pageTitle: document.title,
            pageUrl: window.location.href,
            bodyClass: document.body?.className,
            hasInitialState: !!(window as any).__INITIAL_STATE__,
          },
        };
      });

      this.log('info', 'Login check result:', loginStatus);

      // 有用户头像或用户数据表示已登录
      return (
        loginStatus.hasUserAvatar ||
        loginStatus.hasUserData ||
        loginStatus.hasHeaderUserFace
      );
    } catch (error) {
      this.log('warn', 'Failed to check login status', error);
      return false;
    }
  }

  /**
   * 执行任务
   * TODO 实现更多任务
   */
  async performCheckIn(): Promise<ExecutionResult> {
    const results: string[] = [];
    if(this.page === null) {
      this.log('error', 'Page is not initialized');
      return {
        success: false,
        message: '页面未初始化，无法执行签到任务',
      };
    }
    try {

      // 领取b币
      const vipBenefits = await this.getVipBenefits(this.page);
      if (vipBenefits) {
        results.push(vipBenefits);
      }

      return {
        success: true,
        message: results.length > 0 ? results.join('; ') : '签到任务完成',
        data: { tasks: results },
      };
    } catch (error) {
      this.log('error', 'Check-in failed', error);
      return {
        success: false,
        message: '执行失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { completedTasks: results },
      };
    }
  }
  /**
   * 领取会员权益（b币）
   * TODO：领取其他权益
   */
  private async getVipBenefits(page: Page): Promise<string | null> {
    try {
      this.log('info', 'Starting to get VIP benefits');

      // 访问会员权益页面
      await page.goto('https://account.bilibili.com/account/big/myPackage', {
        waitUntil: 'networkidle',
      });

      await page.waitForTimeout(2000);

      // 执行领取权益的操作
      const result = await page.evaluate(async () => {
        try {
          const response = await fetch('https://api.bilibili.com/x/vip/privilege/receive', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'type=1&csrf=' + document.cookie.match(/bili_jct=([^;]+)/)?.[1] || '',
          });

          const data = await response.json();
          return data;
        } catch (err) {
          return null;
        }
      });

      if (result && result.code === 0) {
        this.log('info', 'VIP benefits received successfully');
        return '会员权益领取成功';
      } else if (result && (result.code === -400 || result.message?.includes('已'))) {
        this.log('info', 'VIP benefits already claimed today');
        return '会员权益已领取';
      } else {
        this.log('warn', 'VIP benefits claim failed', result);
        return null;
      }
    } catch (error) {
      this.log('error', 'Get VIP benefits failed', error);
      return null;
    }
  }

}
