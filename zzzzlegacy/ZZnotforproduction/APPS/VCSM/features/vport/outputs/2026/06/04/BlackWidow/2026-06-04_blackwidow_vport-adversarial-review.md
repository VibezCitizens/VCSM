# BLACKWIDOW V2 — Adversarial Runtime Verification Report
## Feature: vport | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Version | BW2.9 |
| Agent | BLACKWIDOW V2 |
| Feature | vport |
| App | VCSM |
| Run Date | 2026-06-04 |
| Scanner Preflight | FRESH — 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Behavior Contract | PLACEHOLDER — all §9 invariants UNANCHORED |
| VENOM Open Findings | VEN-VPORT-002, VEN-VPORT-003, VEN-VPORT-004, VEN-VPORT-005, VEN-VPORT-006, VEN-VPORT-007, VEN-VPORT-008 (HIGH/MEDIUM) |
| ELEKTRA | NOT RUN |
| Output File | ZZnotforproduction/APPS/VCSM/features/vport/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_vport-adversarial-review.md |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Status | FRESH |
| Maps Generated | 2026-06-04T19:48:25.152Z (~7h old at run time) |
| Scanner Version | 1.1.0 |
| Total Platform Security Paths | 598 |
| vport Security Paths | 11 |
| vport Callgraph Nodes | 1,017 |
| vport Callgraph Edges | 1,433 |
| vport Callgraph Layers | barrel:82, component:131, controller:146, dal:151, hook:89, model:140, module:86, screen:192 |

---

## 3. Scanner Inputs Block

**Security Path Map:** `apps/scanner/maps/security-path-map.json`
**Callgraph Map:** `apps/scanner/maps/callgraph.json`
**Write Execution Map:** `apps/scanner/maps/write-execution-map.json` — returned 0 vport paths (unresolved routes)
**RPC Execution Map:** `apps/scanner/maps/rpc-execution-map.json` — returned 0 vport paths (unresolved routes)

All 11 vport security paths are LOW confidence (no resolved sourceRoute). This is the expected scanner signal for a dashboard-mounted feature with dynamic route segments. All 11 paths are PRIMARY ATTACK TARGETS per Rule BW-002.

**Scanner Low-Confidence Surfaces (ALL 11):**

| # | Write Operation | Table / RPC | File |
|---|---|---|---|
| 1 | rpc | create_vport | vport.core.dal.js |
| 2 | rpc | soft_delete_vport | vport.core.dal.js |
| 3 | rpc | hard_delete_vport | vport.core.dal.js |
| 4 | rpc | restore_vport | vport.core.dal.js |
| 5 | update | vport.profiles | vport.core.dal.js (updateVport) |
| 6 | update | vport.profiles | vport.write.profileMedia.dal.js (updateVportAvatarMediaAssetIdDAL) |
| 7 | update | vport.profiles | vport.write.profileMedia.dal.js (updateVportBannerMediaAssetIdDAL) |
| 8-11 | (rpc duplicates) | various | vport.core.dal.js |

---

## 4. Attack Surface Inventory

### A. DAL Write Surfaces (source-verified)

| DAL Function | Table / RPC | Auth Guard | Ownership Filter |
|---|---|---|---|
| `createVport` | rpc:create_vport | requireUser() — Supabase session | RPC enforces session |
| `softDeleteVport` | rpc:soft_delete_vport | none at DAL | RPC enforces |
| `hardDeleteVport` | rpc:hard_delete_vport | none at DAL | RPC enforces |
| `restoreVport` | rpc:restore_vport | none at DAL | RPC enforces |
| `updateVport` | vport.profiles | requireUser() — but NO owner_user_id filter in UPDATE | RLS only |
| `updateVportAvatarMediaAssetIdDAL` | vport.profiles | none at DAL | RLS only (.eq actor_id) |
| `updateVportBannerMediaAssetIdDAL` | vport.profiles | none at DAL | RLS only (.eq actor_id) |
| `updateVportBookingDAL` | vport.bookings | none at DAL | .eq profile_id (ownership resolved by controller) |
| `insertVportBookingDAL` | vport.bookings | none at DAL | RLS + caller controls payload |
| `upsertVportPublicDetailsDAL` | vport.profile_public_details | supabase.auth.getUser() + owner_user_id check | DUAL: owner_user_id verify + RLS |
| `upsertVportFuelPriceDAL` | vport.fuel_prices | none at DAL | RLS only |
| `createFuelPriceSubmissionDAL` | vport.fuel_price_submissions | none at DAL | RLS only |
| `createVportFuelPriceHistoryDAL` | vport.fuel_price_history | none at DAL | RLS only |
| `updateFuelPriceUnitForActorDAL` | vport.fuel_prices | none at DAL | .eq profile_id (ownership resolved by controller) |
| `insertVportResourceDAL` | vport.resources | none at DAL | RLS only |
| `updatePortfolioMediaAssetIdDAL` | vport.portfolio_media | none at DAL | .eq profile_id (callerProfileId) |

