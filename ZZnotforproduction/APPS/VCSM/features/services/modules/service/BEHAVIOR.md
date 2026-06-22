# BEHAVIOR — services / service
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Behavior Inventory

| ID | Behavior | Source File | Status |
|----|----------|-------------|--------|
| BEH-SERVICES-001 | Initialize HMR-safe Supabase singleton | supabase/supabaseClient.js | SOURCE_VERIFIED |
| BEH-SERVICES-002 | Provide schema-scoped Supabase clients | supabase/vc/vport/reviewsClient.js | SOURCE_VERIFIED |
| BEH-SERVICES-003 | Read auth session and access token | supabase/authSession.js | SOURCE_VERIFIED |
| BEH-SERVICES-004 | Validate UUIDs and normalize search terms | supabase/postgrestSafe.js | SOURCE_VERIFIED |
| BEH-SERVICES-005 | Upload media to Cloudflare R2 | cloudflare/uploadToCloudflare.js | SOURCE_VERIFIED |
| BEH-SERVICES-006 | Resolve public URL for R2 key | cloudflare/uploadToCloudflare.js | SOURCE_VERIFIED |
| BEH-SERVICES-007 | Request OneSignal push permission | onesignal/onesignalClient.js | SOURCE_VERIFIED |
| BEH-SERVICES-008 | Bind OneSignal identity to Supabase user | onesignal/onesignalClient.js | SOURCE_VERIFIED |
| BEH-SERVICES-009 | Initialize Sentry monitoring | monitoring/monitoring.js | SOURCE_VERIFIED |
| BEH-SERVICES-010 | Capture error to Sentry | monitoring/monitoring.js | SOURCE_VERIFIED |

---

## BEH-SERVICES-001 — Initialize HMR-safe Supabase singleton

**Source:** `apps/VCSM/src/services/supabase/supabaseClient.js`

The Supabase client is a true singleton — created once per app process and reused everywhere.

**HMR guard pattern:**
```js
if (!globalThis.__SB_CLIENT__) {
  globalThis.__SB_CLIENT__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { storageKey: 'sb-auth-main', persistSession: true, autoRefreshToken: true }
  })
}
export const supabase = globalThis.__SB_CLIENT__
```

Without this guard, Vite HMR during development would create a new client on every hot reload, causing session duplication or loss.

---

## BEH-SERVICES-002 — Provide schema-scoped clients

**Source:** `supabase/vcClient.js`, `supabase/vportClient.js`, `supabase/reviewsClient.js`

Each schema client wraps the singleton with `.schema('name')`:

```js
// vcClient.js
export const vcClient = supabase.schema('vc')

// vportClient.js
export const vportClient = supabase.schema('vport')

// reviewsClient.js
export const reviewsClient = supabase.schema('reviews')
```

DAL files import the schema client matching their target schema — they never import `supabase` directly.

---

## BEH-SERVICES-003 — Read auth session and access token

**Source:** `apps/VCSM/src/services/supabase/authSession.js`

```js
readSupabaseSession()      // → supabase.auth.getSession().data.session
readSupabaseAccessToken()  // → session.access_token
```

Used by: upload auth headers (Cloudflare), OneSignal identity binding, any place that needs the raw token outside of a DAL context.

---

## BEH-SERVICES-004 — Validate UUIDs and normalize search terms

**Source:** `apps/VCSM/src/services/supabase/postgrestSafe.js`

UUID validation:
- `isUuid(str)` — returns boolean
- `assertUuid(str)` — throws if not a valid UUID

PostgREST search normalization:
- `normalizeSearchTerm(raw)` — trims, lowercases, collapses whitespace
- `toContainsPattern(term)` — wraps in `%term%` for ILIKE
- `toPrefixPattern(term)` — wraps in `term%` for ILIKE prefix

Used by all DAL files that accept user-supplied IDs or search strings.

---

## BEH-SERVICES-005 — Upload media to Cloudflare R2

**Source:** `apps/VCSM/src/services/cloudflare/uploadToCloudflare.js`

```
uploadToCloudflare(file, key)
  ├── getUploadAuthHeaders()        ← reads Supabase access token
  ├── PUT /r2-worker/${key}         ← Cloudflare Worker endpoint
  └── returns { success, url }
```

Auth: Supabase access token sent as Bearer header — Cloudflare Worker validates it before accepting the upload.

---

## BEH-SERVICES-006 — Resolve public URL for R2 key

**Source:** `apps/VCSM/src/services/cloudflare/uploadToCloudflare.js`

```js
publicUrlForKey(key)  // → `${R2_PUBLIC_BASE}/${key}`
```

Used to construct public-facing media URLs without triggering an authenticated upload.

---

## BEH-SERVICES-007 — Request OneSignal push permission

**Source:** `apps/VCSM/src/services/onesignal/onesignalClient.js`

```js
requestPushPermission()
  └── OneSignal.User.PushSubscription.optIn()
```

NotifyButton is explicitly disabled in `initOneSignal.js` — permission is only granted via explicit `requestPushPermission()` call from the app UI.

---

## BEH-SERVICES-008 — Bind OneSignal identity to Supabase user

**Source:** `apps/VCSM/src/services/onesignal/onesignalClient.js`

```js
loginOneSignalExternalUser(externalId)   // binds push subscription to user ID
logoutOneSignalExternalUser()            // unbinds on sign-out
getOneSignalUserId()                     // returns current OneSignal user ID
```

`externalId` is the Supabase `auth.uid()` — used to route notifications to the correct user.

---

## BEH-SERVICES-009 — Initialize Sentry monitoring

**Source:** `apps/VCSM/src/services/monitoring/monitoring.js`

```js
initMonitoring()
  └── Sentry.init({ dsn, tracesSampleRate: 0.10, ... })
```

- Initialized once at app boot
- No-op if `VITE_SENTRY_DSN` env variable is absent (development-safe)
- 10% trace sample rate in production

---

## BEH-SERVICES-010 — Capture error to Sentry

**Source:** `apps/VCSM/src/services/monitoring/monitoring.js`

```js
captureMonitoringError(error, context)
  └── Sentry.captureException(error, { extra: context })
```

Used throughout the app to report unexpected errors with contextual metadata. No-op if Sentry is not initialized.

---

## No Route Entry Points

This module has no screens and no routes. All behaviors are triggered by:
1. App boot calls (initOneSignal, initMonitoring, supabase singleton creation)
2. DAL imports (schema clients, postgrestSafe)
3. Direct call sites (upload, auth session reads, OneSignal identity binding)
