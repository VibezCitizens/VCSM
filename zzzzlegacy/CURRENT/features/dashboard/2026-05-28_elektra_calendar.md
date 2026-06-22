# ELEKTRA Security Scan — Calendar Module
**Date:** 2026-05-28
**Scanner:** ELEKTRA
**Scope:** apps/VCSM — VportDashboardCalendarScreen + availability hooks + WeeklyAvailabilityGrid
**Finding range:** ELEK-2026-05-28-068 to ELEK-2026-05-28-071
**Status:** COMPLETE

---

## Scope

Files scanned:

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/VportDashboardCalendarScreen.jsx`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/index.js`
- `apps/VCSM/src/features/booking/hooks/useBookingAvailability.js`
- `apps/VCSM/src/features/booking/hooks/useManageAvailability.js`
- `apps/VCSM/src/features/dashboard/vport/components/calendar/WeeklyAvailabilityGrid.jsx`

---

## Executive Summary

The calendar screen implements a two-layer defense: (1) `useVportOwnership` hook gate with early return (`if (!isOwner) return ...`) prevents any content from rendering for non-owners, and (2) availability read/write hooks are conditioned on `isOwner === true` via the `enabled` flag. The `WeeklyAvailabilityGrid` passes `viewerActorId` (sourced from `useIdentity()`) directly to `manageAvailability.setAvailabilityRule` as `requestActorId`, which routes through the engine-level `assertActorCanManageResource` controller.

**BW-CAL-003 confirmation:** `identity?.vportType` is used to derive `isBarbershop` / `isLocksmith` for feed publisher routing. This is a non-canonical identity surface — confirmed stale risk after actor switch. ELEK confirms this as a MEDIUM finding.

**VENOM-CAL-003 follow-up (blocks shape):** ELEKTRA traced `WeeklyAvailabilityGrid.onSaveSuccess` — the `blocks` array contains objects with `{id, weekday, startMinutes, endMinutes}`. These fields are internal UI block state (no resource_id, no actor_id, no PII). The feed publisher callback receives these objects but constructs the post content from `weekday`/`startMinutes`/`endMinutes` only. No sensitive internal data is present in the `blocks` payload. VENOM-CAL-003 is resolved.

**Result:** 0 HIGH, 2 MEDIUM, 1 LOW, 0 INFO

---

## Findings

---

### ELEK-2026-05-28-068 — `identity?.vportType` Non-Canonical Identity Surface Routes Feed Publisher (BW-CAL-003 / VENOM-CAL-002 Confirmation)
**Severity:** MEDIUM
**Status:** OPEN — confirmed

**Source:**
`apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/VportDashboardCalendarScreen.jsx` lines 63–66

```js
const isBarbershop = ["barbershop", "barber"].includes(
  String(identity?.vportType ?? "").toLowerCase()
);
const isLocksmith = String(identity?.vportType ?? "").toLowerCase() === "locksmith";
```

**Sink:**
`handleSaveSuccess` callback — lines 71–86 — routes to `publishBarbershopHoursPost` or `publishLocksmithHoursPost` based on the stale `isBarbershop`/`isLocksmith` values.

**Chain:**
```
useIdentity() → identity?.vportType → isBarbershop / isLocksmith
  → handleSaveSuccess({ blocks })
      → if (isBarbershop) publishBarbershopHoursPost({ blocks })
      → else if (isLocksmith) publishLocksmithHoursPost({ blocks })
```

**Description:**
`identity?.vportType` is not part of the canonical identity contract (`actorId` + `kind`). If the user switches actors (e.g., from a barbershop VPORT to a locksmith VPORT), `vportType` in the stale identity context may still reflect the previous VPORT's type. When the user saves hours on the new VPORT, the wrong feed publisher fires — posting barbershop-formatted hours to a locksmith VPORT's feed, or vice versa.

The publisher functions themselves call domain-specific controllers that assert `requestActorId` ownership before posting, so no cross-account post injection occurs. The risk is wrong-publisher routing, not unauthorized posting.

**CISSP Domain:** Identity and Access Management

**Proposed patch (text only — do not apply):**
Replace `identity?.vportType` with a VPORT-specific kind lookup. Fetch the actor record for `actorId` (from `useParams`) and use the canonical `kind` field to drive `isBarbershop`/`isLocksmith`. The lookup should be scoped to the target `actorId`, not the global identity context, ensuring it reflects the correct VPORT type regardless of identity state.

---

### ELEK-2026-05-28-069 — `useVportOwnership` Is UI Convenience Only — Screen Gate Is Single Defense Layer
**Severity:** MEDIUM (architecture compliance; matches BW-CAL-002 / VENOM-CAL-001)
**Status:** OPEN — confirmed; SENTRY assigned

**Source:**
`apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/VportDashboardCalendarScreen.jsx` line 108

```jsx
if (!isOwner)  return <div className="p-10 text-center text-white/50">You can only manage your own calendar.</div>;
```

**Chain:**
```
VportDashboardCalendarScreen
  → useVportOwnership(viewerActorId, actorId)   // UI convenience state (hook docblock: "NOT the security boundary")
  → early return if !isOwner                     // screen gate — UI layer
  → WeeklyAvailabilityGrid → manageAvailability.setAvailabilityRule({ requestActorId: viewerActorId, ... })
      → assertActorCanManageResource             // controller gate — security layer
```

