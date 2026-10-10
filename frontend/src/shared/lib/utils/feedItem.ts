/**
 * Identity and dates every feed entry carries, shared by the build-time feed
 * (`lib/utils/rss`) and the `/api/rss` fallback so both emit the same shape.
 *
 * JSON Feed 1.1 requires a stable `id`, and `published` becomes the item's
 * `date_published`, which stv.pm reads to list the latest posts.
 */
export function feedItemIdentity(link: string, publishedAt: Date) {
  return {
    id: link,
    link,
    date: publishedAt,
    published: publishedAt
  }
}

/** How many posts every feed lists. */
export const FEED_POST_LIMIT = 20

interface FeedCandidate {
  type?: string | null | undefined
  status?: string | null | undefined
  publishDay?: string | number | Date | null | undefined
  publishDate?: string | number | Date | null | undefined
}

/**
 * The posts a feed lists: published posts, newest *published* first.
 *
 * Feeds must not reuse `latestPosts`, which is ordered by last edit time for
 * the "latest posts" widget: an old post that was edited recently would jump
 * into the feed (and onto stv.pm) while newer posts dropped out.
 */
export function selectFeedPosts<T extends FeedCandidate>(
  pages: readonly T[],
  limit: number = FEED_POST_LIMIT
): T[] {
  const publishedAt = (page: T) =>
    new Date(page.publishDay || page.publishDate || 0).getTime()
  return pages
    .filter(page => page.type === 'Post' && page.status === 'Published')
    .sort((a, b) => publishedAt(b) - publishedAt(a))
    .slice(0, limit)
}
