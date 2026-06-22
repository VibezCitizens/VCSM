# MODULE ARCHITECTURE REPORT

---

**Module:** VPORT Money Exchange — Exchange Rate Dashboard
**Application Scope:** VCSM
**Module Type:** VPORT type module (domain: money exchange / currency)
**Primary Root:** `apps/VCSM/src/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

**Scan Date:** 2026-05-27 (deep review — post-security hardening cycle)
**Scanned By:** ARCHITECT
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — VCSM scope enforced
**Prior Report:** 2026-05-27 (pre-fix baseline — superseded by this report)

---

## PURPOSE

The VPORT Exchange Rate module allows a `vport` actor of type `exchange` to:

1. Publish official buy/sell exchange rates per currency pair (e.g. USD/MXN)
2. View current tracked pairs with per-pair metadata (last updated, rates)
3. Optionally publish a system post to the public feed announcing the rate update
4. Access the exchange management surface from the VPORT owner dashboard

The module is gated by ownership: only the actor who owns the VPORT can write rates.
Rate reads are public (no auth gate on the read path).

---

## OWNERSHIP

**Domain owner:** `features/profiles/kinds/vport/` — domain logic (DAL, model, controller, hook, components)
**Dashboard owner:** `features/dashboard/vport/` — entry screen and dashboard card configuration
**Cross-boundary adapter:** `features/profiles/adapters/kinds/vport/` — passthrough adapters for cross-feature access

---

## ENTRY POINTS

| Path | Type | Notes |
|---|---|---|
| `/actor/:actorId/dashboard/exchange` | Primary route | Canonical actor-based route |
| `/vport/:actorId/dashboard/exchange` | Legacy route | Legacy `/vport/` prefix — should be redirected, not duplicated |
| `lazyApp.jsx:102` | Lazy import | `VportDashboardExchangeScreen` |
| Dashboard card key `"exchange"` | Card navigation | `openExchangeRates` handler in `VportDashboardScreen` |
| `dashboardViewByVportType.model.js` | View preset | `exchange` preset activates when `vport.type === "exchange"` |

---

## LAYER MAP

```
DAL (Read)
  └── readVportRatesByActor.dal.js         [profiles/kinds/vport/dal/rates/]
        - TTL cache: 60s (createTTLCache)
        - invalidateRatesCache() exported + now wired into write controller ✅
  └── vportExchangeRatePost.read.dal.js    [profiles/kinds/vport/dal/exchange/]
        - resolveVportExchangeNameDAL → reads vport.profiles.name
        - hasRecentExchangeRatePostDAL → reads vc.posts (dedup, 1h window)
  └── resolveVportProfileId.dal.js         [profiles/kinds/vport/dal/services/]   ← shared helper

DAL (Write)
  └── upsertVportRate.dal.js               [profiles/kinds/vport/dal/rates/]
        - upserts vport.rates
        - conflict key: profile_id,rate_type,base_currency,quote_currency
        - select: explicit column list (id,profile_id,rate_type,base_currency,quote_currency,
                  buy_rate,sell_rate,meta,updated_at,created_at) — actor_id NOT returned

Model
  └── vportRates.model.js                  [profiles/kinds/vport/model/rates/]
        - mapVportRateRow()     — canonical raw→domain transform
        - mapVportRateRows()    — list variant
        - computeLastUpdated() — pure timestamp reduce
      NOTE: mapVportRateRow maps row.actor_id → actorId, but the upsert DAL select
      does NOT include actor_id. Screen compensates by spreading {...mapVportRateRow(saved), actorId}
      on the optimistic-to-persisted swap.

Controller (Read)
  └── getVportRates.controller.js          [profiles/kinds/vport/controller/rates/]
        - no auth requirement — public read

Controller (Write + Auth)
  └── upsertVportRate.controller.js        [profiles/kinds/vport/controller/rates/]
        SECURITY CHAIN (hardened 2026-05-27):
        identityActorId required →
        assertValidCurrencyCode(baseCurrency) → SUPPORTED_FX_CURRENCIES allow-list (38 codes) →
        assertValidCurrencyCode(quoteCurrency) →
        assertValidRate(buyRate) → positive-finite only (n > 0) →
        assertValidRate(sellRate) →
        same-pair guard (base !== quote) →
        assertActorOwnsVportActorController (via booking.adapter) →
        upsertVportRateDal →
        invalidateRatesCache() ✅

