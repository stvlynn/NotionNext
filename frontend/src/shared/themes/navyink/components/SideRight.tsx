import { conf } from '../lib/global'
import * as React from 'react'

import CONFIG from '../config'
import type { Post } from '../types'
import { Toc } from './Toc'

interface SideRightProps {
  post?:
    | (Post & { toc?: { id: string; text: string; indentLevel: number }[] })
    | undefined
}

/**
 * Sticky right rail on article pages — currently the table of contents. Only
 * mounts on wide viewports so the reading column stays centred elsewhere.
 */
export function SideRight({ post }: SideRightProps) {
  const showToc = conf('NAVYINK_WIDGET_TOC', true, CONFIG)
  if (!post || !showToc || !post.toc || post.toc.length < 2) return null

  return (
    <aside className='hidden w-56 shrink-0 xl:block'>
      <div className='sticky top-24'>
        <Toc toc={post.toc} />
      </div>
    </aside>
  )
}
