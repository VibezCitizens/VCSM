# Dashboard Module Behavior Contract — exchange

Status: PARTIAL

Module: exchange

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - EXCHANGE-BEHAVIOR-001
  - EXCHANGE-SPIDER-001
  - EXCHANGE-RLS-001
  - EXCHANGE-DEDUP-001
  - EXCHANGE-FINALVIEW-001
- Security Review Status:
  - VENOM: COMPLETE at dashboard matrix level; module DR_STRANGE command row still NOT_RUN.
  - ELEKTRA: COMPLETE at dashboard matrix level; module DR_STRANGE command row still NOT_RUN.
  - BLACKWIDOW: COMPLETE at dashboard matrix level; module DR_STRANGE command row still NOT_RUN.

---

## 1. User Goal

The exchange module lets an EXCHANGE-kind VPORT owner manage official buy/sell exchange rates from the dashboard and optionally publish an exchange-rate update post to the public feed. The dashboard card also displays current exchange pairs and supports optimistic UI updates after a rate save.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT actor owner | Load owner exchange dashboard, create/update FX currency pairs, view official rates, optionally publish an exchange-rate feed post. | Must pass `useVportOwnership` screen gate and delegated controller ownership checks. |
| Non-owner authenticated actor | None in owner dashboard. | Must not save rates or publish exchange-rate posts for another VPORT. |
| Public/anonymous actor | None in this dashboard card. | Public exchange profile/rates behavior exists outside this dashboard module and is not governed by this card contract. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/dashboard/exchange`
- `/vport/:actorId/dashboard/exchange` is a legacy redirect to `/actor/:actorId/dashboard/exchange`.
- No active standalone `/dashboard/exchange` route was found in the protected route table.

### Screens

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/exchange/VportDashboardExchangeScreen.jsx`
- Current source combines route identity/ownership gating, local form state, optimistic state, save orchestration, toast behavior, and desktop portal rendering in one screen file. It is not split into separate Final Screen and View Screen files.

### Hooks

No local dashboard exchange hook exists. The screen uses profile adapter hooks:

- `useUpsertVportRate`
- `usePublishExchangeRatePost`
- `useVportRates` inside the delegated `VportRatesView`.
- `useVportOwnership` for dashboard owner gating.

### Controllers

No local dashboard exchange controller exists. Delegated profile controllers:

- `upsertVportRate.controller.js`
- `getVportRates.controller.js`
- `publishExchangeRateUpdateAsPost.controller.js`

### DALs

No local dashboard exchange DAL exists. Delegated profile DALs:

- `upsertVportRate.dal.js`
- `readVportRatesByActor.dal.js`
- `vportExchangeRatePost.read.dal.js`
- post creation through `createSystemPost` adapter.

### RPCs

- No exchange-local RPC was found.

### Edge Functions

- No exchange-local edge function was found.

### Engine Dependencies

- Profiles VPORT rates adapters.
- Profiles exchange post adapters/controllers.
- Booking ownership assertion adapter: `assertActorOwnsVportActorController`.
- Shared post adapter: `createSystemPost`.
- Shared realm constant: `PUBLIC_REALM_ID`.
- Shared TTL cache utility for rate reads.

### Ownership Gates

- Screen render gate: `useVportOwnership(viewerActorId, actorId)`.
- Rate save gate: `upsertVportRateController` calls `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })`.
- Feed publish gate: `publishExchangeRateUpdateAsPostController` calls the same ownership assertion before dedup or post creation.

---

## 4. Happy Paths

### HP-001

BEH-DASH-exchange-001

Preconditions:

Authenticated caller owns the target EXCHANGE VPORT and opens the exchange dashboard route.

Flow:

User opens exchange dashboard -> `VportDashboardExchangeScreen` reads route actor id and identity -> `useVportOwnership` verifies owner UI access -> screen renders `VportRateEditorCard` and `VportRatesView` -> `VportRatesView` calls `useVportRates` -> `getVportRatesController` reads rates and maps rows for display.

Expected Result:

Owner sees current exchange pairs, pair count, rate type, last update, and an editor for publishing rates.

Data Changes:

None.

---

### HP-002

BEH-DASH-exchange-002

Preconditions:

Owner enters different supported base/quote currency codes and positive finite buy/sell rates not exceeding `1_000_000`.

Flow:

