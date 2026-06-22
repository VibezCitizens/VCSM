# ACTOR MODEL AUDIT — 2026-06-06
## App: VCSM | Scope: apps/VCSM/src | Type: Read-Only Investigation

---

## SECTION 1 — EXECUTIVE SUMMARY

**Overall Verdict: PARTIAL**

VCSM is substantially actor-first at the core identity, ownership assertion, and routing layers. The canonical ownership gate (`assertActorOwnsVportActorController`) correctly uses `actor_owners` + `actorId` + `kind` verification, and `toPublicIdentity()` exposes only `actorId`, `kind`, `ownerActorId`, and `realmId` — no raw `userId` in the public identity surface.

However, significant drift exists in three areas:

1. **VPORT ownership in several DAL files still uses `owner_user_id = auth.uid()` as the primary authorization filter** instead of `actor_owners`. These are the settings/vport write DAL, settings/profile write DAL, vport core DAL (`listMyVports`), and vport record DAL. Some are defense-in-depth with actor_owners also enforced; others rely solely on `owner_user_id`.

2. **Wanders subsystem is intentionally user-based** (guest-auth anonymous posting) but passes `user.id` into `ownerActorId` fields in two upload controller calls — a semantic mismatch that could cause asset ownership chain errors.

3. **Query cache keys** (`settingsVports`, `settingsProfile`) use `userId` as cache discriminator, which leaks the auth UUID into in-memory React Query key space (dev tools, serialized state).

4. **OneSignal externalId is `user.id`** — this is intentional (stable across actor switches) and documented, but constitutes auth-layer UUID exposure to a third-party push service.

---

## SECTION 2 — USER ID USAGE SUMMARY

| Identifier | Total Hits | Allowed | Risky | Highest Risk Classification |
|---|---|---|---|---|
| `userId` (variable) | ~180 | ~145 | ~35 | OWNERSHIP_DRIFT |
| `user_id` (column) | ~85 | ~70 | ~15 | OWNERSHIP_DRIFT |
| `owner_user_id` (column) | ~45 | ~30 | ~15 | OWNERSHIP_DRIFT |
| `auth.uid()` | 15 | 15 (comments/RLS docs) | 0 | FALSE_POSITIVE (comments only) |
| `user.id` | ~75 | ~60 | ~15 | MONITORING_EXPOSURE / ACTOR_MODEL_BYPASS |
| `ownerUserId` (field) | ~25 | ~20 | ~5 | OWNERSHIP_DRIFT |
| `authUserId` | 0 | 0 | 0 | N/A |

**Notes:**
- `auth.uid()` appears only in code comments describing RLS policies — all are documentation, not code calls. No `auth.uid()` is called in JS source.
- `userId` in `dev/diagnostics/` is excluded from risky counts — diagnostics are dev-only.
- `user.id` passed to OneSignal (`loginOneSignalExternalUser`) is INTENTIONAL and documented in the hook, but constitutes a monitoring exposure.

---

## SECTION 3 — LAYER SUMMARY

| Layer | Total Hits | Allowed | Risky | Risk Level |
|---|---|---|---|---|
| UI (components, screens) | ~15 | ~12 | ~3 | LOW |
| Hooks | ~30 | ~25 | ~5 | MEDIUM |
| Controllers | ~45 | ~38 | ~7 | MEDIUM |
| DAL | ~80 | ~60 | ~20 | HIGH |
| State (identity, providers) | ~40 | ~38 | ~2 | LOW |
| Services | ~10 | ~10 | 0 | NONE |
| Adapters | ~5 | ~5 | 0 | NONE |
| Routes | 0 | 0 | 0 | NONE |
| Monitoring / Analytics | ~8 | ~6 | ~2 | MEDIUM |

---

## SECTION 4 — HIGH-RISK FINDINGS

---

### FINDING-001
- **Title:** Wanders upload controller passes `user.id` as `ownerActorId` — actor model type mismatch
- **Classification:** ACTOR_MODEL_BYPASS
- **Severity:** HIGH
- **File:** `features/wanders/core/controllers/cards.controller.js`
- **Line:** 228
- **Evidence:**
  ```js
  ownerActorId: user.id,
  ```
  This appears inside `publishWandersFromBuilderInCards` where `user.id` (Supabase auth UUID) is passed as `ownerActorId` to `uploadMediaController`. The `ownerActorId` field is expected to be a `vc.actors.id` UUID, not an auth user UUID. These are different namespaces.
