import { chromium, type Browser } from 'playwright';
import logger from '../utils/logger.js';

/**
 * 浏览器管理器
 * 负责管理浏览器实例池，避免频繁启动和关闭浏览器
 */
class BrowserManager {
  private browser: Browser | null = null;
  private lastUsedAt: number = 0;
  private readonly MAX_IDLE_TIME = 5 * 60 * 1000; // 5 分钟空闲后关闭
  private cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * 获取浏览器实例
   */
  async getBrowser(options: { headless?: boolean } = {}): Promise<Browser> {
    const { headless = true } = options;

    // 如果浏览器已存在且连接正常，直接返回
    if (this.browser && this.browser.isConnected()) {
      this.lastUsedAt = Date.now();
      logger.info('[BrowserManager] Reusing existing browser instance');
      return this.browser;
    }

    // 启动新的浏览器实例
    logger.info('[BrowserManager] Launching new browser instance');

    this.browser = await chromium.launch({
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    this.lastUsedAt = Date.now();

    // 设置自动清理定时器
    this.scheduleCleanup();

    return this.browser;
  }

  /**
   * 手动关闭浏览器
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        logger.info('[BrowserManager] Browser closed');
      } catch (error) {
        logger.error('[BrowserManager] Error closing browser', error);
      } finally {
        this.browser = null;
        this.clearCleanupTimer();
      }
    }
  }

  /**
   * 定期清理空闲的浏览器
   */
  private scheduleCleanup(): void {
    // 清除已有的定时器
    this.clearCleanupTimer();

    // 设置新的定时器
    this.cleanupTimer = setInterval(() => {
      const idleTime = Date.now() - this.lastUsedAt;

      if (idleTime > this.MAX_IDLE_TIME && this.browser) {
        logger.info('[BrowserManager] Closing idle browser');
        this.closeBrowser();
      }
    }, 60 * 1000); // 每分钟检查一次
  }

  /**
   * 清除清理定时器
   */
  private clearCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 获取浏览器状态
   */
  getStatus(): {
    isActive: boolean;
    lastUsedAt: number;
    idleTime: number;
  } {
    return {
      isActive: this.browser !== null && this.browser.isConnected(),
      lastUsedAt: this.lastUsedAt,
      idleTime: Date.now() - this.lastUsedAt,
    };
  }
}

// 导出单例
export const browserManager = new BrowserManager();

/**
 * 在应用关闭时清理浏览器
 */
process.on('SIGTERM', async () => {
  logger.info('[BrowserManager] SIGTERM received, closing browser');
  await browserManager.closeBrowser();
});

process.on('SIGINT', async () => {
  logger.info('[BrowserManager] SIGINT received, closing browser');
  await browserManager.closeBrowser();
});
