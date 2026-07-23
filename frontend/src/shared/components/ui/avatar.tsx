import * as React from 'react'

import { cn } from '@/lib/cn'

/**
 * Lightweight avatar. Renders the image when `src` is provided, otherwise the
 * children (typically initials) on a muted background.
 */
interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string
  alt?: string
}

function Avatar({ className, src, alt = '', children, ...props }: AvatarProps) {
  return (
    <span
      data-slot='avatar'
      className={cn(
        'relative flex size-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground',
        className
      )}
      {...props}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className='size-full object-cover'
          loading='lazy'
        />
      ) : (
        children
      )}
    </span>
  )
}

export { Avatar }
