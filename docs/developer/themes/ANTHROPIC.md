# Anthropic 主题 · Navy Ink 设计体系

中文 | 站长文档：[user-guide/themes](../../user-guide/themes/THEMES_CATALOG.md)

`anthropic` 主题（`NEXT_PUBLIC_THEME=anthropic`，仓库默认主题）的视觉体系采用 **Navy Ink**——移植自 [coss.com/ui](https://coss.com/ui)（Cal.com 设计体系）并重新调色的 [navy-ink-design-system](https://github.com/stvlynn/navy-ink-design-system)。原体系的暖色 Tailwind-neutral 调色被替换为冷色蓝灰板岩（浅色银白、深色藏青墨），并保留一个棉花蓝（cornflower）强调色，仅用于链接、焦点与品牌场景。核心原则：**克制优于装饰**。

## 1. 令牌层

全部令牌定义在 `themes/anthropic/style.js` 的全局 `<style jsx global>` 中，分两层：

### 基础色阶（base ramps）

- `--ink-50 … --ink-950`：冷蓝灰板岩（hue ~260，低彩度），OKLCH 表示。
- `--corn-50 … --corn-800`：棉花蓝强调色阶（hue ~258）。

### 语义令牌（semantic tokens）

面向组件使用，别名基础色阶；换肤只需改动语义层或 `config.js`：

| 令牌 | 浅色 | 深色 |
| --- | --- | --- |
| `--background` | `config.ANTHROPIC_BG_LIGHT`（`#fafbfd`） | `config.ANTHROPIC_BG_DARK`（`#141a30`） |
| `--foreground` | `--ink-800` | `--ink-100` |
| `--card` | `#ffffff` | `--ink-900` |
| `--brand` | `config.ANTHROPIC_ACCENT_COLOR`（`#3f6fc9`） | `--corn-400` |
| `--muted-foreground` | `--ink-500` | `--ink-400` |
| `--border` | `ink-900 / 9%` | `white / 8%` |
| `--ring` | 棉花蓝 | `--corn-400` |

半径 `--radius-*`（10px 基准，卡片 `--radius-2xl` = 16px）、间距、阴影（`--shadow-xs…lg`、`--shadow-border`、`--highlight-top`）、动效（`--press-scale: 0.96`、`--ease-smooth`）均以令牌形式集中定义。

### 兼容别名层

历史组件使用 `--anthropic-*` 变量名，令牌层将其映射到语义令牌（`--anthropic-accent → --brand`、`--anthropic-text-primary → --foreground` 等），因此**无需改动任何组件**即可完成换肤。

## 2. coss 细节（polish）

在 `style.js` 中通过选择器统一施加，不新增手写组件：

- **发丝边框 + 顶部高光**：`.post-card > a` 使用 `--border` + `--shadow-border` + `--highlight-top`，读作被上方光源照亮的实体表面。
- **图片描边**：正文与卡片封面图 1px 中性内描边（纯黑/白，`outline-offset: -1px`），不占布局尺寸。
- **表格数字**：`code / pre / .mono / .tag-pill` 使用 `font-variant-numeric: tabular-nums`，数值变动不引发布局抖动。
- **按压反馈**：按钮 `:active` 统一 `scale(var(--press-scale))`（0.96，不低于 0.95）。
- **焦点环**：交互元素 `:focus-visible` 使用 3px 棉花蓝 `--ring`。
- **文本折行**：标题 `text-wrap: balance`，正文 `text-wrap: pretty`。

## 3. 换肤方式

改 `themes/anthropic/config.js` 三个字段即可整体换色，令牌层会自动接管：

- `ANTHROPIC_ACCENT_COLOR` → `--brand` / `--ring`
- `ANTHROPIC_BG_LIGHT` → 浅色 `--background`
- `ANTHROPIC_BG_DARK` → 深色 `--background` 与主题过渡涟漪原始色

无封面文章卡片的占位底色取自 `ANTHROPIC_PALETTE`（已调整为冷色藏青/棉花蓝家族）。

## 4. 未采用完整 coss 组件库的原因

coss ui 基于 Base UI + Tailwind v4，经 shadcn CLI 安装；本项目为 Tailwind v3、Next 14 Pages Router、SSR，且 navy-ink 官方即以「令牌/CSS 原型，非生产组件」形式提供。因此本次以**采纳其设计令牌体系与 coss 细节**的方式落地，用设计体系驱动既有组件，而非替换组件框架。
