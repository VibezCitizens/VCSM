---
name: vcsm.vport.behavior
description: Feature-level behavior contract for the VCSM vport feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P1
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — vport
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The vport feature manages the full lifecycle of VPORT business-identity actors within VCSM. A VPORT is a business storefront identity (e.g., barbershop, gas station, locksmith) owned by a citizen user.

This feature is responsible for:
- Provisioning new VPORT actor records (create flow)
- Bootstrapping booking workspaces for applicable VPORT types (e.g., barbershop type triggers booking workspace creation via engines/booking)
- Profile media write-back (avatar and banner image updates)
- Soft-delete and restore of VPORT actors
- Hard-delete of VPORT actors (requires prior soft-delete)
- Exposing public preview components for marketing-facing surfaces

This feature does NOT own: the VPORT dashboard, booking cards, fuel pricing, or service catalog management. Those live in `features/dashboard/vport/`.

**Owner domain:** VCSM platform feature team — identity and actor provisioning domain.

Sources: ARCHITECTURE.md §PURPOSE, ARCHITECTURE.md §OWNERSHIP

---

## §2 Entry Points

The following entry points are documented in governance artifacts:

| Entry Point | Type | How Reached | Notes |
|---|---|---|---|
| `CreateVportForm.jsx` | Component (embedded) | Rendered inside settings or onboarding flows | No dedicated route; embedded as a component |
| `RestoreVportScreen.jsx` | Screen | Route `/vport/restore` (scanner confirmed); also reached via React Router navigation redirect when active identity is a soft-deleted or inactive VPORT | Route access is `public` per scanner; reachability also depends on identity-redirect |
| `vport.public.js` | Migration barrel (deprecated) | Imported by dev/diagnostics code | Explicitly deprecated; marked for Phase 2 removal; sole confirmed consumer is dev diagnostics |
| `adapters/vport.adapter.js` | Adapter boundary | Consumed by cross-feature settings/profile controllers | Exposes `updateVportAvatarMediaAssetIdDAL` and `updateVportBannerMediaAssetIdDAL` |

Sources: ARCHITECTURE.md §ENTRY POINTS, INDEX.md §Routes, SCREENS.md

---

## §3 User Flows

The following user flows are documented or directly derivable from governance artifacts:

### Flow 1 — VPORT Creation
1. Citizen user accesses the create VPORT form (embedded in settings or onboarding).
2. User fills in name and profile details.
3. A slug is generated client-side from the VPORT name plus a 4-character Math.random() base-36 suffix.
4. The form submits via `submitCreateVport.controller.js`.
5. The `create_vport` RPC is invoked. The DB enforces authentication (AUTH_REQUIRED error if no session). The RPC handles slug collision (SLUG_ALREADY_EXISTS), duplicate VPORT type, and invalid category via error string matching.
6. On barbershop type creation, `createOrganizationLocationWorkspace` is called (engines/booking) to bootstrap a booking workspace.
7. After creation, `refreshVcActorDirectory` is called (engines/identity) to sync the actor directory.
8. After creation, `uploadMediaController` and `createMediaAssetController` (engines/media) handle avatar write-back if the user uploaded an avatar.

**Known UX gap:** Slug collision results in a SLUG_ALREADY_EXISTS error returned to `CreateVportForm`. There is no documented explicit retry-with-new-suffix UX flow — users may be left at an error boundary on collision.

Sources: ARCHITECTURE.md §MODULE DEPENDENCY GRAPH, INDEX.md §Write Surface Map, INDEX.md §Engine Dependencies, outputs/Venom/VEN-VPORT-001

### Flow 2 — VPORT Restore
1. If the active identity is a soft-deleted or inactive VPORT, the user is navigation-redirected to `RestoreVportScreen.jsx` at `/vport/restore`.
2. User confirms restore.
3. `restoreVport` controller/DAL calls the `restore_vport` RPC.
4. RPC enforces VPORT_NOT_FOUND_OR_UNAUTHORIZED if session does not own the VPORT (DB-enforced; app-layer ownership check is NOT present — see §6).

Sources: ARCHITECTURE.md §MODULE RUNTIME READINESS, SCREENS.md, modules/vport/ARCHITECTURE.md §Soft Delete / Restore Path

