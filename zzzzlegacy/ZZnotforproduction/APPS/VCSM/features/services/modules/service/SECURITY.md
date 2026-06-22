# SECURITY — services / service
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Security Profile

| Field | Value |
|-------|-------|
| Attack surface | Client configuration layer only |
| Direct DB writes | None |
| Auth dependency | Supabase auth.uid() (session + token reads) |
| Token exposure risk | Access token passed to Cloudflare R2 worker |
| External services | Supabase, Cloudflare R2, OneSignal, Sentry |
| Last security review | 2026-06-05 |

---

## Confirmed Findings

### SVC-SEC-001 — INFO: Access token passed to Cloudflare Worker via Authorization header

| Field | Value |
|-------|-------|
| Severity | INFO / DESIGN DECISION |
| Status | ACCEPTED — by design |
| Source file | `cloudflare/uploadToCloudflare.js` |

**Pattern:**
```
getUploadAuthHeaders() → readSupabaseAccessToken() → Bearer <token>
PUT ${CLOUDFLARE_WORKER_URL}/${key}
Authorization: Bearer <supabase_access_token>
```

The Supabase JWT is sent to the Cloudflare Worker endpoint over HTTPS. The Worker validates the JWT before accepting the upload.

**Assessment:** Acceptable. Token is short-lived, sent over HTTPS only, and validated server-side. The Cloudflare Worker is the trust boundary — it must not accept uploads without token validation.

**Risk if Cloudflare Worker loses validation:** Any authenticated user could upload arbitrary files to R2. Worker-side token validation must be treated as a HARD requirement.

---

### SVC-SEC-002 — INFO: HMR guard prevents session duplication

| Field | Value |
|-------|-------|
| Severity | INFO |
| Status | RESOLVED by design |
| Source file | `supabase/supabaseClient.js` |

**Pattern:** `globalThis.__SB_CLIENT__` guards against multiple Supabase instances in Vite HMR.

Without the guard, HMR creates duplicate Supabase clients. Multiple clients with the same `storageKey` would compete for session writes — potential for session corruption or premature expiry.

**Assessment:** Guard correctly prevents duplication. No action needed.

---

### SVC-SEC-003 — INFO: storageKey isolation

| Field | Value |
|-------|-------|
| Severity | INFO |
| Status | ACCEPTED |
| Source file | `supabase/supabaseClient.js` |

**storageKey: 'sb-auth-main'** isolates the VCSM session from any other Supabase-based apps sharing the same origin. Changing this key would silently invalidate all persisted user sessions.

**Constraint:** This key must not be changed without a coordinated migration.

---

## Security Properties

### Supabase Auth

- `persistSession: true` — session is stored in localStorage under `sb-auth-main`
- `autoRefreshToken: true` — Supabase SDK handles silent token refresh
- All schema clients (vc, vport, reviews) share the same authenticated session
- RLS policies enforce row-level ownership on every DB call — the client configuration layer does not bypass RLS

### Cloudflare R2

- Upload auth: Supabase access token (Bearer) validated by Cloudflare Worker
- Public URLs (`publicUrlForKey`) require no auth — intentional (media is public)
- Private upload path is protected by Cloudflare Worker auth

### OneSignal

- `externalId` bound to `auth.uid()` — push subscriptions are tied to authenticated user identity
- `logoutOneSignalExternalUser()` must be called on sign-out to unbind push subscription
- `notifyButton: { enable: false }` — no automatic push prompt; permission is explicit only

### Sentry

- Sample rate: 10% — not all errors are sent to Sentry (by design for cost control)
- No-op when DSN absent — safe in development and staging environments without DSN
- Error context is passed as `extra` — no PII should be passed in `context`; this is not enforced programmatically

---

## Unverified Surfaces

| Surface | Risk | Notes |
|---------|------|-------|
| Sentry context PII | MEDIUM | `captureMonitoringError(error, context)` — context is caller-supplied; no PII filtering enforced. Callers must ensure no session tokens or user data in `context`. |
| Cloudflare Worker token validation | HIGH (if absent) | This module assumes the Worker validates tokens — if that assumption is violated, the upload endpoint is unauthenticated. Not verifiable from this layer. |
| OneSignal sign-out flush | MEDIUM | If `logoutOneSignalExternalUser()` is not called on sign-out, the push subscription remains bound to the previous user. Dependent on correct call site behavior. |

---

## Scanner Coverage

| Scanner | Status | Notes |
|---------|--------|-------|
| VENOM | Not run | Module not yet scanned |
| ELEKTRA | Not run | Module not yet scanned |
| BlackWidow | Not run | Module not yet scanned |