- **Data Flow:** Wanders builder UI → `publishWandersFromBuilder` → `uploadMediaController({ ownerActorId: user.id })` → `createMediaAssetController` → inserts into `platform.media_assets(owner_actor_id = user.id)`. This inserts an auth UUID into the actor-keyed `owner_actor_id` column, which will break any downstream actor ownership assertion on that asset.
- **Impact:** Media asset ownership chain is broken. `owner_actor_id` will contain an auth UUID, not an actor UUID. Any ownership gate querying `media_assets` by `owner_actor_id` against `vc.actors` will find no match.
- **Fix Direction:** Replace `ownerActorId: user.id` with `ownerActorId: senderActorId` (already resolved 3 lines earlier in the same function at line 168). `senderActorId` is resolved via `resolveUserActorId(user.id)` which correctly returns the actor UUID.

---

### FINDING-002
- **Title:** Wanders publishWandersFromBuilder controller passes `user.id` as `ownerActorId` — actor model type mismatch (duplicate pattern in different module)
- **Classification:** ACTOR_MODEL_BYPASS
- **Severity:** HIGH
- **File:** `features/wanders/core/controllers/publishWandersFromBuilder.controller.js`
- **Line:** 134
- **Evidence:**
  ```js
  ownerActorId: user.id,
  ```
  Same issue as FINDING-001 but in the standalone `publishWandersFromBuilder.controller.js`. The `user.id` is again passed as `ownerActorId` to `uploadMediaController`.
- **Data Flow:** Wanders builder → `publishWandersFromBuilder` → `uploadMediaController({ ownerActorId: user.id })` → `createMediaAssetController` → `platform.media_assets(owner_actor_id = user.id)`.
- **Impact:** Same as FINDING-001. Auth UUID inserted into actor-keyed column.
- **Fix Direction:** The `senderActorId` is resolved via `resolveUserActorId(user.id)` earlier in this same controller. Replace `ownerActorId: user.id` with `ownerActorId: senderActorId`.

---

### FINDING-003
- **Title:** `vport.core.dal.js:listMyVports` uses `owner_user_id` as primary ownership filter — bypasses `actor_owners`
- **Classification:** OWNERSHIP_DRIFT
- **Severity:** MEDIUM
- **File:** `features/vport/dal/vport.core.dal.js`
- **Line:** 126
- **Evidence:**
  ```js
  .eq("owner_user_id", user.id)
  ```
  The `listMyVports()` function queries `vport.profiles` by `owner_user_id = auth.user.id` without any `actor_owners` check. This is the legacy ownership model.
- **Data Flow:** Settings/vports UI → `listMyVports()` → `vport.profiles WHERE owner_user_id = user.id`.
- **Impact:** If `owner_user_id` on a VPORT profile is stale or mismatched vs the `actor_owners` row, this query will return wrong results. Ownership is not verified via the canonical `actor_owners` chain.
- **Fix Direction:** Replace with `actor_owners → actors(kind='vport') → vport.profiles(actor_id)` join pattern. This pattern is correctly implemented in `settings/vports/dal/vports.read.dal.js:listMyVportsDAL()` — the legacy `vport.core.dal.js` function should be deprecated.

---

### FINDING-004
- **Title:** `vport.read.vportRecords.dal.js:listMyVports` uses `owner_user_id` as ownership filter
- **Classification:** OWNERSHIP_DRIFT
- **Severity:** MEDIUM
- **File:** `features/vport/dal/vport.read.vportRecords.dal.js`
- **Line:** 20
- **Evidence:**
  ```js
  .eq("owner_user_id", user.id)
  ```
- **Data Flow:** Any caller of this `listMyVports()` → `vport.profiles WHERE owner_user_id = user.id`.
- **Impact:** Same as FINDING-003 — legacy ownership model, no `actor_owners` verification.
- **Fix Direction:** Deprecate in favor of `settings/vports/dal/vports.read.dal.js:listMyVportsDAL()` which uses the canonical `actor_owners` chain.

---

