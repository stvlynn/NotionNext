import SmartLink from '@/components/SmartLink'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/router'
import * as React from 'react'

import { cn } from '@/lib/cn'

interface PaginationProps {
  page: number
  totalPage: number
}

const linkBase =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors'

/** Numbered pagination with prev/next, current page on the ink primary. */
export function Pagination({ page, totalPage }: PaginationProps) {
  const router = useRouter()
  const current = +page
  const prefix = (router.asPath.split('?')[0] ?? router.asPath)
    .replace(/\/page\/[1-9]\d*/, '')
    .replace(/\/$/, '')
    .replace('.html', '')

  const hrefFor = (p: number) =>
    p === 1 ? `${prefix}/` : `${prefix}/page/${p}`

  const pages = Array.from({ length: totalPage }, (_, i) => i + 1).filter(
    p => p === 1 || p === totalPage || Math.abs(p - current) <= 1
  )

  return (
    <nav
      className='mt-14 flex items-center justify-center gap-1'
      aria-label='Pagination'>
      <SmartLink
        href={hrefFor(current - 1)}
        rel='prev'
        aria-label='Previous page'
        className={cn(
          linkBase,
          'text-muted-foreground hover:bg-accent hover:text-foreground',
          current <= 1 && 'pointer-events-none invisible'
        )}>
        <ChevronLeft className='size-4' />
      </SmartLink>

      {pages.map((p, i) => {
        const prev = pages[i - 1]
        const gap = prev !== undefined && p - prev > 1
        return (
          <React.Fragment key={p}>
            {gap && (
              <span className='px-1 text-muted-foreground' aria-hidden>
                …
              </span>
            )}
            <SmartLink
              href={hrefFor(p)}
              aria-current={p === current ? 'page' : undefined}
              className={cn(
                linkBase,
                p === current
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}>
              {p}
            </SmartLink>
          </React.Fragment>
        )
      })}

      <SmartLink
        href={hrefFor(current + 1)}
        rel='next'
        aria-label='Next page'
        className={cn(
          linkBase,
          'text-muted-foreground hover:bg-accent hover:text-foreground',
          current >= totalPage && 'pointer-events-none invisible'
        )}>
        <ChevronRight className='size-4' />
      </SmartLink>
    </nav>
  )
}
