import { type Browser, type BrowserContext, type Page } from 'playwright';
import { BasePlatformAdapter } from './base.js';
import type { ExecutionContext } from '../types/index.js';
import { parseCookies } from '../utils/cookie.js';
import { browserManager } from '../utils/browser.js';

/**
 * 浏览器适配器基类
 * 用于基于 Playwright 的平台自动化
 */
export abstract class BrowserAdapter extends BasePlatformAdapter {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;

  /**
   * 初始化浏览器
   */
  protected async initBrowser(
    execContext: ExecutionContext,
    options: {
      headless?: boolean;
      storageState?: string;
      baseUrl?: string;
    } = {}
  ): Promise<Page> {
    const { headless = true, storageState } = options;

    this.log('info', 'Initializing browser context', { headless });

    // 使用 BrowserManager 获取浏览器实例（复用）
    this.browser = await browserManager.getBrowser({ headless });

    // 创建浏览器上下文
    const contextOptions: any = {
      userAgent:
        execContext.account.userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
    };

    // 如果提供了存储状态，使用它
    if (storageState) {
      contextOptions.storageState = storageState;
    }

    // 配置代理
    if (execContext.account.proxy?.enabled && execContext.account.proxy.host) {
      contextOptions.proxy = {
        server: `${execContext.account.proxy.host}:${execContext.account.proxy.port}`,
        username: execContext.account.proxy.username,
        password: execContext.account.proxy.password,
      };
    }

    this.context = await this.browser.newContext(contextOptions);

    // 设置 Cookies
    if (execContext.account.cookies) {
      const cookies = parseCookies(execContext.account.cookies);

      this.log('info', `Parsed ${cookies.length} cookies`);

      // 根据 baseUrl 或已有 domain 设置 Cookie
      const processedCookies = cookies.map((cookie) => {
        // 如果 cookie 已经有 domain，保持原样
        if (cookie.domain) {
          return {
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path || '/',
            expires: cookie.expires ? Math.floor(cookie.expires.getTime() / 1000) : -1,
            httpOnly: cookie.httpOnly ?? false,
            secure: cookie.secure ?? false,
            sameSite: (cookie.sameSite as 'Strict' | 'Lax' | 'None') || 'Lax',
          };
        }

        // 如果没有 domain，尝试从 baseUrl 提取
        // 例如：https://www.bilibili.com -> .bilibili.com
        if (options.baseUrl) {
          try {
            const url = new URL(options.baseUrl);
            const hostname = url.hostname;
            // 提取主域名（如 www.bilibili.com -> .bilibili.com）
            const domainParts = hostname.split('.');
            const mainDomain = domainParts.length >= 2
              ? `.${domainParts.slice(-2).join('.')}`
              : hostname;

            return {
              name: cookie.name,
              value: cookie.value,
              domain: mainDomain,
              path: cookie.path || '/',
              expires: cookie.expires ? Math.floor(cookie.expires.getTime() / 1000) : -1,
              httpOnly: cookie.httpOnly ?? false,
              secure: cookie.secure ?? false,
              sameSite: (cookie.sameSite as 'Strict' | 'Lax' | 'None') || 'Lax',
            };
          } catch (e) {
            this.log('warn', `Failed to parse baseUrl: ${options.baseUrl}`, e);
          }
        }

        // 如果都没有，返回基本格式（让 Playwright 自动处理）
        return {
          name: cookie.name,
          value: cookie.value,
          path: cookie.path || '/',
          expires: cookie.expires ? Math.floor(cookie.expires.getTime() / 1000) : -1,
          httpOnly: cookie.httpOnly ?? false,
          secure: cookie.secure ?? false,
          sameSite: (cookie.sameSite as 'Strict' | 'Lax' | 'None') || 'Lax',
        };
      });

      try {
        await this.context.addCookies(processedCookies as any);
        this.log('info', 'Cookies added successfully');

        // 打印 Cookie 摘要用于调试（只打印名称和前几位）
        if (cookies.length > 0) {
          const cookieSummary = cookies
            .slice(0, 5) // 只显示前 5 个
            .map((c) => `${c.name}=${c.value.substring(0, 8)}...`);
          this.log('info', `Cookie preview: ${cookieSummary.join(', ')}`);

          if (cookies.length > 5) {
            this.log('info', `... and ${cookies.length - 5} more cookies`);
          }
        }
      } catch (error) {
        this.log('error', 'Failed to add cookies', error);
      }
    } else {
      this.log('warn', 'No cookies provided');
    }

    // 添加额外的请求头
    if (execContext.account.headers && Object.keys(execContext.account.headers).length > 0) {
      await this.context.setExtraHTTPHeaders(execContext.account.headers);
    }

    // 创建页面
    this.page = await this.context.newPage();

    // 隐藏 webdriver 特征，避免被反爬虫检测
    await this.page.addInitScript(() => {
      // 删除 navigator.webdriver 属性
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // 修改 Chrome 对象
      (window as any).chrome = {
        runtime: {},
      };

      // 修改 plugins 和 languages
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['zh-CN', 'zh', 'en'],
      });
    });

    // 设置超时
    this.page.setDefaultTimeout(execContext.task.timeout || 30000);

    this.log('info', 'Browser initialized successfully');

    return this.page;
  }

  /**
   * 关闭浏览器上下文和页面
   * 注意：浏览器实例由 BrowserManager 管理，不在这里关闭
   */
  protected async closeBrowser(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      // 不关闭 browser 实例，由 BrowserManager 统一管理
      // 只清空引用
      this.browser = null;
      this.log('info', 'Browser context and page closed successfully');
    } catch (error) {
      this.log('error', 'Error closing browser context', error);
    }
  }

  /**
   * 截图（用于调试）
   */
  protected async screenshot(path: string): Promise<void> {
    if (this.page && __DEV__) {
      await this.page.screenshot({ path, fullPage: true });
      this.log('info', `Screenshot saved to ${path}`);
    }
  }

  /**
   * 等待导航完成
   */
  protected async waitForNavigation(): Promise<void> {
    if (this.page) {
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * 保存浏览器状态（包括 Cookies 和 LocalStorage）
   */
  protected async saveStorageState(path: string): Promise<void> {
    if (this.context) {
      await this.context.storageState({ path });
      this.log('info', `Storage state saved to ${path}`);
    }
  }

  /**
   * 点击元素（带重试）
   */
  protected async clickElement(selector: string, options: { timeout?: number } = {}): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const { timeout = 5000 } = options;

    await this.page.waitForSelector(selector, { timeout });
    await this.page.click(selector);
    this.log('info', `Clicked element: ${selector}`);
  }

  /**
   * 填写输入框
   */
  protected async fillInput(selector: string, value: string, options: { timeout?: number } = {}): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const { timeout = 5000 } = options;

    await this.page.waitForSelector(selector, { timeout });
    await this.page.fill(selector, value);
    this.log('info', `Filled input: ${selector}`);
  }

  /**
   * 获取元素文本
   */
  protected async getText(selector: string, options: { timeout?: number } = {}): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const { timeout = 5000 } = options;

    await this.page.waitForSelector(selector, { timeout });
    const text = await this.page.textContent(selector);
    return text || '';
  }

  /**
   * 等待元素出现
   */
  protected async waitForElement(selector: string, timeout = 5000): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    await this.page.waitForSelector(selector, { timeout });
    this.log('info', `Element found: ${selector}`);
  }

  /**
   * 执行 JavaScript
   */
  protected async evaluate<T>(pageFunction: () => T): Promise<T> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    return await this.page.evaluate(pageFunction);
  }
}
