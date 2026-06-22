# Dashboard Module Behavior Contract — gas

Status: ACTIVE

Module: gas

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - GAS-RLS-001
- Security Review Status:
  - VENOM: COMPLETE at dashboard matrix level; source-side gas cache/screen architecture blockers patched.
  - ELEKTRA: COMPLETE at dashboard matrix level; source-to-sink split covered by focused tests.
  - BLACKWIDOW: COMPLETE at dashboard matrix level; DB RLS/check constraint verification still required.

---

## 1. User Goal

The gas module lets a GAS-kind VPORT display station fuel prices publicly and lets the station owner manage official fuel prices from the dashboard. Authenticated citizens can submit private pending fuel price suggestions for owner review. Owners can update official prices directly, review pending suggestions, apply approved suggestions to official prices, change the station fuel unit, and optionally publish fuel price updates to the feed.

Citizen suggestions are not public community posts. They are private pending rows: the submitter can read their own suggestion, the station owner can read/review station suggestions, and other regular users cannot read those pending rows. A suggestion becomes public price information only when an owner applies it to official prices. Citizen suggestion submission does not publish a feed post.

CURRENT SOURCE NOTE: The UI/source still contains community suggestion display behavior. `getVportGasPricesController` always attempts to load pending submissions and `GasPricesPanel` can render `communitySuggestionByFuelKey` when station settings allow it. With the current hardened RLS policy, unrelated users should not receive other users' pending rows; therefore this community suggestion UI only reflects rows visible to the active session, typically the submitter or station owner. If RLS denies the pending-submission read instead of returning an empty result, the public gas panel can surface a load error even though official prices are public.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| Public viewer | View public gas price card data for a station actor. | Cannot submit suggestions without authenticated identity. Cannot access owner dashboard actions. |
| Authenticated citizen | Submit fuel price suggestions for recognized fuel keys when price sanity checks pass. | Cannot update official prices, review submissions, update station unit, or publish station posts unless also an owner. |
| VPORT actor owner | Load owner gas dashboard, update official prices, review suggestions, apply approved suggestions, update station unit, and publish fuel update posts. | Must pass `checkVportOwnershipController` for privileged writes. |
| Non-owner authenticated actor | Public/citizen read and suggestion behavior only. | Must not perform owner updates, review queue actions, unit updates, or feed publishing. |

---

## 3. Module Architecture

### Routes

- Owner dashboard: `/actor/:actorId/dashboard/gas`
- Public gas screen: actor-based public gas price view through `VportGasPricesScreen`
- Dashboard runtime also indexes `/dashboard/gas`.

### Screens

- `screens/VportDashboardGasScreen.jsx`
- `screens/VportDashboardGasView.jsx`
- `screens/VportGasPricesScreen.jsx`
- `screens/VportGasPricesView.jsx`

### Hooks

- `hooks/useVportGasPrices.js`
- `hooks/useSubmitFuelPriceSuggestion.js`
- `hooks/useOwnerPendingSuggestions.js`
- `hooks/useSubmitBulkFuelPrices.js`
- `hooks/useUpdateStationFuelUnit.js`
- `hooks/useAfterSubmitSuggestion.js`
- `hooks/useGasUnitToggle.js`

### Controllers

- `controller/getVportGasPrices.controller.js`
- `controller/submitFuelPriceSuggestion.controller.js`
- `controller/submitOwnerFuelPriceUpdate.controller.js`
- `controller/submitCitizenFuelPriceSuggestion.controller.js`
- `controller/reviewFuelPriceSuggestion.controller.js`
- `controller/publishFuelPriceUpdateAsPost.controller.js`
- `controller/updateStationFuelUnit.controller.js`

### DALs

- `dal/vportFuelPrices.read.dal.js`
- `dal/vportFuelPrices.write.dal.js`
- `dal/vportFuelPriceHistory.write.dal.js`
- `dal/vportFuelPricePost.read.dal.js`
- `dal/vportFuelPriceReviews.write.dal.js`
- `dal/vportFuelPriceSubmissions.read.dal.js`
- `dal/vportFuelPriceSubmissions.write.dal.js`
- `dal/vportStationPriceSettings.read.dal.js`

