import { conf } from '../lib/global'
import SmartLink from '@/components/SmartLink'
import * as React from 'react'

import { Separator } from '@/components/ui'
import CONFIG from '../config'
import { Logo } from './Logo'

/**
 * Minimal footer: copyright on one side, the wordmark on the other. The
 * author's name links to their homepage when one is configured.
 */
export function Footer() {
  const title = conf<string>('TITLE')
  const author = conf<string>('AUTHOR')
  const aboutUrl = conf<string>(
    'NAVYINK_ABOUT_URL',
    CONFIG.NAVYINK_ABOUT_URL,
    CONFIG
  )
  const since = conf<number | undefined>('SINCE')
  const year = new Date().getFullYear()
  const range = since && since !== year ? `${since} – ${year}` : `${year}`

  return (
    <footer className='mx-auto mt-20 w-full max-w-5xl px-5 pb-10'>
      <Separator className='mb-6' />
      <div className='flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row'>
        <p>
          © {range}{' '}
          {aboutUrl ? (
            <SmartLink
              href={aboutUrl}
              className='transition-colors hover:text-foreground'
            >
              {author || title}
            </SmartLink>
          ) : (
            author || title
          )}
        </p>
        <Logo compact />
      </div>
    </footer>
  )
}
