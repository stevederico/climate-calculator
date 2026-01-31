# BXClimate

Climate and weather tracking application.

**Version:** 0.5.3 | **Domain:** [climate.bixbyapps.com](https://climate.bixbyapps.com) | **Railway Service:** `bxclimate`

## Tech Stack

- React 19.2, Vite 7.1, skateboard-ui 1.2.19
- Hono backend, SQLite database
- Tailwind CSS v4

## Setup

```bash
deno install
deno run start    # Frontend :5173 + Backend :8000
```

## Scripts

- `deno run start` — Development (frontend + backend)
- `deno run build` — Production build
- `deno run prod` — Deploy to Railway

## Routes

**Public:** `/`, `/terms`, `/privacy`, `/subs`, `/eula`
**Protected:** `/app/*` (authentication required)

## Deploy

```bash
railway link -p bixby -e production -s bxclimate
railway up
```
