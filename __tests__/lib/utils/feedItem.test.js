import {
  FEED_POST_LIMIT,
  feedItemIdentity,
  selectFeedPosts
} from '@/lib/utils/feedItem'

describe('feedItemIdentity', () => {
  it('gives every entry a stable id and a publish date', () => {
    const date = new Date('2026-09-21T08:00:00.000Z')
    expect(feedItemIdentity('https://blog.stv.pm/hello', date)).toEqual({
      id: 'https://blog.stv.pm/hello',
      link: 'https://blog.stv.pm/hello',
      date,
      published: date
    })
  })
})

describe('JSON Feed output', () => {
  it('includes the id and date_published that stv.pm requires', () => {
    const { Feed } = jest.requireActual('feed')
    const feed = new Feed({
      id: 'https://blog.stv.pm',
      title: 'Blog',
      copyright: ''
    })
    const date = new Date('2026-09-21T08:00:00.000Z')
    feed.addItem({
      ...feedItemIdentity('https://blog.stv.pm/hello', date),
      title: 'Hello'
    })

    const [item] = JSON.parse(feed.json1()).items
    expect(item).toMatchObject({
      id: 'https://blog.stv.pm/hello',
      url: 'https://blog.stv.pm/hello',
      title: 'Hello',
      date_published: '2026-09-21T08:00:00.000Z'
    })
  })
})

describe('selectFeedPosts', () => {
  const post = (id, publishDay, extra = {}) => ({
    id,
    type: 'Post',
    status: 'Published',
    publishDay,
    ...extra
  })

  it('orders by publish date, newest first, ignoring edit time', () => {
    const pages = [
      post('2022', '2022-03-01', { lastEditedDate: Date.parse('2026-10-09') }),
      post('2026', '2026-09-20'),
      post('2025', '2025-01-10')
    ]
    expect(selectFeedPosts(pages).map(p => p.id)).toEqual([
      '2026',
      '2025',
      '2022'
    ])
  })

  it('keeps only published posts', () => {
    const pages = [
      post('draft', '2026-10-01', { status: 'Draft' }),
      post('page', '2026-10-01', { type: 'Page' }),
      post('ok', '2026-01-01')
    ]
    expect(selectFeedPosts(pages).map(p => p.id)).toEqual(['ok'])
  })

  it('falls back to publishDate when publishDay is missing', () => {
    const pages = [
      post('a', undefined, { publishDate: Date.parse('2026-05-01') }),
      post('b', '2026-04-01')
    ]
    expect(selectFeedPosts(pages).map(p => p.id)).toEqual(['a', 'b'])
  })

  it(`lists at most ${FEED_POST_LIMIT} posts`, () => {
    const pages = Array.from({ length: FEED_POST_LIMIT + 5 }, (_, i) =>
      post(String(i), `2026-01-${String(i + 1).padStart(2, '0')}`)
    )
    expect(selectFeedPosts(pages)).toHaveLength(FEED_POST_LIMIT)
  })
})