### RPCs

- No gas-local RPC was found.

### Edge Functions

- No gas-local edge function was found.

### Engine Dependencies

- Profiles VPORT ownership adapter: `checkVportOwnershipController`
- Profiles profile resolver: `resolveVportProfileId`
- Upload/posts adapter: `createSystemPost`
- Shared realm constant: `PUBLIC_REALM_ID`
- Shared TTL cache utility: `createTTLCache`

### Ownership Gates

- Owner dashboard UI gate: `useVportOwnership(viewerActorId, actorId)`
- Owner direct price update: `checkVportOwnershipController({ callerActorId: actorId, targetActorId })`
- Owner review: resolves target actor from submission profile, then verifies ownership.
- Unit toggle: verifies ownership before updating unit.
- Feed publish: verifies owner via `checkVportOwnershipController({ callerActorId: actorId, targetActorId: actorId })`.

---

## 4. Happy Paths

### HP-001

BEH-DASH-gas-001

Preconditions:

Station actor id is known.

Flow:

Public user opens gas price screen -> `VportGasPricesScreen` resolves `actorId` -> `VportGasPricesView` calls `useVportGasPrices` -> hook calls `getVportGasPricesController` -> controller loads station settings and official fuel prices -> model maps display rows -> `GasPricesPanel` renders official price data. Pending citizen suggestions are not public unless the active session is the submitter or an owner permitted by RLS.

Expected Result:

Public gas price view renders current official prices. Pending citizen suggestions remain private review data and do not appear to unrelated public or authenticated viewers.

Data Changes:

None.

---

### HP-002

BEH-DASH-gas-002

Preconditions:

Authenticated citizen has an `actorId`; target station actor id is known.

Flow:

Citizen submits a fuel key and proposed price -> `useSubmitFuelPriceSuggestion` calls `submitFuelPriceSuggestionController` with `ownerUpdate: false` -> controller validates required fields, allowed fuel key, numeric price, station profile, sanity bounds, official-price delta, and existing pending submission -> `createFuelPriceSubmissionDAL` inserts pending submission -> pending submissions cache invalidates -> UI may patch the submitter's own session state.

Expected Result:

A private pending fuel price suggestion exists for owner review. The submitter can read their own pending suggestion, the station owner can read/review it, and unrelated users cannot see it.

Data Changes:

Insert into `vport.fuel_price_submissions`.

---

### HP-003

BEH-DASH-gas-003

Preconditions:

Authenticated VPORT owner is on the owner dashboard and `useVportOwnership` returns owner access.

Flow:

Owner submits fuel price update -> hook calls `submitFuelPriceSuggestionController` with `ownerUpdate: true` -> controller verifies ownership through `checkVportOwnershipController` -> controller validates sanity bounds -> `upsertVportFuelPriceDAL` writes official row -> `createVportFuelPriceHistoryDAL` writes history -> fuel price cache invalidates -> UI patches official row.

Expected Result:

Official station price updates immediately in the owner UI and appears in future gas price reads.

Data Changes:

Upsert into `vport.fuel_prices`; insert into `vport.fuel_price_history`.

---

### HP-004

BEH-DASH-gas-004

Preconditions:

Authenticated VPORT owner has pending suggestions in the owner review queue.

Flow:

Owner approves or rejects a pending suggestion -> `useOwnerPendingSuggestions` calls `reviewFuelPriceSuggestionController` -> controller fetches submission, resolves target actor from `profile_id`, verifies ownership, validates pending status and decision -> updates submission status -> invalidates pending cache -> if approved and apply-to-official is true, validates fuel key, upserts official price, and writes history -> creates review log row -> dashboard refreshes.

Expected Result:

Pending suggestion is approved or rejected. Approved suggestions can update official prices and write a review log.

Data Changes:

Update `vport.fuel_price_submissions`; insert `vport.fuel_price_submission_reviews`; optionally upsert `vport.fuel_prices`; optionally insert `vport.fuel_price_history`.

---

### HP-005

BEH-DASH-gas-005

Preconditions:

Authenticated owner chooses a valid station unit.

Flow:

