import fs from 'fs'

interface QueueItem<T = unknown> {
  requestFunc: () => T | Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

interface NodeError extends Error {
  code?: string
}

function isNodeError(error: unknown): error is NodeError {
  return error instanceof Error
}

export class RateLimiter {
  private queue: QueueItem[] = []
  private inflight = new Set<string>()
  private isProcessing = false
  private lastRequestTime = 0
  private requestCount = 0
  private windowStart = Date.now()
  private maxRequestsPerMinute: number
  private lockFilePath: string | undefined
  private minIntervalMs: number

  constructor(
    maxRequestsPerMinute = 200,
    lockFilePath?: string,
    minIntervalMs = 300
  ) {
    this.maxRequestsPerMinute = maxRequestsPerMinute
    this.lockFilePath = lockFilePath
    this.minIntervalMs = minIntervalMs
  }

  async acquireLock(): Promise<void> {
    if (!this.lockFilePath) return
    if (fs.existsSync(this.lockFilePath)) {
      const stats = fs.statSync(this.lockFilePath)
      const age = Date.now() - stats.ctimeMs
      if (age > 30 * 1000) {
        try {
          fs.unlinkSync(this.lockFilePath)
          console.warn('[限流] 删除陈旧锁文件:', this.lockFilePath)
        } catch (err) {
          console.error('[限流] 删除陈旧锁失败:', err)
        }
      }
    }
    while (true) {
      try {
        fs.writeFileSync(this.lockFilePath, process.pid.toString(), {
          flag: 'wx'
        })
        return
      } catch (err) {
        if (isNodeError(err) && err.code === 'EEXIST') {
          await new Promise(resolve => setTimeout(resolve, 100))
        } else {
          throw err
        }
      }
    }
  }

  releaseLock(): void {
    if (!this.lockFilePath) return
    try {
      if (fs.existsSync(this.lockFilePath)) fs.unlinkSync(this.lockFilePath)
    } catch (err) {
      console.error('释放锁失败', err)
    }
  }

  enqueue<T>(key: string, requestFunc: () => T | Promise<T>): Promise<T> {
    if (this.inflight.has(key)) {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          if (!this.inflight.has(key)) {
            clearInterval(interval)
            void this.enqueue(key, requestFunc).then(resolve).catch(reject)
          }
        }, 50)
      })
    }

    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFunc,
        resolve: resolve as QueueItem['resolve'],
        reject
      })
      if (!this.isProcessing) {
        void this.processQueue()
      }
    })
  }

  async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false
      return
    }
    this.isProcessing = true

    try {
      await this.acquireLock()
      const now = Date.now()
      const elapsed = now - this.windowStart

      if (elapsed > 60000) {
        this.requestCount = 0
        this.windowStart = now
      }
      if (this.requestCount >= this.maxRequestsPerMinute) {
        const waitTime = 60000 - elapsed + 100
        await new Promise(resolve => setTimeout(resolve, waitTime))
        this.requestCount = 0
        this.windowStart = Date.now()
      }

      const waitTime = Math.max(
        0,
        this.minIntervalMs - (now - this.lastRequestTime)
      )
      if (waitTime > 0) await new Promise(resolve => setTimeout(resolve, waitTime))

      const { requestFunc, resolve, reject } = this.queue.shift()!
      const key = crypto.randomUUID()
      this.inflight.add(key)

      try {
        const result = await requestFunc()
        this.lastRequestTime = Date.now()
        this.requestCount++
        resolve(result)
      } catch (err) {
        reject(err)
      } finally {
        this.inflight.delete(key)
      }
    } catch (err) {
      console.error('限流队列异常', err)
    } finally {
      this.releaseLock()
      setTimeout(() => {
        void this.processQueue()
      }, 0)
    }
  }
}
