//! HTTP route handlers — zero-crate port of `backend/server.ts`.
//!
//! One function per route. Status codes, JSON error bodies, and cookie
//! attributes match the Node server so a parity harness can byte-diff them.

use std::collections::BTreeMap;

use crate::auth::{self, JwtError, JwtPayload, TOKEN_EXPIRATION_DAYS};
use crate::config;
use crate::crypto::{self, ct_eq};
use crate::db::{self, AuthRecord, Subscription, Usage, User, UserQuery};
use crate::http::{Cookie, Request, Response, SameSite};
use crate::json::{self, Json};
use crate::kdf;
use crate::middleware;
use crate::state::AppState;
use crate::stores::CSRF_TOKEN_EXPIRY_MS;
use crate::validation;

/// Dispatch one request: CORS, security headers, routes, access log.
pub fn handle(state: &AppState, req: Request) -> Response {
    let start = config::now_ms();
    middleware::dev_request_log(&state.log, &req, state.prod);
    let res = if req.method.eq_ignore_ascii_case("OPTIONS") {
        middleware::preflight(&req, &state.cors_origins)
    } else {
        let inner = dispatch(state, &req);
        let inner = middleware::apply_secure_headers(inner, state.prod);
        middleware::apply_cors(inner, &req, &state.cors_origins)
    };
    middleware::access_log(&req.method, &req.path, res.status, config::now_ms() - start);
    res
}

fn dispatch(state: &AppState, req: &Request) -> Response {
    match (req.method.as_str(), req.path.as_str()) {
        ("GET", "/api/health") => health(state),
        ("GET", "/api/__integration_error_test__") if config::env("NODE_ENV").as_deref() == Some("test") => {
            unhandled(state, req, "Intentional integration test error")
        }
        ("POST", "/api/signup") => signup(state, req),
        ("POST", "/api/signin") => signin(state, req),
        ("POST", "/api/signout") => signout(state, req),
        ("GET", "/api/me") => me_get(state, req),
        ("PUT", "/api/me") => me_put(state, req),
        ("POST", "/api/usage") => usage(state, req),
        (m, p) if p.starts_with("/api/") => {
            if m == "GET" || m == "HEAD" {
                not_found()
            } else {
                not_found()
            }
        }
        ("GET" | "HEAD", _) => static_or_spa(state, req),
        _ => not_found(),
    }
}

/// Liveness plus a real database round-trip, so a container healthcheck fails when
/// SQLite is unreachable instead of reporting a process that cannot serve anything.
fn health(state: &AppState) -> Response {
    let (status, database) = match state.pool.ping() {
        Ok(()) => (200, "connected"),
        Err(e) => {
            state
                .log
                .error("Health check database probe failed", &[("error", json::s(e.to_string()))]);
            (503, "unavailable")
        }
    };
    json_res(
        status,
        &json::obj([
            ("status", json::s(if status == 200 { "ok" } else { "degraded" })),
            ("database", json::s(database)),
            ("timestamp", json::i(config::now_ms())),
        ]),
    )
}

fn not_found() -> Response {
    Response::text(404, "404 Not Found")
}

fn json_res(status: u16, v: &Json) -> Response {
    Response::json(status, &json::stringify(v))
}

fn err_json(status: u16, msg: &str) -> Response {
    json_res(status, &json::obj([("error", json::s(msg))]))
}

fn unhandled(state: &AppState, req: &Request, message: &str) -> Response {
    let request_id = middleware::request_id();
    let mut meta: Vec<(&str, Json)> = vec![
        ("message", json::s(message)),
        ("path", json::s(req.path.clone())),
        ("method", json::s(req.method.clone())),
        ("requestId", json::s(request_id)),
    ];
    if !state.prod {
        meta.push(("stack", Json::Null));
    }
    state.log.error("Unhandled error occurred", &meta);
    if state.prod {
        err_json(500, "Internal server error")
    } else {
        json_res(500, &json::obj([("error", json::s(message))]))
    }
}

fn parse_json_body(req: &Request) -> Result<Json, Response> {
    json::parse(&req.body).map_err(|_| err_json(400, "Invalid request body"))
}

fn generate_csrf_token() -> Result<String, Response> {
    crypto::random_bytes(32)
        .map(|b| crypto::hex_encode(&b))
        .map_err(|_| err_json(500, "Server error"))
}

fn generate_uuid() -> Result<String, Response> {
    crypto::random_uuid_v4().map_err(|_| err_json(500, "Server error"))
}

fn generate_token(state: &AppState, user_id: &str) -> Result<String, Response> {
    let Some(secret) = state.jwt_secret.as_deref() else {
        state.log.error(
            "Token generation error",
            &[("error", json::s("JWT_SECRET not configured - authentication disabled"))],
        );
        return Err(err_json(500, "Server error"));
    };
    Ok(auth::jwt_sign(
        &JwtPayload {
            user_id: user_id.to_string(),
            exp: Some(auth::token_expire_timestamp(TOKEN_EXPIRATION_DAYS)),
        },
        secret,
    ))
}

fn require_auth(state: &AppState, req: &Request) -> Result<String, Response> {
    let Some(secret) = state.jwt_secret.as_deref() else {
        return Err(err_json(503, "Authentication service unavailable"));
    };
    let Some(token) = req.cookie("token") else {
        return Err(err_json(401, "Unauthorized"));
    };
    match auth::jwt_verify(&token, secret) {
        Ok(p) => Ok(p.user_id),
        Err(JwtError::Expired) => {
            state.log.debug("Token expired", &[]);
            Err(err_json(401, "Token expired"))
        }
        Err(e) => {
            state.log.error(
                "Token verification error",
                &[("error", json::s(format!("{e:?}")))],
            );
            Err(err_json(401, "Invalid token"))
        }
    }
}

