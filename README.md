# Wayhouse Campaign — RPG Companion App repository

This is the standalone RPG Companion App repository for the Wayhouse campaign. It intentionally lives separately from the Obsidian vault at `gh/rpgcompanionapp`. Its app system is `systems/wayhouse-5e2024`, based specifically on the upstream **5e2024** system from `blastervla/rpg-companion-app-systems`.

## First-time setup

1. Install Node.js 20 or newer.
2. Run `npm install` in this folder.
3. Restart or reopen your coding app so it discovers `.mcp.json`.
4. Open this repository in the [RPG Companion Dev Tool](https://rpg-companion.app/dev) or its VS Code extension.

When the Dev Tool asks for the input folder, select this repository's **`systems` folder**—not `systems/wayhouse-5e2024` and not its inner `system` folder. On this machine the correct folder is:

```text
/Users/hilmi/Documents/dnd/gh/rpgcompanionapp/systems
```

## Creating campaign content

Ask the coding assistant to create an item, monster, or encounter for RPG Companion. The repository MCP server exposes `create_item`, `create_monster`, `create_encounter`, and `list_resources`. Output is written to `systems/wayhouse-5e2024/resource_instances`.

After changing content, run:

```sh
npm run validate
```

The original 5e.tools exports remain in `5eTools/`; RPG Companion content is the canonical app-facing copy.

## Publishing for the app

The published repository is `https://github.com/madebyhilmi/dnd-redux`. Use that repository URL in RPG Companion's developer/repository workflow. Keep `systems/wayhouse-5e2024/system` and `systems/wayhouse-5e2024/resource_instances` together.

The inherited system/resource format is subject to the upstream repository's CC BY-NC-SA 4.0 license; local tooling is MIT-compatible.