Owner toggles unit -> `useGasUnitToggle` optimistically sets local unit -> `useUpdateStationFuelUnit` calls `updateStationFuelUnitController` -> controller verifies ownership and allowed unit -> `updateFuelPriceUnitForActorDAL` updates unit on station fuel prices -> fuel price cache invalidates -> hook refreshes.

Expected Result:

Station fuel price unit changes to `liter` or `gallon`; UI rolls back if the write fails.

Data Changes:

Update `vport.fuel_prices.unit`.

---

### HP-006

BEH-DASH-gas-006

Preconditions:

Owner completed one or more official fuel price updates and chooses to share to feed.

Flow:

Bulk submit hook gathers updated official fuels -> `publishFuelPriceUpdateAsPostController` verifies owner, filters valid fuels, enforces one-hour recent-post throttle, resolves station name, and calls `createSystemPost`.

Expected Result:

Fuel update post is created or skipped with a non-blocking status reason. Price updates remain committed even if feed publishing fails.

Data Changes:

Insert into feed/post system through posts adapter when published.

---

## 5. Failure Paths

### FP-001

BEH-DASH-gas-101

Trigger:

`actorId` is missing on public route or owner route.

Expected System Behavior:

Public screen renders invalid station; owner screen returns null before hook orchestration.

Expected UI Behavior:

User sees invalid station copy on public screen or no owner screen content.

Expected Logging:

No gas-local logging found.

---

### FP-002

BEH-DASH-gas-102

Trigger:

Owner dashboard loads without identity.

Expected System Behavior:

Owner screen blocks before owner-only panels render.

Expected UI Behavior:

`Sign in required.`

Expected Logging:

No gas-local logging found.

---

### FP-003

BEH-DASH-gas-103

Trigger:

Authenticated non-owner attempts owner dashboard access.

Expected System Behavior:

`useVportOwnership` marks caller as not owner; owner screen blocks privileged UI.

Expected UI Behavior:

`You can only manage gas prices for your own vport.`

Expected Logging:

No gas-local logging found.

---

### FP-004

BEH-DASH-gas-104

Trigger:

Fuel suggestion or owner update uses an unrecognized fuel key.

Expected System Behavior:

`submitFuelPriceSuggestionController` returns `{ ok: false, reason: "invalid_fuel_key" }`; review apply path also rejects invalid fuel key.

Expected UI Behavior:

Error maps to `Fuel type is not recognized.`

Expected Logging:

No gas-local logging found.

---

### FP-005

BEH-DASH-gas-105

Trigger:

Price is non-numeric or violates configured sanity bounds/delta checks.

Expected System Behavior:

Controller returns `invalid_number`, `out_of_range`, or `too_far_from_official`.

Expected UI Behavior:

Normalized user-facing error is shown.

Expected Logging:

No gas-local logging found.

---

### FP-006

BEH-DASH-gas-106

Trigger:

Citizen already has a pending suggestion for the same station/fuel key.

Expected System Behavior:

Controller returns `already_pending` from app-level check or from DB duplicate error `23505`.

Expected UI Behavior:

Error maps to `You already have a pending suggestion for this fuel type.`

Expected Logging:

No gas-local logging found.

---

### FP-007

BEH-DASH-gas-107

Trigger:

Non-owner attempts owner direct update, review, unit toggle, or feed publish through controller entry point.

Expected System Behavior:

Controller returns `not_owner` or failed/skipped publish status.

Expected UI Behavior:

Owner dashboard should not expose these actions; direct failures map to a user-safe permission message where normalized.

Expected Logging:

No gas-local logging found.

---

### FP-008

BEH-DASH-gas-108

Trigger:

Feed publish has no valid fuels, no realm id, recent fuel post, or adapter failure.

Expected System Behavior:

Controller returns skipped/failed status; bulk submit catches publish failures as non-blocking.

Expected UI Behavior:

Toast reports publish saved/skipped/failed result while preserving committed prices.

Expected Logging:

No gas-local logging found.

---

## 6. Security Rules

### SEC-001

BEH-DASH-gas-201

Rule:

Public gas price reads may load public station price data, but owner dashboard management must be owner-only.

