'use client'

import NotionPage from '@/components/NotionPage'
import * as React from 'react'

import { useRevealOnScroll } from '../lib/useRevealOnScroll'
import type { Post } from '../types'

/**
 * The Notion body wrapped in the theme's reading typography, with below-the-
 * fold blocks revealed as the reader scrolls (see `useRevealOnScroll`).
 */
export function ArticleBody({ post }: { post: Post }) {
  const ref = React.useRef<HTMLElement>(null)
  useRevealOnScroll(ref, post.id)

  return (
    <section ref={ref} className='navyink-article'>
      <NotionPage post={post} />
    </section>
  )
}
