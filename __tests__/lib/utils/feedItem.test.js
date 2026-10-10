import { feedItemIdentity } from '@/lib/utils/feedItem'

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