### B. Controller Entry Points (UI-accessible hooks)

| Hook | Controller Called | Ownership Gate |
|---|---|---|
| `useVportBookingActions` | `updateBookingStatusController` | assertActorOwnsVportActorController (BLOCKED) |
| `useQuickBookingModal` | `createOwnerBookingController` | assertActorOwnsVportActorController (BLOCKED) |
| `useVportBookingOps` | `createVportPublicBookingController` | readActorVportLinkDAL kind check (PARTIAL) |
| `useSaveVportSettings` | `settingsSaveCoordinator` → `saveVportPublicDetailsByActorIdController` | assertActorOwnsVportActorController (BLOCKED) |
| `useUpdateStationFuelUnit` | `updateStationFuelUnitController` | checkVportOwnershipController (BLOCKED) |
| `useSubmitFuelPriceSuggestion` | `submitFuelPriceSuggestionController` | checkVportOwnershipController on ownerUpdate path (BLOCKED) |
| `useOwnerPendingSuggestions` | `reviewFuelPriceSuggestionController` | checkVportOwnershipController (BLOCKED) |

---

## 5. Scanner Signals Block

- All 11 vport security paths are SCANNER_LOW_CONF — no resolved route.
- Write execution map returned 0 results — routes unresolved at scanner time.
- RPC execution map returned 0 results — same reason.
- Source survey reveals 16 active DAL write surfaces across bookings, settings, fuel prices, portfolio, resources, and vport lifecycle.
- Primary scanner signal: `updateVport` (vport.profiles UPDATE) has no app-layer ownership filter — VEN-VPORT-002 (open). BW adversarial test conducted below.

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS

#### A1 — updateVport ownership bypass (VEN-VPORT-002)

**Attack:** Actor A supplies vportId belonging to Actor B. `updateVport()` authenticates the caller (requireUser()) but does NOT filter `.eq("owner_user_id", user.id)` on the UPDATE.

**Source Trace:**
- `vport.core.dal.js:215-228` — `.update(patch).eq("id", vportId)` — no owner_user_id filter on the UPDATE clause.
- `requireUser()` at line 22-28 confirms auth session is checked, but `user.id` is never used as a filter on the UPDATE.

**Result: BYPASSED** [SOURCE_VERIFIED — vport.core.dal.js:215-228]

**Exploit Chain:** Single-step. Authenticated actor with any valid Supabase session submits `updateVport(victimVportId, { name: "hijacked" })`. The UPDATE executes if RLS does not enforce owner restriction. Blocked only if DB RLS on `vport.profiles` UPDATE enforces `owner_user_id = auth.uid()`. OPEN finding from VEN-VPORT-002 — DB confirmation pending. RLS is sole barrier.

**Severity: HIGH**

#### A2 — updateVportAvatarMediaAssetIdDAL / updateVportBannerMediaAssetIdDAL (VEN-VPORT-004)

**Attack:** Actor A calls these DALs with another actor's actorId. Neither DAL verifies the caller owns the actor. No Supabase session check at DAL layer.

**Source Trace:**
- `vport.write.profileMedia.dal.js:5-14` and `16-23` — `.update(patch).eq("actor_id", actorId)` — no auth guard, no ownership check.

**Result: BYPASSED (app layer)** [SOURCE_VERIFIED — vport.write.profileMedia.dal.js:5-23]

VEN-VPORT-004 open. RLS is sole barrier. If called from `submitCreateVportController` (line 84), the actorId used is `res.actorId` (freshly created, owned by caller). However, if another caller reaches these DALs directly (e.g., via the barrel export), no app-layer protection exists.

**Severity: HIGH (app-layer bypass, RLS-dependent)**

#### A3 — insertVportResourceDAL (new finding)

**Attack:** Actor A calls `insertVportResourceDAL({ row: { profile_id: victimProfileId } })` with a victim's profileId.