### FINDING-005
- **Title:** `settings/vports/dal/vports.write.dal.js` uses `owner_user_id` as write authorization guard for 3 operations
- **Classification:** OWNERSHIP_DRIFT
- **Severity:** MEDIUM
- **File:** `features/settings/vports/dal/vports.write.dal.js`
- **Lines:** 44, 75, 106
- **Evidence:**
  ```js
  .eq("owner_user_id", userId)  // line 44 — setVportBusinessCardSettingsDAL
  .eq("owner_user_id", userId)  // line 75 — setVportDirectoryVisibleDAL
  .eq("owner_user_id", userId)  // line 106 — syncDirectoryVisibleToPublicDetailsDAL
  ```
  These DAL functions get `userId` from `supabase.auth.getUser()` and use it directly as the WHERE clause ownership filter against `vport.profiles.owner_user_id`. The controller layer (`vportBusinessCardSettings.controller.js`, `vportDirectoryVisibility.controller.js`) adds `assertActorOwnsVportActorController` as a defense-in-depth layer, but the DAL layer itself relies on `owner_user_id`.
- **Impact:** Mixed ownership model. The controller uses `actor_owners`; the DAL uses `owner_user_id`. If the controller gate is ever skipped (e.g., by future callers calling the DAL directly), the only remaining check is `owner_user_id`. Additionally, CARNAGE ticket references removing the legacy `owner_user_id` branch from `actor_can_manage_profile` — these DAL calls will need updating before that DB migration is applied.
- **Fix Direction:** Ticket CARNAGE-OWNER-USER-ID-001. DAL should accept verified `actorId` from controller and filter via `actor_owners`. The controller already does the ownership assertion — DAL should trust the actor_id from the assertion result rather than re-deriving from auth.uid().

---

### FINDING-006
- **Title:** `settings/vports/dal/vports.read.dal.js` uses `owner_user_id` for two read operations
- **Classification:** OWNERSHIP_DRIFT
- **Severity:** LOW
- **File:** `features/settings/vports/dal/vports.read.dal.js`
- **Lines:** 111, 134
- **Evidence:**
  ```js
  .eq("owner_user_id", userId)  // line 111 — readVportBusinessCardSettingsDAL
  .eq("owner_user_id", userId)  // line 134 — readVportDirectoryStateDAL
  ```
  These are read-only operations, controllers also call `assertActorOwnsVportActorController` before reaching them in most paths.
- **Impact:** LOW — read-only; defense-in-depth. But ownership not via canonical `actor_owners` chain.
- **Fix Direction:** Same as FINDING-005 — migrate to actor-based query when `owner_user_id` is deprecated from vport schema.

---

### FINDING-007
- **Title:** `join/dal/barberVport.read.dal.js` uses `owner_user_id` for barber join flow
- **Classification:** OWNERSHIP_DRIFT
- **Severity:** LOW
- **File:** `features/join/dal/barberVport.read.dal.js`
- **Lines:** 10, 26
- **Evidence:**
  ```js
  .eq("owner_user_id", userId)             // line 10
  .eq("profile.owner_user_id", userId)     // line 26
  ```
  The file includes a comment: "Join runs before actor provisioning, so this flow must scope by auth user id." This is an acknowledged architectural exception — the join flow happens before actor provisioning.
- **Impact:** LOW (architectural exception, documented). However, this means the join flow operates outside the actor model during bootstrap.
- **Fix Direction:** Document as ALLOWED_EXCEPTION_JOIN_BOOTSTRAP. Long-term, enforce `actor_owners` post-provisioning verification.

---

### FINDING-008
- **Title:** `settings/profile/dal/profile.write.dal.js` uses `owner_user_id` for VPORT profile update
- **Classification:** OWNERSHIP_DRIFT
- **Severity:** MEDIUM
- **File:** `features/settings/profile/dal/profile.write.dal.js`
- **Line:** 35
- **Evidence:**
  ```js
  .eq('owner_user_id', userId)
  ```
  The `updateProfile(subjectId, 'vport', data)` path fetches auth user via `supabase.auth.getUser()` and filters `vport.profiles` by `owner_user_id`. No `actor_owners` verification in this DAL.
