import { useThemeGlobal } from '../lib/global'
import * as React from 'react'

import { FadeIn } from './Motion'
import { SearchInput } from './SearchInput'
import { TagPill } from './TagPill'
import type { CategoryItem, TagItem } from '../types'

interface SearchNavProps {
  tagOptions?: TagItem[]
  categoryOptions?: CategoryItem[]
}

/** Empty-state search page: the input plus tag and category clouds. */
export function SearchNav({ tagOptions = [], categoryOptions = [] }: SearchNavProps) {
  const { locale } = useThemeGlobal()

  return (
    <div className='mx-auto max-w-2xl'>
      <FadeIn>
        <SearchInput />
      </FadeIn>

      {tagOptions.length > 0 && (
        <FadeIn delay={0.05} className='mt-10'>
          <p className='mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground'>
            {locale.COMMON.TAGS}
          </p>
          <div className='flex flex-wrap gap-2'>
            {tagOptions.slice(0, 40).map(tag => (
              <TagPill key={tag.name} tag={tag} showCount />
            ))}
          </div>
        </FadeIn>
      )}

      {categoryOptions.length > 0 && (
        <FadeIn delay={0.1} className='mt-8'>
          <p className='mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground'>
            {locale.COMMON.CATEGORY}
          </p>
          <div className='flex flex-wrap gap-2'>
            {categoryOptions.map(cat => (
              <TagPill
                key={cat.name}
                tag={cat}
                showCount
                className='hover:border-brand'
              />
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  )
}
