# CONTRACT REVIEW REPORT — Booking + Availability Write Path

**Date:** 2026-05-14  
**Reviewer:** CONTRACT REVIEWER  
**Trigger:** Final Cerebro audit pipeline step — verify booking system compliance with ARCHITECTURE.md, Engine Contract, and Actor Ownership Contract after Venom/Sentry/Loki/DB/Ironman audit wave  
**Application Scope:** VCSM + ENGINE  
**Contracts Reviewed:**
- `zcontract/ARCHITECTURE.md` — §1.3 Identity Surface Rule, §1.4 Owner Meaning Rule, §2.3 Controller Contract, §2.4 Hook Contract, §5.3 Adapter Contract, §5.4 Adapter Import Rule
- `zcontract/enginecontract.md` — Engine Controller Contract (enforce permissions, enforce membership rules)
- `zcontract/platformcontract.md` — Dependency direction, layer ownership
- `zcontract/SINGLE_SOURCE_ACTOR_ARCHITECTURE.md` — Actor single source of truth

**Files Reviewed:**

| File | Path | Lines |
|---|---|---|
| `manageVportAvailabilityRule.controller.js` | `apps/VCSM/src/features/dashboard/vport/controller/` | 18 |
| `useVportManageAvailability.js` | `apps/VCSM/src/features/dashboard/vport/hooks/` | 27 |
| `vportAvailabilityRules.write.dal.js` | `apps/VCSM/src/features/dashboard/vport/dal/write/` | 43 |
| `booking.adapter.js` | `apps/VCSM/src/features/booking/adapters/` | 17 |
| `useQuickBookingModal.js` | `apps/VCSM/src/features/dashboard/vport/hooks/` | 73 |
| `listVportServicesForProfile.controller.js` | `apps/VCSM/src/features/dashboard/vport/controller/` | 5 |
| `listBookingHistory.controller.js` (feature) | `apps/VCSM/src/features/booking/controller/` | 28 |
| `listBookingHistory.controller.js` (engine) | `engines/booking/src/controller/` | 12 |
| `VportDashboardCalendarScreen.jsx` | `apps/VCSM/src/features/dashboard/vport/screens/` | 200+ |

---

## CRITICAL VIOLATIONS: 3

## HIGH VIOLATIONS: 3

## MEDIUM VIOLATIONS: 1

## WARNINGS: 1

---

## VIOLATIONS

---

### VIOLATION — RC-01

**Rule:** Controller Contract — §2.3 of `ARCHITECTURE.md`  
**Rule Source:** `zcontract/ARCHITECTURE.md §2.3`  
**Severity:** CRITICAL

**File:** `apps/VCSM/src/features/dashboard/vport/controller/manageVportAvailabilityRule.controller.js`  
**Lines:** 1–18

**Issue:**

The controller accepts `{ ruleId, resourceId, ruleType, weekday, startTime, endTime, isActive }` with no `callerActorId` parameter. It performs no ownership verification and calls the DAL directly:

```js
export async function manageVportAvailabilityRuleController({
  ruleId,
  resourceId,
  ruleType,
  weekday,
  startTime,
  endTime,
  isActive,
}) {
  try {
    await upsertVportAvailabilityRuleDAL({ ... });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}
```

**Why This Violates The Contract:**

The Controller Contract states:

> **Controllers must:**
> - enforce actor rules
> - enforce ownership
> - enforce permissions
> - enforce idempotency
> - decide which DAL functions to call
> - decide which model to apply
> - return domain-level results only

This controller enforces no actor rules, no ownership, and no permissions. It is a structural passthrough wrapper around a write DAL. A controller with a write responsibility to `vport.availability_rules` that performs no authorization is a fundamental contract violation.

**Required Change:**

Add `callerActorId` to the parameter signature. Add `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: ownerActorId })` before the DAL call. The `ownerActorId` must be resolved from the `resourceId` or provided by the caller. The controller must throw if ownership assertion fails.

---

### VIOLATION — RC-02

**Rule:** Controller Contract — §2.3 of `ARCHITECTURE.md`  
**Rule Source:** `zcontract/ARCHITECTURE.md §2.3`  
**Severity:** CRITICAL

**File:** `apps/VCSM/src/features/dashboard/vport/controller/listVportServicesForProfile.controller.js`  
**Lines:** 1–5

**Issue:**