### Flow 3 — Soft-Delete VPORT
1. Citizen user triggers soft-delete from settings (account controller).
2. `ctrlSoftDeleteVport({ vportId })` is called.
3. Delegates to `dalDeleteMyVport(vportId)` → `soft_delete_vport` RPC.
4. RPC surfaces AUTH_REQUIRED and VPORT_NOT_FOUND_OR_UNAUTHORIZED.
5. App-layer ownership check is NOT present (see §6 — VEN-VPORT-003).

Sources: outputs/Venom/VEN-VPORT-003, modules/vport/ARCHITECTURE.md §Soft Delete / Restore Path

### Flow 4 — Hard-Delete VPORT
1. Requires prior soft-delete.
2. `ctrlHardDeleteVport` calls `assertActorOwnsVportActorController` before invoking the `hard_delete_vport` RPC (app-layer ownership check IS present — the only lifecycle controller with this guard).
3. RPC enforces ownership at DB level.

Sources: outputs/Venom/Source Verification Summary, outputs/BlackWidow §4 DAL Write Surfaces

### Flow 5 — Avatar / Banner Media Update
1. Settings or profile controllers call `updateVportAvatarMediaAssetIdDAL` or `updateVportBannerMediaAssetIdDAL` via `vport.adapter.js`.
2. DAL executes UPDATE on `vport.profiles` keyed by `actor_id`.
3. No session auth guard at DAL layer (see §6 — VEN-VPORT-004 / BW-VPORT-002).

Sources: ARCHITECTURE.md §LAYER MAP, INDEX.md §Security-Sensitive Surfaces, outputs/Venom/VEN-VPORT-004

---

## §4 Business Rules

Business rules derivable from governance artifacts:

| Rule | Description | Source |
|---|---|---|
| BR-001 | Only authenticated citizens may create a VPORT. The `create_vport` RPC enforces AUTH_REQUIRED if no valid Supabase session exists. | INDEX.md §Security-Sensitive Surfaces; outputs/Venom VEN-VPORT-001 |
| BR-002 | Slug collision returns SLUG_ALREADY_EXISTS from the RPC. Slug is generated client-side and sent to the DB — uniqueness is not guaranteed before RPC invocation. | outputs/Venom VEN-VPORT-001 |
| BR-003 | Each VPORT type may only be created once per user (duplicate VPORT type returns error from create_vport RPC). | outputs/Venom VEN-VPORT-001 (error string matching on "duplicate" type response) |
| BR-004 | Hard-delete requires prior soft-delete. A VPORT that has not been soft-deleted first cannot be hard-deleted. | ARCHITECTURE.md §MODULE DATA CONTRACT |
| BR-005 | Barbershop-type VPORTs trigger booking workspace bootstrap on creation via engines/booking. | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| BR-006 | After any create or update, the actor directory is refreshed via engines/identity (`refreshVcActorDirectory`). | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| BR-007 | VPORT actors (kind=vport) cannot book appointments as customers. Only user-kind actors may book. | outputs/BlackWidow §I6 (BW inferred invariant — BLOCKED at vportPublicBooking.controller.js:58-61) |
| BR-008 | Terminal booking states (completed, cancelled, no_show) are immutable. No mutation is permitted after a booking reaches a terminal state. | outputs/BlackWidow §F1 (BW-VPORT-001/inferred invariant — BLOCKED at updateVportBooking.controller.js:35-37) |
| BR-009 | customer_actor_id for public bookings is always sourced from the authenticated session actor — never from caller-supplied payload. | outputs/BlackWidow §I2 (BLOCKED at vportPublicBooking.controller.js:83-84) |
| BR-010 | The last active team owner of a VPORT team must not be removable. `removeTeamMemberController` asserts that at least one other active owner remains. | outputs/BlackWidow §I5 (BLOCKED at vportTeamAccess.controller.js:145-148) |
| BR-011 | VPORT settings may only be written by the owning actor. `saveVportPublicDetailsByActorIdController` is double-guarded: assertActorOwnsVportActorController at controller entry AND owner_user_id check in the DAL. | outputs/BlackWidow §I4 (BLOCKED — double-guarded) |
| BR-012 | Only the VPORT owner may approve or reject fuel price suggestions. `reviewFuelPriceSuggestionController` calls `checkVportOwnershipController` — non-owner returns `{ ok: false, reason: "not_owner" }`. | outputs/BlackWidow §I3 |
| BR-013 | A citizen may not submit duplicate fuel price suggestions for the same fuel key while a suggestion is already pending. `submitCitizenFuelPriceSuggestionController` checks for existing pending submissions and returns `{ ok: false, reason: "already_pending" }`. DB unique violation (23505) is also caught as defense. | outputs/BlackWidow §F3 |
| BR-014 | A team invite must be in "pending_acceptance" state to be accepted. Accepting an already-accepted or declined invite returns "invite is no longer available." | outputs/BlackWidow §F2 |

