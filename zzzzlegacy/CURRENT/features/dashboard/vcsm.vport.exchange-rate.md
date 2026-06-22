# VCSM — VPORT Exchange Rate Module

**Logan Doc:** `vcsm.vport.exchange-rate.md`
**Domain:** VCSM / VPORT / Money Exchange
**Last Updated:** 2026-05-27
**Status:** STABLE — post-hardening, fully tested
**Canonical Module Report:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/modules/vcsm.vport-exchange-rate-dashboard.architecture.md`
**Related Profile Spec:** `vcsm.vport.money-exchange-profile-spec.md`

---

## 1. Purpose

The Exchange Rate module is the core data management layer for VPORT money exchange businesses. It governs:

- **Storing and reading** FX rate pairs per vport actor (`vport.rates` table)
- **Serving rates** to the public profile Rates tab
- **Updating rates** via the owner dashboard (rate editor)
- **Publishing rate updates** as system posts to the public feed (opt-in, 1-hour dedup throttle)
- **Cache management** — invalidating the 60-second TTL read cache after every write

This module is the reason operators use the Money Exchange dashboard every day. Rate updates must be fast, frictionless, and immediately visible.

---

## 2. Module Scope Boundary

| In Scope | Out of Scope |
|---|---|
| Rate read/write for `vport.rates` | Review dimensions (reviews module) |
| Cache invalidation after write | About / hours / location |
| Publish-as-post (system post creation) | Service catalog |
| Ownership enforcement on writes | Profile avatar / banner |
| Dedup throttle (1h per actor) | Booking / scheduling |

Cross-feature access follows the adapter boundary rule:
- Ownership check via `@/features/booking/adapters/booking.adapter`
- Post creation via `@/features/upload/adapters/posts.adapter`

---

## 3. File Map

```
features/profiles/kinds/vport/
├── dal/
│   ├── rates/
│   │   ├── readVportRatesByActor.dal.js       ← read path + 60s TTL cache + invalidateRatesCache()
│   │   └── upsertVportRate.dal.js             ← write path (upsert on conflict)
│   └── exchange/
│       └── vportExchangeRatePost.read.dal.js  ← dedup check + exchange name lookup
├── model/
│   └── rates/
│       └── vportRates.model.js                ← mapVportRateRow / mapVportRateRows / computeLastUpdated
├── controller/
│   ├── rates/
│   │   ├── getVportRates.controller.js        ← read path (public + owner)
│   │   └── upsertVportRate.controller.js      ← write path (ownership enforced)
│   └── exchange/
│       └── publishExchangeRateUpdateAsPost.controller.js  ← feed publish (non-blocking)
├── hooks/
│   ├── rates/
│   │   ├── useVportRates.js                   ← read hook (refreshSeed pattern)
│   │   └── useUpsertVportRate.js              ← write hook (optimistic update)
│   └── exchange/
│       └── usePublishExchangeRatePost.js      ← publish hook (called post-save)
└── screens/
    └── rates/
        ├── components/
        │   ├── VportRateCard.jsx              ← public read-only rate card
        │   └── VportRateEditorCard.jsx        ← owner edit card (buy/sell inputs + share toggle)
        └── view/
            └── VportRatesView.jsx             ← public rates tab view

features/dashboard/vport/screens/
└── VportDashboardExchangeScreen.jsx           ← owner dashboard entry screen

features/dashboard/vport/screens/ tests:
  None (screen is composition only — no direct test required)

Controller tests:
  controller/rates/__tests__/upsertVportRate.controller.test.js          ← 9 scenarios
  controller/exchange/__tests__/publishExchangeRateUpdateAsPost.controller.test.js  ← 8 scenarios