- **Data Flow:** Profile settings UI → `useProfileController` → `updateProfile(id, 'vport', ...)` → DAL → `vport.profiles WHERE owner_user_id = userId`.
- **Impact:** VPORT profile updates authorized by `owner_user_id` match, not `actor_owners`. If `owner_user_id` diverges from the canonical ownership chain, unauthorized updates could succeed or legitimate updates fail.
- **Fix Direction:** Controller layer should pass verified `actorId` from identity context; DAL should filter via `actor_id` (which is indexed and actor-canonical).

---

### FINDING-009
- **Title:** `explore/model/search.model.js` exposes `ownerUserId` in public VPORT search result
- **Classification:** PUBLIC_IDENTITY_LEAK
- **Severity:** MEDIUM
- **File:** `features/explore/model/search.model.js`
- **Line:** 48
- **Evidence:**
  ```js
  ownerUserId: row.owner_user_id ?? null,
  ```
  The `mapVportSearchResult()` function maps `owner_user_id` from the DB row into the public-facing `ownerUserId` field of search results. This is returned to the UI and potentially rendered or passed to analytics.
- **Impact:** Auth UUID exposed in public search result objects. Any component receiving search results for VPORTs gets `ownerUserId` — this is the Supabase auth UUID which should never appear in public identity surfaces.
- **Fix Direction:** Remove `ownerUserId` from `mapVportSearchResult`. VPORT search results should be actor-first: expose `actorId` only. VPORT ownership is not needed by the search consumer UI.

---

### FINDING-010
- **Title:** `settings/profile/model/profile.model.js` exposes `ownerUserId` in VPORT profile model
- **Classification:** PUBLIC_IDENTITY_LEAK
- **Severity:** MEDIUM
- **File:** `features/settings/profile/model/profile.model.js`
- **Line:** 73
- **Evidence:**
  ```js
  ownerUserId: row.owner_user_id ?? null,
  ```
  The `mapVportProfile()` function includes `ownerUserId` in the model output. This shape is used by settings UI hooks and may propagate into UI state.
- **Impact:** Auth UUID leaks into settings state, potentially into error logs, React DevTools, or any component consuming the profile model.
- **Fix Direction:** Remove `ownerUserId` from `mapVportProfile`. Settings UI does not need this field — ownership is already enforced at the controller/DAL layer.

---

### FINDING-011
- **Title:** `useOneSignalPush` registers `user.id` (auth UUID) as OneSignal external ID
- **Classification:** MONITORING_EXPOSURE
- **Severity:** MEDIUM
- **File:** `shared/hooks/useOneSignalPush.js`
- **Line:** 66
- **Evidence:**
  ```js
  loginOneSignalExternalUser(user.id)
  ```
  The hook deliberately registers the Supabase auth UUID as the OneSignal external identifier. The comment explicitly justifies this: "user.id is stable across actor switches."
- **Impact:** Auth UUID is sent to a third-party push notification service (OneSignal). This is intentional design but constitutes external exposure of the primary auth identifier. A security note already exists in `features/shell/modules/bottom-bar/docs/SECURITY.md` (TOXIN-BB-001, TASK-2026-06-06-002) about the XSS race window.
- **Fix Direction:** Already tracked as TASK-2026-06-06-002. Consider using a VCSM-generated stable push token (opaque to the auth layer) rather than raw auth UUID. If `user.id` must be used, ensure `loginOneSignalExternalUser` is always called after the SDK freeze (ELEK-001 / BW-BN-001 addressed this).

---

### FINDING-012
- **Title:** `queryKeys.js` uses `userId` as cache key discriminator for settings queries — auth UUID in React Query key space
- **Classification:** MONITORING_EXPOSURE
- **Severity:** LOW
- **File:** `queries/queryKeys.js`
- **Lines:** 6, 32, 36
- **Evidence:**
  ```js
  actorContext: (userId) => ['identity', 'engine-ctx', userId],
  settingsProfile: (userId) => ['settings', 'profile', userId],
  settingsVports: (userId) => ['settings', 'vports', userId],
  ```
- **Impact:** Auth UUID is embedded in React Query cache keys. While not transmitted externally, it appears in React Query DevTools, can be serialized to localStorage by dehydrated query state, and creates a minor enumeration risk in dev environments.
- **Fix Direction:** Use `actorId` as cache key discriminator instead of `userId` for `settingsProfile` and `settingsVports`. The `actorContext` key is internal to the identity resolution system and is lower risk (not shared with UI hooks).