/// CSRF check for a state-changing request.
///
/// A token that is missing, mismatched, unknown to the store, or expired is
/// refused with 403. The refusal carries a freshly minted token as a cookie
/// whenever the caller's identity is known, so a client whose token was lost —
/// the in-memory store does not survive a restart — can retry once and succeed.
///
/// Deliberately *not* done here: accepting the request and regenerating the
/// token on a store miss. That turns every post-restart request into a free
/// pass, because the stored token is what the header is checked against.
///
/// # Errors
/// A 403 [`Response`], ready to return, with a replacement cookie when one
/// could be issued.
fn require_csrf(state: &AppState, req: &Request, user_id: &str) -> Result<(), Response> {
    if req.method == "GET" || req.path == "/api/signup" || req.path == "/api/signin" {
        return Ok(());
    }
    let csrf_header = req.header("x-csrf-token");
    if csrf_header.is_none() || user_id.is_empty() {
        state.log.info(
            "CSRF validation failed - missing token or userID",
            &[
                ("hasToken", Json::Bool(csrf_header.is_some())),
                ("hasUserID", Json::Bool(!user_id.is_empty())),
                ("path", json::s(req.path.clone())),
            ],
        );
        return Err(err_json(403, "Invalid CSRF token"));
    }
    let csrf_header = csrf_header.unwrap_or("");
    let Some(stored) = state.csrf.get(user_id) else {
        state.log.info(
            "CSRF validation failed - no token on record for this user",
            &[
                ("userID", json::s(user_id)),
                ("path", json::s(req.path.clone())),
            ],
        );
        return Err(csrf_retry(state, user_id, "CSRF token expired"));
    };
    if csrf_header.len() != stored.token.len()
        || !ct_eq(csrf_header.as_bytes(), stored.token.as_bytes())
    {
        state.log.info(
            "CSRF validation failed - token mismatch",
            &[
                ("userID", json::s(user_id)),
                ("path", json::s(req.path.clone())),
            ],
        );
        return Err(err_json(403, "Invalid CSRF token"));
    }
    if config::now_ms() - stored.timestamp > CSRF_TOKEN_EXPIRY_MS {
        state.log.info(
            "CSRF validation failed - token expired",
            &[
                ("userID", json::s(user_id)),
                (
                    "age",
                    json::s(format!("{}s", (config::now_ms() - stored.timestamp) / 1000)),
                ),
            ],
        );
        return Err(csrf_retry(state, user_id, "CSRF token expired"));
    }
    state.log.debug("CSRF validation passed", &[("userID", json::s(user_id))]);
    Ok(())
}

/// Build a 403 that also hands the caller a usable token for one retry.
///
/// Falls back to a plain 403 when a token cannot be minted, so a failure of the
/// random source can never turn into an accepted request.
fn csrf_retry(state: &AppState, user_id: &str, message: &str) -> Response {
    match generate_csrf_token() {
        Ok(token) => {
            state.csrf.set(user_id, token.clone(), config::now_ms());
            err_json(403, message).cookie(&csrf_cookie(state, &token))
        }
        Err(_) => {
            state.csrf.remove(user_id);
            err_json(403, message)
        }
    }
}

fn token_cookie(state: &AppState, jwt: &str) -> Cookie {
    Cookie {
        name: "token".into(),
        value: jwt.to_string(),
        http_only: true,
        secure: state.prod,
        same_site: SameSite::Strict,
        path: "/".into(),
        max_age: Some(TOKEN_EXPIRATION_DAYS * 24 * 60 * 60),
    }
}

fn csrf_cookie(state: &AppState, token: &str) -> Cookie {
    Cookie {
        name: "csrf_token".into(),
        value: token.to_string(),
        http_only: false,
        secure: state.prod,
        same_site: SameSite::Lax,
        path: "/".into(),
        max_age: Some(CSRF_TOKEN_EXPIRY_MS / 1000),
    }
}

fn delete_token_cookie(state: &AppState) -> Cookie {
    let mut c = token_cookie(state, "");
    c.max_age = Some(0);
    c
}

fn delete_csrf_cookie(state: &AppState) -> Cookie {
    let mut c = csrf_cookie(state, "");
    c.max_age = Some(0);
    c
}

fn set_auth_cookies(state: &AppState, res: Response, user_id: &str, jwt: &str) -> Result<Response, Response> {
    let csrf = generate_csrf_token()?;
    state.csrf.set(user_id, csrf.clone(), config::now_ms());
    Ok(res.cookie(&token_cookie(state, jwt)).cookie(&csrf_cookie(state, &csrf)))
}

fn user_json(u: &User) -> Json {
    let mut m = BTreeMap::new();
    m.insert("_id".into(), Json::Str(u.id.clone()));
    m.insert("email".into(), Json::Str(u.email.clone()));
    m.insert("name".into(), Json::Str(u.name.clone()));
    m.insert("created_at".into(), json::i(u.created_at));
    if let Some(sub) = &u.subscription {
        let mut sm = BTreeMap::new();
        sm.insert("stripeID".into(), Json::Str(sub.stripe_id.clone()));
        sm.insert(
            "expires".into(),
            sub.expires.map(json::i).unwrap_or(Json::Null),
        );
        sm.insert("status".into(), Json::Str(sub.status.clone()));
        m.insert("subscription".into(), Json::Obj(sm));
    }
    if let Some(usage) = &u.usage {
        let mut um = BTreeMap::new();
        um.insert("count".into(), json::i(usage.count));
        um.insert(
            "reset_at".into(),
            usage.reset_at.map(json::i).unwrap_or(Json::Null),
        );
        m.insert("usage".into(), Json::Obj(um));
    }
    Json::Obj(m)
}

fn db_err(state: &AppState, context: &str, e: &db::DbError) -> Response {
    state
        .log
        .error(context, &[("error", json::s(e.to_string()))]);
    err_json(500, "Server error")
}

