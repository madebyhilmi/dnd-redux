# Wayhouse RPG Companion workflow

This is a standalone RPG Companion App resource-pack repository, separate from the Obsidian campaign vault. All app content targets and merges into the canonical D&D 2024 `5e2024` system; do not change the upstream system ID or version and do not create legacy 2014 (`5e`) resources.

When creating or changing an item, monster, or encounter:

1. Treat `systems/5e2024/system/resources/<resource_id>/stats.rpgs` as the schema.
2. Store app content in `systems/5e2024/resource_instances/` as `.rpg.json`.
3. Prefer the `wayhouse-rpg-companion` MCP tools. They create stable IDs, timestamps, nested resources, and safe filenames.
4. Use the source ID `wayhouse_campaign` for original campaign content.
5. Never silently overwrite an instance. Pass `overwrite: true` only when the requested change is intentional.
6. Run `npm run validate` after edits. Run `npm run format` only after validation succeeds.
7. Every stat is `{ "value": ... }`; `stats.id` is the one exception and is a plain string.
8. Nested resources need their own `stats.id` and `stats.updated_at.value`.
9. If removing nested array entries from an existing resource, add their IDs to the stat's `remove_ids` array so the app sync removes them.
10. Keep `systems/_stdlib/` alongside the system. The upstream 2024 RPG Script files import these shared macros and the Dev Tool build will fail without them.

The current system is based on the upstream 5e2024 system. Do not copy copyrighted rulebook text into original campaign resources unless the user supplied or authored it.