---

### FINDING-013
- **Title:** `identityContext.jsx` logs `user.id` in DEV console — identity resolution debug
- **Classification:** MONITORING_EXPOSURE
- **Severity:** LOW
- **File:** `state/identity/identityContext.jsx`
- **Line:** 109
- **Evidence:**
  ```js
  message: user?.id ? `User changed to ${user.id.slice(0, 8)}` : "User became null",
  ```
  This only fires in DEV mode (inside `debugLoginEvent`), and only prints the first 8 characters.
- **Impact:** NEGLIGIBLE — DEV-only, truncated UUID. Not a production concern.
- **Fix Direction:** FALSE_POSITIVE — DEV-only debug event, truncated UUID.

---

### FINDING-014
- **Title:** `ProtectedRoute.jsx` logs `userId: user?.id` to iOS prod debug log
- **Classification:** MONITORING_EXPOSURE
- **Severity:** LOW
- **File:** `app/guards/ProtectedRoute.jsx`
- **Lines:** 24, 44
- **Evidence:**
  ```js
  userId: user?.id ?? null,
  ```
  `appendIOSProdDebugLog` is called with `userId` inside effects. This function writes to a prod-accessible debug log on iOS.
- **Impact:** Auth UUID written to iOS production debug log. Depending on the storage mechanism of `appendIOSProdDebugLog`, this may persist to device storage or be retrievable by device-level forensics. Not externally transmitted.
- **Fix Direction:** Replace `userId: user?.id` with `hasUser: !!user` or use `actorId` from identity context instead of raw auth UUID in prod debug logs.

---

### FINDING-015
- **Title:** `identity.model.js:getIdentityEngineContext` exposes `userId` in engine context object
- **Classification:** PUBLIC_IDENTITY_LEAK
- **Severity:** LOW
- **File:** `state/identity/identity.model.js`
- **Line:** 17
- **Evidence:**
  ```js
  userId: meta.userId ?? null,
  ```
  The `getIdentityEngineContext()` function returns an object with `userId` field. This object is used by `switchActorController` and the identity resolution system.
- **Impact:** The `userId` in the engine context is used internally for actor switching logic (comparing `identityUserId !== user.id` as a session ownership validation guard at line 153 of `useIdentityResolutionEffect.hook.js`). It is NOT exposed through `toPublicIdentity()` or `useIdentity()`. However, it is returned from `getIdentityEngineContext()` which is exported from the model — any future consumer of this export would receive the auth UUID.
- **Fix Direction:** The internal use is legitimate (session ownership guard). Restrict `getIdentityEngineContext` to internal module use only, or rename to `_getIdentityEngineContextInternal` to signal it should not be consumed externally. Consider stripping `userId` from the returned shape if callers only need `actorId`/`availableActors`.

---

### FINDING-016
- **Title:** `wanders/core/controllers/createWandersCard.controller.js` passes `ownerUserId: user.id` to mailbox write
- **Classification:** OWNERSHIP_DRIFT
- **Severity:** LOW
- **File:** `features/wanders/core/controllers/createWandersCard.controller.js`
- **Line:** 73
- **Evidence:**
  ```js
  ownerUserId: user.id,
  ```
  Wanders is a guest-auth system where identity is `auth.users.id`. The `ownerUserId` field in mailbox rows is legitimate for the wanders domain (the DB table has `owner_user_id` column). This is by design.
- **Impact:** LOW — this is the intended wanders ownership model. The wanders system is explicitly user-based (guest-auth). However, the `ownerActorId` field is not populated in this call, creating an asymmetric ownership record.
- **Fix Direction:** FALSE_POSITIVE for the user_id usage in wanders — that system is intentionally user-based. However, the inconsistent population of `ownerActorId` vs `ownerUserId` in the same mailbox row should be documented as an architectural debt item.

---

## SECTION 5 — OWNERSHIP MODEL AUDIT

### Files using `actor_owners` for ownership (ALLOWED):

