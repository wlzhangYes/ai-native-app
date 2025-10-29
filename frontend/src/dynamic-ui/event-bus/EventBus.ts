/**
 * EventBus - 事件总线
 *
 * 用于动态组件之间的通信
 * 支持组件触发事件、监听事件
 */

export type EventCallback = (data: any) => void;

export interface EventSubscription {
  unsubscribe: () => void;
}

class EventBusClass {
  private events: Map<string, Set<EventCallback>> = new Map();

  /**
   * 订阅事件
   */
  on(eventName: string, callback: EventCallback): EventSubscription {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    this.events.get(eventName)!.add(callback);

    return {
      unsubscribe: () => this.off(eventName, callback),
    };
  }

  /**
   * 取消订阅
   */
  off(eventName: string, callback: EventCallback): void {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(eventName);
      }
    }
  }

  /**
   * 触发事件
   */
  emit(eventName: string, data?: any): void {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for "${eventName}":`, error);
        }
      });
    }
  }

  /**
   * 一次性订阅（触发后自动取消订阅）
   */
  once(eventName: string, callback: EventCallback): EventSubscription {
    const wrappedCallback = (data: any) => {
      callback(data);
      this.off(eventName, wrappedCallback);
    };

    return this.on(eventName, wrappedCallback);
  }

  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.events.clear();
  }

  /**
   * 获取事件监听器数量
   */
  getListenerCount(eventName: string): number {
    return this.events.get(eventName)?.size || 0;
  }
}

// 导出单例
export const eventBus = new EventBusClass();

// 导出类型（用于需要创建多个实例的场景）
export { EventBusClass };
