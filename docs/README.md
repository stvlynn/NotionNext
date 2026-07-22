# Documentation

This directory is the single source of truth for how NotionNext is built, organized, and evolved by agents.

## Domain map

- [`project/`](project/README.md) — project overview, goals, architecture, and boundaries.
- [`frontend/`](frontend/README.md) — Feature-Sliced Design (FSD) conventions for the Next.js UI.
- [`backend/`](backend/README.md) — Domain-Driven Design (DDD) layered conventions for the Notion data and API layer.
- [`operations/`](operations/README.md) — local development, CI/CD, and deployment.
- [`quality/`](quality/README.md) — testing strategy and code-review expectations.
- [`decisions/`](decisions/README.md) — architecture decision records (ADRs).

## Existing content

The legacy VitePress documentation site lives alongside this structure and is still authoritative for end-user and contributor guides:

- [`user-guide/`](user-guide/index.md) — end-user documentation and configuration guides.
- [`developer/`](developer/index.md) — developer guides, architecture notes, and runbooks.
- [`community/`](community/PINNED_DISCUSSION_POSTS.zh-CN.md) — community resources.
- [`performance/`](performance/) — performance optimization records.
- [`public/`](public/) — static documentation assets.
- [`DOCUMENTATION_POLICY.md`](DOCUMENTATION_POLICY.md) — documentation contribution policy.

The VitePress site config is at [`../.vitepress/config.mts`](../.vitepress/config.mts).

## How to use this documentation

1. If you are new to the project, read [`project/README.md`](project/README.md) and [`project/architecture.md`](project/architecture.md) first.
2. Before writing frontend code, read [`frontend/README.md`](frontend/README.md).
3. Before writing backend code, read [`backend/README.md`](backend/README.md).
4. Before changing deployment, build, or operational behavior, read [`operations/README.md`](operations/README.md).
5. If you change behavior, architecture, or conventions, update the relevant doc in the same change set.
