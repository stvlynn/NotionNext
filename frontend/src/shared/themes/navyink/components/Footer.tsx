import { conf } from '../lib/global'
import * as React from 'react'

import { Separator } from '@/components/ui'

/** Minimal footer: wordmark, copyright, and the NotionNext credit line. */
export function Footer() {
  const title = conf<string>('TITLE')
  const author = conf<string>('AUTHOR')
  const since = conf<number | undefined>('SINCE')
  const year = new Date().getFullYear()
  const range = since && since !== year ? `${since} – ${year}` : `${year}`

  return (
    <footer className='mx-auto mt-20 w-full max-w-5xl px-5 pb-10'>
      <Separator className='mb-6' />
      <div className='flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row'>
        <p>
          © {range} {author || title}
        </p>
        <p className='inline-flex items-center gap-1'>
          <span className='inline-block size-3 rounded-[4px] bg-brand' />
          {title}
        </p>
      </div>
    </footer>
  )
}