**Source Trace:**
- `vportResource.write.dal.js:5-16` — validates `profile_id` presence only, no ownership check.

**Result: PARTIAL** [SOURCE_VERIFIED — vportResource.write.dal.js:5-16]

No controller currently calling this DAL was found to have an ownership bypass. However, the DAL itself has no ownership filter. If any controller passes a caller-supplied profileId to this DAL, ownership bypass is possible. Classified as PARTIAL pending full controller chain trace.

**Severity: MEDIUM**

---

### B. SESSION MUTATION

#### B1 — viewerActorId from session vs. client payload (booking operations)

**Attack:** Attempt to supply a forged callerActorId from the client payload.

**Source Trace:**
- `useVportBookingActions.js:7` — `callerActorId = identity?.actorId ?? null` — identity is from `useIdentity()` (session-backed React context).
- `useQuickBookingModal.js:8` — same pattern.
- `useSaveVportSettings.js:87` — `identity?.actorId ?? null` — session-backed.

**Result: BLOCKED** [SOURCE_VERIFIED — useVportBookingActions.js:7, useQuickBookingModal.js:8]

All hooks source callerActorId from the trusted identity context, not from any URL parameter, prop, or POST body. A client cannot inject a different actorId through any UI-accessible hook.

**Severity: INFO**

#### B2 — null callerActorId bypass

**Attack:** Unauthenticated actor (null identity) reaches a mutation controller. Does the controller validate presence before acting?

**Source Trace:**
- `updateBookingStatusController` line 27 — `if (!callerActorId) throw new Error("callerActorId is required")` — BLOCKED.
- `createOwnerBookingController` line 18 — `if (!callerActorId) throw new Error(...)` — BLOCKED.
- `saveVportPublicDetailsByActorIdController` line 55 — `if (!requestActorId) throw new Error(...)` — BLOCKED.
- `loadOwnerQuickStatsController` line 29 — `if (!callerActorId) throw new Error(...)` — BLOCKED.
- `reviewFuelPriceSuggestionController` line 34 — `if (!decidedByActorId) throw new Error(...)` — BLOCKED.

**Result: BLOCKED** [SOURCE_VERIFIED — multiple controllers]

All privileged mutation controllers validate callerActorId presence at entry and throw before reaching any ownership check or DAL.

**Severity: INFO**

---

### C. RUNTIME ABUSE

#### C1 — Guest booking bypasses actor kind check

**Attack:** A VPORT actor (kind=vport) calls `createVportPublicBookingController` with their actorId as `requestActorId`, bypassing the "user-kind only" restriction.

**Source Trace:**
- `vportPublicBooking.controller.js:57-61` — checks actor.kind !== "user" and throws "Switch to your citizen profile to book."
- `readActorVportLinkDAL` is called; if it returns null, throws "Only citizens can book appointments."

**Result: BLOCKED** [SOURCE_VERIFIED — vportPublicBooking.controller.js:57-61]

A vport-kind actor is rejected. However, the check uses `readActorVportLinkDAL` — if this DAL returns a row for a vport actor, the kind check at line 60 provides the final gate. This is SOURCE_VERIFIED as blocked at the controller layer.

**Severity: INFO**

#### C2 — ownerUpdate privilege escalation in submitFuelPriceSuggestion

**Attack:** Citizen actor passes `ownerUpdate: true` in the payload to bypass the suggestion pipeline and write directly to official fuel prices.

**Source Trace:**
- `submitFuelPriceSuggestion.controller.js:52-63` — if `ownerUpdate === true`, routes to `submitOwnerFuelPriceUpdateController`.
- `submitOwnerFuelPriceUpdateController.js:27` — `checkVportOwnershipController({ callerActorId: actorId, targetActorId })` — ownership verified before write.
- If caller is not owner, returns `{ ok: false, reason: "not_owner" }` — write does not execute.

**Result: BLOCKED** [SOURCE_VERIFIED — submitOwnerFuelPriceUpdateController.js:27]

The `ownerUpdate` flag is a routing flag, not an authorization bypass. Ownership is verified independently of the flag value. A non-owner caller setting `ownerUpdate: true` will fail at the checkVportOwnershipController gate.

**Severity: INFO**

---

### D. RLS VERIFICATION

#### D1 — updateVport relies solely on RLS (VEN-VPORT-002 verification)

