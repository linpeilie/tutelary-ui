export default class Queue<T> {
  /**
   * 队列队首的键
   */
  private lowest: number
  /**
   * 队列队尾的键
   */
  private highest: number
  /**
   * 数据
   */
  private items: Map<number, T>

  constructor() {
    this.lowest = 0
    this.highest = 0
    this.items = new Map()
  }

  /**
   * 入队列
   * @param ele 元素
   */
  offer(ele: T): void {
    this.items.set(this.highest++, ele)
  }

  /**
   * 队列的第一个元素出队列
   * @returns 返回队列中第一个元素并出队列，如果队列为空则返回 undefined
   */
  poll(): T | undefined {
    if (this.isEmpty())
      return undefined

    if (this.lowest === this.highest)
      return undefined

    const result = this.items.get(this.lowest)
    this.items.delete(this.lowest++)
    return result
  }

  /**
   * 查看队列的第一个元素，但不出队列
   * @returns  返回队列中的第一个元素，如果队列为空则返回 undefined
   */
  peek(): T | undefined {
    if (this.isEmpty())
      return undefined

    return this.items.get(this.lowest)
  }

  /**
   * 返回队列是否为空
   * @returns 队列为空则返回true；否则返回false
   */
  isEmpty(): boolean {
    return this.size() === 0
  }

  /**
   * 返回队列中的数量
   */
  size(): number {
    return this.items.size
  }

  /**
   * 按照插入顺序返回队列中的所有元素
   * @returns  队列中的所有元素
   */
  elements(): T[] {
    return [...this.items.values()]
  }
}