Controller (Publish)
  └── publishExchangeRateUpdateAsPost.controller.js  [profiles/kinds/vport/controller/exchange/]
        SECURITY CHAIN (hardened 2026-05-27):
        actorId required →
        identityActorId required →
        baseCurrency + quoteCurrency presence check →
        assertActorOwnsVportActorController →
        PUBLIC_REALM_ID resolve →
        hasRecentExchangeRatePostDAL (dedup, 1h) →
        resolveVportExchangeNameDAL →
        createSystemPost (posts.adapter → vc.posts INSERT)

Hook (Read)
  └── useVportRates.js                     [profiles/kinds/vport/hooks/rates/]
        - cleanup pattern present (alive flag)

Hook (Write)
  └── useUpsertVportRate.js                [profiles/kinds/vport/hooks/rates/]
        - reads identityActorId from useIdentity()

Hook (Publish)
  └── usePublishExchangeRatePost.js        [profiles/kinds/vport/hooks/exchange/]
        - reads identity.actorId, guards no_identity before calling controller

Components (Presentational)
  └── VportRateCard.jsx                    [profiles/kinds/vport/screens/rates/components/]
  └── VportRateEditorCard.jsx              [profiles/kinds/vport/screens/rates/components/]
        - free-text inputs for currency codes (UI only — controller is authoritative gate)
        - maxLength=10 on currency inputs
        - canSubmit guards empty + same-pair at UI layer

View Screen
  └── VportRatesView.jsx                   [profiles/kinds/vport/screens/rates/view/]
        - calls useVportRates hook
        - merges optimistic + persisted rates
        - renders VportRateCard list

Adapters (Cross-feature boundary)
  └── VportRatesView.adapter.js            [profiles/adapters/kinds/vport/screens/rates/view/]    ← thin re-export
  └── VportRateEditorCard.adapter.js       [profiles/adapters/kinds/vport/screens/rates/components/] ← thin re-export
  └── useUpsertVportRate.adapter.js        [profiles/adapters/kinds/vport/hooks/rates/]           ← thin re-export

Entry Screen (Final)
  └── VportDashboardExchangeScreen.jsx     [dashboard/vport/screens/]
        - identity gate + ownership gate (useVportOwnership)
        - form state: baseCurrency, quoteCurrency, buyRate, sellRate
        - orchestrates upsert + feed publish in onSave (~85 lines — still in screen, not extracted)
        - optimistic update logic inline
        - desktop portal rendering (createPortal)
        - now imports mapVportRateRow from model (duplicate removed ✅)
        - inline helpers still present: normalizeCurrencyCode, toNumOrNull, toRatePairKey (LOW)

Dashboard Config
  └── dashboardViewByVportType.model.js    [dashboard/vport/model/]  ← exchange preset
  └── buildDashboardCards.model.js         [dashboard/vport/model/]  ← exchange card catalog
```

---

## SECURITY STATE — POST 2026-05-27 HARDENING CYCLE

| Finding | Severity | Status |
|---|---|---|
| ELEK-001 / BW-2705-01 — IDOR: publish controller accepted any actorId | HIGH | ✅ CLOSED — identityActorId required + ownership check added |
| ELEK-002 / BW-2705-02 — Zero/negative rate bypass | HIGH | ✅ CLOSED — assertValidRate(n > 0 && isFinite) in upsertVportRate.controller.js |
| ELEK-003 — Arbitrary currency code injection | MEDIUM | ✅ CLOSED — SUPPORTED_FX_CURRENCIES Set (38 ISO 4217 codes) + same-pair guard |
| ELEK-004 — console.log identity leakage in actorOwners.read.dal.js | LOW | ✅ CLOSED — console.log block removed |
| vc.posts INSERT RLS (posts_insert_actor_owner) | HIGH (DB) | ✅ DELIVERED — migration 20260523010000 (see DB discrepancy note below) |

### DB Discrepancy — Migration Reference Error

The security.md open item references migration `20260522010000` as the delivery vehicle for `posts_insert_actor_owner`. **That migration does not exist in the migrations folder.**

The `posts_insert_actor_owner` policy is actually defined in:
`20260523010000_backfill_tracked_rls_coverage.sql`

Policy definition:
```sql
CREATE POLICY posts_insert_actor_owner ON vc.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = posts.actor_id AND ao.user_id = auth.uid()
    )
  );
