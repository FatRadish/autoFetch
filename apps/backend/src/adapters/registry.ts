import type { BasePlatformAdapter } from './base.js';
import { JDAdapter } from './platforms/jd.js';
import { BilibiliAdapter } from './platforms/bilibili.js';

/**
 * 适配器名称到类型的映射
 */
type AdapterMap = {
  jd: JDAdapter;
  bilibili: BilibiliAdapter;
};

/**
 * 平台适配器注册表
 */
class AdapterRegistry {
  private adapters: Map<string, new () => BasePlatformAdapter> = new Map();

  /**
   * 注册适配器（泛型版本）
   */
  register<T extends BasePlatformAdapter>(
    name: string,
    AdapterClass: new () => T
  ): void {
    this.adapters.set(name.toLowerCase(), AdapterClass);
  }

  /**
   * 获取适配器实例（类型安全的重载版本）
   */
  get<K extends keyof AdapterMap>(name: K): AdapterMap[K] | null;
  get(name: string): BasePlatformAdapter | null;
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
  adapterRegistry.register('bilibili', BilibiliAdapter);
}

// 自动注册内置适配器
registerBuiltinAdapters();
