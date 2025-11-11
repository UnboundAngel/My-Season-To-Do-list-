# File structure

```
My-Season-To-Do-list-
├─ assets/
│  └─ icons/            # SVG artwork for default + seasonal themes
├─ docs/                # Documentation hub (you are here)
├─ app.js               # Core task logic, deck controls, storage, theming
├─ index.html           # Markup shell for the entire interface
├─ styles.css           # Global styles, layout, and theme tokens
└─ README.md            # Project overview and quick start
```

## Key elements

- **`index.html`** builds the spacious two-column layout, stats panel, filters, and card deck overlay.
- **`styles.css`** supplies the professional default theme along with Halloween, Christmas, and Mocking overrides. Holiday flourishes (pumpkin path, snowy floor, neon grid) are encoded via CSS custom properties.
- **`app.js`** manages tasks, filters, local storage persistence, keyboard shortcuts, and the Pokémon-style card flipping.
- **`assets/icons/`** houses favicon-ready SVGs for each theme.