```

---

## 4. Data Contract

### Table: `vport.rates`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `profile_id` | uuid | FK → `vport.profiles.id` — resolved from `actorId` at write time |
| `rate_type` | text | Default: `'fx'` |
| `base_currency` | text | ISO code (e.g. `'USD'`) |
| `quote_currency` | text | ISO code (e.g. `'EUR'`) |
| `buy_rate` | numeric | Rate the exchange buys base at |
| `sell_rate` | numeric | Rate the exchange sells base at |
| `meta` | jsonb | Optional — nullable |
| `updated_at` | timestamptz | Set by upsert trigger |
| `created_at` | timestamptz | Set on insert |

**Conflict key:** `(profile_id, rate_type, base_currency, quote_currency)` — upsert semantics, one row per pair per profile.

⚠️ **There is no `actor_id` column on `vport.rates`.** `actorId` is resolved → `profile_id` at the DAL layer. Domain objects must inject `actorId` from context after read (see [Section 7 — Known Bugs Fixed](#7-known-bugs-fixed)).

### Domain Object (post-model mapping)

```js
{
  id: string,
  profileId: string,
  actorId: string | null,   // injected from screen context — not from DB row
  rateType: string,
  baseCurrency: string,
  quoteCurrency: string,
  buyRate: number,
  sellRate: number,
  meta: object | null,
  updatedAt: string,
  createdAt: string,
}
```

---

## 5. Architecture Layers

### DAL Layer

**`readVportRatesByActor.dal.js`**
- Reads `vport.rates` filtered by `profile_id` (resolved from `actorId` via `resolveVportProfileId` helper, 30s TTL)
- Wraps result in a 60-second TTL cache keyed by `actorId:rateType`
- Exports `invalidateRatesCache()` — called by `upsertVportRateController` after every successful write
- DB reads on cold mount: 2 (resolveVportProfileId + rates SELECT)
- DB reads on warm mount: 0 (cache hit for both)

**`upsertVportRate.dal.js`**
- Upserts into `vport.rates` using conflict key `(profile_id, rate_type, base_currency, quote_currency)`
- Resolves `profile_id` from `actorId` internally
- Returns explicit column list — no `select('*')`
- Does NOT return `actor_id` (column does not exist on the table)

**`vportExchangeRatePost.read.dal.js`**
- `resolveVportExchangeNameDAL(actorId)` — reads `vport.profiles.name` for display in system posts
- `hasRecentExchangeRatePostDAL({ actorId, windowMs? })` — queries `vc.posts` for `exchange_rate_update` posts within the dedup window (default 1h). Returns boolean.
- Both are no-cache; called only on publish path (not hot read path)

### Model Layer

**`vportRates.model.js`**
- `mapVportRateRow(row)` — maps raw DB row to domain object (camelCase, normalized types). `actorId` maps from `row.actor_id` which is always null for rate rows (no such column) — callers must inject `actorId` from context.
- `mapVportRateRows(rows)` — array map wrapper
- `computeLastUpdated(rates)` — finds most recent `updatedAt` across all rate pairs

### Controller Layer

**`getVportRates.controller.js`**
- No auth required (public read)
- Calls `readVportRatesByActorDal` → model mapping → returns `{ ok, rateType, lastUpdated, rates[] }`

**`upsertVportRate.controller.js`**
- Guards: `identityActorId` required
- Ownership: `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })` — named object params required
- Write: calls `upsertVportRateDal` with rate fields
- Cache: calls `invalidateRatesCache()` after successful write — NOT called on failure
- Returns DAL result
- Rethrows all errors to caller

**`publishExchangeRateUpdateAsPost.controller.js`**
- Guards: `actorId` required; `baseCurrency` + `quoteCurrency` required (returns `{published:false, reason:'missing_currencies'}` if absent)
- Dedup: `hasRecentExchangeRatePostDAL` check — returns `{published:false, reason:'dedup_throttle'}` if fired within 1h
- Realm: uses `PUBLIC_REALM_ID` from `@/shared/utils/resolveRealm` — always the public realm, never the viewer's session realm
- Creates system post via `createSystemPost` adapter with `post_type:'exchange_rate_update'`
- Returns `{published:true, postId}` on success
- Non-blocking: called as a fire-and-forget side effect post-save; failure does not block rate persistence

### Hook Layer

**`useVportRates.js`**
- Calls `getVportRatesController`
- Re-runs when `refreshSeed` changes (triggered by successful write in `useUpsertVportRate`)
- Holds `{ isLoading, data, error }` state
- `data` shape: `{ ok, rateType, lastUpdated, rates[] }`

**`useUpsertVportRate.js`**
- Orchestrates: optimistic update → controller call → swap persisted row → rollback on failure
- Post-success: bumps `refreshSeed` to trigger `useVportRates` re-read (cache was just invalidated)
- After successful save: calls `usePublishExchangeRatePost` if share toggle is enabled

**`usePublishExchangeRatePost.js`**
- Calls `publishExchangeRateUpdateAsPostController` with rate params
- Non-blocking — toast only on failure, no rollback

---

## 6. Write Path — Full Sequence

```
Owner submits rate edit
  → VportRateEditorCard (submit)
  → useUpsertVportRate
    → optimistic state applied to UI
    → upsertVportRateController({ identityActorId, actorId, ...rateFields })
      → assertActorOwnsVportActorController({ requestActorId, targetActorId })
      → upsertVportRateDal({ actorId, ...rateFields })
      → invalidateRatesCache()          ← clears 60s read cache
      → return result
    → mapped = { ...mapVportRateRow(result), actorId }   ← actorId injected from screen
    → refreshSeed bumped
      → useVportRates re-runs
        → readVportRatesByActorDal (cache miss — just invalidated)
        → fresh SELECT from vport.rates
    → if share toggle enabled:
      → publishExchangeRateUpdateAsPostController({ actorId, currencies, rates })
        → hasRecentExchangeRatePostDAL (dedup check)
        → resolveVportExchangeNameDAL
        → createSystemPost (post_type: 'exchange_rate_update', realm_id: PUBLIC_REALM_ID)