fn is_duplicate(e: &db::DbError) -> bool {
    e.message.contains("UNIQUE constraint failed") || e.message.contains("duplicate key")
}

fn signup(state: &AppState, req: &Request) -> Response {
    if let Err(res) = enforce_auth_rate_limit(state, req) {
        return res;
    }
    let body = match parse_json_body(req) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(mut email) = body.get_str("email").map(str::to_string) else {
        return err_json(400, "Invalid email format or length");
    };
    let Some(password) = body.get_str("password") else {
        return err_json(400, "Password must be 6-72 characters");
    };
    let Some(name) = body.get_str("name") else {
        return err_json(400, "Name required (max 100 characters)");
    };
    if !validation::validate_email(&email) {
        return err_json(400, "Invalid email format or length");
    }
    if !validation::validate_password(password) {
        return err_json(400, "Password must be 6-72 characters");
    }
    if !validation::validate_name(name) {
        return err_json(400, "Name required (max 100 characters)");
    }
    email = email.to_lowercase().trim().to_string();
    let name = validation::escape_html(name.trim());

    let hash = match kdf::hash_password(password) {
        Ok(h) => h,
        Err(e) => {
            state.log.error("Signup error", &[("error", json::s(e.to_string()))]);
            return err_json(500, "Server error");
        }
    };
    let insert_id = match generate_uuid() {
        Ok(id) => id,
        Err(r) => return r,
    };
    let user = User {
        id: insert_id.clone(),
        email: email.clone(),
        name: name.clone(),
        created_at: config::now_ms(),
        subscription: None,
        usage: None,
    };
    let auth_rec = AuthRecord {
        email: email.clone(),
        password: hash,
        user_id: insert_id.clone(),
    };
    // One transaction, so a failure cannot leave a user row with no credentials
    // — an account nobody can sign in to, holding an email address that can
    // never be registered again.
    if let Err(e) = state.pool.create_account(&user, &auth_rec) {
        if is_duplicate(&e) {
            state.log.warn("Signup failed - duplicate account", &[]);
            return err_json(400, "Unable to create account with provided credentials");
        }
        return db_err(state, "Signup error", &e);
    }
    let token = match generate_token(state, &insert_id) {
        Ok(t) => t,
        Err(r) => return r,
    };
    let body = json::obj([
        ("id", json::s(insert_id.clone())),
        ("email", json::s(email)),
        ("name", json::s(name.trim())),
        ("tokenExpires", json::i(auth::token_expire_timestamp(TOKEN_EXPIRATION_DAYS))),
    ]);
    match set_auth_cookies(state, json_res(201, &body), &insert_id, &token) {
        Ok(res) => {
            state.log.info("Signup success", &[]);
            res
        }
        Err(r) => r,
    }
}

fn signin(state: &AppState, req: &Request) -> Response {
    if let Err(res) = enforce_auth_rate_limit(state, req) {
        return res;
    }
    let body = match parse_json_body(req) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(mut email) = body.get_str("email").map(str::to_string) else {
        return err_json(400, "Invalid credentials");
    };
    let Some(password) = body.get_str("password") else {
        return err_json(400, "Invalid credentials");
    };
    if !validation::validate_email(&email) {
        return err_json(400, "Invalid credentials");
    }
    email = email.to_lowercase().trim().to_string();
    state.log.debug("Attempting signin", &[]);

    let ip = client_ip(req);
    let lock = state.lockout.is_locked(&email, &ip, config::now_ms());
    if lock.locked {
        let body = json::obj([
            ("error", json::s("Account temporarily locked. Try again later.")),
            ("retryAfter", json::i(lock.remaining_time)),
        ]);
        return json_res(429, &body).header("Retry-After", &lock.remaining_time.to_string());
    }

    let auth = match state.pool.find_auth(&email) {
        Ok(v) => v,
        Err(e) => return db_err(state, "Signin error", &e),
    };
    let Some(auth) = auth else {
        state.log.debug("Auth record not found", &[]);
        state.lockout.record_failure(&email, &ip, config::now_ms());
        return err_json(401, "Invalid credentials");
    };
    if !kdf::verify_password(password, &auth.password) {
        state.log.debug("Password verification failed", &[]);
        state.lockout.record_failure(&email, &ip, config::now_ms());
        return err_json(401, "Invalid credentials");
    }
    if kdf::needs_rehash(&auth.password) {
        match kdf::hash_password(password) {
            Ok(new_hash) => {
                if let Err(e) = state.pool.update_auth_password(&email, &new_hash) {
                    state
                        .log
                        .warn("Password rehash failed", &[("error", json::s(e.to_string()))]);
                } else {
                    state.log.debug("Password hash migrated to scrypt", &[]);
                }
            }
            Err(e) => state
                .log
                .warn("Password rehash failed", &[("error", json::s(e.to_string()))]),
        }
    }
    let user = match state.pool.find_user(&UserQuery::Email(email.clone())) {
        Ok(v) => v,
        Err(e) => return db_err(state, "Signin error", &e),
    };
    let Some(user) = user else {
        state.log.error("User not found for auth record", &[]);
        return err_json(401, "Invalid credentials");
    };
    state.lockout.clear(&email, &ip);
    let token = match generate_token(state, &user.id) {
        Ok(t) => t,
        Err(r) => return r,
    };
    let mut m = BTreeMap::new();
    m.insert("id".into(), Json::Str(user.id.clone()));
    m.insert("email".into(), Json::Str(user.email.clone()));
    m.insert("name".into(), Json::Str(user.name.clone()));
    if let Some(sub) = &user.subscription {
        let mut sm = BTreeMap::new();
        sm.insert("stripeID".into(), Json::Str(sub.stripe_id.clone()));
        sm.insert(
            "expires".into(),
            sub.expires.map(json::i).unwrap_or(Json::Null),
        );
        sm.insert("status".into(), Json::Str(sub.status.clone()));
        m.insert("subscription".into(), Json::Obj(sm));
    }
    m.insert(
        "tokenExpires".into(),
        json::i(auth::token_expire_timestamp(TOKEN_EXPIRATION_DAYS)),
    );
    match set_auth_cookies(state, json_res(200, &Json::Obj(m)), &user.id, &token) {
        Ok(res) => {
            state.log.info("Signin success", &[]);
            res
        }
        Err(r) => r,
    }
}

