# Domain

The `domain` layer contains business rules. It has no dependencies on frameworks, databases, or transport details.

## Contents

- **Entities** — `Post`, `NotionPage`, `Category`, `Tag`, `Comment`, `SiteConfig`.
- **Value objects** — `Slug`, `LangPrefix`, `NotionPageId`, `CacheKey`.
- **Aggregates** — `Post` aggregate (post + its tags + category).
- **Domain services** — pure functions operating on entities (e.g. `extractLangPrefix`, `parseNotionPageId`).
- **Domain events** — (reserved) `PostPublished`, `CommentReceived`.

## Rules

- No imports from `application`, `infrastructure`, or `interfaces`.
- No framework imports (no `next`, no `react`, no Notion SDK, no DB drivers).
- Only pure TypeScript types and functions.

## Location

`backend/src/domain/`
