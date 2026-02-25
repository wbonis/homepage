# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A macOS desktop experience recreated in the browser as a personal portfolio site. Built with **Svelte 5** (runes), **TypeScript**, and **Vite**. Hosted on **Cloudflare Pages** under **https://www.bonis.de**.

- **GitHub:** https://github.com/wbonis/homepage
- **LinkedIn:** https://www.linkedin.com/in/wbonis/

## Contact

- **Private:** bonis@bonis.de
- **Business:** wb@stylite.de

## Commands

```bash
pnpm dev        # Start Vite dev server
pnpm build      # Production build (Terser + Lightning CSS)
pnpm serve      # Preview production build
pnpm check      # Type-check with svelte-check
```

No test runner or linter is configured. Formatting uses Prettier (tabs, single quotes, 100-char width).

## Architecture

**Entry flow:** `index.html` → `src/main.ts` → `Desktop.svelte` → TopBar, WindowsArea, Dock, Wallpaper, BootupScreen

### State (`src/state/`)
All state uses Svelte 5 `$state` runes. Key files:
- `apps.svelte.ts` — open/close, z-index layering, fullscreen, drag state for all app windows
- `preferences.svelte.ts` — theme (light/dark), accent color, wallpaper; persisted to localStorage via `persisted.svelte.ts`
- `dock.svelte.ts` — dock visibility
- `menubar.svelte.ts` — menu configs and notch visibility

### Apps (`src/components/apps/`)
Each app (Finder, Terminal, Calendar, etc.) is a self-contained Svelte component rendered inside a `Window`. App metadata (title, default size, resizability) is defined in `src/configs/apps/apps-config.ts`. `AppNexus.svelte` acts as the app router.

### Configs (`src/configs/`)
- `apps/apps-config.ts` — app definitions
- `menu/` — menu bar and context menu structures
- `theme/colors.config.ts` — accent color HSL values
- `wallpapers/wallpaper.config.ts` — wallpaper definitions

### Actions (`src/actions/`)
Reusable Svelte actions: `click-outside`, `focus-outside`, `elevation`, `trap-focus`, `portal`.

### Helpers (`src/helpers/`)
Small utilities: `create-app-config`, `create-menu-config`, `fade`, `sleep`, `random`.

## Custom Vite Plugins

- **`prefetch-plugin.ts`** — Injects `<link rel="prefetch">` tags for all build chunks (excluding `.webp`) into `index.html` at build time
- **`blog-seo-plugin.ts`** — Fetches blog posts from `https://blog.stylite.de/blog/index.xml` (RSS) at build time, injects them as `<noscript>` HTML for SEO, and generates `sitemap.xml`

## Images

Wallpapers and assets are optimized via `vite-imagetools`. Import images with query params (e.g. `?w=800&format=webp`) to get optimized variants at build time.

## Key Conventions

- **Path alias:** `🍎/*` resolves to `./src/*` (configured in tsconfig and Vite)
- **Svelte 5 runes:** Use `$state`, `$derived`, `$effect` — not legacy stores
- **CSS:** Global custom properties in `src/css/global.css`; component styles are scoped with `s-{hash}` prefix
- **Light/dark mode:** Toggled via `light`/`dark` class on `<body>`
- **Icons:** Via `unplugin-icons` with multiple `@iconify-json/*` icon sets
- **Animations:** Custom spring physics in `state/spring.svelte.ts`; dragging via `@neodrag/svelte`
- **PWA:** Configured via `vite-plugin-pwa` with workbox service worker
- **Node version:** 20 (see `.node-version`)
- **Package manager:** pnpm 10.12.3
- **Browser targets:** `defaults, not IE 11, not IE_Mob 11, not dead` (via browserslist + Lightning CSS)