| File | Pattern |
|---|---|
| `features/booking/controller/assertActorOwnsVportActor.controller.js` | Full `actor_owners` DB query via `readActorOwnerLinkByActorAndUserProfileDAL` |
| `features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js` | `actor_owners WHERE actor_id + user_id` |
| `features/booking/dal/readOwnerLinkByActorAndSession.dal.js` | `actor_owners WHERE actor_id + profile.id` (session-derived) |
| `features/settings/vports/dal/vports.read.dal.js:listMyVportsDAL` | `actor_owners → actors → vport.profiles` join |
| `features/settings/vports/dal/vports.read.dal.js:readMyVports` | `actor_owners → actors → vport.profiles` join |
| `features/settings/vports/dal/actorOwners.read.dal.js` | `actor_owners WHERE user_id` |
| `features/dashboard/vport/dal/read/actorOwners.read.dal.js` | `actor_owners WHERE actor_id` |
| `features/settings/vports/controller/vportBusinessCardSettings.controller.js` | `assertActorOwnsVportActorController` |
| `features/settings/vports/controller/vportDirectoryVisibility.controller.js` | `assertActorOwnsVportActorController` |
| `features/settings/vports/controller/vportSocialSettings.controller.js` | `assertActorOwnsVportActorController` |
| `features/settings/account/controller/account.controller.js` | `assertActorOwnsVportActorController` |
| `features/settings/privacy/controller/actorPrivacy.controller.js` | `assertActorOwnsVportActorController` |
| `features/booking/controller/confirmBooking.controller.js` | `assertActorOwnsVportActorController` |
| `features/booking/controller/cancelBooking.controller.js` | `assertActorOwnsVportActorController` |
| `features/booking/controller/setAvailabilityRule.controller.js` | `assertActorOwnsVportActorController` |
| `features/dashboard/vport/controller/checkVportOwnership.controller.js` | `assertActorOwnsVportActorController` |
| `features/dashboard/vport/controller/vportOwnerStats.controller.js` | `assertActorOwnsVportActorController` |
| `features/portfolio/setup.js` | `actor_owners` RLS + explicit query |
| `features/reviews/setup.js` | `actor_owners` RLS |
| `features/hydration/vcsmActorHydrator.js` | `readActorOwnerUserDAL(actor.id)` |
| `state/identity/identity.read.dal.js:readActorOwnerUserDAL` | `actor_owners WHERE actor_id` |

### Files using `owner_user_id` or `user_id` for ownership (DRIFT — see findings):

| File | Pattern | Risk |
|---|---|---|
| `features/vport/dal/vport.core.dal.js:listMyVports` | `vport.profiles WHERE owner_user_id = user.id` | MEDIUM |
| `features/vport/dal/vport.read.vportRecords.dal.js:listMyVports` | `vport.profiles WHERE owner_user_id = user.id` | MEDIUM |
| `features/settings/vports/dal/vports.write.dal.js` (3 functions) | `WHERE owner_user_id = userId` | MEDIUM |
| `features/settings/vports/dal/vports.read.dal.js` (2 functions) | `WHERE owner_user_id = userId` | LOW |
| `features/settings/profile/dal/profile.write.dal.js` | `WHERE owner_user_id = userId` (vport mode) | MEDIUM |
| `features/join/dal/barberVport.read.dal.js` | `WHERE owner_user_id = userId` (acknowledged exception) | LOW |

---

## SECTION 6 — PUBLIC IDENTITY AUDIT

### `toPublicIdentity()` — `/state/identity/identity.model.js:1-10`

**CLEAN.** Returns only: `{ actorId, kind, ownerActorId, realmId }`.

No `userId`, `ownerUserId`, `owner_user_id`, or `authUserId` in the public identity shape. This is correctly actor-first.

### `identityContext.jsx` — `useIdentity()` hook

**CLEAN.** The context value exposed by `useIdentity()` is:
```js
{ identity, loading, identityLoading, setIdentity, switchActor, availableActors, refreshAvailableActors, blockedVport }
```

`identity` is the output of `toPublicIdentity()` — `{ actorId, kind, ownerActorId, realmId }`. No userId exposed.

`identityDetails` (raw) is exposed via the deprecated `useIdentityDetailsDeprecated()` and contains the full model including `_engineMeta.userId`. This is only available through the deprecated hook, not through `useIdentity()`.

### `getIdentityEngineContext()` — `/state/identity/identity.model.js:12-26`