fn signout(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    // Sign-out changes server state, so it is CSRF-protected like any other
    // mutation. A refusal still hands back a usable token, so a client holding a
    // stale one can retry immediately rather than being stuck signed in.
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    state.csrf.remove(&user_id);
    state.log.info("Signout success", &[]);
    json_res(200, &json::obj([("message", json::s("Signed out successfully"))]))
        .cookie(&delete_token_cookie(state))
        .cookie(&delete_csrf_cookie(state))
}

fn me_get(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    state.log.debug("/me checking for user", &[]);
    match state.pool.find_user(&UserQuery::Id(user_id)) {
        Ok(Some(u)) => json_res(200, &user_json(&u)),
        Ok(None) => err_json(404, "User not found"),
        Err(e) => db_err(state, "Unhandled error occurred", &e),
    }
}

fn me_put(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    // A malformed body is the caller's mistake, so it answers 400 like every other
    // JSON route — not the 500 an earlier revision returned.
    let body = match parse_json_body(req) {
        Ok(v) => v,
        Err(r) => return r,
    };
    if let Some(name) = body.get("name") {
        let Some(name) = name.as_str() else {
            return err_json(400, "Name must be 1-100 characters");
        };
        if !validation::validate_name(name) {
            return err_json(400, "Name must be 1-100 characters");
        }
    }
    match state.pool.find_user(&UserQuery::Id(user_id.clone())) {
        Ok(Some(_)) => {}
        Ok(None) => return err_json(404, "User not found"),
        Err(e) => {
            state
                .log
                .error("Update user error", &[("error", json::s(e.to_string()))]);
            return err_json(500, "Failed to update user");
        }
    }
    let Some(name) = body.get_str("name") else {
        return err_json(400, "No valid fields to update");
    };
    let sanitized = validation::escape_html(name.trim());
    match state.pool.update_user_set_name(&user_id, &sanitized) {
        Ok(0) => err_json(400, "No changes made"),
        Ok(_) => match state.pool.find_user(&UserQuery::Id(user_id)) {
            Ok(Some(u)) => json_res(200, &user_json(&u)),
            Ok(None) => err_json(404, "User not found"),
            Err(e) => {
                state
                    .log
                    .error("Update user error", &[("error", json::s(e.to_string()))]);
                err_json(500, "Failed to update user")
            }
        },
        Err(e) => {
            state
                .log
                .error("Update user error", &[("error", json::s(e.to_string()))]);
            err_json(500, "Failed to update user")
        }
    }
}

fn resolve_usage(user: &User) -> Usage {
    user.usage.clone().unwrap_or(Usage {
        count: 0,
        reset_at: None,
    })
}

fn is_subscriber(sub: &Subscription) -> bool {
    sub.status == "active" && sub.expires.map(|e| e > config::now_secs()).unwrap_or(true)
}

fn sub_expires_iso(sub: &Subscription) -> Json {
    match sub.expires {
        Some(secs) => Json::Str(config::iso_from_secs(secs)),
        None => Json::Null,
    }
}

/// Length of a free-tier usage window, in seconds (30 days).
const USAGE_WINDOW_SECS: i64 = 30 * 24 * 60 * 60;

/// The 429 body returned when a free-tier caller has no quota left.
fn usage_limit_reached(limit: i64) -> Response {
    json_res(
        429,
        &json::obj([
            ("error", json::s("Usage limit reached")),
            ("remaining", json::i(0)),
            ("total", json::i(limit)),
            ("isSubscriber", Json::Bool(false)),
        ]),
    )
}

