# Layers

FSD uses six layers. Each layer has a single responsibility and a strict downward dependency direction.

## `app`

- Application initialization.
- Global providers (theme, router, state store, i18n).
- Global styles and CSS variables.
- Next.js custom app/document/error entries (`_app.js`, `_document.js`, `_error.js`).

**Does not contain:** business logic, reusable UI, or page-specific code.

In NotionNext: `frontend/src/app/` holds `_app`, `_document`, `_error` wiring and global styles (migrated from root `styles/`).

## `pages`

- Page components mapped to URLs (Next.js Pages Router).
- Reading route parameters and passing them down.
- Page-level layout skeleton (header / content / footer).
- Composing widgets and features into a complete screen.

**Does not contain:** reusable UI, business logic, or direct API calls. Keep pages thin.

In NotionNext: `frontend/src/pages/` is also the Next.js routing root.

## `widgets`

- Self-contained UI blocks that belong to a page or a feature.
- Examples: header, sidebar, post list, footer.

**Does not contain:** application-wide state or routing logic.

## `features`

- Complete user scenarios.
- Examples: search, comments, dark mode, AI summary, analytics.

**Does not contain:** generic primitives (those go in `shared`) or domain rules that belong to `entities`.

## `entities`

- Domain data and rules used by the UI.
- Examples: `Post`, `Category`, `Tag`, `Comment`.
- Contains types, factories, validation, and pure functions that operate on the entity.

**Does not contain:** UI, HTTP clients, or framework-specific code.

In NotionNext: `frontend/src/entities/` holds shared types (migrated from root `types/`).

## `shared`

- Reusable primitives and utilities used by any layer.
- Examples: `Button`, `formatDate`, theme tokens, i18n helpers, hooks.

In NotionNext: `frontend/src/shared/` holds the migrated `components/`, `lib/utils`, `lib/lang`, `themes/`, `hooks/`, and `conf/`.

**Does not contain:** business logic or references to specific entities/features.

## Layer dependency direction

Imports can only go downward:

```
app -> pages -> widgets -> features -> entities -> shared
```

`shared` cannot import from any other layer. `entities` cannot import from `features` or above.
