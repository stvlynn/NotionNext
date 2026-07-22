# Slices

A slice is a grouping of code that changes together. Each layer (except `app` and `shared` at the top level) is divided into slices by business domain.

## Naming

Use kebab-case nouns for slices:

```
features/
  search/
  comments/
  dark-mode/
entities/
  post/
  category/
  tag/
  comment/
```

## Structure of a slice

A slice contains segments (`ui`, `model`, `lib`, `api`, `config`) and exposes a public API through `index.ts`:

```
features/search/
  ui/
  model/
  api/
  lib/
  config/
  index.ts
```

## When to create a new slice

- When a new user scenario is added (a new feature).
- When a new domain concept is introduced (a new entity).
- When a group of files changes together and is independent of existing slices.

## When not to create a slice

- For a single utility function — put it in `shared/lib`.
- For a single UI primitive — put it in `shared/ui`.
