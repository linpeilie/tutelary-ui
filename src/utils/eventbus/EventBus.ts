type Handler<T = any> = (val: T) => void;

interface HandlerWrapper<T = any> {
  handler: Handler<T>;
  once: boolean;
}

export class EventBus<Events extends Record<string, any>> {
  private map: Map<string, Set<HandlerWrapper>> = new Map();
  private maxListeners = 100; // 防止内存泄漏

  /**
   * 订阅事件
   * @param name 事件名
   * @param handler 事件处理函数
   */
  on<EventName extends keyof Events>(name: EventName, handler: Handler<Events[EventName]>) {
    this.addHandler(name, handler, false);
  }

  /**
   * 订阅一次性事件（触发后自动取消订阅）
   * @param name 事件名
   * @param handler 事件处理函数
   */
  once<EventName extends keyof Events>(name: EventName, handler: Handler<Events[EventName]>) {
    this.addHandler(name, handler, true);
  }

  /**
   * 内部方法：添加事件处理器
   */
  private addHandler<EventName extends keyof Events>(
    name: EventName,
    handler: Handler<Events[EventName]>,
    once: boolean
  ) {
    let set: Set<HandlerWrapper<Events[EventName]>> | undefined = this.map.get(name as string);
    if (!set) {
      set = new Set();
      this.map.set(name as string, set);
    }

    // 检查监听器数量，防止内存泄漏
    if (set.size >= this.maxListeners) {
      console.warn(`[EventBus] 事件 "${String(name)}" 的监听器数量已达到 ${this.maxListeners}，可能存在内存泄漏`);
    }

    set.add({ handler, once });
  }

  /**
   * 触发事件
   * @param name 事件名
   * @param value 事件数据
   */
  emit<EventName extends keyof Events>(name: EventName, value: Events[EventName]) {
    const set: Set<HandlerWrapper<Events[EventName]>> | undefined = this.map.get(name as string);
    if (!set) return;

    // 复制一份防止在执行过程中被修改
    const copied = [...set];
    const toRemove: HandlerWrapper<Events[EventName]>[] = [];

    copied.forEach(wrapper => {
      try {
        wrapper.handler(value);
        // 如果是一次性监听器，标记为待移除
        if (wrapper.once) {
          toRemove.push(wrapper);
        }
      } catch (error) {
        console.error(`[EventBus] 事件 "${String(name)}" 的处理器执行出错:`, error);
      }
    });

    // 移除一次性监听器
    toRemove.forEach(wrapper => set.delete(wrapper));
  }
  /**
   *  清除所有事件
   */
  off(): void;
  /**
   * 清除同名事件
   * @param name 事件名
   */
  off<EventName extends keyof Events>(name: EventName): void;
  /**
   * 清除指定事件
   * @param name 事件名
   * @param handler 处理函数
   */
  off<EventName extends keyof Events>(name: EventName, handler: Handler<Events[EventName]>): void;

  off<EventName extends keyof Events>(name?: EventName, handler?: Handler<Events[EventName]>): void {
    // 什么都不传，则清除所有事件
    if (!name) {
      this.map.clear();
      return;
    }

    // 只传名字，则清除同名事件
    if (!handler) {
      this.map.delete(name as string);
      return;
    }

    // name 和 handler 都传了，则清除指定handler
    const handlers: Set<HandlerWrapper<Events[EventName]>> | undefined = this.map.get(name as string);
    if (!handlers) return;

    // 找到并删除匹配的 handler
    for (const wrapper of handlers) {
      if (wrapper.handler === handler) {
        handlers.delete(wrapper);
        break;
      }
    }
  }

  /**
   * 设置单个事件的最大监听器数量
   * @param n 最大数量
   */
  setMaxListeners(n: number) {
    this.maxListeners = n;
  }

  /**
   * 获取指定事件的监听器数量
   * @param name 事件名
   */
  listenerCount<EventName extends keyof Events>(name: EventName): number {
    const set = this.map.get(name as string);
    return set ? set.size : 0;
  }

  /**
   * 获取所有已注册的事件名
   */
  eventNames(): (keyof Events)[] {
    return Array.from(this.map.keys()) as (keyof Events)[];
  }
}
