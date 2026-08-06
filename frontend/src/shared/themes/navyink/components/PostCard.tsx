import LazyImage from '@/components/LazyImage'
import { conf } from '../lib/global'
import SmartLink from '@/components/SmartLink'
import { ArrowUpRight } from 'lucide-react'
import * as React from 'react'

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui'
import CONFIG from '../config'
import type { Post } from '../types'
import { Lift, StaggerItem } from './Motion'
import { TagPill } from './TagPill'

interface PostCardProps {
  post: Post
  index?: number
}

/**
 * Article card composed on the coss Card primitives: cover (or a flat muted
 * placeholder), meta line, title, summary, tags. The whole card is a link; it
 * lifts on hover and the arrow slides out to signal affordance. Enter
 * animation is provided by the parent stagger list.
 */
export function PostCard({ post, index = 0 }: PostCardProps) {
  const showCover = conf('NAVYINK_POST_LIST_COVER', true, CONFIG)
  const showSummary = conf('NAVYINK_POST_LIST_SUMMARY', true, CONFIG)
  if (!post) return null

  const hasCover = showCover && post.pageCoverThumbnail

  return (
    <StaggerItem className='h-full'>
      <Lift className='h-full'>
        <SmartLink
          href={post.href || `/${post.slug || ''}`}
          className='group block h-full rounded-2xl'
        >
          <Card className='h-full overflow-hidden transition-shadow duration-300 group-hover:shadow-md'>
            {showCover && (
              <div className='relative aspect-[16/10] overflow-hidden'>
                {hasCover ? (
                  <LazyImage
                    priority={index < 3}
                    alt={post.title}
                    src={post.pageCoverThumbnail}
                    className='size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
                  />
                ) : (
                  <div className='flex size-full items-center justify-center bg-muted p-6'>
                    <span className='line-clamp-3 text-center text-lg font-semibold leading-snug text-foreground/80'>
                      {post.title}
                    </span>
                  </div>
                )}
              </div>
            )}

            <CardContent className='flex flex-1 flex-col gap-3 p-5'>
              <div className='flex items-center gap-2 font-mono text-xs text-muted-foreground'>
                {post.date?.start_date && <span>{post.date.start_date}</span>}
                {post.category && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{post.category}</span>
                  </>
                )}
              </div>

              <CardTitle
                render={<h2 />}
                className='flex items-start justify-between gap-2 leading-snug tracking-tight text-foreground'
              >
                <span className='transition-colors group-hover:text-brand'>
                  {post.title}
                </span>
                <ArrowUpRight className='mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-[transform,opacity] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100' />
              </CardTitle>

              {showSummary && post.summary && (
                <CardDescription className='line-clamp-3 leading-relaxed'>
                  {post.summary}
                </CardDescription>
              )}

              {post.tagItems && post.tagItems.length > 0 && (
                <div className='mt-auto flex flex-wrap gap-1.5 pt-2'>
                  {post.tagItems.slice(0, 3).map(tag => (
                    <TagPill key={tag.name} tag={tag} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </SmartLink>
      </Lift>
    </StaggerItem>
  )
}
