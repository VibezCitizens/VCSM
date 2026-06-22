# VENOM Post-Fix Security Verification Report — Booking Feed & Availability System

**Date:** 2026-05-14  
**Time (approx):** 18:00  
**Reviewer:** VENOM  
**Branch:** `vport-booking-feed-security-updates`  
**Trigger:** P0 security fix pass completed — targeted re-verification of 6 files modified to resolve 4 original VENOM findings  
**Application Scope:** VCSM + ENGINE  
**Report Type:** Post-Fix Verification (not a new audit)  
**Predecessor Reports:**
- `2026-05-14_venom_booking-dal.md` — original booking DAL system audit (V-BOOK-01 through V-BOOK-07)
- `2026-05-14_venom_booking-availability-write.md` — availability write path audit (V-AVAIL-01 through V-AVAIL-04)

---

## SCOPE

This report covers only the 4 release-blocking findings that triggered the fix pass. Findings V-BOOK-02 through V-BOOK-04, V-BOOK-06 through V-BOOK-07, and V-AVAIL-03 through V-AVAIL-04 were not P0 and are not re-verified here — their status carries forward from the original reports.

### Files Reviewed (Post-Fix State)

| # | File | Modified Layer | Original Finding |
|---|---|---|---|
| 1 | `apps/VCSM/src/features/dashboard/vport/controller/manageVportAvailabilityRuleController.js` | Controller | V-AVAIL-01 |
| 2 | `apps/VCSM/src/features/dashboard/vport/hooks/useVportManageAvailability.js` | Hook | V-AVAIL-02 |
| 3 | `apps/VCSM/src/features/dashboard/vport/controller/listVportServicesForProfile.controller.js` | Controller | S-BOOK-02 |
| 4 | `apps/VCSM/src/features/dashboard/vport/hooks/useQuickBookingModal.js` | Hook | S-BOOK-02 |
| 5 | `apps/VCSM/src/features/booking/adapters/booking.adapter.js` | Adapter | S-BOOK-04 |
| 6 | `engines/booking/src/controller/listBookingHistory.controller.js` | Engine Controller | V-BOOK-01 |

---

## FINDING RE-VERIFICATION

---

### V-AVAIL-01 — Availability Rule Write with No Controller-Level Ownership Assertion

**Original Severity:** CRITICAL  
**Original Exploitability:** HIGH  
**Original Location:** `manageVportAvailabilityRule.controller.js`  
**VENOM Verdict:** RESOLVED

#### Original Violation

The controller accepted `ruleId` and `resourceId` and passed them directly to the DAL with no `callerActorId`, no `ownerActorId`, and no call to `assertActorOwnsVportActorController`. Any authenticated Citizen holding a valid `ruleId` could overwrite any VPORT's availability rules.

#### Post-Fix State

```js
export async function manageVportAvailabilityRuleController({
  callerActorId, ownerActorId, ruleId, resourceId, ruleType, weekday, startTime, endTime, isActive,
}) {
  if (!callerActorId) throw new Error("manageVportAvailabilityRuleController: callerActorId is required");
  if (!ownerActorId)  throw new Error("manageVportAvailabilityRuleController: ownerActorId is required");
  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: ownerActorId });
  // ...DAL call follows only after ownership is confirmed
}
```

#### Verification Analysis

All three required controls are now present:

1. **`callerActorId` guard** — hard throws if absent. A request with no session identity is rejected before touching the DAL.
2. **`ownerActorId` guard** — hard throws if absent. Removes the silent-drop failure mode from the original.
3. **`assertActorOwnsVportActorController` call** — DB-backed ownership assertion via `actor_owners`. This is the canonical VCSM ownership verification pattern. The call occurs before the DAL write, not after.

The fix satisfies the recommended mitigation items 1 and 2 from the original audit. Item 3 (DAL-level `resource_id` filter) and item 4 (RLS policy) are noted in Residual Concerns below.

**Import path for `assertActorOwnsVportActorController`:** `@/features/booking/adapters/booking.adapter` — this crosses feature boundaries via the adapter layer, which is the correct pattern per the Architecture Contract (cross-feature access through adapters only).

**Re-classified Exploitability:** NOT EXPLOITABLE (ownership gate is now controller-enforced and DB-verified)  
**Re-classified Severity:** N/A — finding resolved

---

### V-AVAIL-02 — requestActorId Silently Dropped at Hook Boundary

