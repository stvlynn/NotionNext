# Backend

This section defines how the backend is organized using **Domain-Driven Design (DDD)** layered architecture.

The backend lives in [`backend/src/`](../../backend/src/). NotionNext's backend is the Notion data, caching, and API logic layer that powers the Next.js API routes.

## Documents

- [`domain.md`](domain.md) — entities, value objects, aggregates, domain services, and domain events.
- [`application.md`](application.md) — use cases, application services, transactions, and DTOs.
- [`infrastructure.md`](infrastructure.md) — persistence, external services, messaging, and configuration.
- [`interfaces.md`](interfaces.md) — HTTP/CLI/event adapters, controllers, and input validation.
- [`api-conventions.md`](api-conventions.md) — response format, error codes, and versioning.
- [`database.md`](database.md) — database, migrations, and ID strategy.
- [`logging.md`](logging.md) — logging, tracing, and masking.

## Quick start

1. Read [`domain.md`](domain.md) to understand where business rules live.
2. Read [`application.md`](application.md) before adding a new use case.
3. Read [`interfaces.md`](interfaces.md) before adding a controller or handler.
4. Read [`api-conventions.md`](api-conventions.md) before designing an endpoint.

## Next.js API routes as interfaces

The actual HTTP entry points are Next.js API route handlers in `frontend/src/pages/api/`. They are thin interface adapters that parse input, call a backend application use case, and format the HTTP response. The DDD `interfaces` layer in `backend/src/interfaces/` holds shared adapter helpers (validation, response formatting) used by those route handlers.

## Core principle

Business rules are isolated in the `domain` layer. All other layers depend on `domain` through abstractions. Infrastructure implements those abstractions. Interfaces adapt the application to the outside world.
