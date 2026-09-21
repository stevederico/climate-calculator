# climate-calculator

EV vs gas and solar vs grid calculators. The UI name is Pine.

**Version:** 0.16.0 | **Domain:** [climate.bixbyapps.com](https://climate.bixbyapps.com)

## Tech stack

From `package.json` and `backend/Cargo.toml`:

- React 19.2, Vite 8.2, Tailwind CSS 4.3, TypeScript 7, Node 24
- `@stevederico/skateboard-ui` 5.1.0, skateboard 5.6.0
- Zero-crate Rust backend (`rust-version` 1.95). SQLite through system `libsqlite3`. Stripe HTTP through system `libcurl`
- Icons from `lucide-react`

No Postgres, no MongoDB, no Hono, no Deno.

## Setup

```bash
npm install
npm run start                 # frontend  http://localhost:5173
cd backend && cargo run       # backend   http://localhost:8000
```

Auth and Stripe read `backend/.env` (gitignored). Variable names are in [docs/DEPLOY.md](docs/DEPLOY.md). `JWT_SECRET` must be at least 32 characters when `NODE_ENV=production`.

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

Production is the Docker image in `Dockerfile` (`railway.json`). See [docs/DEPLOY.md](docs/DEPLOY.md).

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Schema](docs/SCHEMA.md)
- [Deploy](docs/DEPLOY.md)
- [Migration](docs/MIGRATION.md)
