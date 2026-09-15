'use client'

import { useLocale } from '../lib/global'
import { uuidToId } from 'notion-utils'
import * as React from 'react'

import { cn } from '@/lib/cn'
import { headingState } from '../lib/reading'
import { useActiveHeading } from '../lib/useActiveHeading'
import type { TocItem } from '../types'

/** Bar length per heading depth, so the rail mirrors the outline shape. */
const BAR_WIDTH_BY_LEVEL = ['w-5', 'w-3.5', 'w-2.5'] as const

const BAR_BY_STATE = {
  read: 'bg-muted-foreground',
  active: 'w-7 bg-brand',
  unread: 'bg-border-strong group-hover/item:bg-muted-foreground'
} as const

/**
 * Section rail: one bar per heading, pinned to the right edge of wide
 * viewports. Bars above the current section read as "done", the current one
 * is the accent, the rest are faint, so the reader can gauge where they are
 * in the whole piece at a glance. Hovering (or tabbing into) the rail slides
 * the heading titles out beside the bars. Hidden on pages with fewer than two
 * headings, where it would be noise.
 */
export function SectionRail({ toc }: { toc?: TocItem[] | undefined }) {
  const locale = useLocale()
  const items = React.useMemo(
    () =>
      (toc ?? []).map(item => ({
        id: uuidToId(item.id),
        text: item.text,
        level: Math.min(item.indentLevel, BAR_WIDTH_BY_LEVEL.length - 1)
      })),
    [toc]
  )
  const ids = React.useMemo(() => items.map(item => item.id), [items])
  const activeIndex = useActiveHeading(ids)

  if (items.length < 2) return null

  const jumpTo = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    target.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start'
    })
    window.history.replaceState(null, '', `#${id}`)
  }

  return (
    <nav
      aria-label={locale.COMMON.TABLE_OF_CONTENTS}
      className='group/rail fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 xl:block'
    >
      <ol className='flex flex-col items-end gap-1.5'>
        {items.map((item, index) => {
          const state = headingState(index, activeIndex)
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={state === 'active' ? 'location' : undefined}
                onClick={event => jumpTo(event, item.id)}
                className='group/item flex items-center justify-end gap-3 py-1 outline-none'
              >
                <span
                  className={cn(
                    'max-w-56 truncate rounded bg-background/90 px-1.5 text-xs leading-5 transition-[opacity,transform] duration-200 ease-out',
                    'translate-x-1 opacity-0 group-hover/rail:translate-x-0 group-hover/rail:opacity-100 group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100',
                    state === 'active'
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground group-hover/item:text-foreground'
                  )}
                >
                  {item.text}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'h-0.5 shrink-0 rounded-full transition-[width,background-color] duration-200 ease-out group-focus-visible/item:bg-foreground',
                    BAR_WIDTH_BY_LEVEL[item.level],
                    BAR_BY_STATE[state]
                  )}
                />
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
