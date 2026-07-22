# pages

Next.js Pages Router routing root. Each file maps to a URL. This layer is also the FSD `pages` layer.

## Rules

- Compose widgets and features; read route parameters and pass them down.
- No reusable UI, no business logic, no direct API calls. Keep pages thin.
- API route handlers live in `api/` and act as DDD interface adapters that delegate to `@/backend/application`.
