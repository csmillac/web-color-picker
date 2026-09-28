# WP Palette Generator

A browser-based color palette generator for WordPress sites built on the **Kadence** and **Ollie** block themes. Pick a single seed/brand color and instantly get a full, accessible theme color palette — ready to drop into `theme.json` as WordPress CSS custom properties.

Live demo: https://csmillac.github.io/web-color-picker/

## What it does

The app has two modes, one per theme system:

### Kadence mode
- Generates Kadence's 14-slot global palette (`palette1`–`palette14`) from a single seed color.
- Choose an accent harmony: Monochromatic, Analogous, Triadic, or Split Complement.
- Choose a background style: cool neutral gray, warm neutral gray, or a subtle tint derived from the seed hue.
- Produces a full contrast scale (strongest → subtle text), base backgrounds, and fixed notice colors (success/warning/error/info).
- Shows a WCAG contrast badge (AAA / AA / AA Large / Fail) on every swatch.

### Ollie mode
- Generates Ollie's 11-color system: 4 brand colors (Brand, Brand Accent, Brand Alt, Brand Alt Accent) + 7 neutrals (Contrast, Contrast Accent, Base, Base Accent, Tint, Border Base, Border Contrast).
- Supports Light and Dark theme variants from the same brand input.
- Includes five built-in brand presets (Default, Agency, Creator, Startup, Studio).
- Renders a live mini site mockup (nav, hero, service cards, CTA section, footer) so you can see the palette in context before using it.
- Includes a contrast checker comparing key color pairs against WCAG AA.

### Shared features
- Click any swatch to copy its hex value to the clipboard.
- "Copy CSS Vars" copies a ready-to-paste `:root { --wp--preset--color--... }` block.
- "Export JSON" downloads the palette as a `theme.json`-style color array.

## Tech stack

- [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) — no external UI or color libraries; all HSL/RGB conversion, contrast ratio (WCAG luminance), and palette math is hand-rolled in [`src/App.jsx`](src/App.jsx).

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

Other scripts:

```bash
npm run build    # production build to dist/
npm run preview  # preview the production build locally
```

## Deployment

Pushes to `main` automatically build and deploy to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## Credits

The Ollie palette structure follows the [Ollie Color System](https://olliewp.com/docs/ollie-block-theme/ollie-color-palette/) docs.
