# ARCHITECTURE — services / service
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Classification

| Field | Value |
|-------|-------|
| Type | Infrastructure / Platform Client Layer |
| Pattern | Singleton factory + schema scoping |
| Data access | None (client config only — no direct DB calls) |
| UI | None |
| Stateful | No (clients are stateless singletons) |
| Consumed By | Every DAL file in apps/VCSM |

---

## Layer Stack — Supabase Client Hierarchy

```
apps/VCSM/src/services/supabase/supabaseClient.js
  └── globalThis.__SB_CLIENT__  (HMR-safe singleton)
        │   SDK: @supabase/supabase-js
        │   storageKey: 'sb-auth-main'
        │   persistSession: true
        │   autoRefreshToken: true
        │
        ├── supabase/vcClient.js        → supabase.schema('vc')
        ├── supabase/vportClient.js     → supabase.schema('vport')
        └── supabase/reviewsClient.js   → supabase.schema('reviews')
```

All DAL files in the codebase import from one of these four exports. No DAL creates its own Supabase instance.

---

## Layer Stack — Cloudflare R2

```
cloudflare/uploadToCloudflare.js
  ├── getUploadAuthHeaders()
  │     └── readSupabaseAccessToken()   ← supabase/authSession.js
  │           └── supabase.auth.getSession()
  │
  ├── uploadToCloudflare(file, key)
  │     └── PUT ${CLOUDFLARE_WORKER_URL}/${key}
  │           Authorization: Bearer <supabase_access_token>
  │
  └── publicUrlForKey(key)
        └── ${R2_PUBLIC_BASE_URL}/${key}
```

---

## Layer Stack — OneSignal Push

```
onesignal/initOneSignal.js
  └── OneSignal.init({
        notifyButton: { enable: false },
        serviceWorkerPath: 'OneSignalSDKWorker.js',
        allowLocalhostAsSecureOrigin: true
      })

onesignal/onesignalClient.js
  ├── requestPushPermission()
  │     └── OneSignal.User.PushSubscription.optIn()
  │
  ├── loginOneSignalExternalUser(externalId)
  │     └── OneSignal.login(externalId)      ← externalId = auth.uid()
  │
  ├── logoutOneSignalExternalUser()
  │     └── OneSignal.logout()
  │
  └── getOneSignalUserId()
        └── OneSignal.User.onesignalId
```

---

## Layer Stack — Sentry Monitoring

```
monitoring/monitoring.js
  ├── initMonitoring()
  │     └── Sentry.init({
  │           dsn: VITE_SENTRY_DSN,
  │           tracesSampleRate: 0.10
  │         })
  │         (no-op if DSN absent)
  │
  └── captureMonitoringError(error, context)
        └── Sentry.captureException(error, { extra: context })
              (no-op if Sentry not initialized)
```

---

## Layer Stack — Auth Session + Query Safety

```
supabase/authSession.js
  ├── readSupabaseSession()
  │     └── supabase.auth.getSession() → .data.session
  └── readSupabaseAccessToken()
        └── session.access_token

supabase/postgrestSafe.js
  ├── isUuid(str)           → boolean (regex check)
  ├── assertUuid(str)       → throws Error if not valid UUID
  ├── normalizeSearchTerm(raw)   → trim/lowercase/collapse
  ├── toContainsPattern(term)    → '%term%'
  └── toPrefixPattern(term)      → 'term%'
```

---

## Source File Map

| File | Layer | Key Exports | Lines |
|------|-------|-------------|-------|
| `supabase/supabaseClient.js` | Client singleton | `supabase`, `supabaseDebug` | ~49 |
| `supabase/vcClient.js` | Schema scope | `vcClient` | 7 |
| `supabase/vportClient.js` | Schema scope | `vportClient` | 7 |
| `supabase/reviewsClient.js` | Schema scope | `reviewsClient` | 7 |
| `supabase/authSession.js` | Auth access | `readSupabaseSession`, `readSupabaseAccessToken` | 14 |
| `supabase/postgrestSafe.js` | Query safety | `isUuid`, `assertUuid`, `normalizeSearchTerm`, `toContainsPattern`, `toPrefixPattern` | ~53 |
| `cloudflare/uploadToCloudflare.js` | R2 media | `getUploadAuthHeaders`, `uploadToCloudflare`, `publicUrlForKey` | 80+ |
| `onesignal/onesignalClient.js` | Push identity | `requestPushPermission`, `loginOneSignalExternalUser`, `logoutOneSignalExternalUser`, `getOneSignalUserId` | 80+ |
| `onesignal/initOneSignal.js` | Push init | `initOneSignal` | ~49 |
| `monitoring/monitoring.js` | Error capture | `initMonitoring`, `captureMonitoringError` | ~56 |

---

## External Dependencies

| Library | Purpose | Consumer |
|---------|---------|---------|
| `@supabase/supabase-js` | Supabase client SDK | supabaseClient.js |
| `@sentry/react` | Error monitoring SDK | monitoring.js |
| OneSignal Web SDK | Push notification SDK | onesignalClient.js, initOneSignal.js |
| Fetch API | Cloudflare R2 upload | uploadToCloudflare.js |

---

## Environment Variables

| Variable | Used By | Required |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | supabaseClient.js | YES |
| `VITE_SUPABASE_ANON_KEY` | supabaseClient.js | YES |
| `VITE_SENTRY_DSN` | monitoring.js | NO (no-op if absent) |
| `VITE_CLOUDFLARE_WORKER_URL` | uploadToCloudflare.js | YES (for uploads) |
| `VITE_R2_PUBLIC_BASE_URL` | uploadToCloudflare.js | YES (for public URLs) |

---

## Invariants

1. Only one Supabase client instance may exist — enforced via `globalThis.__SB_CLIENT__`.
2. All DAL files must import from `@/services/supabase/*` — never call `createClient()` directly.
3. `storageKey: 'sb-auth-main'` must not change — changing it invalidates persisted sessions.
4. Cloudflare uploads must use Supabase access token for auth headers — no unsigned uploads.
5. OneSignal `externalId` must always equal `auth.uid()` — no other ID may be used.
6. Sentry must be a no-op if DSN is absent — no initialization failures in development.

---

## Completeness

| Area | Status |
|------|--------|
| Supabase clients | COMPLETE |
| Auth session access | COMPLETE |
| Query safety utilities | COMPLETE |
| Cloudflare R2 upload | COMPLETE |
| OneSignal push | COMPLETE |
| Sentry monitoring | COMPLETE |
| Tests | MISSING — no test coverage for service singletons |
| Ownership documentation | MISSING — no explicit team/owner record |
