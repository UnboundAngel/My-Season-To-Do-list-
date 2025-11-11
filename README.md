# Blood & Shadow Tasks

Seasonally themed task planner built with Vue 3, TypeScript, Pinia, and Vite.
This project ships with a list-first workflow, a collectible-inspired card deck
viewer, opt-in seasonal themes, and local persistence.

## Quick Start

```bash
git clone https://github.com/UnboundAngel/My-Season-To-Do-list-.git
cd My-Season-To-Do-list-
pnpm install
pnpm dev
```

When pnpm finishes installing, open the URL printed by the dev server (default
`http://localhost:5173`). The build and preview scripts are available through
`pnpm build` and `pnpm preview`, respectively, and you can run static type
checks via `pnpm typecheck`.

## Features at a Glance

- Task filtering (all, pending, done, today, upcoming), search, and due-date sorting.
- Create/edit form with priority, category, and due datetime controls.
- Pokémon-style card deck overlay for immersive review with keyboard controls.
- LocalStorage persistence and optional notifications for due-soon / due-now tasks.
- Theme toggle with seasonal palettes, a neon Mocking mode, and Halloween / Christmas overlays.
- Signature neutral-dark base theme with layered glows that stays sleek without seasonal accents.
- Accessible defaults: focus styling, ARIA labels, and reduced-motion support.

## Documentation

Additional documentation lives in [`docs/`](./docs):

- [`docs/README.md`](./docs/README.md) – setup guide and high-level overview.
- [`docs/file-structure.md`](./docs/file-structure.md) – current directory map.
- [`docs/updates.md`](./docs/updates.md) – chronological change log.

Contributions should follow the existing coding style (Composition API with
TypeScript) and keep seasonal/holiday embellishments opt-in through CSS
variables.
