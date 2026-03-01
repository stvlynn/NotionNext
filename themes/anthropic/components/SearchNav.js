import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { useEffect, useRef } from 'react'
import SearchInput from './SearchInput'
import TagItemMini from './TagItemMini'

/**
 * 搜索页导航 - Anthropic 风格
 * 搜索框 + 分类/标签过滤
 */
export default function SearchNav(props) {
  const { tagOptions, categoryOptions } = props
  const cRef = useRef(null)
  const { locale } = useGlobal()

  useEffect(() => {
    cRef?.current?.focus()
  }, [])

  return (
    <div className='space-y-8'>
      {/* 搜索框 */}
      <SearchInput cRef={cRef} {...props} />

      {/* 分类 */}
      {categoryOptions && categoryOptions.length > 0 && (
        <section>
          <h3
            className='ui-text text-xs font-medium uppercase tracking-wider mb-4'
            style={{ color: 'var(--anthropic-text-tertiary)' }}>
            {locale.COMMON.CATEGORY}
          </h3>
          <div className='flex flex-wrap gap-2'>
            {categoryOptions?.map(category => (
              <SmartLink
                key={category.name}
                href={`/category/${category.name}`}
                passHref
                legacyBehavior>
                <div
                  className='tag-pill cursor-pointer transition-all duration-200'>
                  <span className='flex items-center gap-1.5'>
                    <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z' />
                    </svg>
                    {category.name} ({category.count})
                  </span>
                </div>
              </SmartLink>
            ))}
          </div>
        </section>
      )}

      {/* 标签 */}
      {tagOptions && tagOptions.length > 0 && (
        <section>
          <h3
            className='ui-text text-xs font-medium uppercase tracking-wider mb-4'
            style={{ color: 'var(--anthropic-text-tertiary)' }}>
            {locale.COMMON.TAGS}
          </h3>
          <div className='flex flex-wrap gap-2'>
            {tagOptions?.map(tag => (
              <TagItemMini key={tag.name} tag={tag} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
