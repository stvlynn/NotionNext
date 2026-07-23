import { CalendarDays, FolderOpen } from 'lucide-react'
import SmartLink from '@/components/SmartLink'
import * as React from 'react'

import { Separator } from '@/components/ui'
import type { Post } from '../types'
import { FadeIn } from './Motion'
import { TagPill } from './TagPill'

/** Article masthead: category, title, date, and tags above the Notion body. */
export function ArticleInfo({ post }: { post: Post }) {
  if (!post) return null
  return (
    <FadeIn className='mx-auto max-w-3xl pb-6' y={12}>
      {post.category && (
        <SmartLink
          href={`/category/${post.category}`}
          className='mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-opacity hover:opacity-75'>
          <FolderOpen className='size-3.5' />
          {post.category}
        </SmartLink>
      )}

      <h1 className='text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl'>
        {post.title}
      </h1>

      <div className='mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground'>
        {post.date?.start_date && (
          <span className='inline-flex items-center gap-1.5'>
            <CalendarDays className='size-4' />
            {post.date.start_date}
          </span>
        )}
      </div>

      {post.tagItems && post.tagItems.length > 0 && (
        <div className='mt-4 flex flex-wrap gap-1.5'>
          {post.tagItems.map(tag => (
            <TagPill key={tag.name} tag={tag} />
          ))}
        </div>
      )}

      <Separator className='mt-6' />
    </FadeIn>
  )
}
