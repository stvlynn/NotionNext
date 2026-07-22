# Segments

Inside a slice, code is split into segments by technical role.

## `ui`

React components and styles that render the slice.

## `model`

State management: stores, reducers, selectors, business-state hooks.

## `lib`

Pure helpers and utilities specific to the slice.

## `api`

Requests to the backend and data-fetching hooks.

## `config`

Slice-specific configuration and constants.

## Rules

- A segment may import from other segments **within the same slice**.
- A segment may import from lower layers (`shared`, `entities`) through their public API.
- A segment must not import from a higher layer (`pages`, `widgets`, `app`).
