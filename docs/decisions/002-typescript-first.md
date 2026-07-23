# ADR 002: TypeScript-first codebase

## Status

Accepted

## Context

NotionNext already ships with a strict `frontend/tsconfig.json` (`strict`, `noImplicitAny`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) and a small set of TypeScript modules (site application service, navyink theme, a few API routes). The majority of the codebase remains JavaScript (~1200 `.js` files), which blocks the DDD `domain` layer from being “pure TypeScript”, weakens editor feedback, and forces typed modules to cast at JS boundaries.

Incremental migration via `allowJs` is already documented for themes (`docs/frontend/design-system.md`). Completing TypeScript for backend and non-theme frontend is the next step so agents and humans share one typed contract.

## Decision

1. **Backend is TypeScript-only.** All modules under `backend/src/` are authored as `.ts`. The DDD `domain` layer holds entities and value-object types; application and infrastructure import those types instead of duplicating interfaces.
2. **Frontend core is TypeScript-only.** `frontend/src/pages/`, `frontend/src/shared/lib/`, `frontend/src/shared/config/`, `frontend/src/shared/hooks/`, and `frontend/src/shared/components/` use `.ts` / `.tsx`.
3. **Themes migrate theme-by-theme.** Legacy theme directories under `frontend/src/shared/themes/` (except `navyink`, already TypeScript) may remain `.js` under `allowJs` until each theme is converted using `navyink` as the reference (typed facade over `useGlobal` / `siteConfig`).
4. **Keep `allowJs: true` until themes are done.** Do not enable `checkJs` globally; type safety is enforced on `.ts` / `.tsx` files.
5. **Prefer real types over `any`.** When bridging untyped Notion payloads, keep a single explicit cast/facade boundary (same pattern as `themes/navyink/lib/global.ts`).
6. **CJS bootstrap stays JavaScript.** `frontend/blog.config.js`, `frontend/next.config.js`, and the `shared/config/*.config.js` shards they `require` remain CommonJS so Node can load them without a TypeScript runtime. Tiny CJS bridges (`*.cjs`) mirror selected TypeScript helpers (e.g. `pageId`, `buildMode`, `buildEnv`) for those entry points.

## Consequences

- `yarn type-check` covers backend and frontend core with strict options.
- New code must be TypeScript; new JavaScript outside legacy themes is rejected in review.
- Theme PRs can migrate one theme at a time without blocking core work.
- Path aliases in `frontend/tsconfig.json` continue to resolve both `.ts` and remaining theme `.js` modules.

## Alternatives considered

- **Big-bang rename of all themes to `.ts` with pervasive `any`** — rejected; increases noise and weakens the type system without improving safety.
- **Disable `strict` / `noImplicitAny` during migration** — rejected; the project already relies on strict settings for navyink and site types.
- **Enable `checkJs` on all legacy JS** — rejected for now; would surface thousands of errors in unmigrated themes without a clear fix path in one change set.