Owner clicks publish -> screen normalizes currency codes and builds pair key -> screen adds optimistic rate row -> `useUpsertVportRate.upsert` calls `upsertVportRateController` -> controller validates rate type, currencies, positive finite rates under the max cap, meta, and same-currency rule -> controller verifies ownership -> `upsertVportRateDal` resolves profile id and upserts the rate -> rates cache invalidates -> screen maps saved row, clears inputs, increments refresh seed, and displays toast.

Expected Result:

Official exchange rate pair is saved and appears in the dashboard rate list.

Data Changes:

Upsert into `vport.rates`.

---

### HP-003

BEH-DASH-exchange-003

Preconditions:

Owner saves a rate with `shareToFeed` enabled.

Flow:

After rate save succeeds -> screen calls `publishExchangeRatePost` -> hook resolves `identityActorId` from user actor or acting-as-VPORT available actors -> controller verifies ownership, checks public realm, checks recent exchange-rate post dedup, validates rates, resolves exchange name, and calls `createSystemPost`.

Expected Result:

An `exchange_rate_update` post is created, skipped, or failed independently of the already-saved rate. Toast reports the publish result.

Data Changes:

Optional insert into feed/post system through post adapter.

---

### HP-004

BEH-DASH-exchange-004

Preconditions:

Owner save fails after optimistic UI row is applied.

Flow:

Screen catches rate save failure -> optimistic rate state restores the previous row for that pair or removes the optimistic row if none existed.

Expected Result:

Failed save does not leave a false optimistic rate in the dashboard list.

Data Changes:

None if controller/DAL write fails before persistence.

---

## 5. Failure Paths

### FP-001

BEH-DASH-exchange-101

Trigger:

Route actor id is missing.

Expected System Behavior:

Screen returns null before adapter hooks can perform owner actions.

Expected UI Behavior:

No exchange dashboard content renders.

Expected Logging:

No dashboard-local logging found.

---

### FP-002

BEH-DASH-exchange-102

Trigger:

Identity or ownership is still loading.

Expected System Behavior:

Owner workflow does not render.

Expected UI Behavior:

Skeleton card list renders.

Expected Logging:

No dashboard-local logging found.

---

### FP-003

BEH-DASH-exchange-103

Trigger:

No authenticated identity exists.

Expected System Behavior:

Owner editor does not render.

Expected UI Behavior:

`Sign in required.`

Expected Logging:

No dashboard-local logging found.

---

### FP-004

BEH-DASH-exchange-104

Trigger:

Authenticated caller is not an owner of the target VPORT.

Expected System Behavior:

`useVportOwnership` blocks dashboard UI; delegated controllers also reject direct non-owner writes.

Expected UI Behavior:

`You can only manage exchange rates for your own vport.`

Expected Logging:

No dashboard-local logging found.

---

### FP-005

BEH-DASH-exchange-105

Trigger:

Unsupported rate type, unsupported currency code, same-currency pair, invalid meta, or invalid rate value.

Expected System Behavior:

`upsertVportRateController` throws before ownership check or DAL write, depending on the validation failure.

Expected UI Behavior:

Editor receives `m.error` and renders the error text.

Expected Logging:

No dashboard-local logging found.

---

### FP-006

BEH-DASH-exchange-106

Trigger:

Feed publish is disabled, missing identity, missing currencies, missing realm, duplicate recent post, invalid rates, ownership failure, or post adapter failure.

Expected System Behavior:

Publish is skipped, failed, or throws; rate save remains committed.

Expected UI Behavior:

Toast indicates saved, shared, skipped, or failed feed share result.

Expected Logging:

No dashboard-local logging found.

---

### FP-007

BEH-DASH-exchange-107

Trigger:

Rate read fails.

Expected System Behavior:

`useVportRates` captures error from `getVportRatesController`.

Expected UI Behavior:

`VportRatesView` displays raw error message in a profiles error block.

Expected Logging:

No dashboard-local logging found.

---

## 6. Security Rules

### SEC-001

BEH-DASH-exchange-201

Rule:

Only target VPORT owners may access the dashboard exchange editor.

Enforcement Layer:

`VportDashboardExchangeScreen` via `useVportOwnership`.

Current Status:

IMPLEMENTED as UI gate.

Finding Links:

- EXCHANGE-FINALVIEW-001

---

### SEC-002

BEH-DASH-exchange-202

Rule:

Rate writes must validate domain inputs before writing and must verify actor ownership before DAL upsert.

Enforcement Layer:

`upsertVportRateController`.

Current Status:

IMPLEMENTED in current source with controller tests.

Finding Links:

- EXCHANGE-RLS-001

---

### SEC-003

