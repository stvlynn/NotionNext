# Project

This section describes NotionNext at a high level: what it is, what it is not, and how the major parts fit together.

## Documents

- [`architecture.md`](architecture.md) — system architecture, module boundaries, and data flow.
- [`overview.md`](overview.md) — project overview, goals, and tech stack (migrated from root).

## Project overview

NotionNext is a Next.js application that turns a Notion page into a full-featured blog / CMS website. It uses the Notion API as the content source and renders pages with the Next.js Pages Router.

## Boundaries

The project enforces two architectural boundaries:

- **Frontend** — [`frontend/src/`](../../frontend/src/) structured with [Feature-Sliced Design (FSD)](../frontend/README.md).
- **Backend** — [`backend/src/`](../../backend/src/) structured with [Domain-Driven Design (DDD)](../backend/README.md) layered architecture.

The Next.js API route handlers in `frontend/src/pages/api/` act as the HTTP interface adapters and delegate to the backend application layer.

## What belongs here

- Project goals and non-goals.
- High-level architecture and module relationships.
- Technology-stack decisions.
- Cross-cutting concerns that touch both frontend and backend.

## What does not belong here

- Detailed layer rules (those live in [`frontend/`](../frontend/README.md) and [`backend/`](../backend/README.md)).
- Operational procedures (those live in [`operations/`](../operations/README.md)).
- Testing or code-review policy (those live in [`quality/`](../quality/README.md)).
