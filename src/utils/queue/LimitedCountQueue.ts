import Queue from './Queue'

export default class LimitedCountQueue<T> {
  private queue: Queue<T>
  private count: number

  constructor(count: number) {
    this.queue = new Queue()
    this.count = count
  }

  /**
   * 入队列
   * @param ele 元素
   */
  offer(ele: T): void {
    if (this.queue.size() === this.count)
      this.queue.poll()

    this.queue.offer(ele)
  }

  /**
   * 队列的第一个元素出队列
   * @returns 返回队列中第一个元素并出队列，如果队列为空则返回 undefined
   */
  poll(): T | undefined {
    return this.queue.poll()
  }

  /**
   * 查看队列的第一个元素，但不出队列
   * @returns  返回队列中的第一个元素，如果队列为空则返回 undefined
   */
  peek(): T | undefined {
    return this.queue.peek()
  }

  /**
   * 返回队列是否为空
   * @returns 队列为空则返回true；否则返回false
   */
  isEmpty(): boolean {
    return this.queue.isEmpty()
  }

  /**
   * 按照插入顺序返回队列中的所有元素
   * @returns  队列中的所有元素
   */
  elements(): T[] {
    return this.queue.elements()
  }
}