**DRIFT (LOW).** This exported function returns `{ userId, userAppAccountId, availableActors, activeActor }`. The `userId` field is the auth UUID. Used internally by `switchActorController` for session ownership validation. Not consumed through the `useIdentity()` hook surface. Risk is that future callers of this exported function would receive the auth UUID. See FINDING-015.

### `useIdentityDisplayDeprecated()` — `identityContext.jsx:187-199`

**CLEAN.** Returns only display fields: `{ displayName, username, avatar, banner, vportType, isActive, isDeleted, isVoid }`. No userId.

### `useIdentityDetailsDeprecated()` — `identityContext.jsx:183-185`

**RISK (LOW).** Returns the full `identityDetails` object including `_engineMeta.userId`. This is the deprecated hook — callers include `useAccountController.js` and `useProfileUploads.js`. These callers use only display fields, not the userId. But the full `identityDetails` shape including `_engineMeta.userId` is accessible to any consumer of this hook.

---

## SECTION 7 — ROUTE EXPOSURE AUDIT

No routes containing `:userId`, `/user/:userId`, or `/users/:userId` were found.

All route searches returned zero results:
- `rg -n ":userId" .` → 0 results
- `rg -n "/user/" .` → 0 results
- `rg -n "/users/" .` → 0 results

**VERDICT: ROUTE_CLEAN** — No userId-based URL parameters in any route definition.

---

## SECTION 8 — MONITORING / ANALYTICS AUDIT

### Sentry (`services/monitoring/monitoring.js`)
- `Sentry.init()` has `sendDefaultPii` intentionally omitted (defaults `false`) — no PII auto-capture.
- `captureMonitoringError(error, context)` sends only error + context object. No user ID is passed to Sentry.
- **VERDICT: CLEAN** — Sentry does not receive `user.id` or actor IDs through the monitoring adapter.

### `captureFrontendError` (`services/monitoring/monitoringClient.js`)
- Calls the custom `monitoring-ingest-error` Edge Function via Supabase functions.
- PII scrubbing is applied: `stripPii()` removes fields like `password`, `token`, `email`, etc.
- `userId` and `actorId` are NOT in the `PII_KEYS` set — they would pass through if included in `context` or `tags`.
- Callers (auth hooks) pass `feature`, `module`, `controller`, `route` metadata — inspection of call sites shows no `userId`/`actorId` passed in context objects.
- **VERDICT: CONDITIONALLY_CLEAN** — The PII scrubber does not strip `userId`. If future callers pass `context: { userId }`, it will be transmitted. Recommend adding `userId`, `user_id`, `actorId`, `actor_id` to `PII_KEYS`.

### OneSignal (`shared/hooks/useOneSignalPush.js`)
- `loginOneSignalExternalUser(user.id)` — auth UUID sent to OneSignal as external ID.
- This is intentional and documented (comment on line 60-63 explains the rationale).
- Existing security tracking: TOXIN-BB-001 (MEDIUM), TASK-2026-06-06-002 (OPEN).
- **VERDICT: EXPOSURE_ACKNOWLEDGED** — Auth UUID is sent to third-party service. Tracked.

### Analytics (`features/analytics/funnelSource.js`)
- Only `setFunnelSource()` is called from public/landing screens (VportCategoryLandingScreen, HowToCreateVportScreen, HowToCreateProfileScreen).
- No userId, actorId, or personal data found in analytics calls.
- **VERDICT: CLEAN** — Analytics events are funnel/page-level, no identity data.

### iOS Prod Debug Log
- `appendIOSProdDebugLog('protected_route_state', { userId: user?.id })` — in `ProtectedRoute.jsx` lines 24, 44.
- Auth UUID written to prod iOS debug log. See FINDING-014.
- **VERDICT: LOW_RISK** — Device-local write, not transmitted externally, but auth UUID in prod log.

---

## SECTION 9 — RECOMMENDED TICKETS

### P0 — Security (auth bypass, ownership bypass, identity leak)
*(None found at P0 severity — no auth bypass or critical ownership bypass confirmed)*

### P1 — Identity Contract Violations

**TICKET-ACTOR-001** — Remove `ownerUserId` from `mapVportSearchResult()` in `explore/model/search.model.js:48`.
- Risk: PUBLIC_IDENTITY_LEAK — auth UUID in public-facing search result shape.

