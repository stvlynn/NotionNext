import { conf } from '../lib/global'
import SmartLink from '@/components/SmartLink'
import * as React from 'react'

import { Avatar, AvatarImage } from '@/components/ui'

import CONFIG from '../config'

/**
 * Wordmark. The navyink mark anchors the site title in the header.
 */
export function Logo() {
  const title = conf<string>('TITLE')
  const logoSrc = conf<string>(
    'NAVYINK_LOGO',
    '/themes/navyink/logo.jpg',
    CONFIG
  )

  return (
    <SmartLink
      href='/'
      aria-label={title}
      className='group inline-flex items-center gap-2.5'
    >
      {/* Decorative mark; accessible name comes from the link aria-label. */}
      <Avatar className='size-5 rounded-sm transition-transform duration-200 group-hover:rotate-12'>
        <AvatarImage src={logoSrc} alt='' decoding='async' />
      </Avatar>
      <span className='text-base font-semibold tracking-tight text-foreground'>
        {title}
      </span>
    </SmartLink>
  )
}
