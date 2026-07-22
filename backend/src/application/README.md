# application

Use cases and orchestration. Depends only on `domain` and abstractions.

## Contents

- `build/` — build pipeline orchestration (static paths, prefetch, build env). Migrated from legacy `lib/build/`.
- `site/` — site service, adapters, processors, typed collections. Migrated from legacy `lib/site/`.

## Rules

- Depends on `domain` only (and ports declared in `domain`).
- No HTTP, no Next.js, no framework-specific code.