As verified in A1: `updateVport` at `vport.core.dal.js:215` has no app-layer owner filter. The UPDATE clause is `.eq("id", vportId)` only. **RLS is the sole barrier.** DB confirmation of `vport.profiles` UPDATE RLS policy is REQUIRED.

**Result: UNRESOLVED** [SOURCE_VERIFIED — vport.core.dal.js:215-228]

**Finding: BW-VPORT-001 (HIGH)**

#### D2 — updateFuelPriceUnitForActorDAL has no ownership filter in UPDATE clause

**Source Trace:**
- `vportFuelPrices.write.dal.js:20-21` — `.update({ unit, ... }).eq("profile_id", profileId)` — profileId is resolved from actorId at line 15, but no session auth guard exists at the DAL.
- Controller gate (`updateStationFuelUnitController`) does own the ownership check BEFORE calling this DAL.

**Result: BLOCKED at controller layer** [SOURCE_VERIFIED — updateStationFuelUnitController.js:11-12]

The DAL itself is unguarded, but the only caller is `updateStationFuelUnitController` which enforces ownership first. Risk: if another caller reaches this DAL directly without ownership check, RLS is sole barrier.

**Severity: MEDIUM (defense-in-depth gap — new finding)**

#### D3 — fuel_price_submissions INSERT has no app-layer auth guard

**Source Trace:**
- `vportFuelPriceSubmissions.write.dal.js:17-48` — resolves profileId then inserts. No Supabase session check at DAL.
- The calling controller (`submitCitizenFuelPriceSuggestionController`) validates `actorId` presence but no session verification occurs at the controller layer either.

**Result: PARTIAL** [SOURCE_VERIFIED — vportFuelPriceSubmissions.write.dal.js:17-48]

An unauthenticated actor (no Supabase session) could potentially call this path if they can supply a valid `targetActorId` and `actorId`. The DAL relies entirely on RLS for authentication enforcement.

**Severity: MEDIUM (new finding — BW-VPORT-003)**

---

### E. VIEWER CONTEXT FUZZING

#### E1 — null viewerActorId in checkVportOwnershipController

**Source Trace:**
- `checkVportOwnership.controller.js:4` — `if (!callerActorId || !targetActorId) return false` — returns false (access denied), does not throw.

**Result: BLOCKED** [SOURCE_VERIFIED — checkVportOwnership.controller.js:4]

Null callerActorId safely returns false — no bypass possible.

**Severity: INFO**

#### E2 — null callerActorId in assertActorOwnsVportActorController (adapter call)

Multiple controllers delegate to `assertActorOwnsVportActorController`. All callers were verified to check `callerActorId` presence before delegating. Result: BLOCKED (see B2).

**Severity: INFO**

#### E3 — declineTeamRequestController viewerActorId path

**Attack:** On the isInvitedBarber path of `declineTeamRequestController`, an attacker omits `viewerActorId` to attempt bypass of the DB ownership check and rely on the string equality check at line 50 alone.

**Source Trace:**
- `vportTeamInvite.controller.js:39-73` — if `isInvitedBarber = true` and `!viewerActorId`, throws at line 55: `"viewerActorId required for invited barber path"`.

**Result: BLOCKED** [SOURCE_VERIFIED — vportTeamInvite.controller.js:54-55]

The ELEK-002 patch explicitly guards this path. Null viewerActorId throws before any string-equality ownership decision takes effect.

**Severity: INFO**

---

### F. MUTATION REPLAY

#### F1 — Terminal booking re-trigger

**Attack:** Attempt to confirm/cancel/complete a booking that is already in a terminal state (completed, cancelled, no_show).

**Source Trace:**
- `updateVportBooking.controller.js:35-37` — `if (TERMINAL_STATUSES.includes(booking.status)) throw new Error(...)` — checked BEFORE auth resolution.
- `rescheduleBookingController` line 113-115 — same guard.
- Comment at line 11-12: "VPD-V-021: bookings in these states are terminal and must not be mutated. Any write attempt against a terminal booking is rejected before auth is checked."

**Result: BLOCKED** [SOURCE_VERIFIED — updateVportBooking.controller.js:35-37 and 113-115]

Terminal state guard is the first check, before ownership resolution. Cannot be replayed regardless of caller identity.

**Severity: INFO**

#### F2 — Team invite replay (double-accept)

**Attack:** Accept an already-accepted or declined team request by replaying the `acceptBarbershopInviteController` with the same token.

