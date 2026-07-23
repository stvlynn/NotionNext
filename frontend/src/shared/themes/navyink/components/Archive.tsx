import SmartLink from '@/components/SmartLink'
import * as React from 'react'

import type { Post } from '../types'

/** One archive group (e.g. a month) with its posts as a dated list. */
export function ArchiveGroup({
  archiveTitle,
  posts
}: {
  archiveTitle: string
  posts: Post[]
}) {
  return (
    <section className='mb-10'>
      <h2 className='mb-4 font-mono text-sm font-semibold uppercase tracking-widest text-muted-foreground'>
        {archiveTitle}
      </h2>
      <ul className='space-y-1 border-l border-border'>
        {posts.map(post => (
          <li key={post.id}>
            <SmartLink
              href={post.href || `/${post.slug || ''}`}
              className='group -ml-px flex items-baseline gap-4 border-l-2 border-transparent py-2 pl-4 transition-colors hover:border-brand'>
              <span className='w-14 shrink-0 font-mono text-xs text-muted-foreground'>
                {post.date?.start_date?.slice(5) || post.lastEditedDay}
              </span>
              <span className='text-foreground transition-colors group-hover:text-brand'>
                {post.title}
              </span>
            </SmartLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