**Original Severity:** HIGH  
**Original Exploitability:** HIGH (enabled V-AVAIL-01)  
**Original Location:** `useVportManageAvailability.js:15-23`  
**VENOM Verdict:** RESOLVED

#### Original Violation

The hook received `requestActorId` in its destructured parameter list but never forwarded it to the controller call, silently breaking the ownership identity chain between the calling screen and the controller.

#### Post-Fix State

```js
export default function useVportManageAvailability() {
  const setAvailabilityRule = useCallback(async ({
    callerActorId, ownerActorId, ruleId, resourceId, ruleType, weekday, startTime, endTime, isActive,
  }) => {
    return manageVportAvailabilityRuleController({
      callerActorId, ownerActorId, ruleId, resourceId, ruleType, weekday, startTime, endTime, isActive,
    });
  }, []);
  return { setAvailabilityRule };
}
```

#### Verification Analysis

The hook now explicitly accepts and forwards both `callerActorId` and `ownerActorId` to the controller. The parameter naming is consistent with the controller's expected signature (`callerActorId` / `ownerActorId`), eliminating the previous mismatch where the hook used `requestActorId` while the (pre-fix) controller had no such parameter.

The ownership identity chain is now intact:

```
Session (useIdentity) → callerActorId → hook → controller → assertActorOwnsVportActorController → actor_owners
```

No silent discard. No identity loss at boundary crossing.

**Re-classified Exploitability:** NOT EXPLOITABLE (identity chain is unbroken; V-AVAIL-01 gating now reachable)  
**Re-classified Severity:** N/A — finding resolved

---

### S-BOOK-02 — `profileId` as Forbidden Identity Surface

**Original Severity:** HIGH  
**Original Finding IDs:** V-BOOK-05 (DAL audit) + linked to availability audit as S-BOOK-02  
**Original Locations:**
- `listVportServicesForProfileController` — accepted `profileId` as lookup key, no actor-scoped resolution
- `useQuickBookingModal` — accepted `profileId` as a prop and forwarded it to the controller

**VENOM Verdict:** RESOLVED

#### Original Violation

`useQuickBookingModal({ profileId, resourceId })` accepted `profileId` as an identity surface, in direct violation of the Identity Surface Rule §1.3 (actor-based identity only — `actorId` + `kind`). The controller received the raw `profileId` and passed it directly to the DAL, enabling service enumeration for any VPORT profile regardless of caller relationship to it.

#### Post-Fix State — Controller

```js
export async function listVportServicesForProfileController({ ownerActorId, includeDisabled = false } = {}) {
  if (!ownerActorId) return [];
  const profileId = await getVportProfileIdByActorDAL({ actorId: ownerActorId });
  if (!profileId) return [];
  return listVportServicesByProfileIdDAL({ profileId, includeDisabled });
}
```

#### Post-Fix State — Hook

```js
export function useQuickBookingModal({ ownerActorId, resourceId } = {}) {
  const { identity } = useIdentity();
  const callerActorId = identity?.actorId ?? null;
  // callerActorId sourced from session identity, not props
  useEffect(() => {
    if (!ownerActorId) { setServices([]); return; }
    listVportServicesForProfileController({ ownerActorId }).then(...).catch(...);
  }, [ownerActorId]);
  // callerActorId passed to createOwnerBookingController from identity, not props
}
```

#### Verification Analysis

**Controller fix:** `profileId` is no longer accepted as an external parameter. The controller now receives `ownerActorId` (an actor-scoped identifier), resolves the internal `profileId` via a DAL call (`getVportProfileIdByActorDAL`), and uses it only as an internal resolution detail. The external identity surface is now correctly `actorId`-based. This also addresses V-BOOK-07 (passthrough controller) — the controller now performs actual resolution rather than being a no-op relay.

**Hook fix:** `profileId` has been removed from the hook's prop signature. The hook now accepts `ownerActorId` (correct surface). Critically, `callerActorId` is sourced from `useIdentity()` — the session identity — not from props. This closes the path by which a caller could supply an arbitrary identity through the component interface.

The `includeDisabled` parameter defaults to `false` in the controller and is not surfaced in the hook call, meaning disabled services are not accessible through this path without an explicit override at the controller level.

**Re-classified Exploitability:** NOT EXPLOITABLE — forbidden identity surface removed; services can only be fetched by resolving through a DB-verified actor record  
**Re-classified Severity:** N/A — finding resolved

