'use client'

import { useThemeGlobal } from '../lib/global'
import { uuidToId } from 'notion-utils'
import * as React from 'react'

import { cn } from '@/lib/cn'

interface TocItem {
  id: string
  text: string
  indentLevel: number
}

/**
 * Table of contents with scroll-spy. The active heading is marked with a
 * cornflower rail; clicking scrolls smoothly. Hidden when a page has < 2
 * headings, where a TOC would be noise.
 */
export function Toc({ toc }: { toc?: TocItem[] }) {
  const { locale } = useThemeGlobal()
  const [activeId, setActiveId] = React.useState<string>('')

  const ids = React.useMemo(() => (toc || []).map(t => uuidToId(t.id)), [toc])

  React.useEffect(() => {
    if (ids.length === 0) return
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids])

  if (!toc || toc.length < 2) return null

  return (
    <nav aria-label={locale.COMMON.TABLE_OF_CONTENTS || 'On this page'}>
      <p className='mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground'>
        {locale.COMMON.TABLE_OF_CONTENTS || 'On this page'}
      </p>
      <ul className='space-y-1 border-l border-border'>
        {toc.map(item => {
          const id = uuidToId(item.id)
          const active = id === activeId
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={cn(
                  '-ml-px block border-l-2 py-1 text-sm transition-colors',
                  active
                    ? 'border-brand font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground'
                )}
                style={{ paddingLeft: `${item.indentLevel * 12 + 12}px` }}>
                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
