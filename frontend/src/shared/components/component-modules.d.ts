declare module 'lodash/throttle' {
  const throttle: <T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: {
      leading?: boolean
      trailing?: boolean
    }
  ) => T & { cancel: () => void; flush: () => ReturnType<T> }

  export default throttle
}

declare module 'lodash/escapeRegExp' {
  const escapeRegExp: (value?: string) => string

  export default escapeRegExp
}

declare module 'react-facebook' {
  import type { ComponentType } from 'react'

  export const FacebookProvider: ComponentType<Record<string, any>>
  export const Page: ComponentType<Record<string, any>>
}

declare module 'prismjs' {
  const Prism: any

  export default Prism
}

declare module 'katex' {
  const katex: any

  export default katex
}

declare module 'web-vitals' {
  export interface Metric {
    name: string
    value: number
    id?: string
    delta?: number
    rating?: string
    entries?: PerformanceEntry[]
  }

  export function onCLS(callback: (metric: Metric) => void): void
  export function onFID(callback: (metric: Metric) => void): void
  export function onFCP(callback: (metric: Metric) => void): void
  export function onLCP(callback: (metric: Metric) => void): void
  export function onTTFB(callback: (metric: Metric) => void): void
}