```

**The DB-layer protection exists. The open item is functionally resolved.**
**Action required:** Update `security.md` to correct the migration reference from `20260522010000` → `20260523010000`.

---

## LATENT SECURITY FINDINGS — NEW (POST-HARDENING SCAN)

### LSF-001 — `rateType` parameter is unvalidated
**Severity:** LOW  
**File:** `upsertVportRate.controller.js` line 38, `upsertVportRate.dal.js` line 26  
**Issue:** `rateType` defaults to `"fx"` but passes through to the DB upsert without allow-list validation. An authenticated owner could submit `rateType: "custom_value"` and create rows with arbitrary rate types. If any consumer queries by `rate_type` without filtering, this leaks into the read path.  
**DB constraint status:** Unknown — no CHECK constraint on `vport.rates.rate_type` found in migrations. Needs CARNAGE verification.  
**Risk:** LOW — owner-only surface, no unauthenticated write path. Not exploitable by non-owners.  
**Recommendation:** Add `assertValidRateType` allow-list (`["fx"]` for now, extensible) before the ownership check.

### LSF-002 — `meta` field is arbitrary JSON passthrough
**Severity:** LOW  
**File:** `upsertVportRate.dal.js` line 34, `upsertVportRate.controller.js` line 61  
**Issue:** `meta` is passed from the controller to the DAL without schema validation and stored as `jsonb`. If `meta` is ever indexed or included in public read payloads, it becomes an injection surface.  
**Risk:** LOW — currently `meta` is not exposed in any public read DAL select or UI component. VportRateCard does not render meta.  
**Recommendation:** Document that `meta` is an opaque owner-controlled blob. If it grows into a structured field, add schema validation in the controller.

### LSF-003 — Currency code UI input accepts free text
**Severity:** INFO (not a security gap — controller is authoritative)  
**File:** `VportRateEditorCard.jsx` lines 60-76  
**Issue:** `<input>` for baseCurrency/quoteCurrency accepts any string up to 10 chars. The controller's `SUPPORTED_FX_CURRENCIES` allow-list is the real gate. However, users type arbitrary codes, hit save, and receive a controller-thrown error only after the network call. The UI has no pre-submit allow-list check.  
**Risk:** UX gap only — not a security gap. Controller prevents persistence of invalid codes.  
**Recommendation:** Add a UI-layer allow-list preview (dropdown or inline validation) to improve UX. Out of scope for security remediation.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Ownership-gated exchange rate management + public feed publish | — |
| Owner defined | PASS | profiles/kinds/vport domain + dashboard/vport entry | — |
| Entry points mapped | PASS | `/actor/:actorId/dashboard/exchange`, lazy import, card nav | Legacy route duplication (see boundary warning) |
| Controllers present | PASS | getVportRates, upsertVportRate, publishExchangeRateUpdateAsPost | onSave orchestration still inline in screen |
| DAL/repository present | PASS | Read + write + helper DAL all present | invalidateRatesCache now wired ✅ |
| Models/transformers present | PASS | vportRates.model.js canonical; duplicate removed from screen ✅ | actor_id not in DAL select — actorId always null from DB path |
| Hooks/view models present | PASS | useVportRates, useUpsertVportRate, usePublishExchangeRatePost | |
| Screens/components present | PASS | VportRateCard, VportRateEditorCard, VportRatesView, VportDashboardExchangeScreen | |
| Services/adapters present | PASS | Three passthrough adapters at profiles/adapters/ boundary | Thin re-exports — acceptable |
| Database objects mapped | PARTIAL | vport.rates (write), vc.posts (publish), vport.profiles (name/id lookup) | rateType and meta have no DB-level schema constraints documented |
| Authorization path mapped | PASS | assertActorOwnsVportActorController in both write controllers; UI ownership gate | Dual check (UI + controller) = defense in depth ✅ |
| Cache/runtime behavior mapped | PASS | TTL cache (60s), invalidateRatesCache now wired ✅ | |
| Error/loading/empty states mapped | PASS | Skeletons, empty state, error display all present | |
| Documentation linked | FAIL | No Logan doc for this module | Needs vcsm.vport-exchange.logan.md |
| Tests/validation noted | PASS | publishExchangeRateUpdateAsPost.controller.test.js ✅; upsertVportRate.controller.test.js ✅ | getVportRates.controller.js has no test |
| Native parity noted | FAIL | Not documented | FALCON record missing |
| Engine dependencies mapped | PASS | No engine dependency — module self-contained within profiles + dashboard features | |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `vport.rates` table | database | DAL reads/writes | YES — via vportClient | upsert conflict on `profile_id,rate_type,base_currency,quote_currency` |
| `vport.profiles` table | database | DAL reads | YES — via resolveVportProfileId | Two paths: id lookup + name lookup (not consolidated) |
| `vc.posts` table | database | controller writes via createSystemPost | YES — via posts.adapter | Cross-schema write (vport → vc); INSERT RLS active via 20260523010000 |
| `vc.actor_owners` table | database | ownership check | YES — via assertActorOwnsVportActorController | DB-backed ownership verification |
| `booking.adapter` | adapter | controller imports assertActorOwnsVportActorController | YES — via adapter boundary §5.3 exception (9 call sites) | |
| `useIdentity` / `identityContext` | state | hook + screen | YES — state layer | actorId sourced from identity context |
| `useVportOwnership` | feature hook | screen | YES — dashboard internal | UI ownership gate |
| `resolveRealm.js` | shared util | controller | YES — shared/ | PUBLIC_REALM_ID |
| `createSystemPost` (posts.adapter) | adapter | controller | YES — adapter boundary | Upload feature cross-dependency |
| `profiles/adapters/` | adapter | dashboard screen imports via adapter | YES — approved boundary | Three passthrough adapters |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `vport.rates` rows | read/write | profiles/kinds/vport DAL | Exchange screen, VportRatesView | actor_id not in upsert select — actorId always null from DB path; screen compensates inline |
| `vport.profiles.id` | read (derived) | resolveVportProfileId.dal.js | readVportRatesByActor, upsertVportRate | 30s TTL cache |
| `vport.profiles.name` | read (derived) | resolveVportExchangeNameDAL | publishExchangeRateUpdateAsPost controller | Separate standalone query — not using cached profileId helper |
| `vc.posts` (exchange_rate_update type) | write + dedup read | posts.adapter + vportExchangeRatePost.read.dal.js | publishExchangeRateUpdateAsPost controller | Dedup window: 1 hour; INSERT RLS enforced at DB layer |
| `rateType` field | write | upsertVportRate.controller.js | vport.rates | No allow-list in controller — arbitrary string passthrough (LSF-001) |
| `meta` field | write | upsertVportRate.controller.js | vport.rates | Arbitrary JSON; no schema validation (LSF-002) |
| Domain rate object | derived | vportRates.model.js (mapVportRateRow) | VportRateCard, VportRatesView, optimistic state | Canonical — duplicate removed from screen ✅ |
| Optimistic rate state | client-side | VportDashboardExchangeScreen (inline) | VportRatesView via prop | Still managed in screen — belongs in useExchangeRateSave hook |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | `/actor/:actorId/dashboard/exchange` + lazy import | Duplicate legacy route `/vport/:actorId/dashboard/exchange` — duplicate mount |
| Loading state | PASS | SkeletonCardList while identityLoading \|\| ownershipLoading; skeleton in VportRatesView | |
| Empty state | PASS | "No exchange pairs yet" in VportRatesView | |
| Error state | PASS | Error display in VportRatesView + editor card | |
| Auth/owner gate | PASS | isOwner check before render; assertActorOwnsVportActorController in write controllers | Defense-in-depth ✅ |
| Cache behavior | PASS | Read cache (60s TTL); invalidateRatesCache() now called after upsert ✅ | resolveVportProfileId adds 1 round-trip per write if cache is cold |
| Hot paths | IDENTIFIED | onSave → upsertVportRateController → upsertVportRateDal → resolveVportProfileId (cached) | |
| Feed publish path | PASS | Optional, non-blocking (catch swallowed), dedup-throttled (1h) | |
| LOKI/KRAVEN handoff | RECOMMENDED | Cache miss on cold resolveVportProfileId during high-volume rate updates | |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/vport-exchange/` | MISSING |
| Ownership record | IRONMAN | MISSING |
| Security audit | VENOM + BlackWidow + ELEKTRA — 2026-05-27 | COMPLETE — see audit trail in security.md |
| Runtime audit | LOKI | MISSING |
| Performance audit | KRAVEN | MISSING |
| Migration audit | CARNAGE | PARTIAL — upsert conflict key present; rateType/meta constraints unverified |
| Native transfer audit | FALCON | MISSING |
| Engine audit | N/A | Module is self-contained — no engine dependency |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| `onSave` orchestration still inline in screen | HIGH | ~85-line callback in Final Screen mixes optimistic state, write, publish, toast, rollback. Belongs in `useExchangeRateSave` hook. Screen approaching 300-line limit. | IRONMAN / Wolverine |
| Duplicate legacy route `/vport/:actorId/dashboard/exchange` | MEDIUM | Duplicate screen mount causes duplicate hook + ownership check invocations on legacy path navigation | Wolverine |
| actor_id not in upsert DAL select | MEDIUM | `mapVportRateRow(saved)` always produces `actorId: null` from DB path. Screen compensates by spreading `actorId` inline after model call — workable but fragile. Either extend select to include `actor_id` or formally document the workaround. | Wolverine |
| `rateType` unvalidated (LSF-001) | LOW | Arbitrary rate type strings can be stored in vport.rates by an authenticated owner | ELEKTRA / Wolverine |
| `meta` arbitrary JSON (LSF-002) | LOW | Opaque blob with no schema — future risk if meta becomes indexed or public | ELEKTRA |
| No Logan documentation | LOW | Architecture decisions (dedup window, 1h throttle, dual-schema writes, optimistic pattern) undocumented | LOGAN |
| `getVportRates.controller.js` has no test | LOW | Read controller untested — no coverage for empty result, malformed actorId, model mapping path | SPIDER-MAN |
| `resolveVportExchangeNameDAL` standalone query | LOW | Avoidable extra DB call on every feed publish — could reuse cached profile resolution | Wolverine |
| security.md migration reference wrong | LOW | Says `20260522010000` — actual migration is `20260523010000` | LOGAN |
| Native parity not documented | LOW | No FALCON record | FALCON |

