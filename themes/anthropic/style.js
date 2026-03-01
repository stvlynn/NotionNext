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

      /* 文章卡片悬浮效果 */
      #theme-anthropic .post-card {
        transition: transform 200ms var(--ease-smooth);
      }

      #theme-anthropic .post-card:hover {
        transform: translateY(-2px);
      }

      #theme-anthropic .post-card .card-cover img {
        transition: transform 300ms var(--ease-smooth);
      }

      #theme-anthropic .post-card:hover .card-cover img {
        transform: scale(1.03);
      }

      /* 导航下划线动画 */
      #theme-anthropic .nav-link {
        position: relative;
        text-decoration: none;
      }

      #theme-anthropic .nav-link::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 1px;
        background-color: var(--anthropic-accent);
        transition: width 200ms var(--ease-smooth);
      }

      #theme-anthropic .nav-link:hover::after {
        width: 100%;
      }

      /* 标签样式 */
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
        transition: all 200ms var(--ease-smooth);
      }

      #theme-anthropic .tag-pill:hover {
        border-color: var(--anthropic-accent);
        color: var(--anthropic-accent);
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

      /* 按钮基础样式 */
      #theme-anthropic .btn-primary {
        background-color: var(--anthropic-accent);
        color: white;
        border: none;
        padding: 0.625rem 1.25rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 200ms var(--ease-smooth);
      }

      #theme-anthropic .btn-primary:hover {
        background-color: color-mix(in srgb, var(--anthropic-accent) 85%, black);
      }

      /* 响应式边距 */
      #theme-anthropic .site-margin {
        padding-left: clamp(1.5rem, 1.08rem + 1.8vw, 5rem);
        padding-right: clamp(1.5rem, 1.08rem + 1.8vw, 5rem);
      }

      /* 动画入场 */
      @media (prefers-reduced-motion: no-preference) {
        #theme-anthropic .animate-in {
          animation: slideUp 0.5s var(--ease-smooth) both;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      }
    `}</style>
  )
}

export { Style }
