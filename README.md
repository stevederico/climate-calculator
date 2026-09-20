# BXClimate

EV vs gas and solar vs grid calculators. App name in the UI is Pine.

**Version:** 0.14.0 | **Domain:** [climate.bixbyapps.com](https://climate.bixbyapps.com) | **Railway service:** `BXClimate`

## Tech stack

- React 19, Vite 8, Tailwind 4, `@stevederico/skateboard-ui` 5.1.0
- Skateboard 5.6: zero-crate Rust backend, SQLite through system `libsqlite3`
- Stripe lookup key `climate_monthly`

Postgres, MongoDB, Hono, and Deno are not this app. The 0.11.0 libsql / sqlite-shared move lived in the old JavaScript backend. 0.12.0 replaced that backend with Rust and a local SQLite file.

## Setup

```bash
npm install
npm run start                 # frontend  http://localhost:5173
cd backend && cargo run       # backend   http://localhost:8000
```

Auth and Stripe read `backend/.env` (gitignored). Variables are listed in [docs/DEPLOY.md](docs/DEPLOY.md). `JWT_SECRET` must be at least 32 characters when `NODE_ENV=production`.

## Scripts

- `npm run start` — Vite dev server
- `npm run build` — typecheck, then production frontend build
- `cd backend && cargo test --locked` — backend tests
- `npm run test` — frontend typecheck, script tests, and doc link check

## Routes

Public marketing and legal pages come from skateboard-ui (`/`, `/terms`, `/privacy`, `/subs`, `/eula`).

Authenticated app routes (`constants.json` has `"noLogin": false`):

- `/app/ev` — EV vs gas
- `/app/solar` — solar vs grid

## Deploy

Railway builds `Dockerfile` (`railway.json`). See [docs/DEPLOY.md](docs/DEPLOY.md).

```bash
railway link -p bixby -e production -s BXClimate
railway up
```

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Schema](docs/SCHEMA.md)
- [Deploy](docs/DEPLOY.md)
- [Migration](docs/MIGRATION.md)
