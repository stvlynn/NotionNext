jest.mock('@/lib/page/server-data', () => ({
  fetchGlobalAllData: jest.fn(),
  getPostBlocks: jest.fn()
}))

jest.mock('@/lib/page/runtime', () => ({
  siteConfig: jest.fn((key, fallback) =>
    key === 'POSTS_PER_PAGE' ? 12 : fallback
  ),
  staticPropsResult: jest.fn(props => ({ props, revalidate: 60 }))
}))

jest.mock('@/lib/utils/notion.util', () => ({
  adapterNotionBlockMap: jest.fn(value => value)
}))

jest.mock('@/lib/db/notion/getPostBlocks', () => ({
  formatNotionBlock: jest.fn(value => value)
}))

jest.mock('@/themes/theme', () => ({
  DynamicLayout: () => null
}))

const { fetchGlobalAllData } = require('@/lib/page/server-data')

describe('paginated post routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('blocks the first request until an ungenerated page is ready', async () => {
    fetchGlobalAllData.mockResolvedValue({
      postCount: 25,
      NOTION_CONFIG: {}
    })

    const { getStaticPaths } = require('@/pages/page/[page]')
    const result = await getStaticPaths({ locale: 'zh-CN' })

    expect(result).toEqual({
      paths: [{ params: { page: '2' } }, { params: { page: '3' } }],
      fallback: 'blocking'
    })
  })
})
