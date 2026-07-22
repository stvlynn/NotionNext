# ADR 001: Adopt the agentic-coding FSD/DDD project structure

## Status

Accepted

## Context

NotionNext grew from a flat Next.js layout (`components/`, `lib/`, `themes/`, `hooks/`, `conf/`, `pages/`) into a large codebase with ~95 components, 29 themes, and many utility modules. The flat structure makes it hard to reason about layer boundaries, increases coupling between UI and data layers, and gives coding agents no documented conventions to follow.

The `agentic-coding` template provides a language-agnostic project skeleton with two enforced boundaries: Feature-Sliced Design (FSD) for the frontend and Domain-Driven Design (DDD) layered architecture for the backend, plus a structured `docs/` tree and agent guidelines (`AGENTS.md` / `CLAUDE.md`).

## Decision

Reorganize NotionNext to match the agentic-coding structure:

- Move the Next.js application into `frontend/src/` organized into FSD layers (`app`, `pages`, `widgets`, `features`, `entities`, `shared`).
- Move the Notion data, caching, and API logic into `backend/src/` organized into DDD layers (`domain`, `application`, `infrastructure`, `interfaces`).
- Add the agentic-coding `docs/` subdomains, `deploy/` assets, `AGENTS.md`, `CLAUDE.md`, `Makefile`, `.claude/`, and a unified CI workflow.
- Migrate the legacy root-level documentation into the new `docs/` tree.

Next.js Pages Router auto-detects `src/pages/`, so `frontend/src/pages/` doubles as the routing root and the FSD `pages` layer. Legacy path aliases are remapped in `frontend/tsconfig.json` / `frontend/jsconfig.json` so existing imports keep resolving during the transition.

## Consequences

- The directory tree matches the agentic-coding template, giving agents a documented structure.
- Existing imports keep resolving via remapped aliases, reducing migration risk.
- New code should follow FSD/DDD import rules; legacy aliases are a transitional shim.
- The repository becomes a yarn workspaces monorepo (`frontend/`, `backend/`).

## Alternatives considered

- **Keep the flat structure** — rejected; does not match the requested template and offers no documented boundaries.
- **Adopt only the meta-structure (docs, deploy, AGENTS.md) without moving code** — rejected; the user requested a full physical migration.