---

## MODULE BOUNDARY WARNINGS

---

**MODULE BOUNDARY WARNING #1**

Location: `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx` lines 80–163

Module: dashboard/vport exchange screen

Current dependency: `onSave` callback (~85 lines) owns optimistic state construction, upsert call, rollback on failure, refreshSeed bump, toast message, and conditional feed publish — all inside the Final Screen.

Expected boundary: Orchestration of write + publish + optimistic state belongs in a Hook (`useExchangeRateSave.js`). The Final Screen should only wire state to handlers.

Risk: Screen is at 263 lines. If onSave grows further, the 300-line limit will be violated simultaneously with the layer contract violation. Current state is functional but architecturally fragile.

Suggested correction: Extract `onSave` and `optimisticRatesByPair` state into `profiles/kinds/vport/hooks/exchange/useExchangeRateSave.js`. Screen becomes pure composition.

---

**MODULE BOUNDARY WARNING #2**

Location: `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx` lines 21–39

Module: dashboard/vport exchange screen

Current dependency: `normalizeCurrencyCode`, `toNumOrNull`, `toRatePairKey` defined inline. These are pure transforms that belong in the model layer or a shared utility.

Expected boundary: Pure transforms belong in model.

Risk: LOW — inline helpers are small and stable. Primary risk is drift from the model layer equivalents if either is modified independently.