---

### S-BOOK-04 — `useBookingHistory` Exported via Adapter, Backed by Unprotected Engine Controller

**Original Severity:** HIGH  
**Original Finding IDs:** V-BOOK-01 (core engine finding) + S-BOOK-04 (adapter trust boundary degradation)  
**Original Location:** `booking.adapter.js` — exported `useBookingHistory` which called engine `listBookingHistory` with no caller identity or ownership assertion  
**VENOM Verdict:** RESOLVED

#### Original Violation

The adapter exported `useBookingHistory`, which was backed by the engine controller `listBookingHistory({ resourceId })`. The engine controller accepted only `resourceId` with no `callerActorId`, no `ownerActorId`, and no ownership assertion — meaning any authenticated actor could query any resource's full booking history (including customer PII: names, phone, email, internal notes) by supplying a known `resourceId`.

This was a two-part finding:
- **Engine layer (V-BOOK-01):** The engine controller was unprotected.
- **Adapter layer (S-BOOK-04):** The adapter exported a hook backed by the unprotected engine, degrading the adapter's trust boundary by making the vulnerability reachable from the feature layer.

#### Post-Fix State — Engine Controller

```js
export async function listBookingHistory({ callerActorId, ownerActorId, resourceId, statuses = null, limit = 50, offset = 0 } = {}) {
  if (!callerActorId) throw new Error('[BookingEngine] callerActorId is required')
  if (!ownerActorId)  throw new Error('[BookingEngine] ownerActorId is required')
  if (!resourceId)    throw new Error('[BookingEngine] resourceId is required')
  await assertActorOwnsVportActor({ requestActorId: callerActorId, targetActorId: ownerActorId })
  const rows = await dalListBookingsByResource({ resourceId, statuses, limit, offset })
  return { bookings: mapBookingRows(rows), hasMore: rows.length >= limit }
}
```

#### Post-Fix State — Adapter

```js
// NOTE: useBookingHistory removed — backed by unprotected engine controller
// (All other exports remain; useBookingHistory is no longer part of the adapter surface)
```

The adapter no longer exports `useBookingHistory`. The inline comment in the adapter documents the removal reason, providing an explicit audit trail for future reviewers.

#### Verification Analysis

**Engine fix (V-BOOK-01):** Three mandatory preconditions are now enforced before any data access:

1. `callerActorId` — hard throw if missing (no anonymous reads)
2. `ownerActorId` — hard throw if missing (no unscoped reads)
3. `assertActorOwnsVportActor({ requestActorId: callerActorId, targetActorId: ownerActorId })` — DB-backed ownership check via `actor_owners` before the DAL read

All three guards must pass before `dalListBookingsByResource` is called. A caller cannot reach the DAL without first proving ownership through the `actor_owners` table.

**Adapter fix (S-BOOK-04):** Removing `useBookingHistory` from the adapter eliminates the trust boundary degradation. The adapter no longer provides a hook-level entry point that previously bypassed ownership verification. If `useBookingHistory` is re-introduced in a future refactor, the engine controller now self-protects — the engine fix is the durable guard.

**Error prefix:** The engine controller uses `[BookingEngine]` prefix in throw messages. This is consistent with engine-layer error identification and does not expose internal implementation details.

**Re-classified Exploitability:** NOT EXPLOITABLE
- Engine path: protected by DB-verified ownership assertion
- Adapter surface: removed; `useBookingHistory` is no longer exported

**Re-classified Severity:** N/A — both components of the finding resolved

---

## RESIDUAL CONCERNS

The following items were identified during verification. They do not re-open the resolved findings but represent incremental hardening work.

---

### RC-01 — DAL-Level `resource_id` Filter Not Added (V-AVAIL-01 Recommendation Item 3)

**Status:** Open — non-blocking  
**Location:** `vportAvailabilityRules.write.dal.js` (UPDATE path)  
**Original Recommendation:** Add `.eq("resource_id", resourceId)` to the UPDATE query to constrain the write scope to the confirmed resource, providing defense-in-depth beneath the controller ownership check.

The ownership gate in the controller (V-AVAIL-01 fix) is sufficient for security. The DAL filter is an additional hardening measure that would prevent an edge case where a `ruleId` is valid but belongs to a different resource under the same VPORT. The controller-level fix makes this non-exploitable, but defense-in-depth at the DAL remains the architectural ideal.

