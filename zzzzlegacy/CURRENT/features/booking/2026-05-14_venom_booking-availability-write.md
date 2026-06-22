# VENOM Security Audit — Booking Availability Write Path (Supplemental)

**Date:** 2026-05-14  
**Reviewer:** VENOM  
**Trigger:** Loki runtime trace (L-BOOK-01) — discovered live production write path with no controller-level ownership assertion: `manageVportAvailabilityRuleController` / `upsertVportAvailabilityRuleDAL` — missed by initial Venom pass (focused on booking history and cancel/confirm flows)  
**Application Scope:** VCSM  
**Status:** COMPLETE  
**Findings:** 1 CRITICAL | 1 HIGH | 1 MEDIUM

---

## VENOM TARGET

**Feature / Route / Engine:** `features/dashboard/vport/` — Availability rule write path  
**Application Scope:** VCSM  
**Reason for review:** L-BOOK-01 escalation from Loki — `WeeklyAvailabilityGrid` → `useVportManageAvailability` → `manageVportAvailabilityRuleController` → `upsertVportAvailabilityRuleDAL` is a live production path that modifies `vport.availability_rules` with no controller-level ownership assertion. The `requestActorId` is silently dropped at the hook boundary.  
**Primary trust boundary:** Authenticated VPORT Owner modifying availability rules for their resource

---

## SECURITY SURFACE

**Entry point:** `VportDashboardCalendarScreen.jsx` → `WeeklyAvailabilityGrid` → `useVportManageAvailability.setAvailabilityRule()`  
**Auth source:** `useIdentity()` → `identity.actorId` (session identity)  
**Authorization layer:** UI string comparison only (`String(viewerActorId) === String(actorId)`) — no DB verification  
**Identity surface:** `actorId` (URL param) + `viewerActorId` (session) — `requestActorId` passed but silently dropped  
**Sensitive objects involved:** `vport.availability_rules` (write), `vport.resources` (indirect scope)

---

## TRUST BOUNDARY TRACE

**Client input:**  
- `actorId` from URL params — identifies which VPORT is being managed  
- `viewerActorId` from `useIdentity()` — session actor (correct source)  
- `resourceId` from selected resource state — determines which resource's rules are written  
- `ruleId` from fetched availability data — identifies which rule to update  

**Validated at:**  
- UI layer only — `isOwner = String(viewerActorId) === String(actorId)` at `VportDashboardCalendarScreen.jsx:26`  
- No DB-verified validation at controller or DAL layer  

**Identity resolved at:**  
- `useIdentity()` resolves `viewerActorId` (correct)  
- `actorId` taken from URL param — never cross-referenced against `actor_owners` in this flow  

**Authorization enforced at:**  
- UI component gate only — not controller, not DAL, not RLS (RLS ownership unknown per DB-BOOK-02)  

**Data returned to:**  
- Mutation result returns `SELECT_COLS` from updated row — no sensitive fields but write is the risk, not read

---

## VENOM SECURITY FINDING

### V-AVAIL-01 — Availability Rule Write with No Controller-Level Ownership Assertion

**Finding ID:** V-AVAIL-01  
**Location:** `apps/VCSM/src/features/dashboard/vport/controller/manageVportAvailabilityRule.controller.js`  
**Application Scope:** VCSM  
**Severity:** CRITICAL  
**Exploitability:** HIGH  
**Blast Radius:** Multi-actor (any VPORT resource on the platform)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering, Software Development Security

**Trust Boundary:** Authenticated Citizen (no owner verification)

**Current behavior:**

The availability rule write path flows as follows:

```
VportDashboardCalendarScreen.jsx:26
  isOwner = String(viewerActorId) === String(actorId)  // UI-only gate, not DB-verified

WeeklyAvailabilityGrid.jsx:114,121,127
  manageAvailability.setAvailabilityRule({
    requestActorId: viewerActorId,   // ← passed
    ruleId,
    resourceId,
    ...
  })

useVportManageAvailability.js:15-23
  return manageVportAvailabilityRuleController({
    ruleId,
    resourceId,
    ruleType,
    weekday,
    startTime,
    endTime,
    isActive,
    // ← requestActorId SILENTLY DROPPED — never forwarded
  });

manageVportAvailabilityRuleController.js:3-17
  // No callerActorId
  // No ownerActorId
  // No assertActorOwnsVportActorController call
  // Goes directly to DAL
  await upsertVportAvailabilityRuleDAL({ ruleId, resourceId, ... });
  return { ok: true };

upsertVportAvailabilityRuleDAL — UPDATE path:
  .from("availability_rules")
  .update({ rule_type, weekday, start_time, end_time, is_active })
  .eq("id", ruleId)   // ← ONLY filter — no resource_id, no owner filter
```

**Risk:**  
Any authenticated Citizen who can:  
1. Discover a valid `ruleId` UUID (exposed in the availability management API response to anyone who loads the calendar for a VPORT)  
2. Call this path directly or modify request parameters  

...can overwrite availability rules for any VPORT resource on the platform without owning that VPORT.

