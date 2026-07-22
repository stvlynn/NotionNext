import { useGlobal } from '@/lib/global'
import throttle from 'lodash.throttle'
import { uuidToId } from 'notion-utils'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 目录导航组件 - Anthropic 风格
 * 左侧细线指示器，accent 色高亮当前章节
 * sticky 定位
 */
const Catalog = ({ toc }) => {
  const { locale } = useGlobal()

  useEffect(() => {
    window.addEventListener('scroll', actionSectionScrollSpy)
    actionSectionScrollSpy()
    return () => {
      window.removeEventListener('scroll', actionSectionScrollSpy)
    }
  }, [])

  const tRef = useRef(null)
  const tocIds = []

  const [activeSection, setActiveSection] = useState(null)

  const throttleMs = 200
  const actionSectionScrollSpy = useCallback(
    throttle(() => {
      const sections = document.getElementsByClassName('notion-h')
      let prevBBox = null
      let currentSectionId = activeSection
      for (let i = 0; i < sections.length; ++i) {
        const section = sections[i]
        if (!section || !(section instanceof Element)) continue
        if (!currentSectionId) {
          currentSectionId = section.getAttribute('data-id')
        }
        const bbox = section.getBoundingClientRect()
        const prevHeight = prevBBox ? bbox.top - prevBBox.bottom : 0
        const offset = Math.max(150, prevHeight / 4)
        if (bbox.top - offset < 0) {
          currentSectionId = section.getAttribute('data-id')
          prevBBox = bbox
          continue
        }
        break
      }
      setActiveSection(currentSectionId)
      const index = tocIds.indexOf(currentSectionId) || 0
      tRef?.current?.scrollTo({ top: 28 * index, behavior: 'smooth' })
    }, throttleMs)
  )

  if (!toc || toc.length < 1) {
    return <></>
  }

  return (
    <div className='py-3'>
      {/* 标题 */}
      <div
        className='ui-text text-xs font-medium uppercase tracking-wider mb-3 px-4'
        style={{ color: 'var(--anthropic-text-tertiary)' }}>
        {locale.COMMON.TABLE_OF_CONTENTS}
      </div>

      {/* 目录列表 */}
      <div
        className='overflow-y-auto max-h-[50vh] overscroll-none scroll-hidden'
        ref={tRef}>
        <nav className='relative'>
          {/* 左侧引导线 */}
          <div
            className='absolute left-0 top-0 bottom-0 w-px'
            style={{ backgroundColor: 'var(--anthropic-border)' }}
          />

          {toc.map(tocItem => {
            const id = uuidToId(tocItem.id)
            tocIds.push(id)
            const isActive = activeSection === id

            return (
              <a
                key={id}
                href={`#${id}`}
                className={`block relative pl-4 py-1.5 text-sm transition-all duration-200 hover:text-[var(--anthropic-accent)]
                  notion-table-of-contents-item-indent-level-${tocItem.indentLevel} catalog-item`}
                style={{
                  color: isActive ? 'var(--anthropic-accent)' : 'var(--anthropic-text-secondary)'
                }}>
                {/* 活跃指示器 */}
                {isActive && (
                  <span
                    className='absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full transition-all duration-300'
                    style={{ backgroundColor: 'var(--anthropic-accent)' }}
                  />
                )}

                <span
                  style={{
                    display: 'inline-block',
                    marginLeft: tocItem.indentLevel * 12,
                    fontSize: tocItem.indentLevel > 0 ? '0.8125rem' : '0.875rem'
                  }}
                  className={`truncate ${isActive ? 'font-medium' : 'font-normal'}`}>
                  {tocItem.text}
                </span>
              </a>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default Catalog