---

## §5 State Rules

State transitions documentable from governance artifacts:

### VPORT Lifecycle States

| State | Description | Transitions To | Source |
|---|---|---|---|
| Active | VPORT is live and operational | Soft-deleted | INDEX.md §Write Surface Map; ARCHITECTURE.md §MODULE DATA CONTRACT |
| Soft-deleted | VPORT is deactivated but recoverable | Active (via restore_vport RPC); Hard-deleted | ARCHITECTURE.md §MODULE DATA CONTRACT; modules/vport/ARCHITECTURE.md §Soft Delete / Restore Path |
| Hard-deleted | VPORT is permanently removed | None (terminal) | ARCHITECTURE.md §MODULE DATA CONTRACT |

**Constraint:** Hard-delete is only valid from the Soft-deleted state. Hard-delete from Active state is not permitted.

Sources: ARCHITECTURE.md §MODULE DATA CONTRACT; outputs/Venom §Source Verification Summary (hard_delete_vport "requires prior soft-delete")

### Booking Status States

| State | Mutable? | Notes | Source |
|---|---|---|---|
| pending / confirmed / rescheduled | YES | Can be updated via `updateVportBooking.controller.js` | outputs/BlackWidow §F1 |
| completed / cancelled / no_show | NO (terminal) | Terminal guard fires before auth check — immutable regardless of caller | outputs/BlackWidow §F1 (BLOCKED at updateVportBooking.controller.js:35-37) |

### Fuel Price Suggestion States

| State | Transitions To | Source |
|---|---|---|
| pending | approved / rejected | outputs/BlackWidow §F4 (reviewFuelPriceSuggestion.controller.js:54-60) |
| approved / rejected | None (terminal — "not_pending" returned) | outputs/BlackWidow §F4 |

### Team Invite States

| State | Transitions To | Source |
|---|---|---|
| pending_acceptance | accepted / declined | outputs/BlackWidow §F2 (vportTeamInvite.controller.js:110) |
| accepted / declined | None (terminal — "invite is no longer available") | outputs/BlackWidow §F2 |

---

## §6 Security Constraints

Security constraints derived from SECURITY.md, VENOM, and BlackWidow findings. Each constraint represents a documented security requirement for this feature.