Suggested correction: Move to `vportRates.model.js` or a co-located `exchangeRateUtils.js`. Medium priority.

---

**MODULE BOUNDARY WARNING #3**

Location: Route config (`app.routes.jsx`)

Module: Route configuration

Current dependency: Two routes resolve to `VportDashboardExchangeScreen` — `/actor/:actorId/dashboard/exchange` (canonical) and `/vport/:actorId/dashboard/exchange` (legacy).

Expected boundary: One canonical route. Legacy prefix should be a `<Navigate>` redirect.

Risk: Duplicate screen mount. On legacy-path navigation, hooks (useIdentity, useVportOwnership) fire as two separate component instances. Not catastrophic but architecturally wrong.

Suggested correction: Convert `/vport/:actorId/dashboard/exchange` to `<Navigate to="/actor/:actorId/dashboard/exchange" replace />`.

---

## SPAGHETTI SCORE

**Module:** VPORT Exchange Rate Dashboard
**Score:** WATCH (improved from WATCH — previous HIGH-risk items resolved)

**Reasons:**
- Inline orchestration in `onSave` (~85 lines in Final Screen) — layer violation
- Inline pure transforms (`normalizeCurrencyCode`, `toNumOrNull`, `toRatePairKey`) in Final Screen
- Duplicate route entries for same screen

