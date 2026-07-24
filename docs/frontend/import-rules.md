# Import Rules

## Layer direction

Imports may only go downward:

```
app -> pages -> widgets -> features -> entities -> shared
```

| Layer        | May import from                                  |
|--------------|--------------------------------------------------|
| `app`        | all lower layers                                 |
| `pages`      | `widgets`, `features`, `entities`, `shared`     |
| `widgets`    | `features`, `entities`, `shared`                |
| `features`   | `entities`, `shared`                             |
| `entities`   | `shared`                                         |
| `shared`      | `shared` only (no higher layers)                 |

## Cross-slice rules

- Slices in the same layer may import from each other only through their public API, and only when necessary. Prefer composing at a higher layer.
- Never reach into a slice's internal segments.

## Backend imports

Frontend code may import backend types and use-case entry points through the `@/backend` alias (configured in `frontend/tsconfig.json`). Frontend must not import backend infrastructure internals (Notion client, DB drivers, cache implementations).

Next.js page modules must also keep render-time imports separate from
server-only data dependencies:

- Import browser-safe values and page types from `@/lib/page/runtime`.
- Import Node-only data, cache, feed, and build helpers directly from their
  source module, or from a narrowly scoped server-only compatibility adapter
  such as `@/lib/page/server-data`.
- Use server-only imports exclusively in `getStaticProps`, `getStaticPaths`,
  `getServerSideProps`, and API handlers. Never expose Node-only and
  browser-safe exports from the same barrel.

This separation is required because a broad server barrel used by a page module
can retain unrelated Node-only side effects in the client compilation graph.

## Enforced aliases

- `@/*` → `frontend/src/*`
- `@/components/*` → `frontend/src/shared/components/*`
- `@/lib/*` → `frontend/src/shared/lib/*`
- `@/themes/*` → `frontend/src/shared/themes/*`
- `@/hooks/*` → `frontend/src/shared/hooks/*`
- `@/styles/*` → `frontend/src/app/styles/*`
- `@/pages/*` → `frontend/src/pages/*`
- `@/backend/*` → `backend/src/*`