fn usage(state: &AppState, req: &Request) -> Response {
    let user_id = match require_auth(state, req) {
        Ok(id) => id,
        Err(r) => return r,
    };
    // `operation: "track"` increments a stored counter, so this is a mutation.
    // The body is parsed as JSON regardless of Content-Type, which means a
    // cross-site form post could otherwise reach it without a preflight.
    if let Err(res) = require_csrf(state, req, &user_id) {
        return res;
    }
    let body = match json::parse(&req.body) {
        Ok(v) => v,
        Err(e) => {
            state
                .log
                .error("Usage tracking error", &[("error", json::s(e.to_string()))]);
            return err_json(500, "Server error");
        }
    };
    let operation = body.get_str("operation").unwrap_or("");
    if operation != "check" && operation != "track" {
        return err_json(400, "Invalid operation. Must be 'check' or 'track'");
    }
    let user = match state.pool.find_user(&UserQuery::Id(user_id.clone())) {
        Ok(Some(u)) => u,
        Ok(None) => return err_json(404, "User not found"),
        Err(e) => return db_err(state, "Usage tracking error", &e),
    };
    if let Some(sub) = &user.subscription {
        if is_subscriber(sub) {
            let mut sm = BTreeMap::new();
            sm.insert("status".into(), Json::Str(sub.status.clone()));
            sm.insert("expiresAt".into(), sub_expires_iso(sub));
            return json_res(
                200,
                &Json::Obj(BTreeMap::from([
                    ("remaining".into(), json::i(-1)),
                    ("total".into(), json::i(-1)),
                    ("isSubscriber".into(), Json::Bool(true)),
                    ("subscription".into(), Json::Obj(sm)),
                ])),
            );
        }
    }
    let limit = state.free_usage_limit;
    let now = config::now_secs();
    let mut usage = resolve_usage(&user);
    let is_tracking = operation == "track";
    // A limit below 1 admits nothing, including the first request of a new
    // window — which the window reset below would otherwise wave through.
    if is_tracking && limit < 1 {
        return usage_limit_reached(limit);
    }
    if usage.reset_at.map(|r| now > r).unwrap_or(true) {
        let new_reset = now + USAGE_WINDOW_SECS;
        // Reset and first increment together: a separate increment could be
        // issued by a concurrent request and then erased by this reset.
        match state
            .pool
            .reset_usage_window(&user_id, new_reset, is_tracking)
        {
            Ok(count) => {
                usage = Usage {
                    count,
                    reset_at: Some(new_reset),
                }
            }
            Err(e) => return db_err(state, "Usage tracking error", &e),
        }
    } else if is_tracking {
        // The limit is enforced inside the UPDATE, so concurrent requests
        // cannot both be admitted at the boundary.
        match state.pool.consume_usage(&user_id, limit) {
            Ok(Some(count)) => usage.count = count,
            Ok(None) => return usage_limit_reached(limit),
            Err(e) => return db_err(state, "Usage tracking error", &e),
        }
    }
    let remaining = (limit - usage.count).max(0);
    let mut m = BTreeMap::new();
    m.insert("remaining".into(), json::i(remaining));
    m.insert("total".into(), json::i(limit));
    m.insert("isSubscriber".into(), Json::Bool(false));
    m.insert("used".into(), json::i(usage.count));
    m.insert(
        "subscription".into(),
        match &user.subscription {
            Some(sub) => {
                let mut sm = BTreeMap::new();
                sm.insert("status".into(), Json::Str(sub.status.clone()));
                sm.insert("expiresAt".into(), sub_expires_iso(sub));
                Json::Obj(sm)
            }
            None => Json::Null,
        },
    );
    json_res(200, &Json::Obj(m))
}

fn has_extension(path: &str) -> bool {
    path.rsplit('/')
        .next()
        .and_then(|s| s.rsplit_once('.'))
        .map(|(_, ext)| !ext.is_empty() && ext.chars().all(|c| c.is_ascii_alphanumeric() || c == '_'))
        .unwrap_or(false)
}

fn static_or_spa(state: &AppState, req: &Request) -> Response {
    if let Some(res) = crate::http::serve_file(&state.static_dir, &req.path) {
        return res;
    }
    if req.path.starts_with("/api/") || has_extension(&req.path) {
        return not_found();
    }
    spa_fallback(state)
}

/// Production-only cache of `index.html`, which never changes while the process runs.
static INDEX_HTML: std::sync::OnceLock<Option<String>> = std::sync::OnceLock::new();

/// Serve the SPA shell for any non-API path.
///
/// In production the file is read once and kept in memory — every client-side route
/// lands here, so re-reading it per request is pure syscall overhead. Development
/// reads from disk each time so a rebuild shows up without restarting the server.
fn spa_fallback(state: &AppState) -> Response {
    let read_index = || {
        std::fs::read(state.static_dir.join("index.html"))
            .ok()
            .map(|bytes| String::from_utf8_lossy(&bytes).into_owned())
    };
    let html = if state.prod {
        INDEX_HTML.get_or_init(read_index).clone()
    } else {
        read_index()
    };
    match html {
        Some(body) => Response::html(200, &body),
        None => Response::text(200, "Welcome to Skateboard API"),
    }
}

/// Drop expired CSRF tokens. Called from the hourly cleanup thread.
pub fn run_csrf_cleanup(state: &AppState) {
    let cleaned = state.csrf.cleanup(config::now_ms());
    if cleaned > 0 {
        state.log.debug(
            "CSRF cleanup completed",
            &[("removedTokens", json::i(cleaned as i64))],
        );
    }
}

/// Days a processed Stripe webhook id is remembered for replay protection.
/// Stripe stops retrying an event after ~3 days, so 30 is generous.
const WEBHOOK_RETENTION_DAYS: i64 = 30;

/// Drop webhook records past [`WEBHOOK_RETENTION_DAYS`]. Called from the hourly thread.
pub fn run_webhook_cleanup(state: &AppState) {
    let cutoff = config::now_ms() - WEBHOOK_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    match state.pool.prune_webhook_events(cutoff) {
        Ok(removed) if removed > 0 => state
            .log
            .debug("Webhook cleanup completed", &[("removedEvents", json::i(removed))]),
        Ok(_) => {}
        Err(e) => state
            .log
            .error("Webhook cleanup failed", &[("error", json::s(e.to_string()))]),
    }
}

/// Drop expired lockout and auth-rate entries. Called from the 15-minute cleanup thread.
pub fn run_lockout_cleanup(state: &AppState) {
    let now = config::now_ms();
    let cleaned = state.lockout.cleanup(now);
    if cleaned > 0 {
        state.log.debug(
            "Lockout cleanup completed",
            &[("removedEntries", json::i(cleaned as i64))],
        );
    }
    let rate_cleaned = state.auth_rate.cleanup(now);
    if rate_cleaned > 0 {
        state.log.debug(
            "Auth rate-limit cleanup completed",
            &[("removedEntries", json::i(rate_cleaned as i64))],
        );
    }
}

