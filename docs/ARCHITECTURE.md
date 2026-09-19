# Architecture

BXClimate is a skateboard 5.6 app. The shell (auth, layout, legal pages, Stripe screens) comes from `@stevederico/skateboard-ui`. This repo owns the two calculators and the config.

## Processes

| Mode | Frontend | Backend |
|------|----------|---------|
| Dev | Vite on `:5173` (`npm run start`) | `cargo run` on `:8000` |
| Prod | Static files in `dist/`, built in the Docker frontend stage | One `skateboard-backend` process on `:8000` serves `/api/*` and `dist/` |

`src/constants.json` sets `backendURL` to `/api` and `devBackendURL` to `http://localhost:8000/api`.

## This app

`src/main.tsx` registers two routes and wraps the shell:

- `EVCalcView` at `ev`
- `SolarCalcView` at `solar`
- `CommandMenu` inside the layout override
- `AnalyticsProvider` as the app wrapper

Calculators are client-side. They do not call a climate API.

## Backend

`backend/` is zero-crate Rust. `Cargo.toml` has an empty `[dependencies]`. SQLite is system `libsqlite3`. Stripe HTTP is system `libcurl`.

`backend/config.json` points at `./databases/BXClimate.db`. That file is gitignored. There is no Postgres, Mongo, or libsql adapter in this tree.

Auth is cookie JWT (HS256). Passwords are scrypt. Old bcrypt hashes still verify. CSRF covers state-changing `/api` calls. Stripe webhooks hit `POST /api/payment`.

CSRF tokens, sign-in lockouts, and the auth rate limiter are in process memory. One Railway instance is the supported shape. Extra instances do not share those counters.

## What 0.12.0 removed

0.11.0 added a libsql adapter and pointed production at the shared sqlite-shared server. 0.12.0 deleted the Hono backend. Production storage is the SQLite file the Rust process opens from `config.json` (or `SKATEBOARD_BACKEND_DIR` in Docker).