| Constraint | Evidence |
|---|---|
| CONSTRAINT: VPORT updates must be scoped to the owning user — the UPDATE must include an app-layer owner_user_id filter in addition to RLS. Currently NOT enforced at app layer. | VEN-VPORT-002 (HIGH) / BW-VPORT-001 (HIGH) — updateVport at vport.core.dal.js:215-228 has only .eq("id", vportId). RLS is sole barrier. CONDITIONAL THOR BLOCKER if RLS absent. |
| CONSTRAINT: Soft-delete and restore operations must include app-layer ownership verification before RPC invocation. Currently NOT enforced at app layer (inconsistent with ctrlHardDeleteVport). | VEN-VPORT-003 (HIGH) — ctrlSoftDeleteVport and ctrlRestoreVport have no assertActorOwnsVportActorController call. VPORT-SEC-003 OPEN. |
| CONSTRAINT: Media asset DAL functions (avatar, banner) must include session auth verification before executing UPDATE. Currently NOT enforced at DAL layer. | VEN-VPORT-004 (MEDIUM) / BW-VPORT-002 (HIGH) — updateVportAvatarMediaAssetIdDAL and updateVportBannerMediaAssetIdDAL have no requireUser() or session check. RLS sole barrier. CONDITIONAL THOR BLOCKER if RLS absent. |
| CONSTRAINT: The migration barrel vport.public.js must not expose the ownership-unsafe updateVport function to feature code. Must have a tracked removal deadline. | VEN-VPORT-005 (MEDIUM) — vport.public.js exports updateVport without removal deadline. Phase 2 remediation untracked. |
| CONSTRAINT: owner_user_id (Supabase auth UUID) must not be included in public VPORT read payloads from getVportById or getVportBySlug. | VEN-VPORT-006 (MEDIUM) — both functions include owner_user_id in SELECT columns. VPORT-SEC-004 OPEN. |
| CONSTRAINT: The controller layer must enforce business logic. Controllers that are zero-logic DAL re-exports are architecture violations and eliminate the security enforcement surface. | VEN-VPORT-007 (MEDIUM) — vportCoreOps.controller.js re-exports DAL functions with no logic. |
| CONSTRAINT: Fuel price submissions must require a valid Supabase session. Currently no session check at controller or DAL layer. | BW-VPORT-003 (MEDIUM) — createFuelPriceSubmissionDAL has no Supabase session check; unauthenticated call possible if RLS absent. |
| CONSTRAINT: Notification linkPath for booking events must not embed raw VPORT or booking UUIDs. | BW-VPORT-004 (LOW) — booking notification objectId carries raw booking UUID; risk depends on notification inbox URL construction. linkPath is currently null (BLOCKED). |
| CONSTRAINT: Slug generation for VPORT creation must prevent client-side squatting. Currently slug is fully client-controlled. | VEN-VPORT-001 (LOW) — slug assembled client-side from name + 4-char random suffix. Server-side generation recommended. |

---

## §7 Error Handling

Error states derivable from governance artifacts:

| Error | Surface | Behavior | Source |
|---|---|---|---|
| AUTH_REQUIRED | create_vport RPC | Returned when no valid Supabase session; propagates to CreateVportForm error display | INDEX.md §Security-Sensitive Surfaces |
| VPORT_NOT_FOUND_OR_UNAUTHORIZED | soft_delete_vport, hard_delete_vport, restore_vport RPCs | Returned when session does not own the VPORT or VPORT does not exist | INDEX.md §Security-Sensitive Surfaces |
| SLUG_ALREADY_EXISTS | create_vport RPC | Returned on slug collision; requires client retry. No explicit retry-with-new-suffix flow documented. | outputs/Venom VEN-VPORT-001 |
| Duplicate VPORT type error | create_vport RPC | Returned when user already has a VPORT of the same type | outputs/Venom VEN-VPORT-001 |
| Invalid category error | create_vport RPC | Returned on invalid category submission | outputs/Venom VEN-VPORT-001 |
| Error display in CreateVportForm | CreateVportForm UI | Error display present | ARCHITECTURE.md §MODULE COMPLETENESS MATRIX |
| Error display in RestoreVportScreen | RestoreVportScreen UI | err state handled | ARCHITECTURE.md §MODULE COMPLETENESS MATRIX |
| Loading state (isBusy / busy) | useCreateVport, useRestoreVport hooks | isBusy flag disables submit button | ARCHITECTURE.md §MODULE RUNTIME READINESS |
| Loading skeleton / spinner | CreateVportForm | NOT PRESENT — only button disabled state | ARCHITECTURE.md §MODULE RUNTIME READINESS (WATCH) |
| Empty list state (listMyVports returns []) | Module-level UI | NOT HANDLED within this module | ARCHITECTURE.md §MODULE RUNTIME READINESS (WATCH) |
| callerActorId required | Multiple controllers (updateBookingStatusController, createOwnerBookingController, saveVportPublicDetailsByActorIdController, loadOwnerQuickStatsController, reviewFuelPriceSuggestionController) | Throws Error before reaching ownership check or DAL if callerActorId is null | outputs/BlackWidow §B2 (BLOCKED) |
| Terminal booking mutation attempt | updateVportBooking.controller.js, rescheduleBookingController | Throws before auth resolution for terminal status bookings | outputs/BlackWidow §F1 (BLOCKED) |
| invite is no longer available | acceptBarbershopInviteController | Thrown when invite is not in pending_acceptance state | outputs/BlackWidow §F2 (BLOCKED) |
| not_owner | reviewFuelPriceSuggestionController, checkVportOwnershipController | Returns `{ ok: false, reason: "not_owner" }` for non-owner callers | outputs/BlackWidow §I3 |
| already_pending | submitCitizenFuelPriceSuggestionController | Returns `{ ok: false, reason: "already_pending" }` when duplicate suggestion exists | outputs/BlackWidow §F3 |
| Switch to your citizen profile to book | createVportPublicBookingController | Thrown when actor.kind !== "user" attempts to book | outputs/BlackWidow §C1 / §I6 (BLOCKED) |