The UI-only `isOwner` gate (string comparison) can be bypassed by direct API calls or by manipulating the URL `actorId` param to match `viewerActorId` (which is always true for the attacker's own session).

**Why it matters:**  
Availability rules control when a VPORT accepts bookings. An attacker who corrupts another VPORT's rules can:
- Set `is_active: false` on all rules — blocking all future bookings for that VPORT
- Inject false availability windows — creating booking conflicts and overrides
- Systematically disrupt competitor VPORTs with known `ruleId` values

**Attack Preconditions:**
- Authenticated Citizen account required
- Target `ruleId` discoverable (exposed in the calendar UI response for any visited VPORT)
- `resourceId` also needed for INSERT path; not needed for UPDATE (only `ruleId`)
- No owner verification required anywhere in the write path

**Recommended mitigation:**

1. **Controller layer:** Add `callerActorId` to `manageVportAvailabilityRuleController` signature. Call `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: ownerActorId })` before the DAL call.

2. **Hook layer:** Forward `requestActorId` from `useVportManageAvailability.setAvailabilityRule` to the controller — it is currently destructured but silently dropped on line 15.

3. **DAL layer:** Add `resource_id` filter to the UPDATE path:
   ```js
   .eq("id", ruleId)
   .eq("resource_id", resourceId)  // add this — constrains scope to known resource
   ```

4. **RLS layer:** Verify and if necessary add an RLS UPDATE policy on `vport.availability_rules` restricting writes to resource owners (delegate to Carnage per DB-BOOK-02).

**Rationale:**  
A write path that only gates at the UI layer (string comparison) and has no controller-level ownership assertion violates defense-in-depth. The controller must be the authority for business rule enforcement — not the React component.

**Follow-up command:** Wolverine (implement ownership gate), Carnage (RLS UPDATE policy on availability_rules)

---

## VENOM SECURITY FINDING

### V-AVAIL-02 — requestActorId Silently Dropped at Hook Boundary

**Finding ID:** V-AVAIL-02  
**Location:** `apps/VCSM/src/features/dashboard/vport/hooks/useVportManageAvailability.js:15-23`  
**Application Scope:** VCSM  
**Severity:** HIGH  
**Exploitability:** HIGH (enables V-AVAIL-01)  
**Blast Radius:** Multi-actor

**CISSP Domain:**
- Primary: Software Development Security
- Secondary: Identity and Access Management

**Trust Boundary:** Authenticated Citizen

**Current behavior:**

```js
// useVportManageAvailability.js
const setAvailabilityRule = useCallback(async ({
  requestActorId,   // ← destructured from caller
  ruleId,
  resourceId,
  ...
}) => {
  return manageVportAvailabilityRuleController({
    ruleId,
    resourceId,
    // ← requestActorId never forwarded
    ...
  });
}, []);
```

`WeeklyAvailabilityGrid` correctly passes `requestActorId: viewerActorId` on every call. The hook receives it but does not forward it. This is the mechanism that breaks the ownership chain between the session identity and the controller.

**Risk:**  
The hook creates the illusion that ownership identity is being passed through the system when it is actually being discarded. A future developer reading the calling code would see `requestActorId` being passed and reasonably assume it is honored. The silent discard is an invisible security hole.

**Recommended mitigation:**  
Forward `requestActorId` through the controller call. Once V-AVAIL-01 is fixed and the controller accepts `callerActorId`, this becomes a one-line change:

```js
return manageVportAvailabilityRuleController({
  callerActorId: requestActorId,   // forward it
  ruleId,
  resourceId,
  ...
});
```

**Follow-up command:** Wolverine

---

## VENOM SECURITY FINDING

### V-AVAIL-03 — UI-Only Ownership Gate is String Comparison, Not DB-Verified

**Finding ID:** V-AVAIL-03  
**Location:** `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardCalendarScreen.jsx:26`  
**Application Scope:** VCSM  
**Severity:** MEDIUM  
**Exploitability:** MEDIUM  
**Blast Radius:** Single actor (for UI bypass) / Multi-actor (when combined with direct API calls)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering

**Trust Boundary:** Authenticated Citizen

**Current behavior:**

```js
const actorId       = useMemo(() => params?.actorId ?? null, [params]);
const viewerActorId = identity?.actorId ?? null;
const isOwner       = Boolean(actorId) && Boolean(viewerActorId) && String(viewerActorId) === String(actorId);
```

This compares the URL `actorId` param against the session actor. It does NOT verify the session actor has ownership via `actor_owners`. This is consistent with other dashboard screens but remains a structural weakness.

**Risk:**  
The `isOwner` flag is the only gate that prevents the availability management UI from rendering for non-owners. It checks URL param equality to session actorId, not whether the session actor has a verified entry in `actor_owners` for the target actor.

This does not create an immediate exploitable path (an attacker cannot set `actorId` URL param to their own session ID and then modify another VPORT's rules) — but it is not the correct ownership verification pattern per the Actor Ownership Contract. The correct pattern is `assertActorOwnsVportActorController`.

**Recommended mitigation:**  
This screen already has access to `viewerActorId` and `actorId`. If a lightweight DB-verified ownership check is added at the controller level for each write operation (V-AVAIL-01 fix), this UI gate becomes a rendering optimization only, not a security gate. Document it as such.

**Follow-up command:** Wolverine (note during V-AVAIL-01 fix implementation)

---

## ERROR SUPPRESSION FINDING

### V-AVAIL-04 — Silent Error Catch in manageVportAvailabilityRuleController

**Finding ID:** V-AVAIL-04  
**Location:** `apps/VCSM/src/features/dashboard/vport/controller/manageVportAvailabilityRule.controller.js:15-17`  
**Application Scope:** VCSM  
**Severity:** MEDIUM  
**Exploitability:** LOW (operational risk, not direct security risk)  
**Blast Radius:** Single actor (owner loses mutation failure visibility)

**CISSP Domain:**
- Primary: Security Operations
- Secondary: Software Development Security

**Current behavior:**

```js
} catch (err) {
  return { ok: false, error: err };
}
```

The caught error object `err` is returned in the response payload. If the hook or caller surfaces this to a log or debug tool, raw DB errors (including table names, constraint names, RLS policy names, or query structure) may be exposed. Additionally, RLS rejection is silently swallowed and treated as a soft failure — an attacker attempting to probe RLS boundaries receives no visible signal distinguishing an auth failure from a DB error.

**Recommended mitigation:**

1. Log the error at an operational level (actorId, operation type, error code) without raw error propagation to the client.
2. Distinguish RLS rejection (`error.code === '42501'`) from DB errors and handle separately.
3. Route to Deadpool for full error handling review of this controller.

**Follow-up command:** Deadpool

---

## SUMMARY TABLE

| Finding | Location | Severity | Exploitability | Blast Radius | CISSP Primary |
|---|---|---|---|---|---|
| V-AVAIL-01 — No controller ownership assertion | `manageVportAvailabilityRule.controller.js` | CRITICAL | HIGH | Multi-actor | IAM |
| V-AVAIL-02 — requestActorId silently dropped | `useVportManageAvailability.js:15-23` | HIGH | HIGH | Multi-actor | Software Dev Security |
| V-AVAIL-03 — UI-only string comparison gate | `VportDashboardCalendarScreen.jsx:26` | MEDIUM | MEDIUM | Single/Multi-actor | IAM |
| V-AVAIL-04 — Silent error catch + raw error return | `manageVportAvailabilityRule.controller.js:15-17` | MEDIUM | LOW | Single actor | Security Operations |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No policy-level findings in this scope |
| Asset Security | 0 | No PII overfetch in this specific path |
| Security Architecture and Engineering | 2 | V-AVAIL-01, V-AVAIL-03 — defense-in-depth failures |
| Communication and Network Security | 0 | No endpoint/route exposure findings |
| Identity and Access Management | 3 | V-AVAIL-01, V-AVAIL-02, V-AVAIL-03 — ownership verification chain broken |
| Security Assessment and Testing | 0 | Testing gaps noted in Loki/Sentry — not repeated here |
| Security Operations | 1 | V-AVAIL-04 — silent error swallow |
| Software Development Security | 2 | V-AVAIL-02, V-AVAIL-04 — hook discard + catch pattern |

**CISSP domain gaps this scope:** Security and Risk Management, Asset Security, Communication and Network Security — all out of scope for this availability write path review. Not applicable.

---

## FOLLOW-UP REQUIRED: REQUIRED BEFORE RELEASE

| Finding | Action Required | Blocking Release? | Handoff |
|---|---|---|---|
| V-AVAIL-01 | Add ownership assertion in manageVportAvailabilityRuleController | YES | Wolverine |
| V-AVAIL-02 | Forward requestActorId through useVportManageAvailability | YES (part of V-AVAIL-01 fix) | Wolverine |
| V-AVAIL-03 | Document UI gate as rendering optimization only, not security gate | NO | Wolverine (note) |
| V-AVAIL-04 | Fix error handling — distinguish RLS from DB errors, no raw error propagation | NO — operational hardening | Deadpool |

**DB-BOOK-02 dependency:** V-AVAIL-01 fix provides app-layer protection. Full security requires RLS UPDATE policy on `vport.availability_rules` (DB-BOOK-02 → Carnage). App-layer fix is P0; RLS policy is P1.

---

## FINAL VENOM STATUS: CONTRACT VIOLATION

**Reason:** Live production write path to `vport.availability_rules` has no controller-level ownership assertion (V-AVAIL-01 — CRITICAL). The hook silently drops the identity parameter that would have enabled ownership verification (V-AVAIL-02 — HIGH). The system relies entirely on a UI string comparison gate that is not backed by database-verified actor ownership.

**Combined with V-BOOK-01 (engine listBookingHistory) and S-BOOK-02 (profileId surface in useQuickBookingModal):** The booking + availability system has three separate release-blocking security findings requiring Wolverine implementation before production use.
