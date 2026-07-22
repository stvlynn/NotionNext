import SmartLink from '@/components/SmartLink'

/**
 * 标签小徽章 - Anthropic 风格
 * 药丸形状，mono 字体，大写
 * hover 时 accent 色边框和文字
 */
const TagItemMini = ({ tag, selected = false }) => {
  return (
    <SmartLink
      key={tag}
      href={selected ? '/' : `/tag/${encodeURIComponent(tag.name)}`}
      passHref
      className={`tag-pill cursor-pointer inline-block ${
        selected
          ? 'border-[var(--anthropic-accent)] text-[var(--anthropic-accent)]'
          : ''
      }`}>
      <span className='font-normal'>
        {selected && <span className='mr-0.5'>#</span>}
        {tag.name}
        {tag.count ? ` (${tag.count})` : ''}
      </span>
    </SmartLink>
  )
}

export default TagItemMini