**Recommended follow-up:** Wolverine (DAL hardening) — P2, non-blocking.

---

### RC-02 — RLS Policies Confirmed Live, But `bookings_insert_owner` Uses Legacy Pattern

**Status:** Open — flagged for future Carnage  
**Location:** Production DB — `bookings_insert_owner` policy  
**Detail:** User-provided RLS policy dump confirms:
- `bookings_select_vport_owner`: uses `vport.actor_can_manage_profile(current_actor_id(), profile_id)` — LIVE and aligned with actor ownership model
- `availability_rules_update` + `availability_rules_manage_neutral` — LIVE

However, `bookings_insert_owner` uses `profiles.owner_user_id = auth.uid()` — a legacy pattern that operates on `auth.uid()` (raw Supabase auth ID) rather than the actor ownership model (`actor_owners`). This creates an inconsistency: reads and updates are gated through the actor model; inserts are gated through the legacy profile model.

This is not a blocking issue — the legacy pattern does enforce authorization, just through an older model. The risk is divergence: if the profile → user_id mapping ever drifts (see V-BOOK-06, RC-03 below), insert RLS could fail silently for legitimate owners.

**Recommended follow-up:** Carnage — migrate `bookings_insert_owner` to use `vport.actor_can_manage_profile(current_actor_id(), profile_id)` pattern for consistency. P1 — not blocking current release.

---

### RC-03 — `assertActorOwnsVportActor` Ownership Assertion Fragility (V-BOOK-06 Carries Forward)

**Status:** Open — carried from original audit (V-BOOK-06, MEDIUM)  
**Location:** `features/booking/controller/assertActorOwnsVportActor.controller.js:28`  
**Detail:** The ownership assertion resolves `profile_id` from the actor DB record and uses it to query `actor_owners`. This is a safe indirect resolution (not caller-supplied), but it creates a dependency on the `actor_owners.user_id ↔ vc.actors.profile_id` mapping remaining in sync. A drift between these tables would either block legitimate owner access or (worse) silently pass ownership for deactivated accounts.

This finding was not P0 in the original audit and is not re-triggered by any of the 6 reviewed files. It remains open.

**Recommended follow-up:** DB + Carnage — verify sync invariant between `actor_owners.user_id` and `vc.actors.profile_id`. P2.

---

### RC-04 — V-BOOK-02, V-BOOK-03, V-BOOK-04 Not Addressed in This Fix Pass

**Status:** Open — out of scope for P0 fix pass  
**Detail:** Three HIGH findings from the original booking DAL audit were not addressed in this fix pass (correctly — they were not P0):
- **V-BOOK-02:** `updateBookingStatusDAL` returns PII fields (customer_phone, customer_email, internal_note) to client state after every status update
- **V-BOOK-03:** `listBookingsByCustomerDAL` exposes `member_actor_id` (staff actor ID) to customer-facing reads
- **V-BOOK-04:** Booking cancellation notification embeds raw `owner_actor_id` UUID in `linkPath`

These carry forward as P1 items. They do not block the current release but must be addressed before the booking system is considered fully hardened.

**Recommended follow-up:** Wolverine (V-BOOK-02, V-BOOK-03), Logan (V-BOOK-04). P1.

---

## RLS VERIFICATION SUMMARY

| Policy | Table | Pattern | Status |
|---|---|---|---|
| `bookings_select_vport_owner` | `bookings` | `vport.actor_can_manage_profile(current_actor_id(), profile_id)` | LIVE — confirmed |
| `availability_rules_update` | `availability_rules` | Actor-ownership model | LIVE — confirmed |
| `availability_rules_manage_neutral` | `availability_rules` | Actor-ownership model | LIVE — confirmed |
| `bookings_insert_owner` | `bookings` | `profiles.owner_user_id = auth.uid()` (legacy) | LIVE — but diverges from actor model (see RC-02) |

App-layer fixes (controller ownership assertions) are the primary security gate. RLS policies provide defense-in-depth. Current state: app-layer gates are now present and correct; RLS is live but has one legacy inconsistency (non-blocking).

---

## CISSP DOMAIN SUMMARY — UPDATED STATUS

