/* eslint-disable react/no-unknown-property */
import { siteConfig } from '@/lib/config'
import CONFIG from './config'

const Style = () => {
  const accentColor = siteConfig('ANTHROPIC_ACCENT_COLOR', '#D97757', CONFIG)
  const bgDark = siteConfig('ANTHROPIC_BG_DARK', '#141413', CONFIG)
  const bgLight = siteConfig('ANTHROPIC_BG_LIGHT', '#FAF9F0', CONFIG)

  return (
    <style jsx global>{`
      :root {
        --anthropic-accent: ${accentColor};
        --anthropic-bg-dark: ${bgDark};
        --anthropic-bg-light: ${bgLight};
        --anthropic-text-primary: #141413;
        --anthropic-text-secondary: #6B6B6B;
        --anthropic-text-tertiary: #9B9B9B;
        --anthropic-border: #E5E2D9;
        --anthropic-card-bg: #FFFFFF;
        --anthropic-selection: rgba(204, 120, 92, 0.3);
        --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
        --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
        --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
        --card-stagger: 0;
        /* Raw bg values - never overridden by .dark, used by theme transition ripple */
        --anthropic-raw-bg-light: ${bgLight};
        --anthropic-raw-bg-dark: ${bgDark};
      }

      .dark {
        --anthropic-bg-light: ${bgDark};
        --anthropic-text-primary: #FAFAFA;
        --anthropic-text-secondary: #A0A0A0;
        --anthropic-text-tertiary: #707070;
        --anthropic-border: #2A2A29;
        --anthropic-card-bg: #1C1C1B;
      }

      #theme-anthropic {
        background-color: var(--anthropic-bg-light);
        color: var(--anthropic-text-primary);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      #theme-anthropic ::selection {
        background: var(--anthropic-selection);
      }

      /* 标题使用京华老宋体 */
      #theme-anthropic h1,
      #theme-anthropic h2,
      #theme-anthropic .post-title,
      #theme-anthropic .site-title {
        font-family: "KingHwa_OldSong", "Noto Serif SC", "Source Serif Pro", Georgia, serif;
        font-weight: 400;
        letter-spacing: 0.01em;
      }

      /* 正文使用衬线+无衬线混排 */
      #theme-anthropic article,
      #theme-anthropic .article-body {
        font-family: "Noto Serif SC", "Source Serif Pro", Georgia, serif;
        line-height: 1.8;
      }

      #theme-anthropic .ui-text,
      #theme-anthropic nav,
      #theme-anthropic .meta,
      #theme-anthropic footer {
        font-family: "Noto Sans SC", "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
      }

      /* 代码使用 JetBrains Mono */
      #theme-anthropic code,
      #theme-anthropic pre,
      #theme-anthropic .mono {
        font-family: "JetBrains Mono", "Fira Code", "SF Mono", monospace;
      }

      /* 流体排版 */
      #theme-anthropic h1 {
        font-size: clamp(2rem, 1.69rem + 1.31vw, 3rem);
        line-height: 1.2;
        letter-spacing: -0.01em;
      }

      #theme-anthropic h2 {
        font-size: clamp(1.5rem, 1.35rem + 0.65vw, 2rem);
        line-height: 1.3;
      }

      #theme-anthropic h3 {
        font-size: clamp(1.25rem, 1.18rem + 0.33vw, 1.5rem);
        line-height: 1.4;
      }

      /* 链接样式 */
      #theme-anthropic a.anthropic-link {
        color: var(--anthropic-accent);
        text-decoration: none;
        transition: color 200ms var(--ease-smooth);
      }

      #theme-anthropic a.anthropic-link:hover {
        color: color-mix(in srgb, var(--anthropic-accent) 80%, black);
      }

      /* ==========================================
         文章卡片 - 悬浮效果 + 入场动画
         ========================================== */
      #theme-anthropic .post-card {
        transition:
          transform 400ms var(--ease-smooth),
          box-shadow 400ms var(--ease-smooth);
      }

      #theme-anthropic .post-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.08);
      }

      .dark #theme-anthropic .post-card:hover {
        box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.3);
      }

      #theme-anthropic .post-card .card-cover img {
        transition: transform 500ms var(--ease-smooth);
      }

      #theme-anthropic .post-card:hover .card-cover img {
        transform: scale(1.04);
      }

      /* ==========================================
         导航下划线动画 - 更流畅的展开
         ========================================== */
      #theme-anthropic .nav-link {
        position: relative;
        text-decoration: none;
      }

      #theme-anthropic .nav-link::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 50%;
        width: 0;
        height: 1.5px;
        background-color: var(--anthropic-accent);
        transition: width 350ms var(--ease-smooth), left 350ms var(--ease-smooth);
        border-radius: 1px;
      }

      #theme-anthropic .nav-link:hover::after {
        width: 100%;
        left: 0;
      }

      /* ==========================================
         标签样式
         ========================================== */
      #theme-anthropic .tag-pill {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-family: "JetBrains Mono", monospace;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        border: 1px solid var(--anthropic-border);
        color: var(--anthropic-text-secondary);
        transition: all 300ms var(--ease-smooth);
      }

      #theme-anthropic .tag-pill:hover {
        border-color: var(--anthropic-accent);
        color: var(--anthropic-accent);
        transform: translateY(-1px);
      }

      /* 分割线 */
      #theme-anthropic .divider {
        height: 1px;
        background: var(--anthropic-border);
        border: none;
      }

      /* 滚动条 */
      #theme-anthropic ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }

      #theme-anthropic ::-webkit-scrollbar-track {
        background: transparent;
      }

      #theme-anthropic ::-webkit-scrollbar-thumb {
        background-color: var(--anthropic-accent);
        border-radius: 2px;
      }

      #theme-anthropic * {
        scrollbar-width: thin;
        scrollbar-color: var(--anthropic-accent) transparent;
      }

      /* 文章内容样式增强 */
      #theme-anthropic #article-wrapper {
        max-width: 48rem;
      }

      #theme-anthropic #article-wrapper p {
        font-size: clamp(1.0625rem, 1.04rem + 0.1vw, 1.125rem);
        line-height: 1.8;
        color: var(--anthropic-text-primary);
        margin-bottom: 1.5rem;
      }

      #theme-anthropic #article-wrapper blockquote {
        border-left: 2px solid var(--anthropic-accent);
        padding-left: 1.5rem;
        margin: 2rem 0;
        color: var(--anthropic-text-secondary);
        font-style: italic;
      }

      #theme-anthropic #article-wrapper pre {
        border-radius: 0.5rem;
        margin: 2rem 0;
      }

      #theme-anthropic #article-wrapper img {
        border-radius: 0.5rem;
        margin: 2rem 0;
      }

      /* ==========================================
         按钮基础样式 - 增强交互反馈
         ========================================== */
      #theme-anthropic .btn-primary {
        background-color: var(--anthropic-accent);
        color: white;
        border: none;
        padding: 0.625rem 1.25rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition:
          background-color 200ms var(--ease-smooth),
          transform 200ms var(--ease-smooth),
          box-shadow 200ms var(--ease-smooth);
      }

      #theme-anthropic .btn-primary:hover {
        background-color: color-mix(in srgb, var(--anthropic-accent) 85%, black);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.12);
      }

      #theme-anthropic .btn-primary:active {
        transform: scale(0.97) translateY(0);
        box-shadow: 0 1px 4px -1px rgba(0, 0, 0, 0.1);
      }

      #theme-anthropic .btn-primary:focus-visible {
        outline: 2px solid var(--anthropic-accent);
        outline-offset: 2px;
      }

      /* ==========================================
         通用图标按钮 - 所有 icon buttons 的微交互
         ========================================== */
      #theme-anthropic .anthro-btn-icon {
        cursor: pointer;
        transition:
          background-color 200ms var(--ease-smooth),
          color 200ms var(--ease-smooth),
          transform 200ms var(--ease-smooth),
          box-shadow 200ms var(--ease-smooth);
      }

      #theme-anthropic .anthro-btn-icon:hover {
        background-color: var(--anthropic-border);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.06);
      }

      #theme-anthropic .anthro-btn-icon:active {
        transform: scale(0.97) translateY(0);
        box-shadow: none;
      }

      #theme-anthropic .anthro-btn-icon:focus-visible {
        outline: 2px solid var(--anthropic-accent);
        outline-offset: 2px;
      }

      /* ==========================================
         悬浮按钮 (RightFloatArea) 增强
         ========================================== */
      #theme-anthropic .float-btn {
        transition:
          transform 300ms var(--ease-smooth),
          box-shadow 300ms var(--ease-smooth),
          background-color 200ms var(--ease-smooth);
      }

      #theme-anthropic .float-btn:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.15);
      }

      #theme-anthropic .float-btn:active {
        transform: scale(0.95);
        box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.1);
      }

      #theme-anthropic .float-btn:focus-visible {
        outline: 2px solid var(--anthropic-accent);
        outline-offset: 2px;
      }

      /* 响应式边距 */
      #theme-anthropic .site-margin {
        padding-left: clamp(1.5rem, 1.08rem + 1.8vw, 5rem);
        padding-right: clamp(1.5rem, 1.08rem + 1.8vw, 5rem);
      }

      /* ==========================================
         入场动画 - 有机的 slide up
         ========================================== */
      @media (prefers-reduced-motion: no-preference) {
        #theme-anthropic .animate-in {
          animation: slideUp 0.6s var(--ease-smooth) both;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.99);
          }
          60% {
            opacity: 1;
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ==========================================
           卡片交错入场动画
           ========================================== */
        #theme-anthropic .post-card-stagger {
          animation: cardSlideUp 0.7s var(--ease-smooth) both;
          animation-delay: calc(var(--card-stagger) * 80ms);
        }

        @keyframes cardSlideUp {
          from {
            opacity: 0;
            transform: translateY(32px) scale(0.97);
          }
          40% {
            opacity: 0.6;
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ==========================================
           页面过渡动画 - 进入/离开
           ========================================== */
        .anthropic-page-enter {
          transition: all 500ms var(--ease-smooth);
        }

        .anthropic-page-enter-from {
          opacity: 0;
          transform: translateY(12px) scale(0.98);
        }

        .anthropic-page-enter-to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .anthropic-page-leave {
          transition: all 200ms var(--ease-in-out-quart);
        }

        .anthropic-page-leave-from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .anthropic-page-leave-to {
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
        }

        /* ==========================================
           全屏涟漪 - 暗色模式切换
           ========================================== */
        @keyframes themeRippleExpand {
          from {
            transform: scale(0);
            opacity: 1;
          }
          to {
            transform: scale(var(--ripple-scale, 4000));
            opacity: 1;
          }
        }

        /* ==========================================
           加载指示器 - 优雅的波浪脉冲
           ========================================== */
        @keyframes loadingWave {
          0%, 100% {
            transform: scaleY(0.4);
            opacity: 0.4;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        @keyframes loadingFade {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        #theme-anthropic .loading-dot {
          animation: loadingWave 1.4s var(--ease-smooth) infinite;
        }

        /* ==========================================
           微妙的悬停提升效果 - 通用
           ========================================== */
        #theme-anthropic .hover-lift {
          transition: transform 300ms var(--ease-smooth), box-shadow 300ms var(--ease-smooth);
        }

        #theme-anthropic .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.08);
        }
      }

      /* ==========================================
         减少动效 - 尊重用户偏好
         ========================================== */
      @media (prefers-reduced-motion: reduce) {
        #theme-anthropic .animate-in,
        #theme-anthropic .post-card-stagger {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }

        #theme-anthropic .post-card,
        #theme-anthropic .btn-primary,
        #theme-anthropic .anthro-btn-icon,
        #theme-anthropic .float-btn,
        #theme-anthropic .tag-pill,
        #theme-anthropic .nav-link::after {
          transition-duration: 0ms !important;
        }
      }
    `}</style>
  )
}

export { Style }