BEH-DASH-exchange-203

Rule:

Exchange-rate feed posts must only publish for VPORT owners and must reject invalid rates.

Enforcement Layer:

`publishExchangeRateUpdateAsPostController`.

Current Status:

IMPLEMENTED in current source with controller tests.

Finding Links:

- EXCHANGE-DEDUP-001

---

### SEC-004

BEH-DASH-exchange-204

Rule:

Feed publish dedup must not be caller-tunable by future direct DAL consumers.

Enforcement Layer:

Should be enforced in `hasRecentExchangeRatePostDAL` and/or DB-level post throttling.

Current Status:

PARTIAL. Current controller uses the default one-hour window and profile-layer controller tests cover the dedup skip path. The DAL still accepts `windowMs`, so direct DAL-boundary hardening remains open.

Finding Links:

- EXCHANGE-DEDUP-001
- BW-EXPROFILE-005
- VEN-EXCH-004

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-exchange-301

Invariant:

A non-owner must never save rates or publish exchange-rate posts for another VPORT.

Current Status:

Screen and controller gates present.

Related Findings:

- EXCHANGE-RLS-001

Required Tests:

- TESTREQ-DASH-exchange-001
- TESTREQ-DASH-exchange-003

---

### MNH-002

BEH-DASH-exchange-302

Invariant:

Unsupported currencies, same-currency pairs, invalid rate types, invalid meta, zero/negative/non-finite rates, or over-max rates must never reach the write DAL.

Current Status:

Controller validation present.

Related Findings:

- EXCHANGE-RLS-001

Required Tests:

- TESTREQ-DASH-exchange-002

---

### MNH-003

BEH-DASH-exchange-303

Invariant:

Feed publish failure must never roll back or corrupt an already-saved rate.

Current Status:

Publish runs after rate save and failure is caught as non-blocking.

Related Findings:

- EXCHANGE-SPIDER-001

Required Tests:

- TESTREQ-DASH-exchange-005

---

### MNH-004

BEH-DASH-exchange-304

Invariant:

The dedup window for exchange-rate posts must not be disabled by direct caller-controlled `windowMs`.

Current Status:

OPEN at DAL boundary; current dashboard/controller path does not expose `windowMs`.

Related Findings:

- EXCHANGE-DEDUP-001
- BW-EXPROFILE-005
- VEN-EXCH-004

Required Tests:

- TESTREQ-DASH-exchange-006

---

### MNH-005

BEH-DASH-exchange-305

Invariant:

Failed rate saves must never leave false optimistic rows in the dashboard rate list.

Current Status:

Screen restores or removes optimistic row on catch.

Related Findings:

- EXCHANGE-SPIDER-001

Required Tests:

- TESTREQ-DASH-exchange-004

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vport.rates` | `readVportRatesByActorDal` reads rates for display. | `upsertVportRateDal` inserts a new currency pair. | `upsertVportRateDal` updates existing pair by profile/rate/base/quote conflict key. | No delete found. |
| `vport.profiles` | Resolve profile id for rates and exchange name for feed text. | No | No | No |
| `vc.posts` | `hasRecentExchangeRatePostDAL` checks recent rate update posts. | `createSystemPost` inserts `exchange_rate_update` post. | No | No |

---

## 9. Side Effects

Notifications:

No notification side effect found.

Analytics:

No exchange-local analytics side effect found.

Media:

Exchange-rate posts use `media_url: null`.

Exports:

None found.

Jobs:

None found.

Cache:

Rate reads are cached for 60 seconds by `readVportRatesByActorDal`; `upsertVportRateController` calls `invalidateRatesCache()` after write.

Other:

Feed publish uses public realm id, one-hour actor-level dedup in current controller path, and a user-facing toast.

---

## 10. UI Outputs

Loading States:

Skeleton card list while identity/ownership loads; rates view skeleton while rates load.

Success States:

Exchange editor, pair label, current rates list, pair count, rate type, global update time, optimistic newly saved pair, saved/shared/skipped toast.

Error States:

Sign-in required, non-owner denial, editor error, rates read error, publish skipped/failed toast.

Empty States:

`No exchange pairs yet` when there are no rates.

Owner States:

Owner can edit rates and toggle feed sharing.

Public States:

No public dashboard state. Public profile rates view exists outside this dashboard card.

---

## 11. Acceptance Criteria

### AC-DASH-exchange-001

Requirement:

Exchange dashboard renders only for target VPORT owners.

Evidence:

`VportDashboardExchangeScreen` blocks missing identity and non-owner states before rendering editor/view.

Status:

PASS at source review level.

---

### AC-DASH-exchange-002

Requirement:

Rate saves validate input and enforce actor ownership before DAL write.

Evidence:

`upsertVportRateController` validates all write inputs, then calls `assertActorOwnsVportActorController`, then calls `upsertVportRateDal`.

Status:

PASS with profile-layer controller tests.

---

### AC-DASH-exchange-003

Requirement:

Feed publish validates owner, rates, realm, and dedup before post creation.

Evidence:

`publishExchangeRateUpdateAsPostController` performs ownership check, realm check, dedup check, rate validation, and then `createSystemPost`.

Status:

PASS at controller path with profile-layer controller tests; DAL dedup window hardening remains open.

---

### AC-DASH-exchange-004

Requirement:

Dashboard module has module-level behavior and SPIDER-MAN coverage.

Evidence:

No dashboard-local exchange tests found.

Status:

PARTIAL / OPEN.

---

## 12. Test Requirements

### TESTREQ-DASH-exchange-001

Validates:

Non-owner cannot render exchange editor and cannot trigger delegated save/publish workflows from the dashboard.

Type:

Screen/integration security test.

Status:

MISSING.

---

### TESTREQ-DASH-exchange-002

Validates:

Invalid currencies, invalid rate type, invalid meta, same-currency pair, non-positive/non-finite rates, and rates above `1_000_000` do not reach ownership gate or write DAL as appropriate.

Type:

Controller unit/security test.

Status:

PRESENT in profile-layer `upsertVportRate.controller.test.js`.

---

### TESTREQ-DASH-exchange-003

Validates:

Rate save and feed publish controllers call `assertActorOwnsVportActorController` with identity actor as requester and target VPORT actor as target.

Type:

Controller unit/security test.

Status:

PRESENT in profile-layer controller tests.

---

### TESTREQ-DASH-exchange-004

Validates:

Dashboard optimistic rate row is restored or removed when save fails.

Type:

Dashboard screen interaction test.

Status:

MISSING.

---

### TESTREQ-DASH-exchange-005

Validates:

Feed publish failure after successful rate save does not roll back the saved rate and produces the correct toast.

Type:

Dashboard integration test.

Status:

MISSING.

---

### TESTREQ-DASH-exchange-006

Validates:

`hasRecentExchangeRatePostDAL` cannot be used with caller-controlled `windowMs` to disable dedup, and/or DB-level throttling prevents duplicate post floods.

Type:

DAL/DB security test.

Status:

PARTIAL. Controller-level dedup behavior is present in `publishExchangeRateUpdateAsPost.controller.test.js`; direct DAL-boundary hardening and/or DB-level duplicate throttling remain open.

---

### TESTREQ-DASH-exchange-007

Validates:

DB/RLS prevents non-owner direct writes to `vport.rates` if controller is bypassed.

Type:

DB/RLS security test.

Status:

MISSING / NEEDS_VERIFICATION.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| EXCHANGE-BEHAVIOR-001 | MEDIUM | RESOLVED BY DRAFT | BEH-DASH-exchange-001 through BEH-DASH-exchange-305 |
| EXCHANGE-SPIDER-001 | MEDIUM | OPEN | BEH-DASH-exchange-303, BEH-DASH-exchange-305 |
| EXCHANGE-RLS-001 | HIGH | NEEDS_VERIFICATION / DELEGATED | BEH-DASH-exchange-202, BEH-DASH-exchange-301, BEH-DASH-exchange-302 |
| EXCHANGE-DEDUP-001 | MEDIUM | PARTIAL — CONTROLLER TESTED / DAL BOUNDARY OPEN | BEH-DASH-exchange-204, BEH-DASH-exchange-304 |
| EXCHANGE-FINALVIEW-001 | LOW | OPEN / DEFERRED | BEH-DASH-exchange-201 |
| VEN-EXCH-004 | MEDIUM | SOURCE-PARTIAL / OPEN AT DAL BOUNDARY | BEH-DASH-exchange-204, BEH-DASH-exchange-304 |
| BW-EXPROFILE-005 | LOW | OPEN | BEH-DASH-exchange-204, BEH-DASH-exchange-304 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Dashboard matrix THOR classification | CAUTION | No, but tracked caution remains. |
| Module DR_STRANGE command coverage | BLOCKED | Yes for module-level release sign-off; only DR. STRANGE PARTIAL evidence exists. |
| BEHAVIOR.md draft | PRESENT | No. |
| Dashboard-local SPIDER-MAN tests | MISSING | Yes for promoted-module test sign-off. |
| Profile-layer controller tests | PRESENT | No. |
| DAL/DB dedup hardening | PARTIAL | Yes for full security hardening; controller path is tested, DAL override remains open. |
| RLS verification for direct rates writes | NEEDS_VERIFICATION | Yes for full security approval. |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Exchange rate dashboard editor | Unknown | MISSING SOURCE |
| Exchange rates list | Unknown | MISSING SOURCE |
| Feed-share toggle and toast | Unknown | MISSING SOURCE |
| Optimistic rate update behavior | Unknown | MISSING SOURCE |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| Profiles rates adapters | Read and write VPORT exchange rates. | ACTIVE |
| Profiles exchange adapter | Publish exchange-rate update posts. | ACTIVE |
| Booking ownership adapter | Actor-owner assertion for delegated profile controllers. | ACTIVE |
| Shared post adapter | Create public feed posts. | ACTIVE |
| Shared TTL cache | Cache exchange rate reads. | ACTIVE |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-exchange-001 | Should `VportDashboardExchangeScreen.jsx` be split into Final Screen and View Screen? | OPEN |
| OQ-DASH-exchange-002 | Should `hasRecentExchangeRatePostDAL` remove public `windowMs` override and move dedup to an internal constant? | OPEN |
| OQ-DASH-exchange-003 | Is there DB-level RLS/CHECK coverage for direct `vport.rates` writes and positive rate constraints? | OPEN |
| OQ-DASH-exchange-004 | Should dashboard screen errors use normalized user-safe messages rather than raw `m.error` and rate-read error strings? | OPEN |
| OQ-DASH-exchange-005 | What native or alternate UI parity contract applies to exchange rate management? | OPEN |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | YES — module docs and source. |
| Actors / Roles | HIGH | YES — screen and ownership docs. |
| Module Architecture | HIGH | YES — dashboard source and adapters. |
| Happy Paths | HIGH | YES — screen, hooks, controllers, DALs. |
| Failure Paths | MEDIUM | YES — source reviewed; runtime not executed. |
| Security Rules | HIGH | YES — current controller source and tests. |
| Must Never Happen | HIGH | YES — source and governance evidence. |
| Data Changes | HIGH | YES — DAL and post adapter source. |
| Side Effects | HIGH | YES — cache invalidation and post publish source. |
| UI Outputs | HIGH | YES — screen/view/editor source. |
| Acceptance Criteria | MEDIUM | YES — source review only. |
| Test Requirements | HIGH | YES — profile tests found; dashboard tests missing. |
| Security Findings Linked | MEDIUM | YES — governance evidence plus current source. |
| THOR Release Gates | MEDIUM | YES — dashboard matrix and module DR_STRANGE conflict preserved. |
| Native / Alternate UI Parity | LOW | NO — no native parity source found. |
| Engine Dependencies | HIGH | YES — imports. |
| Open Questions | HIGH | YES — from source/governance gaps. |

---

## 19. Command Sign-Off

ARCHITECT: DRAFTED_FROM_SOURCE

VENOM: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX_AND_EXCHANGE_EVIDENCE

ELEKTRA: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX

BLACKWIDOW: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX_AND_EXCHANGE_EVIDENCE

SPIDER-MAN: PARTIAL — delegated profile controller tests exist; dashboard-local exchange tests missing.

PROFESSOR X: DRAFT_READY_FOR_REVIEW

THOR: CAUTION at dashboard matrix; BLOCKED for module-level command evidence.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding | Handoff |
|---|---|---|---|
| Exchange screen content data source is UNKNOWN | CRITICAL | ARCHITECT_VERIFIED | IRONMAN |
| No controller, DAL, hook, or model in card — shell only | HIGH | ARCHITECT_VERIFIED | IRONMAN |
| Delegation target not documented | HIGH | ARCHITECT_VERIFIED | LOGAN |
| No tests | MEDIUM | ARCHITECT_VERIFIED | SPIDER-MAN |
| No native parity notes | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: MISSING — SPIDER-MAN required. Zero test files in exchange module.

Ownership enforcement: UNKNOWN — no write surfaces in this card. Read path delegation target not identified.

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/exchange/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §5 (route: /actor/:actorId/dashboard/exchange)
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_PARTIAL — Exchange card is a stub shell. Data source is UNKNOWN. IRONMAN investigation required before this contract can be ACTIVE.