---

## §8 Cross-Feature Dependencies

| Dependency | Type | Direction | Boundary | Responsibility | Source |
|---|---|---|---|---|---|
| engines/booking | engine | inbound | APPROVED | createOrganizationLocationWorkspace called on barbershop VPORT creation | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| engines/identity | engine | inbound | APPROVED | refreshVcActorDirectory called after create and update to sync actor directory | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| engines/media | engine | inbound | APPROVED | uploadMediaController, createMediaAssetController for avatar upload on creation | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| engines/notification | engine | inbound | APPROVED (scanner-detected) | Usage scanner-detected; not directly observed in source scan during ARCHITECT pass | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| engines/profile | engine | inbound | APPROVED (scanner-detected) | Usage scanner-detected; not directly observed in source scan during ARCHITECT pass | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| features/profiles | cross-feature | inbound | PARTIAL — VIOLATION | submitCreateVport.controller.js imports VPORT_TYPE_GROUPS directly from features/profiles/adapters/kinds/vport/config — bypasses adapter boundary rule | ARCHITECTURE.md §MODULE BOUNDARY WARNINGS |
| features/identity | cross-feature | inbound | APPROVED | useIdentity() consumed via adapter in RestoreVportScreen | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| features/media | cross-feature | inbound | APPROVED | media.adapter.js used in submitCreateVport.controller.js | ARCHITECTURE.md §MODULE DEPENDENCY GRAPH |
| features/dashboard/vport | sibling feature | none | N/A | Dashboard feature owns booking cards, fuel pricing, and service catalog. vport feature does NOT own these. | ARCHITECTURE.md §PURPOSE |

**Independence status:** MOSTLY INDEPENDENT (ARCHITECT V2 2026-06-04)

---

## §9 Must Never Happen — Security Invariants

Each invariant is derived from VENOM, BlackWidow, or ARCHITECT governance artifacts.

