import type * as React from 'react'

declare global {
  interface Window {
    [key: string]: any
    AOS?: { init: (options?: Record<string, any>) => void }
    ackeeTracker?: any
    _AdBlockInit?: () => void
    Artalk?: any
    CUSDIS?: any
    CozeWebSDK?: any
    difyChatbotConfig?: Record<string, any>
    anime?: any
    createFireworks?: any
    createFlutteringRibbon?: any
    destroyFlutteringRibbon?: any
    createMouseCanvas?: any
    createNest?: any
    destroyNest?: any
    createRibbon?: any
    destroyRibbon?: any
    createSakura?: any
    destroySakura?: any
    renderStarrySky?: any
    Giscus?: any
    Gitalk?: any
    adsbygoogle?: any[]
    gtag?: (...args: any[]) => void
    LA?: any
    Lenis?: any
    loadlive2d?: (id: string, path: string) => void
    NProgress?: any
    Mark?: any
    textToSpoiler?: (text: string) => void
    APlayer?: any
    QRCode?: any
    Prism?: any
    mermaid?: any
    __TECH_GROW_NETWORK_PROBE_INSTALLED__?: boolean
    __TECH_GROW_ALERT_PROBE_INSTALLED__?: boolean
    ReadmorePlugin?: any
    btw?: any
    tianliGPT_postSelector?: string
    tianliGPT_key?: string
    twikoo?: any
    Valine?: any
    VConsole?: any
    fbAsyncInit?: () => void
    FB?: any
  }

  interface Element {
    [key: string]: any
  }

  interface Event {
    [key: string]: any
  }

  interface EventTarget {
    [key: string]: any
  }

  interface Node {
    [key: string]: any
  }

  interface Document {
    webkitExitFullscreen?: () => Promise<void> | void
    mozCancelFullScreen?: () => Promise<void> | void
    msExitFullscreen?: () => Promise<void> | void
  }

  interface HTMLElement {
    webkitRequestFullscreen?: () => Promise<void> | void
    mozRequestFullScreen?: () => Promise<void> | void
    msRequestFullscreen?: () => Promise<void> | void
  }

  interface XMLHttpRequest {
    __techGrowDebugMeta?: Record<string, any>
  }

  namespace JSX {
    interface IntrinsicElements {
      'meting-js': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        [key: string]: any
        server?: string
        type?: string
        id?: string
        fixed?: string
        mini?: string
        autoplay?: string
        theme?: string
        loop?: string
        order?: string
        preload?: string
        volume?: string
        mutex?: string
        lrcType?: string
        listFolded?: string
        listMaxHeight?: string
        storageName?: string
      }
    }
  }
}

declare module 'react' {
  interface HTMLAttributes<T> {
    [key: string]: any
  }

  interface LinkHTMLAttributes<T> {
    fetchpriority?: string
  }
}
