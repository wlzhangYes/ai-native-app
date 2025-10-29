import { ComponentType } from 'react';

/**
 * 动态 UI 组件接口
 */
export interface DynamicUIComponent {
  (props: DynamicUIComponentProps): JSX.Element;
}

/**
 * 动态 UI 组件 Props
 */
export interface DynamicUIComponentProps {
  /** 组件配置 */
  config: Record<string, any>;
  /** 事件回调 */
  onEvent?: (eventName: string, data?: any) => void;
  /** 会话 ID */
  sessionId?: string;
  /** 组件 ID（来自 SSE 事件） */
  componentId?: string;
}

/**
 * ComponentRegistry - 组件注册表
 *
 * 管理动态 UI 组件的注册、查询
 */
class ComponentRegistryClass {
  private registry: Map<string, DynamicUIComponent> = new Map();

  /**
   * 注册组件
   */
  register(name: string, component: DynamicUIComponent): void {
    if (this.registry.has(name)) {
      console.warn(
        `Component "${name}" is already registered. Overwriting...`
      );
    }
    this.registry.set(name, component);
  }

  /**
   * 批量注册组件
   */
  registerBatch(components: Record<string, DynamicUIComponent>): void {
    Object.entries(components).forEach(([name, component]) => {
      this.register(name, component);
    });
  }

  /**
   * 获取组件
   */
  get(name: string): DynamicUIComponent | undefined {
    return this.registry.get(name);
  }

  /**
   * 检查组件是否已注册
   */
  has(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * 取消注册
   */
  unregister(name: string): boolean {
    return this.registry.delete(name);
  }

  /**
   * 获取所有已注册的组件名称
   */
  getRegisteredNames(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.registry.clear();
  }

  /**
   * 获取注册的组件数量
   */
  size(): number {
    return this.registry.size;
  }
}

// 导出单例
export const componentRegistry = new ComponentRegistryClass();

// 导出类型（用于需要创建多个实例的场景）
export { ComponentRegistryClass };