| Invariant | Status | Violated by |
|---|---|---|
| INVARIANT: A citizen must never be able to update another citizen's VPORT name, bio, slug, avatar, or is_active status. | UNVERIFIED at app layer — RLS is sole barrier | VEN-VPORT-002 (HIGH) / BW-VPORT-001 (HIGH) — updateVport has no app-layer owner_user_id filter |
| INVARIANT: A citizen must never be able to soft-delete another citizen's VPORT. | UNVERIFIED at app layer — RPC enforcement unverified | VEN-VPORT-003 (HIGH) — ctrlSoftDeleteVport has no app-layer ownership check |
| INVARIANT: A citizen must never be able to restore a VPORT they do not own. | UNVERIFIED at app layer — RPC enforcement unverified | VEN-VPORT-003 (HIGH) — ctrlRestoreVport has no app-layer ownership check |
| INVARIANT: VPORT avatar and banner media asset IDs must only be updatable by the owning actor. | UNVERIFIED at app layer — RLS is sole barrier | VEN-VPORT-004 (MEDIUM) / BW-VPORT-002 (HIGH) — no session guard at DAL |
| INVARIANT: A VPORT actor (kind=vport) must never be able to book appointments as a customer. Only user-kind actors may submit public bookings. | VERIFIED — BLOCKED at vportPublicBooking.controller.js:58-61 | Inferred invariant; BLOCKED per BW §I6 |
| INVARIANT: A booking that has reached a terminal state (completed, cancelled, no_show) must never be modified. | VERIFIED — BLOCKED at updateVportBooking.controller.js:35-37 | Inferred invariant; BLOCKED per BW §F1 |
| INVARIANT: customer_actor_id on a public booking must never be caller-supplied. It must always be sourced from the authenticated session actor. | VERIFIED — BLOCKED at vportPublicBooking.controller.js:83-84 | Inferred invariant; BLOCKED per BW §I2 (VPD-V-019) |
| INVARIANT: VPORT settings must never be writable by a non-owner. | VERIFIED — BLOCKED (double-guarded: assertActorOwnsVportActorController + DAL owner_user_id check) | Inferred invariant; BLOCKED per BW §I4 |
| INVARIANT: Only the VPORT owner may approve or reject fuel price suggestions. | VERIFIED — BLOCKED at reviewFuelPriceSuggestion.controller.js:45-52 | Inferred invariant; BLOCKED per BW §I3 |
| INVARIANT: The last active team owner of a VPORT must not be removable. At least one active owner must remain at all times. | VERIFIED — BLOCKED at vportTeamAccess.controller.js:145-148 | Inferred invariant; BLOCKED per BW §I5 |
| INVARIANT: A fuel price suggestion in pending state must not be re-submitted by the same actor for the same fuel key. | VERIFIED — BLOCKED at submitCitizenFuelPriceSuggestionController | Inferred invariant; BLOCKED per BW §F3 |
| INVARIANT: A team invite that is no longer in pending_acceptance state must not be accepted. | VERIFIED — BLOCKED at vportTeamInvite.controller.js:110 | Inferred invariant; BLOCKED per BW §F2 |
| INVARIANT: Raw VPORT or booking UUIDs must not appear in public-facing notification linkPaths. | PARTIALLY VERIFIED — linkPath is null for booking notifications (BLOCKED); notification objectId carries raw booking UUID (BW-VPORT-004 OPEN — risk depends on notification inbox URL construction) | BW-VPORT-004 (LOW) |
| INVARIANT: owner_user_id (Supabase auth UUID) must not be returned in public VPORT read payloads. | NOT ENFORCED — VEN-VPORT-006 OPEN | VEN-VPORT-006 (MEDIUM) — getVportById and getVportBySlug include owner_user_id in SELECT |
| INVARIANT: The migration barrel vport.public.js must not be used as a write path by production feature code. | PARTIALLY ENFORCED — sole confirmed consumer is dev/diagnostics; no production path confirmed | VEN-VPORT-005 (MEDIUM) |

---

## §10 Module Responsibilities

The vport feature contains one primary module: `modules/vport`.

### Module: vport (modules/vport/)

**Responsibility:** VPORT actor lifecycle management — create, update, soft-delete, hard-delete, restore — and profile media write-back (avatar, banner). Lifecycle-critical feature.

**Source directories documented:**
- `controller/` — vportCoreOps.controller.js (zero-logic DAL bridge — VEN-VPORT-007 architecture violation), vport lifecycle controllers
- `dal/` — vport.core.dal.js (primary: create_vport, updateVport, soft_delete_vport, hard_delete_vport, restore_vport, getVportById, getVportBySlug, listMyVports); vport.write.profileMedia.dal.js (avatar and banner media updates); vport.read.vportRecords.dal.js (duplicates listMyVports — LOW priority debt)
- `adapters/` — vport.adapter.js (boundary adapter), vport.public.adapter.js, CreateVportForm.jsx.adapter.js
- `hooks/` — useCreateVport.js, useRestoreVport.js, useVportCoreOps.js, useVportServiceCatalog.js
- `model/` — createVportForm.model.js, vportServiceCatalog.model.js
- `public/` — public vport preview components (VportPhonePreview.jsx, VportPreviewCard.jsx, VportPreviewShowcase.jsx)
- `screens/` — RestoreVportScreen.jsx
- `utils/` — vport utilities

**Governance status of module files:** All module governance files (INDEX.md, BEHAVIOR.md, ARCHITECTURE.md, SECURITY.md) were STUB as of 2026-06-05. The module BEHAVIOR.md and SECURITY.md contain source-derived (VENOM+BW) behavioral and security facts as stubs — they are not fully authored contracts.

**Key architectural note:** vportCoreOps.controller.js is a zero-logic DAL re-export (VEN-VPORT-007). It is a controller in name only. The correct create path goes through `submitCreateVport.controller.js` which has input validation.