The controller is a 5-line passthrough with zero business logic:

```js
import { listVportServicesByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportServices.read.dal";

export async function listVportServicesForProfileController({ profileId, includeDisabled = false } = {}) {
  return listVportServicesByProfileIdDAL({ profileId, includeDisabled });
}
```

No caller verification. No ownership check. No actorId involvement. The function adds no value over calling the DAL directly.

**Why This Violates The Contract:**

The Controller Contract requires controllers to "enforce actor rules, enforce ownership, enforce permissions." A controller that is a zero-logic passthrough is not a controller — it is an anti-pattern that bypasses the authorization layer while appearing to use it. The contract also states controllers must "return domain-level results only," but this returns raw DAL output without transformation.

Additionally, §1.3 Identity Surface Rule is violated through this controller (see RC-03 below) — the `profileId` identity surface flows through this function.

**Required Change:**

Replace `profileId` lookup with an `ownerActorId`-scoped service lookup. If services are genuinely public (displayed on public VPORT pages), the controller must be explicitly documented as public and the function renamed to `listPublicVportServicesController`. If services are owner-only, add `callerActorId` and ownership assertion before the DAL call. Either way, the controller must contain actual logic.

---

### VIOLATION — RC-03

**Rule:** Engine Controller Contract — `enginecontract.md`  
**Rule Source:** `zcontract/enginecontract.md — Controller Contract`  
**Severity:** CRITICAL

**File:** `engines/booking/src/controller/listBookingHistory.controller.js`  
**Lines:** 1–12

**Issue:**

The engine controller accepts only `{ resourceId, statuses, limit, offset }` — no caller identity, no ownership assertion:

```js
export async function listBookingHistory({ resourceId, statuses = null, limit = 50, offset = 0 } = {}) {
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')
  const rows = await dalListBookingsByResource({ resourceId, statuses, limit, offset })
  return {
    bookings: mapBookingRows(rows),
    hasMore: rows.length >= limit,
  }
}
```

**Why This Violates The Contract:**

The Engine Controller Contract states:

> **Controllers must:**
> - enforce permissions
> - enforce membership rules
> - enforce idempotency
> - coordinate DAL calls
> - return domain objects

This engine controller enforces no permissions and no membership rules. It returns booking records (sensitive domain objects containing customer information) to any caller that supplies a `resourceId`. The engine contract also requires engines to be authorization-capable — "application-agnostic but not authorization-agnostic." This controller delegates authorization responsibility to the calling app, which violates the engine isolation model.

**Required Change:**

