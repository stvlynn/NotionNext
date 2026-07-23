import SmartLink from '@/components/SmartLink'
import * as React from 'react'

import { Badge } from '@/components/ui'
import { cn } from '@/lib/cn'

interface TagPillProps {
  tag: { name: string; count?: number }
  showCount?: boolean
  className?: string
}

/** Tag chip that links to its tag page. Uses the coss outline badge. */
export function TagPill({ tag, showCount = false, className }: TagPillProps) {
  if (!tag?.name) return null
  return (
    <SmartLink href={`/tag/${encodeURIComponent(tag.name)}`}>
      <Badge
        variant='outline'
        className={cn(
          'cursor-pointer gap-1 transition-colors hover:border-brand hover:text-brand',
          className
        )}>
        {tag.name}
        {showCount && tag.count != null && (
          <span className='text-muted-foreground'>{tag.count}</span>
        )}
      </Badge>
    </SmartLink>
  )
}
