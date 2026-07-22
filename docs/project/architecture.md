# Architecture

> High-level system architecture. Update this file when the project grows or when major modules are added.

## Overview

NotionNext follows a clean separation between:

- **Frontend** — a Next.js 14 (Pages Router) + React 18 application structured with [Feature-Sliced Design (FSD)](../frontend/README.md), living in [`frontend/src/`](../../frontend/src/).
- **Backend** — the Notion data, caching, and API logic structured with [Domain-Driven Design (DDD)](../backend/README.md) layered architecture, living in [`backend/src/`](../../backend/src/).

The two sides communicate through well-defined contracts. The backend exposes use cases in the `application` layer; the Next.js API route handlers in `frontend/src/pages/api/` are thin interface adapters that call those use cases and format HTTP responses.

## Context diagram

```text
+-----------+        HTTP (Next.js API routes)   +-----------------------------+
|  Browser  |  ------------------------------>  |  frontend/src/pages/api/*    |
|  (FSD UI) |  <-----------------------------  |  (interface adapters)       |
+-----------+                                  +-----------------------------+
                                                            |
                                                            v
                                             +-----------------------------+
                                             |  backend/src/application    |
                                             |  (use cases / services)      |
                                             +-----------------------------+
                                                            |
                                                            v
                                             +-----------------------------+
                                             |  backend/src/domain          |
                                             |  (entities / value objects)  |
                                             +-----------------------------+
                                                            ^
                                                            |
                                             +-----------------------------+
                                             |  backend/src/infrastructure  |
                                             |  (Notion API, Supabase, Redis)|
                                             +-----------------------------+
```

## Module boundaries

| Module | Responsibility | Example |
|--------|----------------|---------|
| `frontend/src/app` | Application setup, global providers, global styles | `_app`, `_document`, theme providers |
| `frontend/src/pages` | Next.js routing + page composition | `/`, `/page/[slug]`, `/archive` |
| `frontend/src/widgets` | Self-contained UI blocks composed of features | header, footer, post list |
| `frontend/src/features` | End-to-end user scenarios | search, comments, dark mode |
| `frontend/src/entities` | Domain data and rules used by the UI | `Post`, `Category`, `Tag`, `Comment` |
| `frontend/src/shared` | Reusable primitives, utilities, config | UI components, `lib/utils`, themes, hooks |
| `backend/src/interfaces` | Transport adapters (thin HTTP handlers) | route handler wrappers |
| `backend/src/application` | Use-case orchestration | `GetAllPosts`, `SyncNotion`, `GetComments` |
| `backend/src/domain` | Business rules | `Post`, `NotionPage`, `Comment` models |
| `backend/src/infrastructure` | Concrete implementations | Notion client, Supabase, Redis cache |

## Cross-cutting concerns

- **Authentication / authorization** — Clerk (`@clerk/nextjs`) for the dashboard and member features.
- **Caching** — multi-layer cache in `backend/src/infrastructure` (memory, Vercel, Redis, local file).
- **i18n** — language prefixes (`zh`, `en`, ...) handled in routing and `lib/lang`.
- **Error handling** — centralized in `frontend/src/shared/lib` and backend application services.
- **Validation** — backend validates at the interface boundary; frontend validates for immediate UX feedback.

## Technology stack

- Runtime: Node.js 22
- Frontend framework: Next.js 14 (Pages Router) + React 18
- Styling: Tailwind CSS 3
- Content source: Notion API (`@notionhq/client`, `react-notion-x`)
- Database / auth: Supabase (`@supabase/supabase-js`), Clerk
- Cache: memory-cache, ioredis, Vercel edge cache
- Search: Algolia
- Hosting: Vercel (default), also Docker / Cloudflare / Netlify
