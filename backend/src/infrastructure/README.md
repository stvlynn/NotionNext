# infrastructure

Concrete implementations of domain/application ports using frameworks, databases, and external services.

## Contents

- `db/` — Notion data fetching (`SiteDataApi`, notion client). Migrated from legacy `lib/db/`.
- `cache/` — multi-layer cache (memory, Vercel, Redis, local file, build session). Migrated from legacy `lib/cache/`.
- `claude/` — Claude API integration. Migrated from legacy `lib/server/claude/`.
- `middleware/` — security middleware helpers. Migrated from legacy `lib/middleware/`.
- `env-config/` — environment variable validation. Migrated from legacy `lib/config/`.

## Rules

- Implements ports declared in `domain` or `application`.
- May import frameworks, SDKs, and drivers.
- Must not be imported by `domain`.