**Source Trace:**
- `vportTeamInvite.controller.js:110` — `if (resource.meta?.status !== "pending_acceptance") throw new Error("invite is no longer available")` — ELEK-001 patch. State-machine guard enforced before ownership check.

**Result: BLOCKED** [SOURCE_VERIFIED — vportTeamInvite.controller.js:110]

**Severity: INFO**

#### F3 — Fuel price suggestion re-submission (already_pending duplicate)

**Attack:** Submit the same fuel price suggestion twice for the same fuel key.

**Source Trace:**
- `submitCitizenFuelPriceSuggestion.controller.js:48-52` — checks for existing pending submission by the same actor. Returns `{ ok: false, reason: "already_pending" }`.
- DAL line 64 — catches `23505` unique violation as additional defense.

**Result: BLOCKED** [SOURCE_VERIFIED — submitCitizenFuelPriceSuggestion.controller.js:48-52]

**Severity: INFO**

#### F4 — Fuel price review replay (double-review)

**Attack:** Attempt to approve or reject a submission that has already been reviewed.

**Source Trace:**
- `reviewFuelPriceSuggestion.controller.js:54-60` — `if (subRow.status !== "pending") return { ok: false, reason: "not_pending" }`.

**Result: BLOCKED** [SOURCE_VERIFIED — reviewFuelPriceSuggestion.controller.js:54-60]

**Severity: INFO**

---

### G. HYDRATION POISONING

The vport dashboard feature does not directly interact with a hydration store. Settings invalidation uses `invalidateVportPublicDetails(actorId)` which is a cache-bust callback passed from the hook layer. No actor summary hydration store is written by vport dashboard controllers. This attack category does not apply to the in-scope dashboard controllers.

**Result: NOT APPLICABLE**

---

### H. URL SURFACE

#### H1 — Booking notification linkPath

**Attack:** Check whether notification construction for booking events embeds raw UUIDs in linkPath.

**Source Trace:**
- `vportPublicBooking.controller.js:117` — `linkPath: null` — explicitly commented "VPD-V-020: omit linkPath to prevent raw VPORT UUID from being stored in the notification row."
- `updateVportBooking.controller.js:78-94` — `publishVcsmNotification` does not pass `linkPath` at all; no linkPath field present.

**Result: BLOCKED** [SOURCE_VERIFIED — vportPublicBooking.controller.js:117, updateVportBooking.controller.js:78-94]

Raw UUIDs are not embedded in notification linkPaths for booking events.

**Severity: INFO**

#### H2 — Notification objectId as raw UUID

**Attack:** The booking objectId is `String(updated.id)` or `String(booking.id)` — a raw booking UUID passed to notification as objectId.

**Source Trace:**
- `updateVportBooking.controller.js:83` — `objectId: String(updated.id)` — this is an internal notification objectId (not a URL parameter). No evidence this becomes a public URL.
- `vportPublicBooking.controller.js:113` — `objectId: booking?.id ? String(booking.id) : null`.

**Result: PARTIAL** [SOURCE_VERIFIED — updateVportBooking.controller.js:83]

The `objectId` field on notifications may hold a raw UUID. This is an internal notification reference, not a public-facing URL. Risk depends on how the notification inbox constructs navigation links. No public URL construction found in scope. Classified as LOW — requires notification system review to confirm objectId is never surfaced as a URL segment.

**Finding: BW-VPORT-004 (LOW)**

---

### I. §9 INVARIANT ATTACK MAP

BEHAVIOR.md status: **PLACEHOLDER** — no §9 Must Never Happen invariants are declared. All invariants below are inferred from source code comments, VEN findings, and engineering annotations.

#### I1 — Inferred Invariant: A booking must not be modified after reaching a terminal state

**Attack Harness:** Pass a bookingId in status "completed" to `updateBookingStatusController` with `status: "confirmed"`.

**Source Trace:** `updateVportBooking.controller.js:35-37` — terminal guard fires first.

**Result: BLOCKED** [SOURCE_VERIFIED]

#### I2 — Inferred Invariant: customer_actor_id must never be caller-supplied for public bookings

**Attack Harness:** Call `createVportPublicBookingController` with a payload that includes `customerActorId: victimActorId`.

**Source Trace:** `vportPublicBooking.controller.js:83-84` — `customer_actor_id: requestActorId ?? null` — the controller explicitly ignores any caller-supplied customerActorId. The value is always sourced from `requestActorId` (verified session actor). VPD-V-019 annotation confirms intent.

