const CONFIG = {
  // 首页配置
  ANTHROPIC_HOME_BANNER_ENABLE: false,

  // 菜单配置
  ANTHROPIC_MENU_INDEX: true,
  ANTHROPIC_MENU_CATEGORY: true,
  ANTHROPIC_MENU_TAG: true,
  ANTHROPIC_MENU_ARCHIVE: true,
  ANTHROPIC_MENU_SEARCH: true,

  // 文章列表配置
  ANTHROPIC_POST_LIST_COVER: true,
  ANTHROPIC_POST_LIST_SUMMARY: true,
  ANTHROPIC_POST_LIST_PREVIEW: false,

  // 文章详情配置
  ANTHROPIC_ARTICLE_ADJACENT: true,
  ANTHROPIC_ARTICLE_COPYRIGHT: true,
  ANTHROPIC_ARTICLE_RECOMMEND: true,

  // 侧边栏配置
  ANTHROPIC_WIDGET_TOC: true,
  ANTHROPIC_WIDGET_LATEST_POSTS: true,

  // 配色方案 - Navy Ink 设计体系（源自 coss.com/ui，冷色银白 / 藏青墨 + 棉花蓝强调）
  ANTHROPIC_ACCENT_COLOR: '#3f6fc9', // cornflower 棉花蓝强调色
  ANTHROPIC_BG_DARK: '#141a30', // ink-950 藏青墨背景
  ANTHROPIC_BG_LIGHT: '#fafbfd', // ink-50 银白背景
  ANTHROPIC_TEXT_DARK: '#28304a', // ink-800
  ANTHROPIC_TEXT_LIGHT: '#f2f4f9', // ink-100

  // 插图背景色调色板（用于无封面文章卡片）- 冷色藏青 / 棉花蓝家族
  ANTHROPIC_PALETTE: [
    '#28304a', // ink-800 藏青墨
    '#2b4d93', // corn-700 深棉花蓝
    '#3f6fc9', // corn-500 棉花蓝
    '#3c4760', // ink-700 冷板岩
    '#305bb0', // corn-600 靛蓝
    '#545f78', // ink-600 石墨蓝
    '#3f7d6e', // 冷杉绿
    '#6d788f'  // ink-500 银蓝
  ]
}
export default CONFIG
