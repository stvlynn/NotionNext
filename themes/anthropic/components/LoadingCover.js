/**
 * 加载状态 - Anthropic 风格
 * 优雅的波浪脉冲动画，使用 accent 色
 * 替代简单 pulse，改用交错的 scaleY 波浪效果
 */
export default function LoadingCover() {
  return (
    <div
      id='loading-cover'
      className='flex-grow flex flex-col items-center justify-center w-full min-h-screen'>
      {/* 波浪脉冲加载指示器 */}
      <div className='flex items-end space-x-1' style={{ height: '24px' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <span
            key={i}
            className='loading-dot rounded-full'
            style={{
              width: '3px',
              height: '16px',
              backgroundColor: 'var(--anthropic-accent)',
              animationDelay: `${i * 120}ms`,
              transformOrigin: 'center bottom'
            }}
          />
        ))}
      </div>
    </div>
  )
}