Enforcement Layer:

Public route has no ownership gate; owner dashboard uses `useVportOwnership` and controller gates for writes.

Current Status:

IMPLEMENTED at UI/controller layer.

Finding Links:

- GAS-RLS-001

---

### SEC-002

BEH-DASH-gas-202

Rule:

Official price updates require actor-owner verification.

Enforcement Layer:

`submitFuelPriceSuggestionController` owner path calls `checkVportOwnershipController`.

Current Status:

IMPLEMENTED.

Finding Links:

- VENOM gas prior findings marked resolved in current source.

---

### SEC-003

BEH-DASH-gas-203

Rule:

Suggestion review must resolve the target VPORT from the submission row, then verify ownership before changing status or official prices.

Enforcement Layer:

`reviewFuelPriceSuggestionController`.

Current Status:

IMPLEMENTED.

Finding Links:

- GAS-RLS-001

---

### SEC-004

BEH-DASH-gas-204

Rule:

Citizen suggestions must be bounded by recognized fuel key, numeric price validation, station sanity settings, and duplicate-pending guard.

Enforcement Layer:

`submitFuelPriceSuggestionController`; `ALLOWED_FUEL_KEYS`; pending-submission read before insert; DB duplicate error handling.

Current Status:

IMPLEMENTED in current source; DB constraint/RLS verification remains open.

Finding Links:

- GAS-RLS-001

---

### SEC-005

BEH-DASH-gas-205

Rule:

Gas write DALs must not be exposed as public module exports because DALs do not enforce ownership.

Enforcement Layer:

Should be enforced by module boundary/index policy.

Current Status:

RESOLVED / SOURCE-VERIFIED. `gasprices/index.js` no longer exports DAL files; the public card barrel exposes models, controllers, hooks, components, and screens only.

Finding Links:

- RULE9-DASH-GAS-001

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-gas-301

Invariant:

A non-owner must never update official gas prices, station unit, suggestion review status, or publish station fuel posts.

Current Status:

Controller gates implemented; public index DAL export bypass risk is patched. DB RLS verification remains open.

Related Findings:

- GAS-RLS-001

Required Tests:

- TESTREQ-DASH-gas-001
- TESTREQ-DASH-gas-006

---

### MNH-002

BEH-DASH-gas-302

Invariant:

Unrecognized fuel keys must never enter official fuel prices or pending submissions.

Current Status:

Controller/model allowlist implemented in current source; DB check verification remains open.

Related Findings:

- GAS-RLS-001

Required Tests:

- TESTREQ-DASH-gas-002

---

### MNH-003

BEH-DASH-gas-303

Invariant:

A single authenticated citizen must not flood a station/fuel key with unlimited duplicate pending submissions.

Current Status:

App-level existing-pending guard implemented; DB partial unique/RLS verification remains open.

Related Findings:

- GAS-RLS-001

Required Tests:

- TESTREQ-DASH-gas-003

---

### MNH-004

BEH-DASH-gas-304

Invariant:

Gas official price cache must not remain stale after owner update, unit update, or approved suggestion apply.

Current Status:

RESOLVED / SOURCE-VERIFIED. `FuelPriceCacheService` owns official, pending, and settings cache invalidation; controllers call the service.

Related Findings:

- DEFER-006
- GAS-CACHE-001

Required Tests:

- TESTREQ-DASH-gas-004

---

### MNH-005

BEH-DASH-gas-305

Invariant:

Public module exports must not expose write DALs as callable surfaces outside controller ownership gates.

Current Status:

RESOLVED / SOURCE-VERIFIED. `gasprices/index.js` no longer exports `./dal/*`.

Related Findings:

- RULE9-DASH-GAS-001

Required Tests:

