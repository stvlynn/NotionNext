/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
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
