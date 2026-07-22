# interfaces

Transport adapters that adapt the application layer to the outside world.

## HTTP entry points

In NotionNext the concrete HTTP entry points are the Next.js API route handlers in [`frontend/src/pages/api/`](../../../frontend/src/pages/api/). Each handler is a thin adapter that parses input, calls a backend application use case, and formats the HTTP response.

## http/

Shared adapter helpers (request validation, response envelopes, error-to-status mapping) used by the route handlers will live here as the DDD migration progresses.

See [`docs/backend/interfaces.md`](../../../docs/backend/interfaces.md).