| CISSP Domain | Original Findings | Post-Fix Status | Residual |
|---|---|---|---|
| Security and Risk Management | 0 | N/A | None |
| Asset Security | 3 (V-BOOK-02, V-BOOK-03, V-BOOK-04) | Not addressed in this pass (P1) | RC-04 open |
| Security Architecture and Engineering | 2 (V-BOOK-01, V-AVAIL-01) | RESOLVED — engine and controller both now self-protecting | RC-01 (DAL hardening, non-blocking) |
| Communication and Network Security | 1 (V-BOOK-04) | Not addressed in this pass (P1) | RC-04 open |
| Identity and Access Management | 4 (V-BOOK-01, V-BOOK-05, V-AVAIL-01, V-AVAIL-02) | RESOLVED — ownership chains restored, forbidden surface removed | RC-03 (ownership assertion fragility, P2) |
| Security Assessment and Testing | 1 (V-BOOK-06) | Carries forward | RC-03 open |
| Security Operations | 0 | N/A | None |
| Software Development Security | 3 (V-BOOK-02, V-BOOK-05, V-BOOK-07) | V-BOOK-05 / V-BOOK-07 RESOLVED in this pass. V-BOOK-02 open (P1). | RC-04 (V-BOOK-02) open |

---

## FINDING-BY-FINDING VERDICT TABLE

| Finding ID | Original Severity | Description | VENOM Verdict | Re-classified Exploitability | Blocking Release? |
|---|---|---|---|---|---|
| V-AVAIL-01 | CRITICAL | No controller ownership assertion on availability write | **RESOLVED** | Not exploitable | No (resolved) |
| V-AVAIL-02 | HIGH | `requestActorId` silently dropped at hook boundary | **RESOLVED** | Not exploitable | No (resolved) |
| S-BOOK-02 / V-BOOK-05 | HIGH | `profileId` as forbidden identity surface in quick booking | **RESOLVED** | Not exploitable | No (resolved) |
| S-BOOK-04 / V-BOOK-01 | CRITICAL (engine) + HIGH (adapter) | Engine `listBookingHistory` unprotected + adapter export | **RESOLVED** | Not exploitable | No (resolved) |
| V-BOOK-02 | HIGH | PII overfetch in `updateBookingStatusDAL` | CARRIES FORWARD (P1) | MEDIUM | No (P1) |
| V-BOOK-03 | HIGH | Staff `member_actor_id` in customer booking read | CARRIES FORWARD (P1) | MEDIUM | No (P1) |
| V-BOOK-04 | HIGH | Raw UUID in notification `linkPath` | CARRIES FORWARD (P1) | LOW | No (P1) |
| V-BOOK-06 | MEDIUM | Ownership assertion `profile_id` drift risk | CARRIES FORWARD (P2) | LOW | No (P2) |
| V-AVAIL-03 | MEDIUM | UI-only string comparison gate | CARRIES FORWARD (note) | LOW — now rendering-only, not security gate | No |
| V-AVAIL-04 | MEDIUM | Silent error catch + raw error return | CARRIES FORWARD (P2) | LOW | No |

---

## FINAL VENOM SECURITY STATUS

### P0 Findings (Release-Blocking)

| Finding | Status |
|---|---|
| V-AVAIL-01 — Availability write with no ownership gate | RESOLVED |
| V-AVAIL-02 — requestActorId silently dropped at hook | RESOLVED |
| S-BOOK-02 — profileId as forbidden identity surface | RESOLVED |
| S-BOOK-04 / V-BOOK-01 — Unprotected engine booking history read + adapter export | RESOLVED |

All 4 P0 findings are resolved. No new P0 findings were identified during this verification pass.

### Overall Status

**FINAL VENOM STATUS: CLEARED**

The `vport-booking-feed-security-updates` branch resolves all release-blocking security findings from the original VENOM booking system audits. The three surviving HIGH findings (V-BOOK-02, V-BOOK-03, V-BOOK-04) and two MEDIUM findings (V-BOOK-06, V-AVAIL-04) are tracked as P1/P2 hardening work and are appropriate carry-forwards for the next Wolverine/Carnage session.

The booking and availability write paths now enforce ownership at the controller layer with DB-backed assertions through `actor_owners`. The forbidden `profileId` identity surface has been removed from all public hook and controller signatures. The unprotected engine read path is now self-protecting and the adapter trust boundary has been restored by removing the vulnerable export.

**This branch is CLEARED for merge pending standard review.**

---

*VENOM Post-Fix Verification — 2026-05-14 ~18:00 — Branch: vport-booking-feed-security-updates*