- TESTREQ-DASH-gas-006

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vport.station_price_settings` | Load community/sanity settings. | No | No gas-local settings write found. | No |
| `vport.fuel_prices` | Load official fuel prices; resolve actor from profile for review path. | Upsert through owner update or approved review apply. | Update unit and official price rows. | No |
| `vport.fuel_price_history` | No read path found in gas module. | Insert history rows after official price writes. | No | No |
| `vport.fuel_price_submissions` | Load pending submissions; fetch submission by id for review. | Insert citizen suggestions. | Update status/review fields. | No |
| `vport.fuel_price_submission_reviews` | No read path found in gas module. | Insert review log rows. | Update `applied_to_official` helper exists; not observed in controller flow. | No |
| Feed/post system | Recent fuel post check and station name resolution. | Insert system post through adapter. | No | No |

---

## 9. Side Effects

Notifications:

No notification side effect found.

Analytics:

No gas-local analytics side effect found.

Media:

None found.

Exports:

None found.

Jobs:

None found.

Cache:

`fuelPriceCache` uses 60s TTL; `pendingSubmissionsCache` uses 30s TTL; `settingsCache` uses 5m TTL. Official cache invalidation is called from owner update, unit toggle, and review apply paths. Pending cache invalidation occurs after submission insert and review status changes.

Other:

Feed publishing can create a `fuel_price_update` system post with a one-hour dedup window. Owner dashboard uses toast state to surface publish results.

---

## 10. UI Outputs

Loading States:

Owner dashboard shows `SkeletonCardList` while identity or ownership is loading. Gas price hooks expose loading state to panels.

Success States:

Public gas price panel, owner official gas panel, owner pending suggestion panel, unit toggle, bulk update modal, feed publish toast.

Error States:

Invalid station, sign-in required, non-owner management block, normalized gas error messages, unit error, bulk update error, panel load errors.

Empty States:

Panel-level empty behavior exists in gas components; exact copy not fully enumerated in this contract.

Owner States:

Owner sees official price management, pending suggestion review, unit toggle, and feed sharing.

Public States:

Public viewer sees official gas price card data. Authenticated public users can submit suggestions, but those suggestions are private pending review records and are not visible to unrelated users.

---

## 11. Acceptance Criteria

### AC-DASH-gas-001

Requirement:

Public gas price view loads station settings and official prices without owner-only actions. It must not expose unrelated users' pending suggestions.

Evidence:

`VportGasPricesView` uses `useVportGasPrices` and passes `isStationOwner` separately. Live RLS policy verification restricts `vport.fuel_price_submissions` reads to the submitter or station manager.

Status:

PASS at source review level.

---

### AC-DASH-gas-002

Requirement:

Citizen suggestions validate identity, fuel key, price sanity, and duplicate-pending status before insert.

Evidence:

`submitFuelPriceSuggestionController` checks `actorId`, `ALLOWED_FUEL_KEYS`, numeric price, settings bounds/delta, and existing pending submissions.

Status:

PASS at source review level; DB constraint verification remains open.

---

### AC-DASH-gas-003

Requirement:

Owner official updates and review actions require server-side ownership gates.

Evidence:

Owner path and review path call `checkVportOwnershipController`.

Status:

PASS at controller layer.

---

### AC-DASH-gas-004

Requirement:

Gas module public index must not expose write DALs.

Evidence:

`gasprices/index.js` no longer exports DAL files. Regression coverage exists in `gasprices.index.rule9.test.js`.

Status:

PASS / SOURCE-VERIFIED.

---

### AC-DASH-gas-005

Requirement:

Owner gas screen should separate Final and View responsibilities.

Evidence:

`VportDashboardGasScreen.jsx` now owns route params, identity loading, ownership gate, access-denied states, and portal wrapper. `VportDashboardGasView.jsx` owns hook wiring, toast state, and component composition.

Status:

PASS / SOURCE-VERIFIED.

---

## 12. Test Requirements

### TESTREQ-DASH-gas-001

Validates:

Owner direct update does not call official write DAL or invalidate official cache when ownership check fails.

Type:

Controller unit/security test.

Status:

PRESENT in `submitFuelPriceSuggestion.controller.test.js`.

---

### TESTREQ-DASH-gas-002

Validates:

Invalid fuel keys are rejected before submission or official price writes.

Type:

Controller/model unit test.

Status:

PRESENT for submit path; review path coverage not confirmed.

---

### TESTREQ-DASH-gas-003

Validates:

Duplicate pending suggestions return `already_pending` and do not create another pending submission.

Type:

Controller/DAL unit test.

Status:

PRESENT in submit controller tests and DAL duplicate handling evidence.

---

### TESTREQ-DASH-gas-004

Validates:

Official and pending caches are invalidated after owner update, unit update, citizen insert, and review status change/apply.

Type:

Controller/DAL unit test.

Status:

PRESENT in `submitFuelPriceSuggestion.controller.test.js` and `gasprices.spiderman.test.js`. Cache invalidation is centralized in `FuelPriceCacheService`.

---

### TESTREQ-DASH-gas-005

Validates:

Raw server/database error strings are normalized before user-facing display.

Type:

Model/component test.

Status:

PRESENT for `gasErrorMessages.model.test.js`; component usage coverage not confirmed.

---

### TESTREQ-DASH-gas-006

Validates:

`gasprices/index.js` does not export write DALs.

Type:

Architecture/SENTRY boundary test.

Status:

PRESENT in `gasprices.index.rule9.test.js`.

---

### TESTREQ-DASH-gas-007

Validates:

DB RLS/check constraints prevent non-owner official writes, duplicate pending spam, and invalid fuel keys even if controller is bypassed.

Type:

DB/RLS security test.

Status:

NEEDS LIVE DB VERIFICATION. Source tests cannot prove deployed RLS/check constraints.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| RULE9-DASH-GAS-001 | HIGH | RESOLVED / SOURCE-VERIFIED | BEH-DASH-gas-201, BEH-DASH-gas-301, BEH-DASH-gas-305 |
| DEFER-004 | MEDIUM | RESOLVED / SOURCE-VERIFIED | BEH-DASH-gas-001 through BEH-DASH-gas-006 |
| DEFER-006 | MEDIUM | RESOLVED / SOURCE-VERIFIED | BEH-DASH-gas-304 |
| GAS-CACHE-001 | MEDIUM | RESOLVED / SOURCE-VERIFIED | BEH-DASH-gas-304 |
| GAS-RLS-001 | HIGH | NEEDS_VERIFICATION | BEH-DASH-gas-201, BEH-DASH-gas-204, BEH-DASH-gas-301, BEH-DASH-gas-302, BEH-DASH-gas-303 |
| VENOM-GAS-F-001 | MEDIUM | SOURCE-CHANGED / VERIFY | BEH-DASH-gas-202 |
| VENOM-GAS-F-002 | MEDIUM | SOURCE-CHANGED / VERIFY | BEH-DASH-gas-303 |
| VENOM-GAS-F-003 | MEDIUM | SOURCE-CHANGED / VERIFY | BEH-DASH-gas-302 |
| VENOM-GAS-F-004 | LOW | SOURCE-CHANGED / VERIFY | BEH-DASH-gas-002 |
| VENOM-GAS-F-006 | LOW | SOURCE-CHANGED / VERIFY | BEH-DASH-gas-105 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Dashboard matrix THOR classification | CAUTION | No, but tracked caution remains. |
| Module DR_STRANGE command coverage | BLOCKED | Yes for module-level release sign-off; only DR. STRANGE PARTIAL evidence exists. |
| Rule 9 write DAL export remediation | RESOLVED / SOURCE-VERIFIED | No. |
| RLS/check constraint verification | NEEDS_VERIFICATION | Yes for security approval. |
| Owner screen Final/View split | RESOLVED / SOURCE-VERIFIED | No. |
| SPIDER-MAN gas tests | COMPLETE for source; DB verification still external | No for source; yes for final THOR CLEAR. |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Public gas price display | Unknown | MISSING SOURCE |
| Citizen price suggestion | Unknown | MISSING SOURCE |
| Owner official price update | Unknown | MISSING SOURCE |
| Owner pending suggestion review | Unknown | MISSING SOURCE |
| Unit toggle | Unknown | MISSING SOURCE |
| Feed publish after price update | Unknown | MISSING SOURCE |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| Profiles VPORT ownership adapter | Owner verification for privileged gas writes. | ACTIVE |
| Profiles profile resolver | Resolve profile id from actor id for profile-scoped gas tables. | ACTIVE |
| Upload/posts adapter | Create fuel update feed posts. | ACTIVE |
| Shared TTL cache | Cache official prices, pending submissions, and station settings. | ACTIVE; centralized through `FuelPriceCacheService`. |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-gas-001 | Have DB RLS policies and CHECK/UNIQUE constraints been verified for `fuel_prices` and `fuel_price_submissions` against controller bypass? | OPEN |
| OQ-DASH-gas-002 | Should `gasprices/index.js` stop exporting all write DALs and expose controllers/models/hooks only? | ANSWERED — yes; source patched. |
| OQ-DASH-gas-003 | Should `VportDashboardGasScreen.jsx` be split into Final Screen and View Screen under DEFER-004 before additional feature work? | ANSWERED — yes; source patched. |
| OQ-DASH-gas-004 | Should official/pending/settings cache invalidation move into a dedicated gas cache service? | ANSWERED — yes; source patched. |
| OQ-DASH-gas-005 | What native or alternate UI parity contract applies to gas price display and owner management? | OPEN |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | YES — module README, screens, controllers. |
| Actors / Roles | HIGH | YES — source and ownership docs. |
| Module Architecture | HIGH | YES — source inventory. |
| Happy Paths | HIGH | YES — hooks/controllers/DALs. |
| Failure Paths | MEDIUM | YES for controller/hook source; runtime UI not executed. |
| Security Rules | HIGH | YES — controllers, governance, VENOM report. |
| Must Never Happen | HIGH | YES — derived from source/gov findings. |
| Data Changes | HIGH | YES — DAL source. |
| Side Effects | HIGH | YES — cache and post adapter source. |
| UI Outputs | MEDIUM | YES — screen/component source partially reviewed. |
| Acceptance Criteria | MEDIUM | YES — source review only. |
| Test Requirements | HIGH | YES — test files and scanner map. |
| Security Findings Linked | MEDIUM | YES — source differs from older VENOM report, marked verify. |
| THOR Release Gates | MEDIUM | YES — dashboard matrix and module DR_STRANGE conflict preserved. |
| Native / Alternate UI Parity | LOW | NO — no native parity source found. |
| Engine Dependencies | HIGH | YES — imports. |
| Open Questions | HIGH | YES — from governance/source gaps. |

---

## 19. Command Sign-Off

ARCHITECT: DRAFTED_FROM_SOURCE

VENOM: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX_AND_GAS_SCAN

ELEKTRA: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX

BLACKWIDOW: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX

SPIDER-MAN: COMPLETE FOR SOURCE — 57 gas tests pass, including Rule 9, final/view split, cache service ownership, owner update, citizen submit, DAL, and error-message coverage. Live DB RLS verification remains external.

PROFESSOR X: DRAFT_READY_FOR_REVIEW

THOR: CAUTION — source blockers resolved; blocked only on live DB RLS/check-constraint verification before CLEAR.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding ID | Handoff |
|---|---|---|---|
| Owner update path: explicit actor_owners ownership assert unverified | HIGH | VEN-DASHBOARD-006 (ownerUpdate controlled by client-side isOwner prop) | VENOM |
| Direct import from profiles feature DAL: resolveVportProfileId imported across feature boundary | HIGH | ARCHITECT_VERIFIED | SENTRY |
| Feed post creation dependency path (publishFuelPriceUpdateAsPost) unverified | MEDIUM | ARCHITECT_VERIFIED | IRONMAN |
| fuelPriceCache.service.js invalidation strategy undocumented | MEDIUM | ARCHITECT_VERIFIED | LOKI |
| No native parity notes | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: 7 test files present — good coverage basis. Owner path additional security coverage recommended.

Ownership enforcement: Citizen path verified (resolveVportProfileId server-side + actorId). Owner direct update path: PARTIAL — ownerUpdate flag is client-controlled per VEN-DASHBOARD-006. Requires VENOM validation.

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/gasprices/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §8 (gasprices mutations), §11 (fuel price cache side effect)
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md (VEN-DASHBOARD-005, VEN-DASHBOARD-006)
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_ACTIVE — Citizen and owner paths documented. Owner path security gap (VEN-DASHBOARD-006) routes to VENOM. profiles DAL boundary violation routes to SENTRY.
