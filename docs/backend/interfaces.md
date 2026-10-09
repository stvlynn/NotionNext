# Interfaces

The `interfaces` layer adapts the application layer to the outside world.

## In NotionNext

The concrete HTTP entry points are Next.js API route handlers in `frontend/src/pages/api/`. Each handler is a thin adapter:

1. Parse and validate the request input.
2. Call an application use case.
3. Format and return the HTTP response.

`backend/src/interfaces/` holds shared adapter helpers used by those route handlers:

- Request validation helpers.
- Response formatting helpers (success/error envelopes).
- Error-to-status-code mapping.

## Existing route handlers

- `frontend/src/pages/api/cache.js`
- `frontend/src/pages/api/rss.ts`
- `frontend/src/pages/api/revalidate.js`
- `frontend/src/pages/api/subscribe.js`
- `frontend/src/pages/api/notion-comments.js`
- `frontend/src/pages/api/user.ts`
- `frontend/src/pages/api/auth/callback/notion.ts`
- `frontend/src/pages/api/claude/contribution-refresh.js`

## Feed contract

The blog publishes RSS 2.0, Atom and JSON Feed 1.1 at `/rss/feed.xml`,
`/rss/atom.xml` and `/rss/feed.json`. They are written as static files at build
time by `lib/utils/rss.tsx`; when a file is missing, `next.config.js` rewrites
the path to `pages/api/rss.ts`. Both generators build each entry with
`lib/utils/feedItem.ts` (`feedItemIdentity`), so every item carries:

- `id` — the post's absolute URL (required by JSON Feed).
- `date_published` / `pubDate` — the post's publish date.

The homepage at https://stv.pm (repository `stvlynn/stv.pm`) reads
`/rss/feed.json` to list the latest posts and fails its build if `id`, `title`,
`url` or `date_published` is missing, so keep these fields stable.

## Rules

- Controllers must be thin: parse input, call an application service, format output.
- No business logic in controllers.
- Input validation happens here, at the boundary.

## Location

`backend/src/interfaces/` (helpers) + `frontend/src/pages/api/` (route handlers).
