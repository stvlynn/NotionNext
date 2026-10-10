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
