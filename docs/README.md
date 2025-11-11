# Project Documentation Hub

Welcome to the documentation bundle for **Blood & Shadow Tasks**. This folder collects
setup notes, architectural references, and update logs so you can keep track of the
seasonal task manager as it evolves.

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/UnboundAngel/My-Season-To-Do-list-.git
   cd My-Season-To-Do-list-
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

   > ℹ️ If `pnpm` is not available on your system yet, install it via `npm install -g pnpm`
   > (or follow the instructions at <https://pnpm.io/installation>). You do **not** need
   > `pip`; pnpm is a Node.js package manager.

3. **Run the development server**
   ```bash
   pnpm dev
   ```
   Then open the printed local URL (default `http://localhost:5173`).

4. **Additional scripts**
   - `pnpm build` – create a production bundle.
   - `pnpm preview` – serve the production build locally.
   - `pnpm typecheck` – run Vue TypeScript checks.

## Project Highlights

- Vue 3 + TypeScript application using the Composition API and Pinia for state.
- LocalStorage persistence, keyboard shortcuts, and accessibility affordances.
- Optional seasonal and holiday themes (including the neon Mocking mode) with CSS variable overrides.
- Card-deck inspired overlay for immersive task browsing.
- Signature dark-mode baseline with layered glows and page-edge sheen on the deck view.

For more details on specific changes, see [`updates.md`](./updates.md). For a quick
reference to the current file layout, open [`file-structure.md`](./file-structure.md).
