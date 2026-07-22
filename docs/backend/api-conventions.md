# API Conventions

## Response format

All API route handlers return a JSON envelope:

```json
{ "code": 0, "message": "ok", "data": {} }
```

On error:

```json
{ "code": <non-zero>, "message": "<human readable>", "data": null }
```

## HTTP status codes

- `200` — success.
- `400` — bad request / validation error.
- `401` — unauthenticated.
- `403` — forbidden.
- `404` — not found.
- `500` — internal error.

## Versioning

NotionNext API routes are currently unversioned. When a breaking change is required, introduce a new route path or a versioned query parameter and document the decision in an ADR under [`docs/decisions/`](../decisions/README.md).

## Validation

Validate at the interface boundary using `zod`. Backend is the source of truth; frontend validation is for UX only.
