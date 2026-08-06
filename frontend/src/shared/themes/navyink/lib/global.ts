/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { siteConfig as siteConfigRaw } from '@/lib/config'
import { useGlobal as useGlobalRaw } from '@/lib/global'

/**
 * Typed facade over NotionNext's untyped `useGlobal` / `siteConfig`.
 *
 * These live in JavaScript modules and return `any`, which leaks unsafe access
 * across the theme. Casting once here gives the rest of the theme real types
 * and keeps the `any` boundary in a single, explicit place.
 */

export interface Locale {
  NAV: {
    INDEX: string
    ARCHIVE: string
    SEARCH: string
    DARK_MODE?: string
    MENU?: string
  }
  COMMON: {
    CATEGORY: string
    TAGS: string
    MORE?: string
    NO_MORE?: string
    NOT_FOUND: string
    NO_RESULTS?: string
    TABLE_OF_CONTENTS?: string
    ARTICLE_LOCK_TIPS: string
    PASSWORD_ERROR: string
    SUBMIT?: string
  }
  SEARCH?: {
    ARTICLES?: string
  }
  PAGINATION?: {
    LABEL?: string
    PREVIOUS?: string
    NEXT?: string
  }
}

export interface ThemeGlobal {
  locale: Locale
  isDarkMode: boolean
  changeDarkMode: (value?: boolean) => void
  fullWidth: boolean
  NOTION_CONFIG: Record<string, unknown>
}

/** Strongly-typed view of the global theme context. */
export function useThemeGlobal(): ThemeGlobal {
  return useGlobalRaw() as unknown as ThemeGlobal
}

/** Strongly-typed `siteConfig` reader. */
export function conf<T = unknown>(
  key: string,
  defaultValue?: T,
  config?: unknown
): T {
  return siteConfigRaw<T>(key, defaultValue, config)
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

/**
 * English fallback copy for the navy-ink theme. Every user-facing string a
 * theme component needs is defined here exactly once; `useLocale` deep-merges
 * the active NotionNext lang file over these values, so consumers never need
 * `|| 'literal'` fallbacks.
 */
export const NAVYINK_LOCALE_DEFAULTS = {
  NAV: {
    SEARCH: 'Search',
    DARK_MODE: 'Toggle theme',
    MENU: 'Menu'
  },
  COMMON: {
    NOT_FOUND: 'No posts found.',
    NO_RESULTS: 'No results for',
    MORE: 'Load more',
    NO_MORE: 'No more posts',
    SUBMIT: 'OK',
    TABLE_OF_CONTENTS: 'On this page'
  },
  PAGINATION: {
    LABEL: 'Pagination',
    PREVIOUS: 'Previous page',
    NEXT: 'Next page'
  }
} satisfies DeepPartial<Locale>

/** Locale with every `NAVYINK_LOCALE_DEFAULTS` key guaranteed present. */
export type ResolvedLocale = Locale & typeof NAVYINK_LOCALE_DEFAULTS

function mergeLocale(
  defaults: Record<string, any>,
  overrides: Record<string, any> | undefined
): Record<string, any> {
  const result: Record<string, any> = { ...defaults }
  for (const [key, value] of Object.entries(overrides ?? {})) {
    const current = result[key]
    if (
      value !== null &&
      typeof value === 'object' &&
      current !== null &&
      typeof current === 'object'
    ) {
      result[key] = mergeLocale(current, value)
    } else if (value !== undefined) {
      result[key] = value
    }
  }
  return result
}

/**
 * `useThemeGlobal().locale` deep-merged over `NAVYINK_LOCALE_DEFAULTS`.
 * Keys listed in the defaults are always defined on the returned object.
 */
export function useLocale(): ResolvedLocale {
  const { locale } = useThemeGlobal()
  return mergeLocale(NAVYINK_LOCALE_DEFAULTS, locale) as ResolvedLocale
}
