import { conf } from '../lib/global'
import SmartLink from '@/components/SmartLink'
import * as React from 'react'

/**
 * Wordmark. A small cornflower square anchors the site title in the ink scale.
 */
export function Logo() {
  const title = conf<string>('TITLE')

  return (
    <SmartLink
      href='/'
      aria-label={title}
      className='group inline-flex items-center gap-2.5'>
      <span className='inline-block size-5 rounded-[6px] bg-brand transition-transform duration-200 group-hover:rotate-12' />
      <span className='text-base font-semibold tracking-tight text-foreground'>
        {title}
      </span>
    </SmartLink>
  )
}