/// Client IP used for auth rate limiting and lockout keys.
///
/// Transport `peer_ip` by default. `TRUST_PROXY` is the number of reverse
/// proxies in front of this process (`TRUST_PROXY=1` for a single proxy such as
/// Railway); set it only when every one of those hops is trusted.
///
/// Proxies **append** to `X-Forwarded-For`, so the leftmost entry is whatever
/// the client sent and must never be trusted — rotating it would mint a fresh
/// rate-limit and lockout bucket per request. Index `hops` from the right
/// instead: with one trusted proxy that is the address it observed.
///
/// Falls back to `peer_ip` when the header is absent or carries fewer entries
/// than `hops` (a spoofed-short chain then shares the proxy's bucket rather
/// than escaping into one of its own).
fn client_ip(req: &Request) -> String {
    let hops = config::env("TRUST_PROXY")
        .and_then(|v| v.trim().parse::<usize>().ok())
        .unwrap_or(0);
    if hops > 0 {
        if let Some(xff) = req.header("x-forwarded-for") {
            let chain: Vec<&str> = xff
                .split(',')
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .collect();
            if let Some(ip) = chain.len().checked_sub(hops).and_then(|i| chain.get(i)) {
                return (*ip).to_string();
            }
        }
    }
    req.peer_ip.clone()
}

