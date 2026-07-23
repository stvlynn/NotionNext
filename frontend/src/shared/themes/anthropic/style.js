/* eslint-disable react/no-unknown-property */
import { siteConfig } from '@/lib/config'
import CONFIG from './config'

/**
 * Navy Ink design system for the Anthropic theme.
 *
 * Recolored from coss.com/ui (Cal.com's design system): the original warm
 * Tailwind-neutral palette is retuned to a cool, restrained blue-grey slate —
 * silver-white in light, navy ink in dark — with a single cornflower-blue
 * accent reserved for links, focus and brand moments. Restraint over ornament.
 *
 * Two token layers:
 *   1. Base ramps  — --ink-* (cool slate) and --corn-* (cornflower)
 *   2. Semantic    — --background, --foreground, --brand … (alias the ramps)
 * The theme's legacy --anthropic-* variables are mapped onto the semantic
 * tokens so every existing component adopts the system without a rewrite.
 */
const Style = () => {
  const accentColor = siteConfig('ANTHROPIC_ACCENT_COLOR', '#3f6fc9', CONFIG)
  const bgDark = siteConfig('ANTHROPIC_BG_DARK', '#141a30', CONFIG)
  const bgLight = siteConfig('ANTHROPIC_BG_LIGHT', '#fafbfd', CONFIG)

  return (
    <style jsx global>{`
      :root {
        /* — Base ramps ————————————————————————————————————————————————— */
        --white: #ffffff;
        --black: oklch(0.16 0.028 264);

        /* Ink — cool blue-grey slate (hue ~260, low chroma) */
        --ink-50: oklch(0.985 0.004 258);
        --ink-100: oklch(0.969 0.006 258);
        --ink-150: oklch(0.947 0.01 258);
        --ink-200: oklch(0.916 0.013 259);
        --ink-300: oklch(0.858 0.017 259);
        --ink-400: oklch(0.708 0.024 260);
        --ink-500: oklch(0.585 0.028 261);
        --ink-600: oklch(0.48 0.032 262);
        --ink-700: oklch(0.382 0.036 263);
        --ink-800: oklch(0.296 0.042 264);
        --ink-900: oklch(0.232 0.044 265);
        --ink-950: oklch(0.172 0.04 265);

        /* Cornflower — the ribbon blue, the one accent (hue ~258) */
        --corn-50: oklch(0.966 0.018 257);
        --corn-100: oklch(0.93 0.036 257);
        --corn-200: oklch(0.878 0.062 258);
        --corn-300: oklch(0.798 0.094 258);
        --corn-400: oklch(0.69 0.128 258);
        --corn-500: oklch(0.585 0.152 259);
        --corn-600: oklch(0.52 0.156 260);
        --corn-700: oklch(0.462 0.142 261);
        --corn-800: oklch(0.402 0.116 262);

        /* — Semantic ——————————————————————————————————————————————————— */
        --radius: 0.625rem;
        --radius-sm: calc(var(--radius) - 4px);
        --radius-md: calc(var(--radius) - 2px);
        --radius-lg: var(--radius);
        --radius-xl: calc(var(--radius) + 4px);
        --radius-2xl: 1rem;
        --radius-full: 9999px;

        --background: ${bgLight};
        --foreground: var(--ink-800);

        --card: var(--white);
        --card-foreground: var(--ink-800);

        /* Brand = cornflower (used sparingly: links, selection, focus) */
        --brand: ${accentColor};
        --brand-foreground: var(--white);
        --brand-muted: color-mix(in srgb, ${accentColor} 8%, transparent);

        --muted-foreground: var(--ink-500);

        /* Lines & rings */
        --border: color-mix(in srgb, var(--ink-900) 9%, transparent);
        --border-strong: color-mix(in srgb, var(--ink-900) 16%, transparent);
        --ring: ${accentColor};

        /* Elevation — restrained, cool-tinted */
        --shadow-xs: 0 1px 2px -1px color-mix(in srgb, var(--ink-950) 8%, transparent);
        --shadow-sm: 0 1px 3px -1px color-mix(in srgb, var(--ink-950) 10%, transparent),
          0 1px 2px -1px color-mix(in srgb, var(--ink-950) 6%, transparent);
        --shadow-md: 0 4px 12px -2px color-mix(in srgb, var(--ink-950) 12%, transparent);
        --shadow-lg: 0 12px 32px -6px color-mix(in srgb, var(--ink-950) 16%, transparent);

        /* The coss top-highlight: a 1px inner line that reads as lit from above */
        --highlight-top: inset 0 1px 0 color-mix(in srgb, var(--white) 40%, transparent);

        /* Shadow-as-border — a 1px ring + gentle lift for elevated surfaces */
        --shadow-border: 0 0 0 1px color-mix(in srgb, #000 6%, transparent),
          0 1px 2px -1px color-mix(in srgb, #000 6%, transparent),
          0 2px 4px 0 color-mix(in srgb, #000 4%, transparent);
        --shadow-border-hover: 0 0 0 1px color-mix(in srgb, #000 8%, transparent),
          0 8px 24px -8px color-mix(in srgb, var(--ink-950) 18%, transparent);

        /* Motion — press-scale never below 0.95 */
        --press-scale: 0.96;
        --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
        --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
        --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
        --card-stagger: 0;

        /* — Legacy alias layer: components keep their --anthropic-* names, the
             values now resolve to the navy-ink semantic tokens ——————————————— */
        --anthropic-accent: var(--brand);
        --anthropic-bg-light: var(--background);
        --anthropic-bg-dark: ${bgDark};
        --anthropic-text-primary: var(--foreground);
        --anthropic-text-secondary: var(--muted-foreground);
        --anthropic-text-tertiary: var(--ink-400);
        --anthropic-border: var(--border);
        --anthropic-card-bg: var(--card);
        --anthropic-selection: var(--brand-muted);

        /* Raw bg values — concrete colors for the theme-transition ripple
           (never overridden by .dark) */
        --anthropic-raw-bg-light: ${bgLight};
        --anthropic-raw-bg-dark: ${bgDark};
      }

      .dark {
        --background: ${bgDark};
        --foreground: var(--ink-100);

        --card: var(--ink-900);
        --card-foreground: var(--ink-100);

        --brand: var(--corn-400);
        --brand-foreground: var(--ink-950);
        --brand-muted: color-mix(in srgb, var(--corn-400) 20%, transparent);

        --muted-foreground: var(--ink-400);

        --border: color-mix(in srgb, var(--white) 8%, transparent);
        --border-strong: color-mix(in srgb, var(--white) 16%, transparent);
        --ring: var(--corn-400);

        --highlight-top: inset 0 1px 0 color-mix(in srgb, var(--white) 8%, transparent);

        /* On dark surfaces layered depth shadows vanish — use a single ring */
        --shadow-border: 0 0 0 1px color-mix(in srgb, #fff 8%, transparent);
        --shadow-border-hover: 0 0 0 1px color-mix(in srgb, #fff 14%, transparent),
          0 8px 24px -8px rgba(0, 0, 0, 0.5);

        --anthropic-text-tertiary: var(--ink-500);
      }

      #theme-anthropic {
        background-color: var(--background);
        color: var(--foreground);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }

      #theme-anthropic ::selection {
        background: var(--anthropic-selection);
      }

      /* Text wrapping — balance headings, pretty body (no lone last words) */
      #theme-anthropic h1,
      #theme-anthropic h2,
      #theme-anthropic h3,
      #theme-anthropic h4 {
        text-wrap: balance;
      }
      #theme-anthropic p,
      #theme-anthropic li,
      #theme-anthropic figcaption,
      #theme-anthropic blockquote {
        text-wrap: pretty;
      }

      /* Image outlines — a neutral 1px inset separator for consistent depth.
         Pure black / white only so the edge never reads as a tint. */
      #theme-anthropic #article-wrapper img,
      #theme-anthropic .card-cover img {
        outline: 1px solid rgba(0, 0, 0, 0.1);
        outline-offset: -1px;
      }
      .dark #theme-anthropic #article-wrapper img,
      .dark #theme-anthropic .card-cover img {
        outline-color: rgba(255, 255, 255, 0.1);
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
        font-family: "Noto Sans SC", "Cal Sans UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
      }

      /* 代码与数字使用等宽字体 + 表格数字（数值变动不引发布局抖动） */
      #theme-anthropic code,
      #theme-anthropic pre,
      #theme-anthropic .mono {
        font-family: "Paper Mono", "JetBrains Mono", "Fira Code", "SF Mono", ui-monospace, monospace;
        font-variant-numeric: tabular-nums;
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

      /* 链接样式 — 棉花蓝，克制地出现 */
      #theme-anthropic a.anthropic-link {
        color: var(--brand);
        text-decoration: none;
        transition: color 200ms var(--ease-smooth);
      }

      #theme-anthropic a.anthropic-link:hover {
        color: color-mix(in srgb, var(--brand) 80%, var(--foreground));
      }

      /* ==========================================
         文章卡片 - 发丝边框 + 顶部高光 + 入场动画
         ========================================== */
      #theme-anthropic .post-card {
        transition:
          transform 400ms var(--ease-smooth),
          box-shadow 400ms var(--ease-smooth);
      }

      #theme-anthropic .post-card > a {
        border: 1px solid var(--border);
        box-shadow: var(--shadow-border), var(--highlight-top);
        border-radius: var(--radius-2xl);
        transition: box-shadow 400ms var(--ease-smooth);
      }

      #theme-anthropic .post-card:hover {
        transform: translateY(-4px);
      }

      #theme-anthropic .post-card:hover > a {
        box-shadow: var(--shadow-border-hover), var(--highlight-top);
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
        background-color: var(--brand);
        transition: width 350ms var(--ease-smooth), left 350ms var(--ease-smooth);
        border-radius: 1px;
      }

      #theme-anthropic .nav-link:hover::after {
        width: 100%;
        left: 0;
      }

      /* ==========================================
         标签样式 - 发丝边框胶囊，hover 转棉花蓝
         ========================================== */
      #theme-anthropic .tag-pill {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        font-family: "Paper Mono", "JetBrains Mono", ui-monospace, monospace;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        border: 1px solid var(--border);
        color: var(--muted-foreground);
        transition: all 300ms var(--ease-smooth);
      }

      #theme-anthropic .tag-pill:hover {
        border-color: var(--brand);
        color: var(--brand);
        transform: translateY(-1px);
      }

      /* 分割线 */
      #theme-anthropic .divider {
        height: 1px;
        background: var(--border);
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
        background-color: var(--brand);
        border-radius: 2px;
      }

      #theme-anthropic * {
        scrollbar-width: thin;
        scrollbar-color: var(--brand) transparent;
      }

      /* 文章内容样式增强 */
      #theme-anthropic #article-wrapper {
        max-width: 48rem;
      }

      #theme-anthropic #article-wrapper p {
        font-size: clamp(1.0625rem, 1.04rem + 0.1vw, 1.125rem);
        line-height: 1.8;
        color: var(--foreground);
        margin-bottom: 1.5rem;
      }

      #theme-anthropic #article-wrapper blockquote {
        border-left: 2px solid var(--brand);
        padding-left: 1.5rem;
        margin: 2rem 0;
        color: var(--muted-foreground);
        font-style: italic;
      }

      #theme-anthropic #article-wrapper pre {
        border-radius: var(--radius-lg);
        margin: 2rem 0;
      }

      #theme-anthropic #article-wrapper img {
        border-radius: var(--radius-lg);
        margin: 2rem 0;
      }

      /* ==========================================
         主按钮 - 棉花蓝品牌动作 + 触觉反馈
         ========================================== */
      #theme-anthropic .btn-primary {
        background-color: var(--brand);
        color: var(--brand-foreground);
        border: none;
        padding: 0.625rem 1.25rem;
        border-radius: var(--radius-lg);
        font-size: 0.875rem;
        cursor: pointer;
        box-shadow: var(--highlight-top);
        transition:
          background-color 200ms var(--ease-smooth),
          transform 200ms var(--ease-smooth),
          box-shadow 200ms var(--ease-smooth);
      }

      #theme-anthropic .btn-primary:hover {
        background-color: color-mix(in srgb, var(--brand) 88%, black);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md), var(--highlight-top);
      }

      #theme-anthropic .btn-primary:active {
        transform: scale(var(--press-scale)) translateY(0);
        box-shadow: var(--shadow-xs);
      }

      #theme-anthropic .btn-primary:focus-visible {
        outline: 3px solid var(--ring);
        outline-offset: 1px;
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
        background-color: color-mix(in srgb, var(--ink-900) 6%, transparent);
        transform: translateY(-1px);
        box-shadow: var(--shadow-xs);
      }
      .dark #theme-anthropic .anthro-btn-icon:hover {
        background-color: color-mix(in srgb, var(--white) 8%, transparent);
      }

      #theme-anthropic .anthro-btn-icon:active {
        transform: scale(var(--press-scale)) translateY(0);
        box-shadow: none;
      }

      #theme-anthropic .anthro-btn-icon:focus-visible {
        outline: 3px solid var(--ring);
        outline-offset: 1px;
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
        box-shadow: var(--shadow-lg);
      }

      #theme-anthropic .float-btn:active {
        transform: scale(var(--press-scale));
        box-shadow: var(--shadow-sm);
      }

      #theme-anthropic .float-btn:focus-visible {
        outline: 3px solid var(--ring);
        outline-offset: 1px;
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
          box-shadow: var(--shadow-md);
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
