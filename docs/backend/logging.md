# Logging

## Approach

- Use `console` with the existing themed console style helpers (migrated to `backend/src/infrastructure` from `lib/themeConsoleStyle.js`).
- Log levels: `error`, `warn`, `info`, `debug`. Control verbosity via `LOG_LEVEL`.
- Avoid logging in hot render paths on the client.

## Masking

- Never log secrets, tokens, or full Notion page content.
- Mask `NOTION_PAGE_ID`, Clerk secrets, Supabase keys, and Redis URLs.

## Tracing

- Cache and build operations log a `cache_key_path` for traceability (migrated from `lib/cache/cache_key_path.js`).