**TICKET-ACTOR-002** — Remove `ownerUserId` from `mapVportProfile()` in `settings/profile/model/profile.model.js:73`.
- Risk: PUBLIC_IDENTITY_LEAK — auth UUID in settings profile model shape.

**TICKET-ACTOR-003** — Fix `ownerActorId: user.id` in `features/wanders/core/controllers/cards.controller.js:228`.
- Risk: ACTOR_MODEL_BYPASS — auth UUID inserted into actor-keyed media asset column.

**TICKET-ACTOR-004** — Fix `ownerActorId: user.id` in `features/wanders/core/controllers/publishWandersFromBuilder.controller.js:134`.
- Risk: ACTOR_MODEL_BYPASS — same as TICKET-ACTOR-003, different module.

### P2 — Ownership Drift

**TICKET-DRIFT-001** — Deprecate `features/vport/dal/vport.core.dal.js:listMyVports` and `features/vport/dal/vport.read.vportRecords.dal.js:listMyVports` — both use `owner_user_id` as primary ownership filter. Redirect callers to `settings/vports/dal/vports.read.dal.js:listMyVportsDAL`.

**TICKET-DRIFT-002** — Migrate `settings/vports/dal/vports.write.dal.js` (3 write operations) from `owner_user_id` filter to actor-based authorization. Requires CARNAGE ticket for DB migration coordination before removing `owner_user_id` from `actor_can_manage_profile`.

**TICKET-DRIFT-003** — Migrate `settings/profile/dal/profile.write.dal.js:updateProfile(vport mode)` from `owner_user_id` filter to actor-id based authorization.

**TICKET-DRIFT-004** — Add `userId`, `user_id`, `actorId`, `actor_id` to `PII_KEYS` in `services/monitoring/monitoringClient.js` to prevent future callers from leaking identity into monitoring.

### P3 — Architecture Cleanup

**TICKET-ARCH-001** — Restrict `getIdentityEngineContext()` export visibility or strip `userId` from returned shape (`state/identity/identity.model.js:17`).

**TICKET-ARCH-002** — Replace `userId: user?.id` with `hasUser: !!user` in `ProtectedRoute.jsx` iOS prod debug log calls.

**TICKET-ARCH-003** — Replace `userId`-keyed React Query cache keys (`settingsVports`, `settingsProfile`) with `actorId`-keyed keys in `queries/queryKeys.js`. Callers (`useVportsList`, `useProfileSettings`) should pass `identity.actorId` instead of `user.id`.

**TICKET-ARCH-004** — Document `features/join/dal/barberVport.read.dal.js` as an acknowledged ALLOWED_EXCEPTION_JOIN_BOOTSTRAP and add a CARNAGE review item to enforce `actor_owners` post-provisioning verification.

**TICKET-ARCH-005** — Implement opaque stable push token for OneSignal instead of raw `user.id` (auth UUID). This removes the auth UUID from the third-party service. Track with TASK-2026-06-06-002.

---

## FINAL VERDICT

**ACTOR_FIRST_WITH_DRIFT**

VCSM's core ownership gate (`assertActorOwnsVportActorController`), public identity surface (`toPublicIdentity`), and route layer are actor-first and correctly implemented. The `actor_owners` table is consistently used for ownership assertions in the booking, settings, and dashboard controller layers.

Drift is concentrated in: legacy DAL functions (`vport.core.dal.js`, `vport.read.vportRecords.dal.js`) that use `owner_user_id` as ownership filter; certain settings write DALs that rely on `owner_user_id` instead of the canonical actor chain; model functions that leak `ownerUserId` into public shapes; and two wanders controller calls that pass `user.id` as an `ownerActorId` (wrong type/namespace).

None of the findings constitute a complete ownership bypass — in all risky cases, either RLS policies or controller-layer `assertActorOwnsVportActorController` calls provide compensating controls. The findings represent architecture debt that will become blocking issues when the DB `owner_user_id` column is deprecated (CARNAGE ticket already notes this).

---

*Audit completed: 2026-06-06 | Scope: apps/VCSM/src | Method: Read-Only Source Trace*
*Report path: ZZnotforproduction/APPS/VCSM/security/ACTOR_MODEL_AUDIT_2026-06-06.md*
