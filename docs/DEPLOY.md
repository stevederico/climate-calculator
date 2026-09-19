# Deployment

Production is a Docker image on Railway. `railway.json` sets the builder to `Dockerfile`. Do not deploy this app to Vercel, Render, or Netlify. Those guides were leftover from the old Hono template.

## Image

The Dockerfile has three stages:

1. `node:24-bookworm-slim` runs `npm run build` and writes `dist/`.
2. `rust:bookworm` runs `cargo build --release --locked`.
3. `debian:bookworm-slim` runs `skateboard-backend` as user `skateboard`, with `libsqlite3` and `libcurl`.

The image listens on port 8000. Health check: `GET /api/health`.

A `.env` file in the build context fails the frontend stage on purpose. Secrets belong in the host environment, not the image.

```bash
docker build -t bxclimate .
docker run --rm -p 8000:8000 --env-file backend/.env bxclimate
```

## Railway

Project `bixby`, environment `production`, service `BXClimate`, domain [climate.bixbyapps.com](https://climate.bixbyapps.com).

```bash
railway link -p bixby -e production -s BXClimate
railway up
```

## Environment

Set these on the service. Names match `backend/src/state.rs` and `backend/src/config.rs`.

| Variable | Required in production | Role |
|----------|------------------------|------|
| `NODE_ENV` | yes (`production`) | Refuses to boot if `JWT_SECRET` is missing, short, or still the example placeholder |
| `JWT_SECRET` | yes, 32+ characters | HS256 signing key |
| `STRIPE_KEY` | yes for checkout | Stripe secret key |
| `STRIPE_ENDPOINT_SECRET` | yes for webhooks | `POST /api/payment` signature |
| `FRONTEND_URL` | yes | Stripe success and cancel redirects |
| `CORS_ORIGINS` | when the browser origin is not the same host | Comma-separated allow list |
| `PORT` | no | Listen port. Default 8000 |
| `FREE_USAGE_LIMIT` | no | Free-tier monthly cap. Default 20 |
| `SKATEBOARD_BACKEND_DIR` | set by the image | Directory that holds `config.json`. Image sets `/app/backend` |

Stripe product lookup key in `src/constants.json` is `climate_monthly`.

Webhook endpoint: `https://climate.bixbyapps.com/api/payment`

Events the backend handles:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## Database

SQLite only. `backend/config.json`:

```json
{
  "staticDir": "../dist",
  "database": {
    "db": "BXClimate",
    "dbType": "sqlite",
    "connectionString": "./databases/BXClimate.db"
  }
}
```

`*.db` is gitignored. On Railway, persist `backend/databases/` or the process starts empty after each deploy.
