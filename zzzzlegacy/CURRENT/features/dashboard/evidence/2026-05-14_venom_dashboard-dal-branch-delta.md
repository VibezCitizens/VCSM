# VENOM Security Audit — Dashboard DAL Branch Delta

**Date:** 2026-05-14  
**Branch:** `vport-booking-feed-security-updates`  
**Scope:** `apps/VCSM/src/features/dashboard/` — 20 modified files on branch  
**Triggered by:** CEREBRO orchestration over `vcsm.dal.dashboard.md`  
**Authority:** VENOM — Security and trust-boundary governance

---

## Audit Scope

20 dashboard files were modified on the current branch since the 2026-05-11 Avengers Assembly. The branch name `vport-booking-feed-security-updates` signals intentional security-focused changes. This audit reviews every modified file for trust-boundary violations, identity contract compliance, injection risk, and privilege escalation paths.

---

## Files Audited

| File | Change Area |
|---|---|
| `flyerEditor.controller.js` | Flyer editor |
| `designStudio.assetsExports.controller.js` | Design studio |
| `vport.adapter.js` | Adapter boundary |
| `QuickBookingModal.jsx` | Booking UI |
| `addPortfolioMediaWithRecord.controller.js` | Portfolio writes |
| `createOwnerBooking.controller.js` | Owner booking creation |
| `listVportBookingHistory.controller.js` | Booking history reads |
| `saveVportPublicDetailsByActorId.controller.js` | Profile settings |
| `updateVportBooking.controller.js` | Booking status updates |
| `vportPublicBooking.controller.js` | Public booking (primary focus) |
| `vportTeam.controller.js` | Team management |
| `vportTeamAccess.controller.js` | Team access control |
| `vportTeamInvite.controller.js` | Team invites |
| `vportServices.read.dal.js` | Service catalog DAL |
| `useBarberTeamRequests.js` | Team request hook |
| `useVportBookingActions.js` | Booking action hook |
| `useVportBookingHistory.js` | Booking history hook |
| `useVportOwnerSchedule.js` | Schedule hook |
| `useVportTeam.js` | Team hook |
| `VportDashboardBookingHistoryScreen.jsx` | Booking history screen |

---

## Findings

---

### VENOM-BRANCH-01 — SECURITY IMPROVEMENT CONFIRMED

**File:** `vportPublicBooking.controller.js`  
**Function:** `createVportPublicBookingController`  
**Severity:** IMPROVEMENT (resolved prior risk)

**Finding:**  
The `service_label_snapshot` field in booking records is now resolved **server-side** from the service catalog via `getVportServiceByIdDAL({ serviceId })`. The resolved label overwrites any client-supplied value.

```js
// Resolve service label server-side from the catalog — never trust client-supplied snapshot
let resolvedLabel = "Appointment";
if (serviceId) {
  const service = await getVportServiceByIdDAL({ serviceId });
  if (service) {
    resolvedLabel = service.label || service.key || "Appointment";
  }
}
```

**Assessment:** This eliminates a client-trust risk where a caller could supply an arbitrary `service_label_snapshot`. The server now enforces the canonical service catalog label. **VERIFIED SECURE.**

---

### VENOM-BRANCH-02 — ANONYMOUS BOOKING ALLOWED (undocumented)

**File:** `vportPublicBooking.controller.js`  
**Function:** `createVportPublicBookingController`  
**Severity:** MEDIUM — design intent unconfirmed

**Finding:**  
`requestActorId` is an optional parameter (defaults to `null`). The actor identity check is only applied when `requestActorId` is truthy:

```js
if (requestActorId) {
  const actor = await readActorVportLinkDAL({ actorId: requestActorId });
  if (!actor) throw new Error("Only citizens can book appointments.");
  if (actor.kind !== "user") throw new Error("Switch to your citizen profile to book.");
}
```

When `requestActorId = null`, the booking proceeds without any actor identity verification. The booking record stores `created_by_actor_id: null` and `customer_actor_id: null`.

**Risk:** If anonymous public booking is not an intended product feature, this is a missing guard. Any caller could omit `requestActorId` to bypass the actor identity check and create unattributed bookings. Customer name/note are captured but not linked to any actor.

**Assessment:** Likely intentional for walk-in/guest booking scenarios (no account required). However, this must be explicitly documented as a design decision.

**Recommended action:** Confirm with product owner whether anonymous booking is intentional. If YES — document in the controller with a comment. If NO — add `if (!requestActorId) throw new Error("Must be signed in to book.")` guard.

**Status:** OPEN — awaiting product decision

---

### VENOM-BRANCH-03 — OWNERSHIP VERIFICATION CHAIN CONFIRMED

**Files:** `createOwnerBooking.controller.js`, `updateVportBooking.controller.js`, `listVportBookingHistory.controller.js`, `vportTeam.controller.js`, `vportTeamAccess.controller.js`, `vportTeamInvite.controller.js`  
**Severity:** VERIFIED SECURE

**Finding:**  
All owner-gated mutations now consistently route through `assertActorOwnsVportActorController` before any write:

```js
await assertActorOwnsVportActorController({
  requestActorId: callerActorId,
  targetActorId: vportActorId,
});
```

The controller itself:
1. Verifies `requestActorId` is a real actor
2. Confirms actor `kind === "user"` (not VPORT)
3. Checks `actor_owners` table via `readActorOwnerLinkByActorAndUserProfileDAL`
4. Throws on any ownership mismatch

**Assessment:** The ownership verification chain is sound and consistently applied. No privilege escalation path found. **VERIFIED SECURE.**

---

### VENOM-BRANCH-04 — BOOKING STATUS PRIVILEGE BOUNDARIES VERIFIED

**File:** `updateVportBooking.controller.js`  
**Function:** `updateBookingStatusController`  
**Severity:** VERIFIED SECURE

**Finding:**  
The status update path correctly implements a dual-privilege model:
- **Customer path:** May only cancel (`CUSTOMER_STATUSES = ["cancelled"]`) — ownership check uses `customer_actor_id` match
- **Owner path:** May confirm, cancel, complete, or no_show — verified via `assertActorOwnsVportActorController`

The distinction is enforced before any write occurs. No cross-privilege escalation path found.

**Assessment:** VERIFIED SECURE.

---

### VENOM-BRANCH-05 — TEAM WRITE PATH ACTOR OWNERSHIP VERIFIED

**File:** `vportTeam.controller.js`  
**Severity:** VERIFIED SECURE

**Finding:**  
All team mutations (`addTeamMemberController`, `sendTeamRequestController`, `removeTeamMemberController`) gate on `assertActorOwnsVportActorController` before any write. The `actorId` used is always the VPORT actor being managed — not a `profileId` or user-level ID.

`resolveProfileId` is used only internally to look up a `profile_id` for DAL queries that require it (domain-model lookup, not identity gate). The gate itself is always actor-based.

**Assessment:** VERIFIED SECURE.

---

### VENOM-BRANCH-06 — VPORTSERVICES.READ.DAL CHANGE CLEAN

**File:** `vportServices.read.dal.js`  
**Severity:** VERIFIED CLEAN

**Finding:**  
The DAL uses explicit `SELECT_COLS` (no `select('*')`). Both exported functions guard on required parameters before querying. No injection surface found.

**Assessment:** VERIFIED CLEAN.

---

### VENOM-BRANCH-07 — LEADS WRITE DAL IMPORT INCONSISTENCY

**File:** `vportLeads.write.dal.js`  
**Severity:** LOW — cosmetic, not a security risk

**Finding:**  
The file imports `vport` (raw client export) rather than `vportSchema` (the standard pattern across other DAL files). Both refer to the same Supabase client instance, so this is functionally equivalent.

```js
import { vport } from "@/services/supabase/vportClient";
// Other DAL files use:
import vportSchema from "@/services/supabase/vportClient";
```

**Assessment:** No security risk. Minor inconsistency. Recommend aligning with `vportSchema` import pattern on next touch.

---

### VENOM-BRANCH-08 — PRIOR FINDING VENOM-1 RESOLVED

**Prior finding:** `designStudio.auth.dal.js` returns raw `userId` — concern it may be used as identity gate  
**Status:** RESOLVED (see SENTRY pass in this report)

`designStudio.shared.controller.js` uses the `userId` only as an ownership lookup parameter passed to `dalReadActorOwnerRow({ actorId: ownerActorId, userId })`. The `ownerActorId` (actorId) is the primary scoping key. The `userId` is never used as an identity gate or routing key. **COMPLIANT.**

---

## Summary

| Finding | Severity | Status |
|---|---|---|
| VENOM-BRANCH-01: service_label_snapshot server-side resolution | IMPROVEMENT | RESOLVED |
| VENOM-BRANCH-02: anonymous booking undocumented | MEDIUM | OPEN |
| VENOM-BRANCH-03: ownership verification chain | VERIFIED SECURE | CLOSED |
| VENOM-BRANCH-04: booking status privilege boundaries | VERIFIED SECURE | CLOSED |
| VENOM-BRANCH-05: team write actor ownership | VERIFIED SECURE | CLOSED |
| VENOM-BRANCH-06: vportServices.read.dal change | VERIFIED CLEAN | CLOSED |
| VENOM-BRANCH-07: leads write import inconsistency | LOW | OPEN (next touch) |
| VENOM-BRANCH-08: designStudio userId concern | RESOLVED | CLOSED |

**Blocking findings:** 0  
**Open items:** 2 (VENOM-BRANCH-02 needs product decision; VENOM-BRANCH-07 cosmetic)

---

## VENOM Verdict

**BRANCH CHANGES: APPROVED WITH ONE OPEN ITEM**

The `vport-booking-feed-security-updates` branch introduces genuine security improvements (server-side label resolution, consistent `assertActorOwnsVportActorController` gating). No new security violations introduced. The anonymous booking path (VENOM-BRANCH-02) requires a documented product decision but is not blocking.

**Status:** REVIEW_PENDING (VENOM-BRANCH-02 product decision)