/// Refuse the request when this IP has exhausted the auth sliding window.
fn enforce_auth_rate_limit(state: &AppState, req: &Request) -> Result<(), Response> {
    let ip = client_ip(req);
    let status = state.auth_rate.check_and_record(&ip, config::now_ms());
    if !status.limited {
        return Ok(());
    }
    let body = json::obj([
        ("error", json::s("Too many authentication attempts. Try again later.")),
        ("retryAfter", json::i(status.retry_after_secs)),
    ]);
    Err(json_res(429, &body).header("Retry-After", &status.retry_after_secs.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Logger;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::Mutex;

    static TEST_DIR_SEQ: AtomicU64 = AtomicU64::new(0);

    /// Tests mutate process env; serialize them so they cannot clobber each other.
    static ENV_LOCK: Mutex<()> = Mutex::new(());

    fn test_state() -> (AppState, std::path::PathBuf) {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        test_state_locked()
    }

    /// Like [`test_state`] but assumes the caller already holds [`ENV_LOCK`].
    fn test_state_locked() -> (AppState, std::path::PathBuf) {
        let n = TEST_DIR_SEQ.fetch_add(1, Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!("sk-rs-{}-{n}", std::process::id()));
        std::fs::create_dir_all(dir.join("databases")).unwrap();
        std::fs::write(
            dir.join("config.json"),
            r#"{"staticDir":"dist","database":{"db":"T","dbType":"sqlite","connectionString":"./databases/T.db"}}"#,
        )
        .unwrap();
        // SAFETY: serialized by ENV_LOCK; tests run with a dedicated dir.
        unsafe {
            std::env::set_var("JWT_SECRET", "test-secret-value-at-least-32-chars!!");
            std::env::remove_var("STRIPE_KEY");
            std::env::remove_var("STRIPE_ENDPOINT_SECRET");
            std::env::remove_var("PORT");
            std::env::remove_var("NODE_ENV");
        }
        let state = AppState::open_in(&dir, 2, Logger::new(true)).expect("open");
        (state, dir)
    }

    fn json_body(res: &Response) -> Json {
        json::parse(&res.body).expect("json")
    }

    fn cookie_header(req: &mut Request, res: &Response) {
        let cookies: Vec<String> = res
            .headers
            .iter()
            .filter(|(k, _)| k.eq_ignore_ascii_case("Set-Cookie"))
            .map(|(_, v)| v.split(';').next().unwrap_or(v).to_string())
            .collect();
        if !cookies.is_empty() {
            req.set_test_header("cookie", &cookies.join("; "));
        }
        if let Some((_, csrf)) = res.headers.iter().find(|(k, v)| {
            k.eq_ignore_ascii_case("Set-Cookie") && v.starts_with("csrf_token=")
        }) {
            let token = csrf.split('=').nth(1).unwrap_or("").split(';').next().unwrap_or("");
            req.set_test_header("x-csrf-token", token);
        }
    }

    /// Replay the cookies set by `sources`, in order, with later responses
    /// overriding earlier ones by cookie name — so an auth cookie from signup
    /// can be combined with a replacement CSRF cookie from a later response.
    ///
    /// `send_csrf` controls whether the matching `x-csrf-token` header is sent,
    /// which is what separates "client has no token" from "token is stale".
    fn replay_cookies(req: &mut Request, sources: &[&Response], send_csrf: bool) {
        let mut jar: Vec<(String, String)> = Vec::new();
        for res in sources {
            let set_cookies = res
                .headers
                .iter()
                .filter(|(k, _)| k.eq_ignore_ascii_case("Set-Cookie"));
            for (_, value) in set_cookies {
                let pair = value.split(';').next().unwrap_or(value);
                let Some((name, token)) = pair.split_once('=') else {
                    continue;
                };
                jar.retain(|(existing, _)| existing != name);
                jar.push((name.to_string(), token.to_string()));
            }
        }
        if !jar.is_empty() {
            let serialized: Vec<String> =
                jar.iter().map(|(n, v)| format!("{n}={v}")).collect();
            req.set_test_header("cookie", &serialized.join("; "));
        }
        if send_csrf {
            if let Some((_, token)) = jar.iter().find(|(name, _)| name == "csrf_token") {
                req.set_test_header("x-csrf-token", token);
            }
        }
    }

    #[test]
    fn health_ok() {
        let (state, dir) = test_state();
        let res = handle(&state, Request::for_test("GET", "/api/health"));
        assert_eq!(res.status, 200);
        let body = json_body(&res);
        assert_eq!(body.get_str("status"), Some("ok"));
        assert!(body.get_i64("timestamp").is_some());
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn signup_rejects_bad_email() {
        let (state, dir) = test_state();
        let mut req = Request::for_test("POST", "/api/signup");
        req.set_test_body(br#"{"email":"nope","password":"secret1","name":"Ada"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 400);
        assert_eq!(json_body(&res).get_str("error"), Some("Invalid email format or length"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn signup_signin_me_round_trip() {
        let (state, dir) = test_state();
        let mut req = Request::for_test("POST", "/api/signup");
        req.set_test_body(br#"{"email":"Ada@Example.COM","password":"secret1","name":"Ada"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 201, "{}", String::from_utf8_lossy(&res.body));
        let body = json_body(&res);
        assert_eq!(body.get_str("email"), Some("ada@example.com"));
        assert_eq!(body.get_str("name"), Some("Ada"));

        let mut me = Request::for_test("GET", "/api/me");
        cookie_header(&mut me, &res);
        let me_res = handle(&state, me);
        assert_eq!(me_res.status, 200, "{}", String::from_utf8_lossy(&me_res.body));
        assert_eq!(json_body(&me_res).get_str("email"), Some("ada@example.com"));

        let mut signin = Request::for_test("POST", "/api/signin");
        signin.set_test_body(br#"{"email":"ada@example.com","password":"secret1"}"#.to_vec());
        let si = handle(&state, signin);
        assert_eq!(si.status, 200, "{}", String::from_utf8_lossy(&si.body));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn unknown_api_is_404_text() {
        let (state, dir) = test_state();
        let res = handle(&state, Request::for_test("GET", "/api/nope"));
        assert_eq!(res.status, 404);
        assert_eq!(res.body, b"404 Not Found");
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn spa_fallback_without_dist() {
        let (state, dir) = test_state();
        let res = handle(&state, Request::for_test("GET", "/app"));
        assert_eq!(res.status, 200);
        assert_eq!(res.body, b"Welcome to Skateboard API");
        std::fs::remove_dir_all(&dir).ok();
    }

    /// Sign up, then return the state and the signup response (which carries
    /// the auth cookies and the CSRF token).
    fn signed_up(state: &AppState, email: &str) -> Response {
        let mut req = Request::for_test("POST", "/api/signup");
        req.set_test_body(
            format!(r#"{{"email":"{email}","password":"secret1","name":"P"}}"#).into_bytes(),
        );
        let res = handle(state, req);
        assert_eq!(res.status, 201, "{}", String::from_utf8_lossy(&res.body));
        res
    }

    #[test]
    fn usage_track_requires_csrf() {
        let (state, dir) = test_state();
        let signup = signed_up(&state, "usage@example.com");
        let mut req = Request::for_test("POST", "/api/usage");
        replay_cookies(&mut req, &[&signup], false);
        req.set_test_body(br#"{"operation":"track"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 403, "{}", String::from_utf8_lossy(&res.body));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn signout_requires_csrf() {
        let (state, dir) = test_state();
        let signup = signed_up(&state, "out@example.com");
        let mut req = Request::for_test("POST", "/api/signout");
        replay_cookies(&mut req, &[&signup], false);
        let res = handle(&state, req);
        assert_eq!(res.status, 403, "{}", String::from_utf8_lossy(&res.body));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn csrf_store_miss_is_refused_not_auto_accepted() {
        let (state, dir) = test_state();
        let signup = signed_up(&state, "miss@example.com");
        let user_id = state
            .pool
            .find_user(&UserQuery::Email("miss@example.com".into()))
            .expect("query")
            .expect("user")
            .id;
        // Simulates a restart: the cookie and header survive, the store does not.
        state.csrf.remove(&user_id);

        let mut req = Request::for_test("PUT", "/api/me");
        replay_cookies(&mut req, &[&signup], true);
        req.set_test_body(br#"{"name":"Renamed"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(
            res.status, 403,
            "a store miss must not accept the request: {}",
            String::from_utf8_lossy(&res.body)
        );
        // The name must be unchanged, proving the mutation did not run.
        let after = state
            .pool
            .find_user(&UserQuery::Id(user_id))
            .expect("query")
            .expect("user");
        assert_eq!(after.name, "P");
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn csrf_refusal_issues_a_token_usable_on_retry() {
        let (state, dir) = test_state();
        let signup = signed_up(&state, "retry@example.com");
        let user_id = state
            .pool
            .find_user(&UserQuery::Email("retry@example.com".into()))
            .expect("query")
            .expect("user")
            .id;
        state.csrf.remove(&user_id);

        let mut first = Request::for_test("PUT", "/api/me");
        replay_cookies(&mut first, &[&signup], true);
        first.set_test_body(br#"{"name":"Renamed"}"#.to_vec());
        let refused = handle(&state, first);
        assert_eq!(refused.status, 403);

        // Retry with the replacement token the refusal set.
        let mut second = Request::for_test("PUT", "/api/me");
        replay_cookies(&mut second, &[&signup, &refused], true);
        second.set_test_body(br#"{"name":"Renamed"}"#.to_vec());
        let res = handle(&state, second);
        assert_eq!(res.status, 200, "{}", String::from_utf8_lossy(&res.body));
        assert_eq!(json_body(&res).get_str("name"), Some("Renamed"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn put_me_requires_csrf() {
        let (state, dir) = test_state();
        let mut req = Request::for_test("POST", "/api/signup");
        req.set_test_body(br#"{"email":"csrf@example.com","password":"secret1","name":"C"}"#.to_vec());
        let signed = handle(&state, req);
        assert_eq!(signed.status, 201);

        let mut put = Request::for_test("PUT", "/api/me");
        cookie_header(&mut put, &signed);
        // cookie_header also copies x-csrf-token from Set-Cookie; strip it to
        // prove a missing header is rejected.
        put.headers = crate::http::Headers::from_pairs(
            put.headers
                .iter()
                .filter(|(k, _)| !k.eq_ignore_ascii_case("x-csrf-token"))
                .map(|(k, v)| (k.to_string(), v.to_string()))
                .collect(),
        );
        put.set_test_body(br#"{"name":"New"}"#.to_vec());
        let res = handle(&state, put);
        assert_eq!(res.status, 403);
        std::fs::remove_dir_all(&dir).ok();
    }


    #[test]
    fn auth_rate_limit_blocks_after_cap() {
        let (state, dir) = test_state();
        let now = config::now_ms();
        for _ in 0..crate::stores::AUTH_RATE_LIMIT {
            assert!(!state.auth_rate.check_and_record("198.51.100.9", now).limited);
        }
        let mut req = Request::for_test("POST", "/api/signup");
        req.peer_ip = "198.51.100.9".into();
        req.set_test_body(br#"{"email":"overflow@example.com","password":"secret1","name":"R"}"#.to_vec());
        let res = handle(&state, req);
        assert_eq!(res.status, 429);
        assert!(res.headers.iter().any(|(k, _)| k.eq_ignore_ascii_case("retry-after")));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn auth_rate_limit_honors_forwarded_for_when_trust_proxy_set() {
        let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        // SAFETY: ENV_LOCK is held for the whole test so TRUST_PROXY cannot race.
        unsafe {
            std::env::set_var("TRUST_PROXY", "1");
        }
        let (state, dir) = test_state_locked();
        let now = config::now_ms();
        for _ in 0..crate::stores::AUTH_RATE_LIMIT {
            assert!(!state.auth_rate.check_and_record("198.51.100.10", now).limited);
        }
        let mut req = Request::for_test("POST", "/api/signup");
        req.peer_ip = "10.0.0.1".into();
        req.set_test_header("x-forwarded-for", "198.51.100.10");
        req.set_test_body(br#"{"email":"xff-over@example.com","password":"secret1","name":"R"}"#.to_vec());
        assert_eq!(handle(&state, req).status, 429);
        // Different forwarded IP still allowed (socket peer is the same proxy).
        let mut req = Request::for_test("POST", "/api/signup");
        req.peer_ip = "10.0.0.1".into();
        req.set_test_header("x-forwarded-for", "198.51.100.11");
        req.set_test_body(br#"{"email":"xff-other@example.com","password":"secret1","name":"R"}"#.to_vec());
        assert_eq!(handle(&state, req).status, 201);
        unsafe {
            std::env::remove_var("TRUST_PROXY");
        }
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn spoofed_leading_forwarded_for_cannot_mint_a_fresh_rate_limit_bucket() {
        let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        // SAFETY: ENV_LOCK is held for the whole test so TRUST_PROXY cannot race.
        unsafe {
            std::env::set_var("TRUST_PROXY", "1");
        }
        let (state, dir) = test_state_locked();
        let now = config::now_ms();
        // Exhaust the window for the address the single trusted proxy observed.
        for _ in 0..crate::stores::AUTH_RATE_LIMIT {
            assert!(!state.auth_rate.check_and_record("198.51.100.10", now).limited);
        }
        // The client prepends junk; the proxy appends the address it saw. Taking
        // the leftmost hop would hand the attacker an unused bucket every time.
        for (i, spoof) in ["203.0.113.1", "203.0.113.2", "203.0.113.3"].iter().enumerate() {
            let mut req = Request::for_test("POST", "/api/signup");
            req.peer_ip = "10.0.0.1".into();
            req.set_test_header("x-forwarded-for", &format!("{spoof}, 198.51.100.10"));
            req.set_test_body(
                format!(r#"{{"email":"spoof{i}@example.com","password":"secret1","name":"R"}}"#)
                    .into_bytes(),
            );
            assert_eq!(handle(&state, req).status, 429, "spoofed hop {spoof} escaped the limit");
        }
        unsafe {
            std::env::remove_var("TRUST_PROXY");
        }
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn forwarded_for_shorter_than_trusted_hops_falls_back_to_peer_ip() {
        let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        // SAFETY: ENV_LOCK is held for the whole test so TRUST_PROXY cannot race.
        unsafe {
            std::env::set_var("TRUST_PROXY", "2");
        }
        let (state, dir) = test_state_locked();
        let now = config::now_ms();
        // Only one hop present but two are configured: fail closed to the socket
        // peer rather than trusting the client-supplied entry.
        for _ in 0..crate::stores::AUTH_RATE_LIMIT {
            assert!(!state.auth_rate.check_and_record("10.0.0.1", now).limited);
        }
        let mut req = Request::for_test("POST", "/api/signup");
        req.peer_ip = "10.0.0.1".into();
        req.set_test_header("x-forwarded-for", "203.0.113.9");
        req.set_test_body(br#"{"email":"short-chain@example.com","password":"secret1","name":"R"}"#.to_vec());
        assert_eq!(handle(&state, req).status, 429);
        unsafe {
            std::env::remove_var("TRUST_PROXY");
        }
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn put_me_rejects_malformed_json_as_bad_request() {
        let (state, dir) = test_state();
        let signed = signed_up(&state, "badjson@example.com");

        let mut put = Request::for_test("PUT", "/api/me");
        cookie_header(&mut put, &signed);
        put.set_test_body(b"{not json".to_vec());
        let res = handle(&state, put);

        assert_eq!(res.status, 400);
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn health_reports_the_database_probe() {
        let (state, dir) = test_state();
        let body = json_body(&handle(&state, Request::for_test("GET", "/api/health")));

        assert_eq!(body.get_str("database"), Some("connected"));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn webhook_cleanup_drops_only_expired_records() {
        let (state, dir) = test_state();
        let day_ms = 24 * 60 * 60 * 1000;
        let now = config::now_ms();
        state
            .pool
            .insert_webhook_event("evt_old", "invoice.paid", now - (WEBHOOK_RETENTION_DAYS + 1) * day_ms)
            .unwrap();
        state.pool.insert_webhook_event("evt_new", "invoice.paid", now).unwrap();

        run_webhook_cleanup(&state);

        assert!(state.pool.find_webhook_event("evt_old").unwrap().is_none());
        assert!(state.pool.find_webhook_event("evt_new").unwrap().is_some());
        std::fs::remove_dir_all(&dir).ok();
    }
}
