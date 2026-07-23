import LazyImage from '@/components/LazyImage'
import { conf } from '../lib/global'
import SmartLink from '@/components/SmartLink'
import { ArrowUpRight } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/cn'
import CONFIG from '../config'
import type { Post } from '../types'
import { Lift, StaggerItem } from './Motion'
import { TagPill } from './TagPill'

/** Ink-tinted placeholder covers, used when a post has no cover image. */
const PLACEHOLDER_TINTS = [
  'from-corn-400/25 to-corn-600/10',
  'from-ink-400/20 to-ink-600/10',
  'from-corn-300/25 to-ink-500/10',
  'from-ink-300/20 to-corn-500/10'
]

interface PostCardProps {
  post: Post
  index?: number
}

/**
 * Article card: cover (or tinted placeholder), meta line, title, summary, tags.
 * The whole card is a link; it lifts on hover and the arrow slides out to
 * signal affordance. Enter animation is provided by the parent stagger list.
 */
export function PostCard({ post, index = 0 }: PostCardProps) {
  const showCover = conf('NAVYINK_POST_LIST_COVER', true, CONFIG)
  const showSummary = conf('NAVYINK_POST_LIST_SUMMARY', true, CONFIG)
  if (!post) return null

  const hasCover = showCover && post.pageCoverThumbnail
  const tint = PLACEHOLDER_TINTS[index % PLACEHOLDER_TINTS.length]

  return (
    <StaggerItem className='h-full'>
      <Lift className='h-full'>
        <SmartLink
          href={post.href || `/${post.slug || ''}`}
          className='group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-md'>
          {showCover && (
            <div className='relative aspect-[16/10] overflow-hidden'>
              {hasCover ? (
                <LazyImage
                  priority={index < 3}
                  alt={post.title}
                  src={post.pageCoverThumbnail}
                  className='size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]'
                />
              ) : (
                <div
                  className={cn(
                    'flex size-full items-center justify-center bg-gradient-to-br p-6',
                    tint
                  )}>
                  <span className='line-clamp-3 text-center text-lg font-semibold leading-snug text-foreground/80'>
                    {post.title}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className='flex flex-1 flex-col gap-3 p-5'>
            <div className='flex items-center gap-2 font-mono text-xs text-muted-foreground'>
              {post.date?.start_date && <span>{post.date.start_date}</span>}
              {post.category && (
                <>
                  <span aria-hidden>·</span>
                  <span>{post.category}</span>
                </>
              )}
            </div>

            <h2 className='flex items-start justify-between gap-2 text-lg font-semibold leading-snug tracking-tight text-foreground'>
              <span className='transition-colors group-hover:text-brand'>
                {post.title}
              </span>
              <ArrowUpRight className='mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100' />
            </h2>

            {showSummary && post.summary && (
              <p className='line-clamp-3 text-sm leading-relaxed text-muted-foreground'>
                {post.summary}
              </p>
            )}

            {post.tagItems && post.tagItems.length > 0 && (
              <div className='mt-auto flex flex-wrap gap-1.5 pt-2'>
                {post.tagItems.slice(0, 3).map(tag => (
                  <TagPill key={tag.name} tag={tag} />
                ))}
              </div>
            )}
          </div>
        </SmartLink>
      </Lift>
    </StaggerItem>
  )
}
