Project Nexus - To-Do — README
A seasonal, professional to-do app with optional Pokémon-style card view, advanced UI animations, and a clean list-first workflow. Built with TypeScript + Vite + Vue 3 for speed and maintainability. Seasonal skins (Spring, Summer, Autumn, Winter) swap colors, icons, and micro-interactions. Holiday packs (Halloween, Christmas, Lunar New Year, etc.) plug in later without touching core logic.

Why this exists
Popular apps nail focus and polish. This project borrows the good parts:


Motion/Sunsama/Akiflow: schedule-aware focus, tidy daily view


Linear: keyboard-driven speed, subtle animations


Superlist/Routine/Amie/Morgen/Todoist/TickTick: predictable list UX with low friction


And skips the bloat and heavy upkeep (Notion, Trello boards for everything, over-automated schedulers).

Features


List-first UI: filters (All, Pending, Done, Today, Upcoming), search-as-you-type, sort by due date/priority.


Task cards (optional): click any task to open a card deck with a page-turn flip animation. Navigate with click/Space/←/→/Esc.


Seasonal themes: four core themes with matching icons and micro-interactions. Toggle auto by system date or manual switch.


Holiday packs (extensible): overlays and icon swaps (e.g., lanterns for Autumn/Halloween, lights for Winter/Christmas).


Local persistence (default): localStorage. Swappable data layer for IndexedDB or a backend later.


Desktop notifications: due soon + due now (permission-gated).


Keyboard shortcuts: / focus search, N new task, Ctrl/Cmd+Enter quick add, Esc exit modals/deck.


A11y: focus rings, ARIA landmarks/labels, prefers-reduced-motion fallbacks.


Zero-framework lock-in: all themes and animations are modular; card view can be removed without breaking the list.



Tech Stack


Runtime: Vue 3 (Composition API) + TypeScript


Build: Vite


Styling: CSS variables + PostCSS (optional Tailwind preset)


State: Pinia (small, typed store)


Animations: CSS + WAAPI; GPU-friendly transforms only


Icons: SVG sprites per season; app favicon shipped as icon.svg



Quick Start
# 1) Create the project
pnpm create vite blood-shadow-tasks --template vue-ts
cd blood-shadow-tasks

# 2) Install deps
pnpm i

# 3) Add UI libs (optional)
pnpm add pinia

# 4) Start dev
pnpm dev
# open http://localhost:5173

# 5) Build
pnpm build
pnpm preview


Project Structure
blood-shadow-tasks/
├─ index.html
├─ vite.config.ts
├─ src/
│  ├─ main.ts                 # boot Vue/Pinia, apply theme
│  ├─ App.vue                 # layout + routes (single-page)
│  ├─ stores/tasks.ts         # Pinia store (typed Task[])
│  ├─ components/
│  │  ├─ TaskList.vue         # professional list UI
│  │  ├─ TaskRow.vue          # single row + actions
│  │  ├─ TaskEditor.vue       # create/edit form
│  │  ├─ CardDeck.vue         # Pokémon-style flip deck
│  │  └─ StatsBar.vue         # total/done/today/productivity
│  ├─ styles/
│  │  ├─ base.css             # resets, tokens, utilities
│  │  ├─ themes/
│  │  │  ├─ spring.css
│  │  │  ├─ summer.css
│  │  │  ├─ autumn.css
│  │  │  └─ winter.css
│  │  └─ holidays/
│  │     ├─ halloween.css
│  │     └─ christmas.css
│  ├─ icons/
│  │  ├─ spring.svg  summer.svg  autumn.svg  winter.svg
│  │  ├─ halloween.svg  christmas.svg
│  │  └─ favicon/icon.svg
│  └─ utils/
│     ├─ storage.ts           # localStorage / IndexedDB adapters
│     ├─ dates.ts             # due date helpers
│     └─ notify.ts            # Notification API wrapper
└─ README.md


Data Model (TypeScript)
export type Priority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  name: string;
  desc?: string;
  priority: Priority;
  category?: string;
  due?: string;       // ISO datetime, local user TZ
  done: boolean;
  createdAt: number;  // epoch ms
  updatedAt?: number;
  completedAt?: number;
}


Core UX


Default view: clean list, predictable focus order, no confetti.


Card view: optional overlay for single-task focus with deck flipping.


Season toggle: auto by month or user setting; theme writes CSS variables.


Holiday overlays: enabled if within holiday window or user toggled.



Animations


List row enter: 120–180 ms fade+translateY


Card flip: 600 ms 3D Y-rotation, transform: translateZ(0) to avoid paint


Focus rings: 2 px accent outline, no box-shadow blur for clarity


Prefers-reduced-motion: disables flips; uses crossfade



Theming
Each season CSS defines the same token set:
:root {
  --bg: #0b0c11;
  --panel: #111420;
  --edge: #20263a;
  --ink: #e8eaf6;
  --muted: #a8b0c9;
  --accent: #4f46e5;   /* swapped per season */
  --accent2: #22c55e;  /* swapped per season */
}

Holiday packs overlay only deltas (extra accents, small icon swaps, micro-FX). No layout changes.

Accessibility


Keyboard complete: search, add, edit, mark done, deck navigation


ARIA: role=list, role=listitem, labelled buttons, dialog semantics for CardDeck


Color contrast ≥ WCAG AA on all themes


Motion-safe: @media (prefers-reduced-motion: reduce)



Scripts
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "vue-tsc --noEmit"
  }
}

Run pnpm typecheck in CI.

Configuration


Notifications: user permission required. “Due soon” (5 min) and “Due now.”


Storage adapter: swap localStorage with IndexedDB by changing createStorage() in utils/storage.ts.


Theme selection: App.vue applies data-theme="winter" or html.classList.add('halloween'). Persist in localStorage.



Keyboard Shortcuts


/ focus search


N focus task name


Ctrl/Cmd + Enter add task


Space or → next card in deck


← previous card


Esc close deck/editor



Roadmap


Calendar strip for “Today/Next 7 days”


Quick capture (global hotkey)


Recurring tasks (RRULE light)


Subtasks and checklists


i18n


Backend sync adapter (REST/SQLite/Serverless)


Holiday content: Halloween bats/wax drips, Christmas lights, autumn leaves, spring petals



Design Guidelines


Professional default: neutral palette, tight spacing, minimal ornament


Seasonal fun is optional and never disrupts task density/readability


All icons are SVG, single-color tintable via CSS where possible


Animations are additive; app functions identically with them off



Development Tips


Prefer composables for logic (useTasks, useTheme, useDeck)


Keep flip animation isolated inside CardDeck.vue


Never couple storage format to UI; migrations live in storage.ts


Do not store Date objects; always ISO strings or epoch numbers



License
N/A

Credits / Inspiration


Motion, Sunsama, Akiflow, Linear, Superlist, Routine, Amie, Morgen Calendar, Todoist, TickTick — for focus and pacing ideas.


CSS/WAAPI patterns adapted and simplified for reliability and performance.



FAQ
Why Vue 3 + Vite + TypeScript?
Fast HMR, small mental overhead, strong types, easy theming, and zero runtime surprises.
Do I need the card deck?
No. It’s optional. Remove CardDeck.vue and related routes without touching the list.
Can I disable all seasonal/holiday stuff?
Yes. Default theme is professional. Toggle off seasonal packs in settings or build without /styles/themes and /styles/holidays.
Where’s the icon?
The icon is right in the main! It’s used for the favicon and downloadable as an app asset.
