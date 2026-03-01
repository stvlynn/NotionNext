import SmartLink from '@/components/SmartLink'

/**
 * 博客列表上方嵌入条 - Anthropic 风格
 * 水平可滚动的标签/分类过滤栏
 */
export default function SlotBar(props) {
  const { tag, category } = props

  if (tag) {
    return (
      <div className='mb-6 flex items-center'>
        <SmartLink
          key={tag}
          href={`/tag/${encodeURIComponent(tag)}`}
          passHref
          className='inline-flex items-center gap-2 tag-pill'>
          <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z' />
            <path strokeLinecap='round' strokeLinejoin='round' d='M6 6h.008v.008H6V6z' />
          </svg>
          <span>{tag}</span>
        </SmartLink>
      </div>
    )
  } else if (category) {
    return (
      <div className='mb-6 flex items-center'>
        <span
          className='inline-flex items-center gap-2 text-base ui-text'
          style={{ color: 'var(--anthropic-text-primary)' }}>
          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z' />
          </svg>
          <span className='post-title'>{category}</span>
        </span>
      </div>
    )
  }

  return <></>
}
