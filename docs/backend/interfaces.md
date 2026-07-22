# Interfaces

The `interfaces` layer adapts the application layer to the outside world.

## In NotionNext

The concrete HTTP entry points are Next.js API route handlers in `frontend/src/pages/api/`. Each handler is a thin adapter:

1. Parse and validate the request input.
2. Call an application use case.
3. Format and return the HTTP response.

`backend/src/interfaces/` holds shared adapter helpers used by those route handlers:

- Request validation helpers.
- Response formatting helpers (success/error envelopes).
- Error-to-status-code mapping.

## Existing route handlers

- `frontend/src/pages/api/cache.js`
- `frontend/src/pages/api/rss.js`
- `frontend/src/pages/api/revalidate.js`
- `frontend/src/pages/api/subscribe.js`
- `frontend/src/pages/api/notion-comments.js`
- `frontend/src/pages/api/user.ts`
- `frontend/src/pages/api/auth/callback/notion.ts`
- `frontend/src/pages/api/claude/contribution-refresh.js`

## Rules

- Controllers must be thin: parse input, call an application service, format output.
- No business logic in controllers.
- Input validation happens here, at the boundary.

## Location

`backend/src/interfaces/` (helpers) + `frontend/src/pages/api/` (route handlers).
