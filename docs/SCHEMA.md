# Database schema

SQLite only, opened through system `libsqlite3`. Statements live in `backend/src/db.rs` (`SCHEMA` and `INDEXES`). Postgres and MongoDB are not supported.

The file path comes from `backend/config.json` (`./databases/BXClimate.db`).

## Users

```sql
CREATE TABLE IF NOT EXISTS Users (
  _id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  subscription_stripeID TEXT,
  subscription_expires INTEGER,
  subscription_status TEXT,
  usage_count INTEGER DEFAULT 0,
  usage_reset_at INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON Users(email);
```

`created_at` is unix milliseconds (`config::now_ms` at signup). `subscription_expires` and `usage_reset_at` are unix seconds. `subscription_status` is the Stripe status string (`active`, plus canceled and past-due values Stripe sends).

## Auths

```sql
CREATE TABLE IF NOT EXISTS Auths (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  userID TEXT NOT NULL,
  FOREIGN KEY (userID) REFERENCES Users(_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auths_email ON Auths(email);
```

`password` is a scrypt hash. Legacy bcrypt hashes still verify, then rehash.

Signup inserts `Users` and `Auths` in one transaction.

## WebhookEvents

```sql
CREATE TABLE IF NOT EXISTS WebhookEvents (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at INTEGER NOT NULL
);
```

Stripe event ids already in this table are ignored. That is the webhook idempotency key.
