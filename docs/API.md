# API

All routes are under `/api`. Dispatch is the `match` at the top of `backend/src/routes.rs`. There is no `GET /api/isSubscriber`. Subscriber state is a field on `POST /api/usage` only, not on `GET /api/me`.

## Auth

JWT in an HttpOnly cookie. State-changing requests send `X-CSRF-Token`.

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | `/api/signup` | no | Create `Users` + `Auths`, set cookies |
| POST | `/api/signin` | no | Verify password, set cookies. Lockout returns 429 |
| POST | `/api/signout` | cookie + CSRF | Clear cookies |
| GET | `/api/me` | cookie | Profile, subscription, usage. No `isSubscriber` field |
| PUT | `/api/me` | cookie + CSRF | Update name |
| POST | `/api/usage` | cookie + CSRF | Body `operation`: `check` or `track` |
| POST | `/api/checkout` | cookie + CSRF | Body: `email`, `lookup_key`. Only keys listed in `src/constants.json` are accepted (`climate_monthly`) |
| POST | `/api/portal` | cookie + CSRF | Stripe customer portal |
| POST | `/api/payment` | Stripe signature | Webhook. Not a browser call |
| GET | `/api/health` | no | Process up |

Unknown `/api/*` paths return 404. Other paths fall through to the static frontend.

## Signup body

```json
{ "name": "Ada", "email": "ada@example.com", "password": "long-enough-password" }
```

Duplicate email returns 400 and does not say that the email exists.

## Usage body

```json
{ "operation": "check" }
```

`track` increments the free-tier counter. Subscribers (`subscription_status` `active` and not expired) get `remaining: -1` and `isSubscriber: true`. Everyone else is capped by `FREE_USAGE_LIMIT` (default 20) per 30-day window. Over the cap, `track` returns 429.

## Production secrets

`JWT_SECRET`, `STRIPE_KEY`, and `STRIPE_ENDPOINT_SECRET` come from the environment. See [DEPLOY.md](DEPLOY.md). Do not commit them.
