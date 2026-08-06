import SmartLink from '@/components/SmartLink'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import * as React from 'react'

import { cn } from '@/lib/cn'
import {
  buttonVariants,
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from '@/components/ui'

import { useLocale } from '../lib/global'

interface PaginationProps {
  page: number
  totalPage: number
}

/**
 * Numbered pagination composed from the coss pagination primitives. Links
 * render through SmartLink so routing keeps NotionNext's link behavior.
 */
export function Pagination({ page, totalPage }: PaginationProps) {
  const locale = useLocale()
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
    <PaginationRoot className='mt-14' aria-label={locale.PAGINATION.LABEL}>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            rel='prev'
            aria-label={locale.PAGINATION.PREVIOUS}
            render={<SmartLink href={hrefFor(current - 1)} />}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'default' }),
              'max-sm:aspect-square max-sm:p-0',
              current <= 1 && 'pointer-events-none invisible'
            )}
          >
            <ChevronLeftIcon className='sm:-ms-1' />
            <span className='max-sm:hidden'>{locale.PAGINATION.PREVIOUS}</span>
          </PaginationLink>
        </PaginationItem>

        {pages.map((p, i) => {
          const prev = pages[i - 1]
          const gap = prev !== undefined && p - prev > 1
          return (
            <React.Fragment key={p}>
              {gap && (
                <PaginationItem>
                  <PaginationEllipsis className='text-muted-foreground' />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  isActive={p === current}
                  render={<SmartLink href={hrefFor(p)} />}
                  className={cn(
                    buttonVariants({
                      variant: p === current ? 'brand' : 'ghost',
                      size: 'icon'
                    }),
                    'tabular-nums'
                  )}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            </React.Fragment>
          )
        })}

        <PaginationItem>
          <PaginationLink
            rel='next'
            aria-label={locale.PAGINATION.NEXT}
            render={<SmartLink href={hrefFor(current + 1)} />}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'default' }),
              'max-sm:aspect-square max-sm:p-0',
              current >= totalPage && 'pointer-events-none invisible'
            )}
          >
            <span className='max-sm:hidden'>{locale.PAGINATION.NEXT}</span>
            <ChevronRightIcon className='sm:-me-1' />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  )
}