Add `callerActorId` and `ownerActorId` to the function signature. Call `assertActorOwnsVportActor` (or the engine's own `assertActorOwnsVportActor.controller.js` equivalent) before the DAL call. The engine should self-protect regardless of what the app layer does.

---

### VIOLATION — RC-04

**Rule:** Identity Surface Rule — §1.3 of `ARCHITECTURE.md`  
**Rule Source:** `zcontract/ARCHITECTURE.md §1.3`  
**Severity:** HIGH

**File:** `apps/VCSM/src/features/dashboard/vport/hooks/useQuickBookingModal.js`  
**Lines:** 6, 15, 20

**Issue:**

The hook accepts `profileId` as a parameter and uses it as a data lookup key:

```js
export function useQuickBookingModal({ profileId, resourceId } = {}) {
  // ...
  useEffect(() => {
    if (!profileId) {
      setServices([]);
      return;
    }
    listVportServicesForProfileController({ profileId })  // ← profileId used as lookup key
      .then(...)
  }, [profileId]);
}
```

**Why This Violates The Contract:**

The Identity Surface Rule states:

> The identity object returned by `useIdentity()` is actor-first only.
> It must never expose: `profileId`, `vportId`
> `identity.actorId` is the only canonical ID used by the app to scope data.

The hook accepts `profileId` as a public parameter — this is a hook surface. The rule also implies that internal feature code must not use `profileId` as a data scoping key. `actorId` is the canonical identity surface for all domain operations.

**Required Change:**

Remove `profileId` from the hook signature. Accept `ownerActorId` or derive the VPORT actor from `resourceId`. The service lookup must be keyed by `actorId`, not `profileId`.

---

### VIOLATION — RC-05

**Rule:** Adapter Contract — §5.3 of `ARCHITECTURE.md`  
**Rule Source:** `zcontract/ARCHITECTURE.md §5.3`  
**Severity:** HIGH

**File:** `apps/VCSM/src/features/booking/adapters/booking.adapter.js`  
**Line:** 7

**Issue:**

The adapter exports `useBookingHistory`:

```js
export { default as useBookingHistory } from "@/features/booking/hooks/useBookingHistory";
```

`useBookingHistory` calls the engine's `listBookingHistory` controller (via `@booking`), which has no ownership assertion (RC-03 above). Any code that imports from `booking.adapter.js` and uses `useBookingHistory` will receive booking records for any resource without ownership verification.

**Why This Violates The Contract:**

The Adapter Contract defines the adapter as the public trust boundary of a feature:

> Adapters define the trust boundary of a feature. Exporting an unsafe surface through the adapter degrades the boundary for all callers.

An adapter export must represent a safe, production-ready surface. Exporting a hook backed by an unprotected controller violates the adapter's role as the feature's public trust surface.

**Required Change:**

Remove `useBookingHistory` from `booking.adapter.js` until RC-03 is resolved and the engine controller has an ownership gate. If `useBookingHistory` is needed internally, it must be imported directly — not through the adapter.

---

### VIOLATION — RC-06

**Rule:** Hook Contract — §2.4 of `ARCHITECTURE.md`  
**Rule Source:** `zcontract/ARCHITECTURE.md §2.4`  
**Severity:** HIGH

**File:** `apps/VCSM/src/features/dashboard/vport/hooks/useVportManageAvailability.js`  
**Lines:** 5–24

**Issue:**

The hook receives `requestActorId` but silently drops it before forwarding to the controller:

```js
const setAvailabilityRule = useCallback(async ({
  requestActorId,   // ← destructured
  ruleId,
  resourceId,
  ...
}) => {
  return manageVportAvailabilityRuleController({
    ruleId,
    resourceId,
    // ← requestActorId NOT forwarded
    ...
  });
}, []);
```

**Why This Violates The Contract:**

The Hook Contract states:

> **Hooks must not:**
> - apply business rules
> - infer permissions or ownership

Silently dropping a security-relevant parameter (`requestActorId`) is a form of implicit business rule enforcement — the hook decides that ownership identity is not needed by the controller, which is an authorization inference that belongs exclusively to the controller layer. The hook is interfering with the authorization chain by suppressing an identity parameter the controller should be receiving.

**Required Change:**

Forward `requestActorId` as `callerActorId` to `manageVportAvailabilityRuleController`. Once RC-01 is fixed and the controller accepts `callerActorId`, this is a one-line addition.

---

### VIOLATION — RC-07 (MEDIUM)

**Rule:** Owner Meaning Rule — §1.4 of `ARCHITECTURE.md`  
**Rule Source:** `zcontract/ARCHITECTURE.md §1.4`  
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardCalendarScreen.jsx`  
**Line:** 26

**Issue:**

```js
const isOwner = Boolean(actorId) && Boolean(viewerActorId) && String(viewerActorId) === String(actorId);
```

Ownership is determined by a string comparison of URL param vs session actorId.

**Why This Violates The Contract:**

The Owner Meaning Rule states:

> In this system, Owner means Actor Owner. The authoritative ownership model is actor-based because all meaningful domain entities are tied to `vc.actors`. Ownership semantics must follow `actor_owners`.

A string equality check does not follow `actor_owners`. It does not query the database. It accepts any session actorId that matches the URL actorId — which is always true when a user navigates to their own dashboard. This gate does not verify that the actor has ownership entry in `actor_owners` for the target VPORT actor.

This is a rendering gate (MEDIUM severity) because the actual write authorization is the missing controller-level check (RC-01). Once RC-01 is fixed, this becomes a UI optimization. Until then, it is the only gate and it does not satisfy the Owner Meaning Rule.

**Required Change:**

Document this explicitly as a UI rendering optimization only — not a security gate. Once RC-01 is in place (controller-level ownership via `actor_owners`), this check is acceptable as an enabling condition for rendering the management UI.

---

## WARNING

### WARNING — RC-W01

**Rule:** File Naming Rule — §4.5 of `ARCHITECTURE.md`  
**File:** `apps/VCSM/src/features/dashboard/vport/dal/write/vportAvailabilityRules.write.dal.js`

**Observation:**

The file naming convention specified in the architecture contract is `<name>.dal.js`. This file uses `.write.dal.js` which is a subdomain qualifier. While this pattern is used consistently across `dal/write/` and `dal/read/` directories and is readable, it departs from the canonical single-segment DAL suffix.

This is not a violation but a pattern that the team should decide to adopt or reject formally. If adopted, it should be documented in the architecture contract as an approved variant.

**Suggested Improvement:** Formally document `.write.dal.js` / `.read.dal.js` as approved DAL naming variants in the architecture contract, or normalize all DAL filenames to use the single-segment `.dal.js` suffix.

---

## COMPLIANT ITEMS (CONFIRMED)

| Area | Status | Evidence |
|---|---|---|
| Import path rule (`@/...`) | COMPLIANT | All app files use `@/` — no relative imports in VCSM app code |
| Engine internal imports | COMPLIANT | Engine uses `'../'` relative imports within own package boundary — correct |
| File size rule (300 lines) | COMPLIANT | All reviewed files well under limit |
| DAL permission enforcement | COMPLIANT | `vportAvailabilityRules.write.dal.js` contains no auth logic — pure DB access |
| Module build order | COMPLIANT | DAL → Controller → Hook → Component chain observed throughout |
| Cross-feature boundary (dashboard/vport internal) | COMPLIANT | `useQuickBookingModal` and `manageVportAvailabilityRule` both stay within `dashboard/vport` feature |
| Dependency direction | COMPLIANT | VCSM app imports engine (`@booking`) — no reverse direction found |
| No circular dependencies | COMPLIANT | No circular import patterns detected in reviewed files |
| DAL select projection | COMPLIANT | `vportAvailabilityRules.write.dal.js` uses explicit `SELECT_COLS` constant |

---

## OVERALL STATUS: NON-COMPLIANT

**Reason:** Three CRITICAL contract violations exist across the reviewed booking and availability write paths:

1. `manageVportAvailabilityRuleController` — no ownership enforcement in a write controller (§2.3)
2. `listVportServicesForProfileController` — zero-logic passthrough with forbidden identity surface (§2.3 + §1.3)
3. `engines/booking/src/controller/listBookingHistory` — engine controller with no permission enforcement (Engine Contract)

These are not minor deviations — they are structural violations of the core controller responsibility. Two of the three affect live production write or read paths. All three must be resolved before this system meets contract compliance.

**Release gate status:** NON-COMPLIANT — RC-01, RC-03, RC-04, RC-05 are all release-blocking. RC-02 and RC-06 must be resolved as part of the RC-01 fix implementation.

---

## VIOLATION SUMMARY TABLE

| ID | File | Rule | Severity | Release Blocking? |
|---|---|---|---|---|
| RC-01 | `manageVportAvailabilityRule.controller.js` | §2.3 Controller Contract | CRITICAL | YES |
| RC-02 | `listVportServicesForProfile.controller.js` | §2.3 Controller Contract | CRITICAL | YES |
| RC-03 | `engines/.../listBookingHistory.controller.js` | Engine Controller Contract | CRITICAL | YES |
| RC-04 | `useQuickBookingModal.js` | §1.3 Identity Surface Rule | HIGH | YES |
| RC-05 | `booking.adapter.js` | §5.3 Adapter Contract | HIGH | YES |
| RC-06 | `useVportManageAvailability.js` | §2.4 Hook Contract | HIGH | YES (part of RC-01 fix) |
| RC-07 | `VportDashboardCalendarScreen.jsx:26` | §1.4 Owner Meaning Rule | MEDIUM | NO |

---

## RECOMMENDED HANDOFF

| Finding | Required Action | Handoff |
|---|---|---|
| RC-01 + RC-06 | Implement ownership gate in `manageVportAvailabilityRuleController`, forward `callerActorId` from hook | Wolverine |
| RC-02 + RC-04 | Replace `profileId` surface with `actorId`-scoped service lookup in controller and hook | Wolverine |
| RC-03 | Add `callerActorId`/`ownerActorId` + ownership assertion to engine `listBookingHistory` | Wolverine (engine scope — requires explicit cross-root approval) |
| RC-05 | Remove `useBookingHistory` from `booking.adapter.js` until RC-03 is resolved | Wolverine |
| RC-07 | Document UI gate as rendering optimization, not security gate | Logan |
