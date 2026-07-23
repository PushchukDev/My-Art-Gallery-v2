# My Art Gallery

**My Art Gallery** — a client-only scroll exhibition of original drawings, built with **Svelte 5**, **TypeScript**, and **Vite**. No backend, no API keys.

Explore the art through **Tunnel**, **Drift**, **Film**, and **Gallery** presets. Ambient audio and a music-reactive backdrop are optional. Choice of explore mode is saved in `localStorage`.

## Scripts

```bash
npm install
npm run dev          # local server (base path "/")
npm run build        # production build
npm run preview      # preview production build
npm run check        # svelte-check
npm run optimize:images   # PNG → WebP in src/assets/images/
```

## Explore presets

- **Tunnel** — 3D Z-corridor (scroll snaps between pieces)
- **Drift** — vertical fade / parallax
- **Film** — front-arc carousel (wheel / keys / drag)
- **Gallery** — grid with click-to-zoom

With `prefers-reduced-motion`, Tunnel and Film are disabled and **Drift** is used.

Art list: [`src/lib/data/pieces.ts`](src/lib/data/pieces.ts).  
Tunnel sequence: [`src/lib/data/gallery.ts`](src/lib/data/gallery.ts).

## Assets (private)

Images and audio are **not** committed here. They live in a private assets repo and are copied in by CI before build.

| Local path | Private repo folder |
|------------|---------------------|
| `src/assets/images/*.webp` | `images/` |
| `static/media/*.mp3` | `media/` |

**Actions secrets** (Settings → Secrets → Actions):

| Secret | Value |
|--------|--------|
| `ASSETS_REPO` | `owner/private-assets-repo` |
| `ASSETS_TOKEN` | Fine-grained PAT with Contents: Read on that repo |

For local preview, copy those folders from the private repo into this project (gitignored), then `npm run dev`.

If assets are missing: image placeholders + a notice; sound control disables.

## GitHub Pages

Live site: **https://PushchukDev.github.io/My-Art-Gallery/**

1. Push to `main` (workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
2. Repo **Settings → Pages → Source: GitHub Actions**
3. Site URL: `https://PushchukDev.github.io/My-Art-Gallery/`

The workflow fetches private assets, builds with `GITHUB_PAGES=true` (`base: /My-Art-Gallery/`), and publishes `dist`.

Local Pages-like build (assets already present locally):

```powershell
$env:GITHUB_PAGES='true'; npm run build
```

## Stack

- Svelte 5 (runes) + TypeScript
- Vite 6
- Web Audio (ambient + reactive backdrop)
- GitHub Pages (Actions deploy)

## Credit

© Vadym Pushchuk / @Push_Art
