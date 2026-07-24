# Domain

The `domain` layer contains business rules. It has no dependencies on frameworks, databases, or transport details.

## Contents

- **Entities** — `Post`, `BasePage` / `NavPage`, `Category`, `Tag`, `Comment`, `SiteConfig`, `SiteData` (see `backend/src/domain/entities/`).
- **Value objects** — `Slug`, `LangPrefix`, `NotionPageId`, `CacheKey` (see `backend/src/domain/value-objects/`).
- **Aggregates** — `Post` aggregate (post + its tags + category).
- **Domain services** — pure helpers on value objects (e.g. slug / Notion page ID / cache-key helpers).
- **Domain events** — (reserved) `PostPublished`, `CommentReceived`.

## Rules

- No imports from `application`, `infrastructure`, or `interfaces`.
- No framework imports (no `next`, no `react`, no Notion SDK, no DB drivers).
- Only pure TypeScript types and functions.

## Location

`backend/src/domain/`

Public API: `backend/src/domain/index.ts`.

Application DTOs such as `FetchSiteParams` stay in `backend/src/application/site/site.types.ts`. Overlapping site page/site-data types are defined in `domain` and re-exported from `site.types.ts` for backward compatibility.
