# Architecture

climate-calculator is a skateboard 5.6 app. The shell (auth, layout, legal pages) comes from `@stevederico/skateboard-ui`. This repo owns the two calculators and the config.

## Processes

| Mode | Frontend | Backend |
|------|----------|---------|
| Dev | Vite on `:5173` (`npm run start`) | `cargo run` on `:8000` |
| Prod | Static files in `dist/`, built in the Docker frontend stage | One `skateboard-backend` process on `:8000` serves `/api/*` and `dist/` |

`src/constants.json` sets `backendURL` to `/api` and `devBackendURL` to `http://localhost:8000/api`.

## This app

`src/main.tsx` registers two routes and overrides the layout:

- `EVCalcView` at `ev`
- `SolarCalcView` at `solar`
- `CommandMenu` inside the layout override

Calculators are client-side. They do not call a climate API.

## Backend

`backend/` is zero-crate Rust. `Cargo.toml` has an empty `[dependencies]`. SQLite is system `libsqlite3`.

`backend/config.json` points at `./databases/BXClimate.db`. That file is gitignored. There is no Postgres, Mongo, or libsql adapter in this tree. Storage is that SQLite file.

Auth is cookie JWT (HS256). Passwords are scrypt. Old bcrypt hashes still verify. CSRF covers state-changing `/api` calls. There is no billing: no checkout, portal, or payment webhook.

CSRF tokens, sign-in lockouts, and the auth rate limiter are in process memory. One Railway instance is the supported shape. Extra instances do not share those counters.
