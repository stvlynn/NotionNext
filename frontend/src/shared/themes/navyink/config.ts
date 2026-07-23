/**
 * Navy Ink theme configuration.
 *
 * Design system: https://github.com/stvlynn/navy-ink-design-system
 * Built on coss UI (Base UI) recoloured to a cool silver-white light mode,
 * navy-ink dark mode, and a single cornflower-blue accent.
 *
 * Colour is driven entirely by the token layer in
 * `shared/styles/navy-ink.css`; this config only toggles theme features.
 */
const CONFIG = {
  // Navigation
  NAVYINK_MENU_INDEX: true,
  NAVYINK_MENU_CATEGORY: true,
  NAVYINK_MENU_TAG: true,
  NAVYINK_MENU_ARCHIVE: true,
  NAVYINK_MENU_SEARCH: true,

  // Post list
  NAVYINK_POST_LIST_COVER: true,
  NAVYINK_POST_LIST_SUMMARY: true,

  // Article
  NAVYINK_ARTICLE_ADJACENT: true,
  NAVYINK_ARTICLE_COPYRIGHT: true,
  NAVYINK_ARTICLE_RECOMMEND: true,

  // Sidebar
  NAVYINK_WIDGET_TOC: true,
  NAVYINK_WIDGET_LATEST_POSTS: true
}

export default CONFIG
