describe('post configuration', () => {
  const originalSortOrder = process.env.NEXT_PUBLIC_POST_SORT_BY

  afterEach(() => {
    if (originalSortOrder === undefined) {
      delete process.env.NEXT_PUBLIC_POST_SORT_BY
    } else {
      process.env.NEXT_PUBLIC_POST_SORT_BY = originalSortOrder
    }
    jest.resetModules()
  })

  it('orders posts by publish date by default', () => {
    delete process.env.NEXT_PUBLIC_POST_SORT_BY
    jest.resetModules()

    const config = require('@/conf/post.config')

    expect(config.POSTS_SORT_BY).toBe('date')
  })

  it('preserves an explicit Notion database order', () => {
    process.env.NEXT_PUBLIC_POST_SORT_BY = 'notion'
    jest.resetModules()

    const config = require('@/conf/post.config')

    expect(config.POSTS_SORT_BY).toBe('notion')
  })
})