**Description:**
The `useVportOwnership` hook's own docblock states: `isOwner is a UI convenience state only. It is NOT the security boundary.` The screen uses `!isOwner` as the primary gate before rendering any content or mounting availability hooks. This is a UI-level gate backed by `checkVportOwnershipController`.

The architecture contract requires Final Screen (identity + ownership) + View Screen (hooks + composition). The current design combines both in one 214-line file. An actor with an invalid `isOwner: true` state (e.g., from a race condition, cached value, or future bug in `checkVportOwnershipController`) would be permitted to render and mount hooks — the write path is then protected by `assertActorCanManageResource` at the controller level.

The multi-layer defense structure means no current exploit path exists, but the lack of screen split creates future regression risk.

**CISSP Domain:** Security Architecture and Engineering

**Proposed patch (text only — do not apply):**
Split into `VportCalendarFinalScreen` (handles `useVportOwnership`, early returns for non-owners) and `VportCalendarViewScreen` (mounts availability hooks, renders `WeeklyAvailabilityGrid`). This matches the architecture contract and eliminates the single-point-of-failure risk.

---

### ELEK-2026-05-28-070 — `viewerActorId` Passed as `requestActorId` to `ensureOwnerResource` Without Additional Screen Guard
**Severity:** LOW (VENOM-CAL-004 resolution)
**Status:** RESOLVED — controller path confirmed

**Source:**
`apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/VportDashboardCalendarScreen.jsx` lines 94–103

```js
useEffect(() => {
  if (!isOwner || !actorId || !viewerActorId) return;
  // ...
  const res = await ensureOwnerResource({ requestActorId: viewerActorId, ownerActorId: actorId, timezone: tz });
}, [isOwner, actorId, viewerActorId, ...]);
```

**ELEKTRA Trace:**
The `ensureOwnerResource` call is guarded by `!isOwner` (screen gate) and `!viewerActorId` (null check). The call passes `requestActorId: viewerActorId` and `ownerActorId: actorId` to the booking adapter. Tracing through the engine, `ensureOwnerResource` resolves to a controller that checks `assertActorOwnsVportActor` before performing any INSERT. Two enforcement layers exist: screen gate + controller gate.

**Assessment:** VENOM-CAL-004 is RESOLVED. The controller path does gate on `actor_owners` before resource creation.

**CISSP Domain:** Identity and Access Management

---

### ELEK-2026-05-28-071 — `blocks` Payload From `WeeklyAvailabilityGrid.onSaveSuccess` — Shape Verified Safe
**Severity:** INFO (VENOM-CAL-003 resolution)
**Status:** RESOLVED

**Source:**
`apps/VCSM/src/features/dashboard/vport/components/calendar/WeeklyAvailabilityGrid.jsx` line 134

```js
onSaveSuccess?.({ blocks: [...blocks] });
```

**ELEKTRA Trace:**
The `blocks` array contains objects with shape `{ id: uid(), weekday: Number, startMinutes: Number, endMinutes: Number }`. The `uid()` function generates local ephemeral IDs for UI state — not database row IDs. No `resource_id`, `owner_actor_id`, `actor_id`, or PII fields are present in the block objects.

The caller `handleSaveSuccess` in `VportDashboardCalendarScreen.jsx` passes `blocks` to `publishBarbershopHoursPost`/`publishLocksmithHoursPost`. The publisher functions construct post content from the block time data only. No sensitive internal state is published.

**Assessment:** VENOM-CAL-003 is RESOLVED. The `blocks` payload is safe — UI-only time data, no internal IDs or PII.

---

## BW / VENOM Finding Resolution Table

| Finding ID | Description | ELEKTRA Assessment | Status |
|---|---|---|---|
| BW-CAL-002 (no Final Screen) | Architecture: no screen split | Confirmed → ELEK-2026-05-28-069 (MEDIUM) | OPEN |
| BW-CAL-003 (vportType stale) | `identity?.vportType` non-canonical | Confirmed → ELEK-2026-05-28-068 (MEDIUM) | OPEN |
| VENOM-CAL-001 (no Final/View Screen split) | Same as BW-CAL-002 | Confirmed → ELEK-2026-05-28-069 | OPEN |
| VENOM-CAL-002 (identity?.vportType) | Same as BW-CAL-003 | Confirmed → ELEK-2026-05-28-068 | OPEN |
| VENOM-CAL-003 (blocks shape) | blocks payload verified safe | RESOLVED — no PII, no internal IDs | RESOLVED |
| VENOM-CAL-004 (ensureOwnerResource untraced) | Controller path untraced | RESOLVED — assertActorOwnsVportActor confirmed in path | RESOLVED |

---

## Summary Table

| ID | Severity | Status | Description |
|---|---|---|---|
| ELEK-2026-05-28-068 | MEDIUM | OPEN | `identity?.vportType` stale — wrong feed publisher may fire after actor switch |
| ELEK-2026-05-28-069 | MEDIUM | OPEN | No screen split — single combined screen, `isOwner` UI gate only layer before hooks |
| ELEK-2026-05-28-070 | LOW | RESOLVED | `ensureOwnerResource` controller path confirmed gated via `assertActorOwnsVportActor` |
| ELEK-2026-05-28-071 | INFO | RESOLVED | `blocks` payload verified safe — no PII or internal IDs in feed publisher input |
