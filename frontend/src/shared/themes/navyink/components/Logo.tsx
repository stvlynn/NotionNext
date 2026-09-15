import { conf } from '../lib/global'
import SmartLink from '@/components/SmartLink'
import * as React from 'react'

import { Avatar, AvatarImage } from '@/components/ui'
import { cn } from '@/lib/cn'

import CONFIG from '../config'

/**
 * Wordmark: the navyink mark plus the site title, linking home. The header
 * uses the default size; `compact` is the quieter footer variant.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
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
      className={cn(
        'group inline-flex items-center',
        compact ? 'gap-2' : 'gap-2.5'
      )}
    >
      {/* Decorative mark; accessible name comes from the link aria-label. */}
      <Avatar
        className={cn(
          'rounded-sm transition-transform duration-200 group-hover:rotate-12',
          compact ? 'size-4' : 'size-5'
        )}
      >
        <AvatarImage src={logoSrc} alt='' decoding='async' />
      </Avatar>
      <span
        className={cn(
          'tracking-tight',
          compact
            ? 'text-sm transition-colors group-hover:text-foreground'
            : 'text-base font-semibold text-foreground'
        )}
      >
        {title}
      </span>
    </SmartLink>
  )
}
