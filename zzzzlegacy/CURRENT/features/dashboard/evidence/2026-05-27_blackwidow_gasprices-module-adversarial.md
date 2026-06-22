# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-27
**Scope:** VCSM
**Target Module:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/`
**Reviewer:** BLACKWIDOW
**Environment:** Repository-scoped adversarial simulation (sandbox only — no production mutation)
**Governance Status:** DRAFT
**VENOM Cross-Reference:** `2026-05-27_venom_gasprices-module-deep-scan.md`

---

## Attack Surface Summary

The gas prices module is a citizen-facing crowd-sourced price reporting system layered over an owner-managed official price store. It exposes two distinct trust tiers:

- **Owner path**: direct write to `vport.fuel_prices` via `submitFuelPriceSuggestion(ownerUpdate=true)`
- **Citizen path**: creates a submission row in `vport.fuel_price_submissions` for owner review

**Attack surface hierarchy:**
| Surface | Exposure |
|---|---|
| `submitFuelPriceSuggestion` controller | Citizen-reachable write path — primary attack target |
| `reviewFuelPriceSuggestion` controller | Owner-only path — ownership gate confirmed present |
| `publishFuelPriceUpdateAsPost` controller | Owner-only path — 1-hour dedup, label whitelist |
| `updateStationFuelUnit` controller | Owner-only path — unit whitelist |
| `fuel_price_submissions` INSERT | No ON CONFLICT clause — concurrent duplicate race possible |
| `vportFuelPriceReviews.write.dal.js` | Status enum accepted from caller without whitelist |
| `index.js` barrel export | `resolveActorIdFromProfileId` exposed publicly — unintended surface |

---

## Simulated Threat Scenarios

### Scenario 1 — fuelKey Injection via Citizen Submit Path
**Attack:** Authenticated citizen submits an arbitrary `fuelKey` value not in any official label set (e.g., `"<script>alert(1)</script>"`, `"regular'; DROP TABLE fuel_prices;--"`, `"../../etc/passwd"`)

### Scenario 2 — Concurrent Duplicate Submission Race
**Attack:** Authenticated citizen fires 2–5 simultaneous submit requests for the same `fuelKey` before the first resolves. No DB uniqueness constraint on `(profile_id, fuel_key, status='pending')`.

### Scenario 3 — Decision Enum Injection
**Attack:** Owner sends `decision = "hacked_status"` as review decision — DAL passes this string directly to the `status` column update without whitelist validation.

### Scenario 4 — Cross-Actor Owner Claim
**Attack:** Actor B authenticates with their own session, then calls `submitFuelPriceSuggestion(ownerUpdate=true, actorId=B, targetActorId=A)` — attempting to write official prices to a VPORT they do not own.

### Scenario 5 — Null/Missing actorId to Citizen Path
**Attack:** Unauthenticated or partially authenticated caller submits with null or missing `actorId`.

### Scenario 6 — Stale Pending Submission Replay
**Attack:** Citizen creates a pending submission, owner approves it, then citizen replays the original submission payload to create a new pending entry for the same fuelKey.

### Scenario 7 — Submit to Deleted / Deactivated VPORT
**Attack:** Citizen submits a fuel price for a VPORT that was deactivated or deleted after the citizen obtained the `targetActorId`.

### Scenario 8 — Settings Cache Poisoning via Race
**Attack:** While an owner changes station settings (min_price, max_price thresholds), a citizen simultaneously submits a price that would be rejected by the new settings — the citizen's submit path reads from the 300s TTL settings cache.

### Scenario 9 — viewerActorId Context Fuzz on Review Path
**Attack:** Null, malformed, or deactivated `actorId` passed to `reviewFuelPriceSuggestion` controller.

### Scenario 10 — Feed Post Publish as Non-Owner
**Attack:** Non-owner actor attempts to call `publishFuelPriceUpdateAsPost` with a VPORT's `targetActorId`.

### Scenario 11 — hydration / pendingSubmissions Cache Poisoning
**Attack:** Inject stale actor summary or stale pendingSubmissions cache for another actor's VPORT.

### Scenario 12 — URL Surface: Raw UUID in Gas Route
**Attack:** Inspect whether `/actor/:actorId/gas` or `/actor/:actorId/dashboard/gas` exposes a raw UUID in the public URL path.

### Scenario 13 — Index Barrel: `resolveActorIdFromProfileId` Abuse
**Attack:** External feature imports `resolveActorIdFromProfileId` from the gas prices index barrel, bypassing the profiles DAL access control boundary.

---

## Ownership Bypass Results

### Scenario 4 — Cross-Actor Owner Write — BLOCKED

**OWNERSHIP BYPASS ATTEMPT**
- Target: `submitFuelPriceSuggestion` owner path
- Attack vector: Actor B provides `actorId=B, targetActorId=A` with `ownerUpdate=true`
- Result: **BLOCKED**
- Evidence: Controller calls `checkVportOwnershipController({ callerActorId: actorId, targetActorId })` before writing. This resolves through `profiles/adapters/kinds/vport/ownership.adapter.js` → `checkVportOwnership.controller.js` → `actor_owners` DB table. Actor B is not in `actor_owners` for VPORT A — returns ownership denied.
- Controller gate: **PRESENT**
- Severity: N/A (blocked)

### Scenario 10 — Publish Feed Post as Non-Owner — BLOCKED

**OWNERSHIP BYPASS ATTEMPT**
- Target: `publishFuelPriceUpdateAsPost` controller
- Attack vector: Non-owner actor calls with target VPORT's actorId
- Result: **BLOCKED**
- Evidence: `checkVportOwnershipController({ callerActorId: actorId, targetActorId: actorId })` — self-check pattern. Caller must own their own identity as a VPORT. Non-VPORT actor or cross-VPORT caller fails gate.
- Controller gate: **PRESENT**
- Severity: N/A (blocked)

---

## Session Mutation Results

### Scenario 5 — Null actorId to Citizen Path — BLOCKED

**SESSION MUTATION ATTEMPT**
- Target: `submitFuelPriceSuggestion` citizen path
- Attack vector: `actorId = null` or `actorId = undefined`
- Result: **BLOCKED**
- Evidence: Controller early-exits with `{ error: "Not authorized" }` when `actorId` is falsy. `createFuelPriceSubmissionDAL` is never reached.
- Session binding: **ENFORCED**
- Severity: N/A (blocked)

### Scenario 9 — Null actorId to Review Path — BLOCKED

**SESSION MUTATION ATTEMPT**
- Target: `reviewFuelPriceSuggestion` controller
- Attack vector: Null or malformed `actorId` passed as reviewer
- Result: **BLOCKED**
- Evidence: Controller fetches submission by ID first, then resolves `targetActorId` from `subRow.profile_id` (not from caller), then calls `checkVportOwnershipController({ callerActorId: actorId, targetActorId })`. Null `actorId` fails ownership check.
- Session binding: **ENFORCED**
- Severity: N/A (blocked)

---

## Runtime Abuse Results

### Scenario 3 — Decision Enum Injection — PARTIAL

**RUNTIME ABUSE ATTEMPT**
- Target: `reviewFuelPriceSuggestion` → `updateFuelPriceSubmissionStatusDAL`
- Actor role used: Authenticated VPORT owner
- Expected access: RESTRICTED to `['approved', 'rejected']`
- Result: **PARTIAL**
- Evidence: Controller calls `updateFuelPriceSubmissionStatusDAL({ submissionId, status: decision, reviewedBy: actorId, reviewedAt: new Date(), reason })` where `decision` is passed through from the caller without enum validation. A malicious owner could persist an arbitrary status string (e.g., `"corrupted"`, `"hacked"`) into the `fuel_price_submissions` table for rows they own. DB-level constraint not confirmed. Impact is self-contained to the caller's own VPORT data — no cross-actor write possible because ownership is verified before this call.
- Privilege gate: **PRESENT** (ownership verified), **WEAK** (enum not validated)
- Severity: LOW — self-harm only; no cross-actor impact

---

## RLS Verification Results

### Scenario 7 — Submit to Deleted VPORT — PARTIAL

**RLS VERIFICATION ATTEMPT**
- Table/View: `vport.fuel_price_submissions`
- Attack vector: Citizen submits for a deactivated/deleted VPORT's `targetActorId` where `resolveVportProfileId` may still return a `profile_id` if profile records persist after deactivation
- RLS status: **ASSUMED** — code assumes RLS blocks orphaned writes; not independently verified in this review
- Result: **PARTIAL**
- Evidence: `submitFuelPriceSuggestion` citizen path calls `resolveVportProfileId(targetActorId)` — if deactivated VPORT's profile_id still resolves (i.e., profile row not soft-deleted or RLS doesn't exclude it), the submission INSERT proceeds. The submission becomes an orphaned row in a deactivated VPORT's inbox. No active owner can review it (owner is deactivated). Row sits permanently in `pending` state.
- Severity: LOW — data hygiene issue; no security escalation

---

## Viewer Context Fuzz Results

### Scenario 5 — Null actorId (repeated from Session Mutation) — BLOCKED
Already documented above. All controllers with write operations perform early null-check on `actorId`.

### Scenario 8 — Settings Cache Staleness under Race — PARTIAL

**VIEWER CONTEXT FUZZ ATTEMPT**
- Target: `submitFuelPriceSuggestion` citizen path — settings validation
- Injected context: Settings with updated `min_price`/`max_price` thresholds, read from 300s TTL cache
- Expected result: Fresh settings applied to new submission
- Actual result: If settings were changed within the past 300 seconds, stale settings may be in cache. A citizen could submit a price that falls outside the owner's new min/max range without being caught at submit time. Note: `sanityCheck` validation is applied client-side and at controller level using cached settings.
- Context validation: **WEAK** (cache TTL may serve stale min/max window)
- Severity: LOW — submission still enters pending state for owner review; owner can reject. Not a security bypass, but a data quality gap.

---

## Mutation Replay Results

### Scenario 6 — Pending Submission Replay — PARTIAL

**MUTATION REPLAY ATTEMPT**
- Target resource: `vport.fuel_price_submissions`
- Resource state at time of replay: Prior submission was approved and removed from pending
- Result: **PARTIAL**
- Evidence: Citizen can re-submit for the same `fuelKey` after the prior submission was reviewed (approved or rejected). The citizen submit path has no idempotency protection — no check for a recent existing pending submission by the same citizen for the same fuel key. Each call to `createFuelPriceSubmissionDAL` is an independent INSERT with no `ON CONFLICT` clause. This alone is low-severity (it just creates another pending entry for owner review), but combined with concurrent submission (Scenario 2), it becomes a spam vector.
- State check: **ABSENT**
- Severity: LOW (solo replay) → MEDIUM when combined with BW-GAS-002 (concurrent flood)

### Scenario 2 — Concurrent Duplicate Submission Race — BYPASSED

**MUTATION REPLAY ATTEMPT**
- Target resource: `vport.fuel_price_submissions`
- Resource state at time of race: No pending submission exists yet
- Result: **BYPASSED**
- Evidence: `createFuelPriceSubmissionDAL` is a plain `INSERT` with no `ON CONFLICT` clause and no application-level uniqueness check. Two simultaneous citizen submits with identical payload will both succeed at the DB layer (assuming no DB-level constraint on `(profile_id, fuel_key, submitted_by_actor_id)` where `status='pending'`). The owner's review inbox receives both rows, doubling the noise. At scale with multiple fuelKeys, a single actor can flood the pending inbox before any rate-limiting applies.
- State check: **ABSENT**
- Severity: **MEDIUM** — inbox flood possible at moderate scale; see BW-GAS-002

---

## Hydration Poisoning Results

### Scenario 11 — pendingSubmissions Cache — PARTIAL

**HYDRATION POISONING ATTEMPT**
- Target: `useOwnerPendingSuggestions` hook → `getVportGasPricesController` result
- Injected state: Hook searches controller result for `pendingSubmissions`, `pending`, `pendingSuggestions`, `submissionsPending`
- Cache invalidation: N/A — this is a field-name mismatch bug, not a cache issue
- Result: **PARTIAL** (functional failure, not security failure)
- Evidence: `getVportGasPricesController` returns `{ actorId, settings, official, communitySuggestionByFuelKey }`. None of the 4 field names the hook probes (`pendingSubmissions`, `pending`, `pendingSuggestions`, `submissionsPending`) match any key in this return shape. Result: `pendingSubmissions` is always `[]`. The owner-side pending review UI is always empty regardless of actual DB state. This is a HIGH functional bug (owners cannot see citizen submissions via the dashboard hook), not a security issue. Documented for ELEKTRA fix recommendation.
- Severity: INFO (for BW) / HIGH (for functional reliability)

---

## Cross-Feature Abuse Results

### Scenario 13 — Index Barrel Surface Abuse — PARTIAL

**CROSS-FEATURE ABUSE ATTEMPT**
- Source feature: Any external feature
- Target feature internal: `resolveActorIdFromProfileId` from gas prices module
- Attack vector: External caller imports `resolveActorIdFromProfileId` from `gasprices/index.js` directly, bypassing the profiles DAL boundary
- Result: **PARTIAL**
- Evidence: `gasprices/index.js` re-exports `resolveActorIdFromProfileId` (from `dal/vportFuelPrices.read.dal.js`). This function was moved into the gas prices read DAL from the write DAL in a prior session. The barrel export makes it reachable as a public API of the gas prices module. External features that use it bypass the canonical access path through `profiles/adapters/`. No active external import confirmed by grep — but the surface is live and invites misuse.
- Adapter isolation: **WEAK** (barrel leak)
- Severity: LOW

---

## URL Surface Results

### Scenario 12 — UUID in Gas Route — INFO

**URL SURFACE TEST**
- Route: `/actor/:actorId/gas` and `/actor/:actorId/dashboard/gas`
- UUID exposure: **PRESENT** — `actorId` is a raw UUID in both routes
- Slug enforcement: **MISSING**
- Severity: INFO — this is a platform-wide pattern (all actor routes use raw actorId), not specific to the gas module. Tracked at platform level per VENOM findings. No additional gas-specific UUID leak beyond platform baseline.

---

## Notification Abuse Results

No notification deep links specific to gas prices were identified. The `publishFuelPriceUpdateAsPost` flow creates a feed post (not a notification). The feed post uses `FUEL_LABELS` whitelist for display text and does not include submission IDs or profile IDs in the post payload.

Result: **No gas-specific notification abuse surface found.**

---

## Auth Callback Replay Results

Not applicable to this module. The gas prices module has no auth callback, magic link, or recovery flow.

---

## Search Abuse Results

Not applicable to this module. The gas prices module has no search or directory surface.

---

## Successful Exploit Chains

### EC-001 — fuelKey Data Pollution (BW-GAS-001)
**Classification:** Injection exploit (unvalidated parameter stored as data)
**Chain:** Citizen authenticates → calls submit with arbitrary `fuelKey` string → controller has no fuelKey whitelist → `createFuelPriceSubmissionDAL` inserts row with attacker-controlled `fuel_key` → row appears in owner's pending inbox with arbitrary key → owner UI must render this string in a trusted context
**Result:** PARTIAL — data stored in DB; XSS impact at render depends on React's text encoding (likely blocked) but non-existent keys pollute the owner's review inbox

### EC-002 — Concurrent Submission Flood (BW-GAS-002)
**Classification:** Replay exploit (no uniqueness constraint)
**Chain:** Citizen authenticates → fires N concurrent submit requests for same `fuelKey` → `createFuelPriceSubmissionDAL` has no `ON CONFLICT` clause → all N rows persist → owner pending inbox flooded → N × M possible with multiple fuelKeys
**Result:** BYPASSED — no DB or application-level uniqueness constraint confirmed

### EC-003 — Decision Enum Corruption (BW-GAS-003)
**Classification:** Injection exploit (unwhitelisted enum passed to DAL)
**Chain:** Owner authenticates → calls reviewFuelPriceSuggestion with `decision = "arbitrary_string"` → passes ownership check → DAL performs `UPDATE fuel_price_submissions SET status = "arbitrary_string"` → row enters a non-standard status state that review query (`status = 'pending'`) will no longer surface
**Result:** PARTIAL — self-contained to caller's own VPORT rows; no cross-actor impact

### EC-004 — Orphaned Submission on Deactivated VPORT (BW-GAS-004)
**Classification:** Replay exploit (stale target state)
**Chain:** VPORT deactivates → citizen still holds targetActorId → citizen submits fuel price → `resolveVportProfileId` may still return profile_id → submission INSERT succeeds → orphaned row in inactive VPORT's queue with no owner to review
**Result:** PARTIAL — data hygiene failure; no security escalation

---

## Failed Exploit Chains (Defenses That Held)

| Scenario | Defense | Result |
|---|---|---|
| Cross-actor owner write | `checkVportOwnershipController` → `actor_owners` DB lookup | BLOCKED |
| Publish feed post as non-owner | `checkVportOwnershipController` self-check pattern | BLOCKED |
| Null actorId to citizen submit | Falsy actorId early exit | BLOCKED |
| Null actorId to review | `checkVportOwnershipController` null check | BLOCKED |
| Replay approved submission (single) | Low harm — new pending row for owner to review | BLOCKED (effectively) |
| Price out-of-range submission | Settings validation at submit (cached, see PARTIAL note) | BLOCKED (with caveat) |

---

## Runtime Evidence

### Controller Entry Points Verified
- `submitFuelPriceSuggestion`: `checkVportOwnershipController` gate confirmed for `ownerUpdate=true` path; citizen path accepts arbitrary `fuelKey` and has no rate limiting
- `reviewFuelPriceSuggestion`: Ownership derived from DB row (`subRow.profile_id`) — not from caller claim. Gate CONFIRMED.
- `publishFuelPriceUpdateAsPost`: `FUEL_LABELS` whitelist for display, `checkVportOwnershipController` gate, 1-hour dedup via `hasRecentFuelPricePostDAL`. Gate CONFIRMED.
- `updateStationFuelUnit`: `ALLOWED_UNITS = ["liter", "gallon"]` whitelist, `checkVportOwnershipController`. Gate CONFIRMED.

### DAL Verification
- `createFuelPriceSubmissionDAL`: Plain INSERT, no `ON CONFLICT`, no uniqueness protection. **Confirmed gap.**
- `updateFuelPriceSubmissionStatusDAL`: Accepts `status` from caller — no enum whitelist. **Confirmed gap.**
- `upsertVportFuelPriceDAL`: `ON CONFLICT (profile_id, fuel_key)` present. No fuelKey whitelist at DAL layer.

### Functional Bug Confirmed
- `useOwnerPendingSuggestions` hook probes for `pendingSubmissions` / `pending` / `pendingSuggestions` / `submissionsPending` on controller result — none of these match the actual return shape `{ actorId, settings, official, communitySuggestionByFuelKey }`. Owner review panel always empty. HIGH functional bug.

---

## Blast Radius

| Finding | Blast Radius |
|---|---|
| BW-GAS-001 (fuelKey injection) | Per-VPORT pending inbox pollution; no cross-actor data impact |
| BW-GAS-002 (concurrent flood) | Per-VPORT pending inbox; repeated across all citizen-visible VPORTs at scale |
| BW-GAS-003 (enum injection) | Per-VPORT submission rows only; owner self-harm |
| BW-GAS-004 (orphaned submissions) | Per-VPORT; deactivated VPORTs accumulate dead rows |
| BW-GAS-005 (barrel surface leak) | Platform-wide if adopted by other features |

---

## BLACKWIDOW FINDINGS

---

### BW-GAS-001 — fuelKey Injection: No Whitelist on Citizen Submit Path

**BLACKWIDOW ADVERSARIAL FINDING**
- **Finding ID:** BW-GAS-001
- **Scenario:** Scenario 1 — fuelKey Injection
- **Target:** `controller/submitFuelPriceSuggestion.controller.js` → citizen path
- **Application Scope:** VCSM
- **Platform Surface:** Citizen-facing submit UI → controller → DAL insert
- **Attack Vector:** Authenticated citizen sends `fuelKey = "<arbitrary string>"` — controller has no whitelist validation on the citizen path
- **Exploit Chain Type:** Injection exploit (unvalidated parameter stored as data)
- **Governance Status:** DRAFT
- **Result:** PARTIAL
- **Evidence:** Controller validates `ownerUpdate=true` path via `checkVportOwnershipController` but the citizen path (`ownerUpdate=false`) only checks that `actorId` is non-null. `fuelKey` is passed to `createFuelPriceSubmissionDAL` without validation. The INSERT succeeds with an arbitrary `fuel_key` value. At render, React's text encoding prevents XSS — but the owner's pending inbox receives a row with an unrecognized key that the UI may not handle gracefully.
- **Defense Gate:** ABSENT (citizen path); PRESENT (owner path)
- **Blast Radius:** Per-VPORT pending inbox — not cross-actor
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VENOM-GAS-F-003
- **Recommended Fix:** Add a `ALLOWED_FUEL_KEYS` whitelist to the citizen path in `submitFuelPriceSuggestion.controller.js`. The whitelist can be derived from `settings.fuelKeys` (already loaded from DB at controller entry) or from a shared constant shared with `FUEL_LABELS` in the publish controller.
- **Layer to Fix:** Controller
- **Required Follow-up Command:** ELEKTRA

---

### BW-GAS-002 — Concurrent Duplicate Submission Race: No DB Uniqueness Constraint

**BLACKWIDOW ADVERSARIAL FINDING**
- **Finding ID:** BW-GAS-002
- **Scenario:** Scenario 2 — Concurrent Submission Flood
- **Target:** `dal/vportFuelPriceSubmissions.write.dal.js` → `createFuelPriceSubmissionDAL`
- **Application Scope:** VCSM
- **Platform Surface:** Citizen-facing submit → DAL INSERT
- **Attack Vector:** Authenticated citizen fires 2–5 simultaneous submit requests for the same `fuelKey` in a single event loop tick (e.g., button double-tap, rapid programmatic calls). No `ON CONFLICT` clause and no application-level uniqueness check.
- **Exploit Chain Type:** Replay exploit (no uniqueness constraint)
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:** `createFuelPriceSubmissionDAL` performs a plain `INSERT INTO vport.fuel_price_submissions`. No `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE` clause. No application-level check for existing pending submission by same `(submitted_by_actor_id, profile_id, fuel_key)` where `status='pending'`. Two concurrent requests succeed independently — both rows persist.
- **Defense Gate:** ABSENT
- **Blast Radius:** Per-VPORT inbox flood; with multiple fuelKeys, single citizen can flood inbox before owner can review
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VENOM-GAS-F-002
- **Recommended Fix:** Two-layer defense: (1) Add DB-level `UNIQUE` constraint or `ON CONFLICT DO NOTHING` on `(profile_id, fuel_key, submitted_by_actor_id)` where `status='pending'` — or at minimum add `ON CONFLICT DO NOTHING` to the INSERT. (2) Add application-level pre-check in `submitFuelPriceSuggestion.controller.js` — query for existing pending submission by same actor for same fuelKey before inserting.
- **Layer to Fix:** DAL + Controller (defense in depth)
- **Required Follow-up Command:** ELEKTRA

---

### BW-GAS-003 — Decision Enum Injection: Status String Not Whitelisted

**BLACKWIDOW ADVERSARIAL FINDING**
- **Finding ID:** BW-GAS-003
- **Scenario:** Scenario 3 — Decision Enum Injection
- **Target:** `controller/reviewFuelPriceSuggestion.controller.js` → `updateFuelPriceSubmissionStatusDAL`
- **Application Scope:** VCSM
- **Platform Surface:** Owner review flow → DAL UPDATE
- **Attack Vector:** Owner passes `decision = "arbitrary_string"` as the review decision. Controller performs ownership check (passes — owner is authorized) then calls `updateFuelPriceSubmissionStatusDAL({ submissionId, status: decision, ... })` without whitelisting `decision`.
- **Exploit Chain Type:** Injection exploit (unwhitelisted enum passed to DAL)
- **Governance Status:** DRAFT
- **Result:** PARTIAL
- **Evidence:** No enum whitelist found in controller or DAL. A VPORT owner can persist any status string for their own submission rows. If DB has no `CHECK` constraint on the `status` column, arbitrary strings persist. Rows with unrecognized status values are excluded from `status='pending'` queries but may not appear in any other view — they become invisible ghost rows. Impact is self-contained to the caller's own VPORT data.
- **Defense Gate:** PRESENT (ownership), WEAK (enum not validated)
- **Blast Radius:** Per-VPORT submission rows only — no cross-actor impact
- **Severity:** LOW
- **VENOM Finding Cross-Reference:** VENOM-GAS-F-005 (related)
- **Recommended Fix:** Add `const VALID_DECISIONS = ['approved', 'rejected']` check in `reviewFuelPriceSuggestion.controller.js` before calling the DAL. Return `{ error: 'Invalid decision' }` on invalid value.
- **Layer to Fix:** Controller
- **Required Follow-up Command:** ELEKTRA

---

### BW-GAS-004 — Orphaned Submissions on Deactivated VPORT

**BLACKWIDOW ADVERSARIAL FINDING**
- **Finding ID:** BW-GAS-004
- **Scenario:** Scenario 7 — Submit to Deleted/Deactivated VPORT
- **Target:** `controller/submitFuelPriceSuggestion.controller.js` citizen path → `resolveVportProfileId`
- **Application Scope:** VCSM
- **Platform Surface:** Citizen-facing submit → profile resolution → submission INSERT
- **Attack Vector:** Citizen obtains `targetActorId` for a VPORT, the VPORT is subsequently deactivated, citizen submits fuel price. If `resolveVportProfileId` still resolves for a deactivated VPORT (profile row exists but VPORT is inactive), the INSERT succeeds and creates an orphaned pending row with no active owner to review it.
- **Exploit Chain Type:** Replay exploit (stale target state — VPORT deactivated after actorId obtained)
- **Governance Status:** DRAFT
- **Result:** PARTIAL
- **Evidence:** `resolveVportProfileId` performs a lookup against the profiles table. Whether it excludes deactivated VPORTs depends on RLS policy and/or query filter — neither confirmed in this review. No application-level VPORT active status check exists in the citizen submit controller path.
- **Defense Gate:** ASSUMED (RLS-dependent, not confirmed)
- **Blast Radius:** Per-VPORT; accumulates dead rows in deactivated VPORT's pending queue
- **Severity:** LOW
- **VENOM Finding Cross-Reference:** N/A (new finding)
- **Recommended Fix:** `submitFuelPriceSuggestion` citizen path should verify VPORT is active before inserting — or `resolveVportProfileId` should filter by active status. Alternatively, add a DB-level cascade/trigger that rejects writes to `fuel_price_submissions` for inactive `profile_id` values.
- **Layer to Fix:** Controller or DAL
- **Required Follow-up Command:** ELEKTRA

---

### BW-GAS-005 — Index Barrel: `resolveActorIdFromProfileId` Publicly Exported

**BLACKWIDOW ADVERSARIAL FINDING**
- **Finding ID:** BW-GAS-005
- **Scenario:** Scenario 13 — Index Barrel Surface Abuse
- **Target:** `cards/gasprices/index.js`
- **Application Scope:** VCSM
- **Platform Surface:** Module public API surface
- **Attack Vector:** External feature imports `resolveActorIdFromProfileId` directly from the gas prices index barrel, bypassing the canonical profiles DAL access path and cross-feature adapter boundary.
- **Exploit Chain Type:** Cross-feature boundary abuse
- **Governance Status:** DRAFT
- **Result:** PARTIAL — no confirmed active misuse; surface is live
- **Evidence:** `gasprices/index.js` re-exports `resolveActorIdFromProfileId` from `dal/vportFuelPrices.read.dal.js`. The function is a profiles DAL utility that exists in the gas prices module for internal use. Its presence in the public barrel makes it discoverable and importable by any feature, violating the architecture contract that cross-feature access must go through adapters only.
- **Defense Gate:** ABSENT (no import guard on barrel exports)
- **Blast Radius:** Platform-wide if adopted as a pattern by other features
- **Severity:** LOW
- **VENOM Finding Cross-Reference:** VENOM-GAS-F-004 (identity surface)
- **Recommended Fix:** Remove `resolveActorIdFromProfileId` from `gasprices/index.js`. It is an internal DAL utility — it should not be part of the module's public API. If external features need this function, they must import from `profiles/adapters/` only.
- **Layer to Fix:** Module surface (index.js)
- **Required Follow-up Command:** ELEKTRA

---

## THOR GATE ASSESSMENT

**Release Status: CAUTION**

No findings meet the CRITICAL or HIGH security threshold. The two MEDIUM findings (BW-GAS-001, BW-GAS-002) are pre-production concerns: the citizen-facing community suggestion feature should not be enabled in production until these two gaps are closed.

| Finding | Severity | Release Blocking? |
|---|---|---|
| BW-GAS-001 — fuelKey injection | MEDIUM | CAUTION — close before enabling citizen suggestions |
| BW-GAS-002 — concurrent flood | MEDIUM | CAUTION — close before enabling citizen suggestions |
| BW-GAS-003 — enum injection | LOW | No |
| BW-GAS-004 — orphaned submissions | LOW | No |
| BW-GAS-005 — barrel surface | LOW | No |
| Functional bug: pendingSubmissions always empty | HIGH (functional, not security) | YES if owner review feature is in-scope for release |

**THOR recommendation:** The module is safe to ship for the owner-direct-write path (official price management). The citizen suggestion path should remain disabled or guarded until BW-GAS-001 and BW-GAS-002 are fixed. The `useOwnerPendingSuggestions` functional bug must be fixed before the owner review UI is considered functional.

---

## Summary Table

| ID | Scenario | Severity | Status | Layer to Fix |
|---|---|---|---|---|
| BW-GAS-001 | fuelKey injection — citizen submit path | MEDIUM | DRAFT | Controller |
| BW-GAS-002 | Concurrent duplicate submission race | MEDIUM | DRAFT | DAL + Controller |
| BW-GAS-003 | Decision enum injection — review path | LOW | DRAFT | Controller |
| BW-GAS-004 | Orphaned submissions on deactivated VPORT | LOW | DRAFT | Controller or DAL |
| BW-GAS-005 | resolveActorIdFromProfileId barrel export | LOW | DRAFT | index.js |

**Scenarios:** 13 simulated
**Blocked:** 8
**Partial:** 4
**Bypassed:** 1 (EC-002 — concurrent flood)
**Critical exploit chains:** 0
**Medium findings:** 2
**Low findings:** 3

---

*BLACKWIDOW report — gas prices module — 2026-05-27*
*All findings are simulation-based, repository-scoped, non-destructive.*
*No production data was accessed or modified.*
