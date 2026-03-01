import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'

/**
 * 数字翻页 - Anthropic 风格
 * 简洁分页，accent 色高亮当前页
 */
const PaginationNumber = ({ page, totalPage }) => {
  const router = useRouter()
  const currentPage = +page
  const showNext = page < totalPage
  const pagePrefix = router.asPath
    .split('?')[0]
    .replace(/\/page\/[1-9]\d*/, '')
    .replace(/\/$/, '')
    .replace('.html', '')
  const pages = generatePages(pagePrefix, page, currentPage, totalPage)

  return (
    <div className='mt-12 mb-6 flex justify-center items-center space-x-1 ui-text'>
      {/* 上一页 */}
      <SmartLink
        href={{
          pathname:
            currentPage === 2
              ? `${pagePrefix}/`
              : `${pagePrefix}/page/${currentPage - 1}`,
          query: router.query.s ? { s: router.query.s } : {}
        }}
        rel='prev'
        className={`${currentPage === 1 ? 'invisible' : 'block'} w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-200 text-sm hover:bg-[var(--anthropic-border)]`}
        style={{ color: 'var(--anthropic-text-secondary)' }}>
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
        </svg>
      </SmartLink>

      {pages}

      {/* 下一页 */}
      <SmartLink
        href={{
          pathname: `${pagePrefix}/page/${currentPage + 1}`,
          query: router.query.s ? { s: router.query.s } : {}
        }}
        rel='next'
        className={`${+showNext ? 'block' : 'invisible'} w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-200 text-sm hover:bg-[var(--anthropic-border)]`}
        style={{ color: 'var(--anthropic-text-secondary)' }}>
        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
        </svg>
      </SmartLink>
    </div>
  )
}

function getPageElement(page, currentPage, pagePrefix) {
  const selected = page + '' === currentPage + ''
  return (
    <SmartLink
      href={page === 1 ? `${pagePrefix}/` : `${pagePrefix}/page/${page}`}
      key={page}
      passHref
      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm transition-all duration-200 ${
        selected
          ? 'font-medium text-white'
          : 'hover:bg-[var(--anthropic-border)]'
      }`}
      style={
        selected
          ? { backgroundColor: 'var(--anthropic-accent)' }
          : { color: 'var(--anthropic-text-secondary)' }
      }>
      {page}
    </SmartLink>
  )
}

function generatePages(pagePrefix, page, currentPage, totalPage) {
  const pages = []
  const groupCount = 7
  if (totalPage <= groupCount) {
    for (let i = 1; i <= totalPage; i++) {
      pages.push(getPageElement(i, page, pagePrefix))
    }
  } else {
    pages.push(getPageElement(1, page, pagePrefix))
    const dynamicGroupCount = groupCount - 2
    let startPage = currentPage - 2
    if (startPage <= 1) {
      startPage = 2
    }
    if (startPage + dynamicGroupCount > totalPage) {
      startPage = totalPage - dynamicGroupCount
    }
    if (startPage > 2) {
      pages.push(
        <span
          key={-1}
          className='w-8 h-8 flex items-center justify-center text-sm'
          style={{ color: 'var(--anthropic-text-tertiary)' }}>
          ...
        </span>
      )
    }
    for (let i = 0; i < dynamicGroupCount; i++) {
      if (startPage + i < totalPage) {
        pages.push(getPageElement(startPage + i, page, pagePrefix))
      }
    }
    if (startPage + dynamicGroupCount < totalPage) {
      pages.push(
        <span
          key={-2}
          className='w-8 h-8 flex items-center justify-center text-sm'
          style={{ color: 'var(--anthropic-text-tertiary)' }}>
          ...
        </span>
      )
    }
    pages.push(getPageElement(totalPage, page, pagePrefix))
  }
  return pages
}

export default PaginationNumber
