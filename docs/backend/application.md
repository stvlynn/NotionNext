# Application

The `application` layer contains use cases and orchestration. It depends only on `domain` and on abstractions defined in `domain`.

## Contents

- **Use cases** — `GetAllPosts`, `GetPostBySlug`, `SyncNotion`, `GetComments`, `Subscribe`, `RefreshClaudeContribution`, `Revalidate`, `GenerateRss`, `GetSitemap`.
- **Application services** — `SiteService` (migrated from `lib/site/site.service.ts`).
- **DTOs** — request/response shapes crossing the interface boundary.
- **Transactions** — orchestration of multiple domain operations and cache writes.

## Rules

- Depends on `domain` only (and abstractions/ports declared in `domain`).
- Declares ports (interfaces) for infrastructure it needs (e.g. `NotionRepository`, `CachePort`).
- No HTTP, no Next.js, no framework-specific code.

## Location

`backend/src/application/`