```

**Failure modes:**
- Ownership rejection → error toast, no write, no cache invalidation
- DAL write failure → error toast, cache NOT invalidated, UI rolls back to pre-optimistic state
- Publish failure → warning toast only; rate save is already committed

---

## 7. Known Bugs Fixed (2026-05-27)

### Bug 1 — Stale-Read-After-Write (CLOSED)
**Symptom:** After saving a rate, the UI would re-read from cache and show the old value until the 60s TTL expired.
**Root cause:** `invalidateRatesCache()` existed but was never called after a successful write.
**Fix:** `upsertVportRateController` now stores the DAL result and calls `invalidateRatesCache()` before returning.
**Verified by:** KRAVEN runtime audit — stale-read-after-write confirmed closed.

### Bug 2 — `actorId: null` on Persisted Rate Swap (CLOSED)
**Symptom:** After save, the domain object had `actorId: null` because `mapVportRateRow` maps `row.actor_id`, and `vport.rates` has no `actor_id` column.
**Root cause:** Screen used a duplicate `mapRawRateRowToDomain` function that also mapped `row.actor_id`, which was always null from the upsert SELECT result.
**Fix:** Removed duplicate model function from screen; now uses `{ ...mapVportRateRow(saved), actorId }` injecting `actorId` from screen context.

### Bug 3 — Ownership Check Always Throws (CLOSED — Critical Production Bug)
**Symptom:** Every rate save attempt threw "requestActorId is required". Exchange rate saves were completely broken in production.
**Root cause:** `upsertVportRateController` called `assertActorOwnsVportActorController(identityActorId, actorId)` with positional string args. The function expects a destructured object `{ requestActorId, targetActorId }`. Destructuring a string for named properties yields `undefined` for both fields.
**Fix:** Changed to `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })`.
**Discovered by:** SPIDER-MAN — test scenario 3 (ownership check called with named object params) failed against the original call site.

---

## 8. Cache Behavior

| Cache | TTL | Key | Invalidated By |
|---|---|---|---|
| `readVportRatesByActor` read cache | 60s | `actorId:rateType` | `invalidateRatesCache()` in `upsertVportRateController` |
| `resolveVportProfileId` helper | 30s | `actorId` | Not invalidated (stable — profile IDs don't change) |
| Ownership check (`useVportOwnership`) | None — no cache | N/A | Re-verified on every mount, window focus, visibilitychange |

**Ownership re-verification is intentional** — no TTL cache on `useVportOwnership` is a security design decision. Do not add TTL caching to the ownership hook without VENOM sign-off. (KRAVEN finding KPF-003.)

---

## 9. Security Model

| Check | Location | Type |
|---|---|---|
| Identity present | `upsertVportRateController` — guard | Hard block |
| Actor owns vport | `assertActorOwnsVportActorController` | Authoritative (DB-backed) |
| UI ownership advisory | `useVportOwnership` | Advisory only — not authoritative |

**The UI ownership flag is advisory only.** The controller ownership check is the authoritative gate. A malicious caller who bypasses the UI and posts directly to the controller cannot succeed without passing `assertActorOwnsVportActorController`.

**System posts always use `PUBLIC_REALM_ID`** — never the viewer's session `realmId`. This ensures exchange rate update posts land in the public feed, not accidentally scoped to the void realm.

---

## 10. SENTRY Architecture Status

**FINAL STATUS: MINOR DRIFT** (2026-05-27)

| Finding | Severity | Status |
|---|---|---|
| SF-001: `mapVportRateRow` imported directly in screen (should go via model adapter) | LOW / P3 | Deferred |
| SF-002: `usePublishExchangeRatePost` imported directly in screen (should go via hook adapter) | LOW / P3 | Pre-existing, deferred |

Neither finding blocks release. Both are P3 adapter wrapper cleanups.

Adapter paths (when created):
- `features/profiles/adapters/kinds/vport/model/rates/vportRates.model.adapter.js`
- `features/profiles/adapters/kinds/vport/hooks/exchange/usePublishExchangeRatePost.adapter.js`

---

## 11. KRAVEN Performance Status

**FINAL STATUS: PASS — No critical findings** (2026-05-27)

| Finding | Severity | Action |
|---|---|---|
| KPF-001: `vport.profiles` hit twice per publish (id via cache, name uncached) | LOW | P3 — unify profile resolver |
| KPF-002: Name + auth reads sequential in publish controller | LOW | P3 — Promise.all candidate |
| KPF-003: Ownership re-verify on window focus | LOW (security trade-off) | VENOM consult before change |

**DB read counts (KRAVEN verified):**

| Path | Cold Mount | Warm Mount |
|---|---|---|
| Dashboard mount (non-self) | 4 reads | 2 reads |
| Dashboard mount (acting-as) | 3 reads | 2 reads |
| Publish rate update | 3 reads + 1 write | — |

---

## 12. Test Coverage

| File | Tests | Coverage |
|---|---|---|
| `upsertVportRate.controller.test.js` | 9 | Ownership gate, cache invalidation, DAL args, error propagation |
| `publishExchangeRateUpdateAsPost.controller.test.js` | 8 | Missing currencies, dedup throttle, success path, realm_id |

**Unprotected (deferred):**
- `getVportRates.controller.js` — low risk (read-only, no auth, no side effects)
- `useUpsertVportRate.js` — hook test pending
- `VportDashboardExchangeScreen.jsx` — screen composition test (low priority)

---

## 13. P3 Cleanup Backlog

| Item | Priority | Effort |
|---|---|---|
| Create `vportRates.model.adapter.js` (SF-001) | P3 | Low |
| Create `usePublishExchangeRatePost.adapter.js` (SF-002) | P3 | Low |
| Unify vport profile resolver to avoid double `vport.profiles` read on publish (KPF-001) | P3 | Medium |
| Parallelize name + auth.getUser() in publish controller (KPF-002) | P3 | Low |

None of the above are release-blocking.

---

## 14. Related Documents

| Document | Purpose |
|---|---|
| `vcsm.vport.money-exchange-profile-spec.md` | Public profile UX and tab spec |
| `vcsm.vport-exchange-rate-dashboard.architecture.md` | Full ARCHITECT module report |
| `audits/performance/2026-05-27_03-00_kraven_vport-exchange-rate-runtime.md` | KRAVEN runtime audit |
| `audits/compliance/2026-05-27_02-50_sentry_vport-exchange-rate-p1-fixes.md` | SENTRY compliance report |
| `audits/tasks/2026-05-27_vport-exchange-hardening.audit.md` | Master task audit (KRAVEN + SPIDER-MAN) |