Sources: modules/vport/INDEX.md, modules/vport/BEHAVIOR.md, modules/vport/SECURITY.md, modules/vport/ARCHITECTURE.md, ARCHITECTURE.md §LAYER MAP

---

## §11 Known Gaps

### UNKNOWN behavior (insufficient governance evidence):

| Gap | Reason | Section Affected |
|---|---|---|
| Full behavior of useVportCoreOps.js | ARCHITECTURE.md notes "purpose unclear from static scan" | §3 User Flows |
| notification and profile engine — specific call sites | Scanner-detected but not directly observed in ARCHITECT source scan | §8 Cross-Feature Dependencies |
| Loading skeleton / spinner in CreateVportForm | Documented as WATCH/ABSENT — no skeleton; button disabled only | §7 Error Handling |
| Empty list state handler | Documented as absent in this module | §7 Error Handling |
| Cache behavior / React Query invalidation | ARCHITECTURE.md marks cache layer as FAIL — no cache layer in this module | §5 State Rules |
| Notification inbox URL construction for objectId | BW-VPORT-004 notes risk depends on notification system — out of scope for this feature | §9 Invariants |
| vport.profiles RLS UPDATE policy presence | DB verification pending — CONDITIONAL THOR BLOCKER | §6 Security Constraints |
| soft_delete_vport / restore_vport RPC ownership enforcement at DB level | DB verification pending | §6 Security Constraints |
| ELEKTRA source-to-sink chain analysis | ELEKTRA has never been run on this feature | §6 Security Constraints |

### Missing governance artifacts:

| Missing Item | Impact |
|---|---|
| OWNERSHIP.md — no ownership record | No IRONMAN assignment; ownership inferred from domain only |
| Zero test coverage (0 tests detected by scanner) | No regression safety for create, restore, soft/hard delete, or media write-back |
| ELEKTRA never run | No source-to-sink chain analysis; import path analysis for updateVportAvatarMediaAssetIdDAL and updateVportBannerMediaAssetIdDAL unverified |
| Route-map entries absent for CreateVportForm | Component-embedded; no route-map coverage |
| No domain model for VPORT entity itself | Shape inferred from DAL SELECTs only |

### Open architecture debt:

| Debt Item | Severity | Source |
|---|---|---|
| vport.public.js migration barrel unresolved — no removal deadline | MEDIUM | ARCHITECTURE.md §MODULE MISSING PIECES; VEN-VPORT-005 |
| Cross-feature import violation in submitCreateVport.controller.js (imports from features/profiles/adapters internal path) | MEDIUM | ARCHITECTURE.md §MODULE BOUNDARY WARNINGS |
| vport.read.vportRecords.dal.js duplicates listMyVports from vport.core.dal.js | LOW | ARCHITECTURE.md §MODULE MISSING PIECES |
| vportCoreOps.controller.js is a zero-logic DAL re-export (architecture layer violation) | MEDIUM | VEN-VPORT-007 |

### Open tickets referenced in governance:

| Ticket | Description | Source |
|---|---|---|
| TICKET-VENOM-VPORT-0001 | VENOM review of vport feature | outputs/Venom metadata |
| TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001 | This BEHAVIOR.md authoring ticket | Current task |

---

## §12 Validation Sources

