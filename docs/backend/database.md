# Database

## Notion as content source

Notion is the primary content store. Pages and properties are fetched via the Notion API and normalized into the `Post` domain entity. There is no relational schema to migrate; the Notion database structure is documented in [`../user-guide/notion-database.md`](../user-guide/notion-database.md).

## Supabase

Supabase is used for membership / comments features. The client lives in `backend/src/infrastructure/`. Migrations and table definitions are managed in the Supabase dashboard; document schema-affecting changes here.

## ID strategy

- Notion page IDs are used as the canonical content identifier.
- `NotionPageId` value object (in `domain`) handles the `lang:pageId` multi-language prefix format.