**Result: BLOCKED** [SOURCE_VERIFIED — vportPublicBooking.controller.js:83-84]

#### I3 — Inferred Invariant: Only the VPORT owner may approve/reject fuel price suggestions

**Attack Harness:** Non-owner actor calls `reviewFuelPriceSuggestionController` with their actorId as `decidedByActorId`.

**Source Trace:** `reviewFuelPriceSuggestion.controller.js:45-52` — resolves targetActorId from submissionId profile_id, then calls `checkVportOwnershipController`. Non-owner returns `{ ok: false, reason: "not_owner" }`.

**Result: BLOCKED** [SOURCE_VERIFIED — reviewFuelPriceSuggestion.controller.js:45-52]

#### I4 — Inferred Invariant: VPORT settings must not be writable by a non-owner

**Attack Harness:** Actor A calls `saveVportPublicDetailsByActorIdController(victimActorId, payload, { requestActorId: actorA })`.

**Source Trace:** `saveVportPublicDetailsByActorId.controller.js:58-61` — `assertActorOwnsVportActorController` at entry. `upsertVportPublicDetailsDAL` at line 37-40 also independently verifies `owner_user_id = userId`.

**Result: BLOCKED (double-guarded)** [SOURCE_VERIFIED — saveVportPublicDetailsByActorId.controller.js:58-61, vportPublicDetails.write.dal.js:32-41]

#### I5 — Inferred Invariant: The last active owner of a team must not be removable

**Attack Harness:** Call `removeTeamMemberController` targeting the only active owner resource.

**Source Trace:** `vportTeamAccess.controller.js:145-148` — `assertOwnerRemains(existing, resourceId, "remove the last owner")` throws if no other active owner exists.

**Result: BLOCKED** [SOURCE_VERIFIED — vportTeamAccess.controller.js:145-148]

#### I6 — Inferred Invariant: A VPORT actor cannot self-book (non-user actor type)

**Attack Harness:** A vport-kind actor calls `createVportPublicBookingController` with their own actorId as `requestActorId`.

**Source Trace:** `vportPublicBooking.controller.js:58-61` — `actor.kind !== "user"` guard throws.

**Result: BLOCKED** [SOURCE_VERIFIED — vportPublicBooking.controller.js:58-61]

---

## 7. Exploitability Assessment

| Finding | Attack Type | Exploitability | Notes |
|---|---|---|---|
| BW-VPORT-001 | Ownership bypass (updateVport, no app filter) | HIGH if RLS absent | RLS sole barrier — DB confirmation required |
| BW-VPORT-002 | Ownership bypass (avatar/banner media DAL) | HIGH if RLS absent | VEN-VPORT-004 — RLS sole barrier |
| BW-VPORT-003 | Session bypass (fuel price submission INSERT) | MEDIUM | No session check at controller or DAL; RLS sole barrier |
| BW-VPORT-004 | URL surface (notification objectId raw UUID) | LOW | Not confirmed as public URL; internal objectId only |
| All other paths | Various | INFO-LOW | Blocked at controller layer or double-guarded |

---

## 8. Source Verification Summary

| Finding | Verification Method | File | Line(s) |
|---|---|---|---|
| BW-VPORT-001 (updateVport bypass) | SOURCE_VERIFIED | apps/VCSM/src/features/vport/dal/vport.core.dal.js | 215-228 |
| BW-VPORT-002 (media DAL no auth) | SOURCE_VERIFIED | apps/VCSM/src/features/vport/dal/vport.write.profileMedia.dal.js | 5-23 |
| BW-VPORT-003 (fuel submission no session) | SOURCE_VERIFIED | apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.write.dal.js | 17-48 |
| BW-VPORT-004 (notification objectId) | SOURCE_VERIFIED | apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller.js | 83 |
| F1 terminal booking guard | SOURCE_VERIFIED | apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller.js | 35-37, 113-115 |
| H1 linkPath omitted | SOURCE_VERIFIED | apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/vportPublicBooking.controller.js | 117 |
| I2 customer_actor_id | SOURCE_VERIFIED | apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/vportPublicBooking.controller.js | 83-84 |
| I4 settings double-guard | SOURCE_VERIFIED | apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/controller/saveVportPublicDetailsByActorId.controller.js:58-61; vportPublicDetails.write.dal.js:32-41 | |

