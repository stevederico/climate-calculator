# Migration

This app is skateboard **5.6.0** with skateboard-ui **5.1.0** (`package.json`). The backend is zero-crate Rust. Do not install Deno, and do not look for `backend/server.js`.

## 0.11.0 to 0.12.0

0.11.0 (Hono) added a libsql adapter and moved production onto sqlite-shared. 0.12.0 deleted that backend.

Current storage is SQLite via system `libsqlite3`, path in `backend/config.json`. Changelog lines for libsql describe the old process, not this tree.

## Later skateboard upgrades

Follow the checklist in [AGENTS.md](../AGENTS.md) (`Migrating 4.x → 5.0`, then the updater):

```bash
node scripts/update-skateboard.js --yes
```

Custom UI stays in `src/components/` and `src/main.tsx`. Custom API behavior stays in `backend/src/routes.rs`. Schema stays in `backend/src/db.rs`.

`version` in `package.json` is this app (0.13.0). `skateboardVersion` is the template pin (5.6.0). They are not the same number.