| File | Key Facts Extracted |
|---|---|
| ZZnotforproduction/APPS/VCSM/features/vport/CURRENT_STATUS.md | Architecture state EVOLVING; independence status MOSTLY INDEPENDENT; top gap is BEHAVIOR.md placeholder; recommended handoffs LOGAN/SPIDER-MAN/IRONMAN/HAWKEYE/VENOM |
| ZZnotforproduction/APPS/VCSM/features/vport/SECURITY.md | 8 VENOM findings (0 CRITICAL, 2 HIGH, 4 MEDIUM, 2 LOW); 4 BW findings (0 CRITICAL, 2 HIGH, 1 MEDIUM, 1 LOW); CONDITIONAL THOR BLOCKER on BW-VPORT-001+002 and VEN-VPORT-002 if DB confirms RLS absent; ELEKTRA not run |
| ZZnotforproduction/APPS/VCSM/features/vport/ARCHITECTURE.md | Full module architecture: layer map, completeness matrix, dependency graph, data contract, runtime readiness, boundary warnings, spaghetti score WATCH, missing pieces, build priority |
| ZZnotforproduction/APPS/VCSM/features/vport/INDEX.md | Source inventory (29 files), write surface map (7 operations), security-sensitive surfaces, engine dependencies, routes (0 route-map entries) |
| ZZnotforproduction/APPS/VCSM/features/vport/SCREENS.md | 1 screen: RestoreVportScreen at /vport/restore, access: public, confidence: HIGH |
| ZZnotforproduction/APPS/VCSM/features/vport/modules/vport/BEHAVIOR.md | STUB with VENOM+BW-derived expected behaviors and invariants (unverified) |
| ZZnotforproduction/APPS/VCSM/features/vport/modules/vport/SECURITY.md | STUB with 5 security findings: VPORT-SEC-001 through VPORT-SEC-005; CONDITIONAL THOR BLOCKER on VPORT-SEC-001/002 |
| ZZnotforproduction/APPS/VCSM/features/vport/modules/vport/ARCHITECTURE.md | STUB with execution path diagrams for update, media asset update, soft-delete/restore, public data leak, migration barrel |
| ZZnotforproduction/APPS/VCSM/features/vport/modules/vport/INDEX.md | STUB with source directory listing and CONDITIONAL THOR BLOCKER status |
| ZZnotforproduction/APPS/VCSM/features/vport/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_vport-security-review.md | Full VENOM V2 review: 8 findings SOURCE_VERIFIED; scanner inputs; trust boundary analysis; CISSP domain coverage; mitigation plan; THOR impact |
| ZZnotforproduction/APPS/VCSM/features/vport/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_vport-adversarial-review.md | Full BW V2 adversarial review: 4 findings; 14 attack scenarios BLOCKED; 2 BYPASSED (app layer); §9 invariant attack map; SPIDER-MAN test requirements; THOR impact |

---

## §13 THOR Release Status

**From SECURITY.md (Last Updated: 2026-06-04):**

> THOR Release Blocker: YES (conditional — BW-VPORT-001 + BW-VPORT-002 become hard blockers if DB confirms vport.profiles RLS UPDATE policy is absent; VEN-VPORT-002 same condition)

**Current THOR status:** CONDITIONAL BLOCKER

**Blocker details:**

| Blocker ID | Finding IDs | Condition | Description |
|---|---|---|---|
| CONDITIONAL-THOR-001 | BW-VPORT-001 / VEN-VPORT-002 | Hard blocker if DB confirms vport.profiles RLS UPDATE policy is absent | updateVport has no app-layer owner_user_id filter — RLS is sole ownership barrier. If RLS is absent, any authenticated Citizen can update any VPORT. |
| CONDITIONAL-THOR-002 | BW-VPORT-002 / VEN-VPORT-004 | Hard blocker if vport.profiles RLS is absent for avatar/banner UPDATE paths | updateVportAvatarMediaAssetIdDAL and updateVportBannerMediaAssetIdDAL have no session auth guard at DAL layer. |

**Additional governance note:** VEN-VPORT-008 / BW §11 flag that BEHAVIOR.md being a PLACEHOLDER was a governance blocker before the next vport lifecycle release. This BEHAVIOR.md authoring resolves that specific finding. VENOM and SPIDER-MAN re-review is recommended now that §5 and §9 are declared.

**Required action before unconditional THOR clearance:**
- DB command must verify vport.profiles RLS UPDATE policy presence and correctness.
- DB command must verify soft_delete_vport and restore_vport RPC ownership enforcement.
- If RLS is absent: add app-layer owner_user_id filter to updateVport (match profile.write.dal.js pattern); add assertActorOwnsVportActorController to ctrlSoftDeleteVport and ctrlRestoreVport; add requireUser() to media asset DAL functions.
- ELEKTRA must be run to trace import paths for updateVportAvatarMediaAssetIdDAL and updateVportBannerMediaAssetIdDAL.

Sources: SECURITY.md, modules/vport/SECURITY.md §THOR Status, outputs/Venom §9 THOR Impact, outputs/BlackWidow §12 THOR Impact
