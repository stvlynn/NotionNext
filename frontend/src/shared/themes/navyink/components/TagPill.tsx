import SmartLink from '@/components/SmartLink'
import * as React from 'react'

import { cn } from '@/lib/cn'

/** Sigil that marks a tag, the way it is written in a post. */
const TAG_SIGIL = '#'

interface TagPillProps {
  tag: { name: string; count?: number }
  showCount?: boolean
  className?: string
  /** Categories are the same link without the tag sigil. */
  kind?: 'tag' | 'category'
  /** Override the link target; defaults to the tag page. */
  href?: string
}

/**
 * Tag link. Chrome-free: the sigil and the muted colour carry the meaning,
 * so a row of tags reads as text rather than as a row of buttons.
 */
export function TagPill({
  tag,
  showCount = false,
  className,
  kind = 'tag',
  href
}: TagPillProps) {
  if (!tag?.name) return null
  return (
    <SmartLink
      href={href ?? `/tag/${encodeURIComponent(tag.name)}`}
      className={cn(
        'inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-brand',
        className
      )}
    >
      <span>
        {kind === 'tag' && (
          <span aria-hidden className='mr-0.5 opacity-70'>
            {TAG_SIGIL}
          </span>
        )}
        {tag.name}
      </span>
      {showCount && tag.count != null && (
        <span className='tabular-nums opacity-60'>{tag.count}</span>
      )}
    </SmartLink>
  )
}
