# Infrastructure

The `infrastructure` layer implements the abstractions from `domain` using concrete frameworks, databases, and external services.

## Contents

- **Notion client** — `@notionhq/client` + `react-notion-x` data fetching (migrated from `lib/db/notion/`).
- **Site data API** — `lib/db/SiteDataApi.js`.
- **Cache** — multi-layer cache: memory, Vercel, Redis, local file, build session (migrated from `lib/cache/`).
- **Database** — Supabase client (`@supabase/supabase-js`).
- **Build pipeline** — static path generation, prefetch, build env (migrated from `lib/build/`).
- **Plugins** — analytics, comments, mail, AI summary integrations (migrated from `lib/plugins/`).
- **Middleware** — security middleware helpers (migrated from `lib/middleware/`).
- **Configuration** — env validation, site config (migrated from `lib/config/`).
- **Sitemap utilities** — migrated from `lib/sitemap-utils.js`.

## Rules

- Implements ports declared in `domain` or `application`.
- May import frameworks, SDKs, and drivers.
- Must not be imported by `domain`.

## Location

`backend/src/infrastructure/`
