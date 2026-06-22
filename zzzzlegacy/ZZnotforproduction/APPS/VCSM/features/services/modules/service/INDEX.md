# INDEX — services / service
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Summary

| Field | Value |
|-------|-------|
| Module | service |
| Feature | services |
| Type | Infrastructure / Platform Client Layer |
| Source Directory | apps/VCSM/src/services/ |
| Source Files | 14 |
| Screens | 0 |
| Routes | 0 |
| DB Tables | None (client configuration only) |
| External Services | Supabase, Cloudflare R2, OneSignal, Sentry |
| Consumed By | Every DAL file in the VCSM app |
| Governance Status | SOURCE_VERIFIED |

---

## Purpose

This module owns the **singleton client instances** for all external services consumed by the VCSM app. It is infrastructure — not a feature domain. It has no UI, no controllers, no business logic, and no direct DB writes.

Every DAL file in the app imports from this module to get its client. No DAL should instantiate its own client.

---

## Source File Inventory

### Supabase Clients

| File | Lines | Exports | Purpose |
|------|-------|---------|---------|
| `supabase/supabaseClient.js` | ~49 | `supabase`, `supabaseDebug` | Main singleton; HMR-safe via globalThis.__SB_CLIENT__; storageKey 'sb-auth-main'; persistent session + autoRefresh |
| `supabase/vcClient.js` | 7 | `vcClient` | schema('vc') wrapper — VCSM core schema |
| `supabase/vportClient.js` | 7 | `vportClient` | schema('vport') wrapper — VPORT schema |
| `supabase/reviewsClient.js` | 7 | `reviewsClient` | schema('reviews') wrapper — reviews schema |
| `supabase/authSession.js` | 14 | `readSupabaseSession`, `readSupabaseAccessToken` | Auth session read wrappers |
| `supabase/postgrestSafe.js` | ~53 | `isUuid`, `assertUuid`, `normalizeSearchTerm`, `toContainsPattern`, `toPrefixPattern` | UUID validation + PostgREST search query normalization |

### Cloudflare R2

| File | Lines | Exports | Purpose |
|------|-------|---------|---------|
| `cloudflare/uploadToCloudflare.js` | 80+ | `getUploadAuthHeaders`, `uploadToCloudflare`, `publicUrlForKey` | R2 media upload + public URL resolution |
| `cloudflare/index.js` | — | barrel | Re-exports cloudflare utilities |

### OneSignal

| File | Lines | Exports | Purpose |
|------|-------|---------|---------|
| `onesignal/onesignalClient.js` | 80+ | `requestPushPermission`, `loginOneSignalExternalUser`, `logoutOneSignalExternalUser`, `getOneSignalUserId` | Push notification permission + user identity binding |
| `onesignal/initOneSignal.js` | ~49 | `initOneSignal` | SDK initialization; notifyButton disabled; serviceWorkerPath: 'OneSignalSDKWorker.js'; allowLocalhostAsSecureOrigin: true |

### Monitoring

| File | Lines | Exports | Purpose |
|------|-------|---------|---------|
| `monitoring/monitoring.js` | ~56 | `initMonitoring`, `captureMonitoringError` | Sentry adapter; 10% sample rate; no-op when DSN absent |

### Barrels

| File | Purpose |
|------|---------|
| `index.js` | Root barrel |
| `supabase/index.js` | Supabase barrel |
| `cloudflare/index.js` | Cloudflare barrel |

---

## Import Paths (Public API)

| Import Path | Exports |
|-------------|---------|
| `@/services/supabase/supabaseClient` | `supabase`, `supabaseDebug` |
| `@/services/supabase/vcClient` | `vcClient` |
| `@/services/supabase/vportClient` | `vportClient` |
| `@/services/supabase/reviewsClient` | `reviewsClient` |
| `@/services/supabase/authSession` | `readSupabaseSession`, `readSupabaseAccessToken` |
| `@/services/supabase/postgrestSafe` | `isUuid`, `assertUuid`, `normalizeSearchTerm`, `toContainsPattern`, `toPrefixPattern` |
| `@/services/cloudflare/uploadToCloudflare` | `getUploadAuthHeaders`, `uploadToCloudflare`, `publicUrlForKey` |
| `@/services/onesignal/onesignalClient` | `requestPushPermission`, `loginOneSignalExternalUser`, `logoutOneSignalExternalUser`, `getOneSignalUserId` |
| `@/services/onesignal/initOneSignal` | `initOneSignal` |
| `@/services/monitoring/monitoring` | `initMonitoring`, `captureMonitoringError` |

---

## External Service Clients

| Service | SDK | Config |
|---------|-----|--------|
| Supabase | `@supabase/supabase-js` | storageKey: 'sb-auth-main', persistent session, autoRefresh |
| Cloudflare R2 | Fetch API + auth headers | Auth via Supabase access token |
| OneSignal | OneSignal Web SDK | serviceWorkerPath: 'OneSignalSDKWorker.js' |
| Sentry | `@sentry/react` | 10% sample rate; no-op if DSN absent |

---

## Governance Files

| File | Status |
|------|--------|
| INDEX.md | SOURCE_VERIFIED |
| BEHAVIOR.md | SOURCE_VERIFIED |
| ARCHITECTURE.md | SOURCE_VERIFIED |
| SECURITY.md | SOURCE_VERIFIED |