**Resolved since last scan:**
- `invalidateRatesCache()` now wired ✅
- `mapRawRateRowToDomain` duplicate removed; canonical `mapVportRateRow` imported ✅
- Tests added for both write controllers ✅
- Security hardening complete ✅

**Release risk:** LOW — module is functional, secure, and tested. Remaining issues are architectural quality.

---

## CODE HEALTH METRICS

| Module | Files | Layers | Cross-Feature Imports | Cycles | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---|
| exchange (dashboard entry) | 1 screen | 1 | 5 (via adapters + hooks) | 0 | 0 | WATCH |
| exchange (profiles domain) | 10 | DAL+Model+Controller+Hook+Component+View | 2 (booking.adapter, posts.adapter) | 0 | 0 | CLEAN |
| dashboard config (model) | 2 | MODEL | 0 | 0 | `screens/model/` are compat re-exports | CLEAN |

---

## FINAL MODULE STATUS: **MOSTLY COMPLETE**

Security hardening complete. Tests in place for write path. Cache invalidation wired. Duplicate model function removed.

Three remaining items for COMPLETE status:
1. Extract `onSave` orchestration into `useExchangeRateSave` hook (layer contract)
2. Redirect legacy `/vport/` route (duplicate mount)
3. Either include `actor_id` in upsert DAL select, or formally document the `actorId` compensation pattern

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command | Status |
|---|---|---|---|---|
| P0 — DONE | Security hardening (ELEK-001–004) | IDOR, zero-rate bypass, currency injection, identity leakage | ELEKTRA | ✅ CLOSED |
| P0 — DONE | Test coverage for write controllers | No regression safety on ownership + validation paths | SPIDER-MAN | ✅ DONE |
| P0 — DONE | Wire `invalidateRatesCache()` | Stale read after write | Wolverine | ✅ DONE |
| P1 | Extract `onSave` into `useExchangeRateSave` hook | Layer contract violation; screen approaching 300-line limit | Wolverine |  |
| P1 | Redirect legacy route `/vport/:actorId/dashboard/exchange` | Duplicate mount | Wolverine |  |
| P1 | Correct migration reference in security.md (20260522010000 → 20260523010000) | Wrong reference for vc.posts RLS delivery | LOGAN |  |
| P2 | Add `rateType` allow-list in controller (LSF-001) | Unvalidated string stored in DB | ELEKTRA / Wolverine |  |
| P2 | Document `meta` schema or add validation (LSF-002) | Opaque JSON blob — future surface | ELEKTRA |  |
| P2 | Either add `actor_id` to upsert DAL select or document compensation pattern | actorId: null silent bug in model path | Wolverine |  |
| P2 | Move inline pure transforms out of screen | Layer contract — belongs in model | Wolverine |  |
| P3 | Test `getVportRates.controller.js` | Read controller untested | SPIDER-MAN |  |
| P3 | Write Logan doc | Architecture decisions undocumented | LOGAN |  |
| P3 | Consolidate `resolveVportExchangeNameDAL` with cached helper | Avoidable extra DB call per feed publish | Wolverine |  |
| P3 | Native parity assessment | No FALCON record | FALCON |  |

---

## RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| **Wolverine** | P1 fixes: onSave hook extraction, legacy route redirect, actorId select fix |
| **LOGAN** | Correct security.md migration reference; write Logan doc for this module |
| **ELEKTRA** | LSF-001 rateType allow-list; LSF-002 meta schema documentation |
| **IRONMAN** | Assign formal feature ownership |
| **SPIDER-MAN** | Add `getVportRates.controller.js` test coverage |
| **LOKI** | Runtime trace: cold-cache resolveVportProfileId timing under write load |
| **CARNAGE** | Verify DB constraints on vport.rates.rate_type and meta columns |
| **FALCON** | Native parity assessment |