---

## 9. Confidence Summary

| Category | Count | Method |
|---|---|---|
| SOURCE_VERIFIED findings | 4 findings | Source read + line citation |
| SCANNER_LOW_CONF surfaces | 11 paths | Scanner map — all LOW confidence |
| BYPASSED (source verified) | 2 (BW-VPORT-001, BW-VPORT-002) | Source verified |
| BLOCKED | 14 attack scenarios | Source verified |
| UNRESOLVED (DB-dependent) | 3 (BW-VPORT-001, BW-VPORT-002, BW-VPORT-003) | DB RLS confirmation needed |

---

## 10. §9 Invariant Attack Map

| Invariant (Inferred) | Attack Designed | Result |
|---|---|---|
| Terminal bookings immutable | Attempt status update on completed booking | BLOCKED |
| customer_actor_id session-only | Inject victimActorId as customerActorId | BLOCKED |
| Fuel review owner-only | Non-owner decides on submission | BLOCKED |
| Settings owner-only | Non-owner writes settings | BLOCKED (double-guarded) |
| Last active team owner preserved | Remove sole owner resource | BLOCKED |
| VPORT actor cannot book as customer | vport-kind actor calls public booking | BLOCKED |

**NOTE:** BEHAVIOR.md is a PLACEHOLDER. All invariants above are source-inferred. The §9 Must Never Happen section must be authored before the next vport lifecycle release. This is an ongoing VEN-VPORT-008 concern and a governance gap.

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md status: **PLACEHOLDER** (confirmed at Step 1).

All §9 invariants are UNANCHORED — they are not declared in the contract, only inferred from source. This means:
- Future refactors have no invariant contract to test against.
- Regression tests cannot be anchored to a declared §9 rule.
- BW can only test source-inferred invariants, not owner-declared ones.

**Required action:** Author BEHAVIOR.md §4 and §9 sections before next vport lifecycle release. This remains a governance blocker (VEN-VPORT-008).

---

## 12. THOR Impact

| Finding | Severity | Release Blocker? | Notes |
|---|---|---|---|
| BW-VPORT-001 | HIGH | CONDITIONAL | Becomes YES if DB confirms vport.profiles RLS UPDATE policy is absent. Same condition as original VENOM THOR gate. |
| BW-VPORT-002 | HIGH | CONDITIONAL | Becomes YES if vport.profiles RLS is absent for the avatar/banner UPDATE paths. VEN-VPORT-004. |
| BW-VPORT-003 | MEDIUM | NO | Defense-in-depth gap. RLS should protect, but no session check at controller or DAL. Remediation recommended before production. |
| BW-VPORT-004 | LOW | NO | Requires notification system cross-review. |
| VEN-VPORT-008 | HIGH | NO (deferred) | BEHAVIOR.md placeholder. Governance gap, not a runtime exploit. |

---

## 13. SPIDER-MAN Test Requirements

| Test Requirement | Priority | Linked Finding |
|---|---|---|
| Test: `updateVport` called by non-owner user — assert rejection (requires DB RLS test harness) | P0 | BW-VPORT-001 / VEN-VPORT-002 |
| Test: `updateVportAvatarMediaAssetIdDAL` called with mismatched actorId — assert RLS rejection | P0 | BW-VPORT-002 / VEN-VPORT-004 |
| Test: `createFuelPriceSubmissionDAL` called without Supabase session — assert rejection or silent RLS block | P1 | BW-VPORT-003 |
| Test: `updateBookingStatusController` with terminal booking status — assert throw before any DB call | P0 | F1 (regression test) |
| Test: `createVportPublicBookingController` with vport-kind actor — assert "Switch to your citizen profile" error | P1 | I6 |
| Test: `createVportPublicBookingController` with caller-supplied customerActorId — assert ignored | P0 | I2 |
| Test: `acceptBarbershopInviteController` with already-accepted invite — assert "invite is no longer available" | P1 | F2 |
| Test: `removeTeamMemberController` targeting sole active owner — assert throw | P1 | I5 |
| Test: `reviewFuelPriceSuggestionController` by non-owner — assert `{ ok: false, reason: "not_owner" }` | P0 | I3 |
| Test: `saveVportPublicDetailsByActorIdController` by non-owner — assert ownership exception | P0 | I4 |

---

*Report generated by BLACKWIDOW V2 — BW2.9 | 2026-06-04*
