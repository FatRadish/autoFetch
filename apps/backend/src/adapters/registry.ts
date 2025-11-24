import type { BasePlatformAdapter } from './base.js';
import { JDAdapter } from './platforms/jd.js';

/**
 * 平台适配器注册表
 */
class AdapterRegistry {
  private adapters: Map<string, new () => BasePlatformAdapter> = new Map();

  /**
   * 注册适配器
   */
  register(name: string, AdapterClass: new () => BasePlatformAdapter): void {
    this.adapters.set(name.toLowerCase(), AdapterClass);
  }

  /**
   * 获取适配器实例
   */
  get(name: string): BasePlatformAdapter | null {
    const AdapterClass = this.adapters.get(name.toLowerCase());
    if (!AdapterClass) {
      return null;
    }
    return new AdapterClass();
  }

  /**
   * 检查适配器是否存在
   */
  has(name: string): boolean {
    return this.adapters.has(name.toLowerCase());
  }

  /**
   * 获取所有已注册的适配器名称
   */
  list(): string[] {
    return Array.from(this.adapters.keys());
  }
}

// 创建全局注册表实例
export const adapterRegistry = new AdapterRegistry();

// 注册所有内置适配器
export function registerBuiltinAdapters(): void {
  adapterRegistry.register('jd', JDAdapter);
  adapterRegistry.register('京东', JDAdapter); // 支持中文名称

  // 可以在这里注册更多适配器
  // adapterRegistry.register('taobao', TaobaoAdapter);
  // adapterRegistry.register('baidupan', BaiduPanAdapter);
}

// 自动注册内置适配器
registerBuiltinAdapters();
