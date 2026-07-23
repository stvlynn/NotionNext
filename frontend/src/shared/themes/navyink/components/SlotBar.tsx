import { useThemeGlobal } from '../lib/global'
import * as React from 'react'

import { FadeIn } from './Motion'
import type { ThemeLayoutProps } from '../types'

/**
 * Contextual heading above a post list — the active category, tag, or search
 * term. Renders nothing on the plain index so the grid leads the page.
 */
export function SlotBar(props: ThemeLayoutProps) {
  const { category, tag, currentSearch } = props
  const { locale } = useThemeGlobal()

  const label = category
    ? locale.COMMON.CATEGORY
    : tag
      ? locale.COMMON.TAGS
      : currentSearch
        ? locale.NAV.SEARCH
        : null
  const value = category || tag || currentSearch

  if (!value) return null

  return (
    <FadeIn className='mb-8' y={6}>
      <p className='font-mono text-xs uppercase tracking-widest text-muted-foreground'>
        {label}
      </p>
      <h1 className='mt-1 text-2xl font-bold tracking-tight text-foreground'>
        {value}
      </h1>
    </FadeIn>
  )
}
