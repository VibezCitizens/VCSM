# SENTRY Compliance Report — VPORT Book Tab

**Date:** 2026-05-27
**Time:** 06:30
**Application Scope:** VCSM + ENGINE
**Review reason:** Post BOOK-001/002 resolution; secondary architectural audit before THOR gate
**Reviewer:** SENTRY
**Architecture contract:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`
**Boundary contract:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

---

## BOUNDARY COMPLIANCE STATUS

| Protected Root | In Scope | Modified | Violation | Notes |
|---|---|---|---|---|
| apps/VCSM | Yes | No (read-only review) | No | All reviewed files are within VCSM |
| apps/wentrex | No | No | No | Not in scope |
| apps/Traffic | No | No | No | Not in scope |
| engines | Yes | No (read-only review) | No | Booking engine DAL reviewed for 23505 handler pattern |

---

## FILES REVIEWED

**App-layer (booking tab):**
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportBookingView.jsx` — tab entry (thin wrapper)
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/view/VportBookingView.jsx` — owner/visitor branch
- `apps/VCSM/src/features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx` — tab container
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` — visitor hook
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js` — owner+visitor full hook
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingMutations.js` — mutation routing
- `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js` — public booking controller
- `apps/VCSM/src/features/booking/adapters/booking.adapter.js` — booking feature adapter
- `apps/VCSM/src/features/dashboard/vport/hooks/useVportBookingOps.js` — local ops hook

**Engine-layer:**
- `engines/booking/src/controller/createBooking.controller.js`
- `engines/booking/src/dal/vportBooking.write.dal.js`

---

## ARCHITECTURE ALIGNMENT STATUS

| Area | Status | Drift Level | Notes |
|---|---|---|---|
| Tab entry thin wrapper | ALIGNED | NONE | `VportBookingView` (tabs/) is a 5-line wrapper importing from `booking/view/` ✅ |
| Owner/visitor branch | ALIGNED | MINOR DRIFT | Split done in view component; creates two divergent hook paths |
| Booking adapter use | ALIGNED | NONE | `useVportBookingView` imports engine hooks via `booking.adapter` ✅ |
| Cross-feature adapter use | ALIGNED | NONE | `useVportPublicBooking` imports via `dashboard/vport/adapters/vport.adapter` ✅ |
| Controller ownership enforcement | ALIGNED | NONE | Both visitor and owner paths enforce ownership in controller layer ✅ |
| DAL layer responsibility | ALIGNED | NONE | All DALs are pure persistence — no business logic ✅ |
| Debugger hook in production | DRIFT | MODERATE DRIFT | `useActorConsistencyCheck` from `@debuggers` imported unconditionally in `useVportBookingView.js` |
| Engine isolation | ALIGNED | NONE | Engine never imports from apps ✅ |

---

## ACTOR OWNERSHIP STATUS

| Flow | Status | Risk | Notes |
|---|---|---|---|
| Visitor booking ownership (public path) | ALIGNED | LOW | `createVportPublicBookingController` forces `customer_actor_id = requestActorId` from server-side identity; kind gate enforced ✅ |
| Owner booking ownership | ALIGNED | LOW | `createOwnerBookingController` calls `assertActorOwnsVportActorController` — DB-backed ownership gate ✅ |
| Status transition ownership | ALIGNED | LOW | `updateVportBookingController` calls `assertActorOwnsVportActorController` for owner actions; customer can only cancel own booking ✅ |
| `isOwner` in `useVportBookingMutations` | ALIGNED | NONE | Advisory/routing flag only; backed by controller-level enforcement. Mutation guard `if (isOwner && !viewerActorId) return` prevents uncredentialed owner writes. ✅ |

---

## IDENTITY SURFACE STATUS

| Surface | Status | Risk | Notes |
|---|---|---|---|
| `customer_actor_id` in booking insert | ALIGNED | NONE | Forced from `requestActorId` (server identity) — VPD-V-019 ✅ |
| Notification `linkPath` | ALIGNED | NONE | Set to `null` — VPD-V-020 prevents raw VPORT UUID in notification rows ✅ |
| `profile_id` in insert payload | ALIGNED | NONE | Resolved from DB resource row, not from caller input ✅ |
| Engine: `customerActorId` pin on public path | ALIGNED | NONE | ELEK-003 enforced: `customerActorId` is overwritten to `requestActorId` on citizen path ✅ |

---

## ENGINE ISOLATION STATUS

| Engine Area | Status | Drift | Notes |
|---|---|---|---|
| Booking engine → apps dependency | ALIGNED | NONE | No app imports in engine ✅ |
| App → engine via adapter | ALIGNED | NONE | `booking.adapter.js` is the approved cross-feature boundary ✅ |
| Engine 23505 handler | ALIGNED | NONE | DAL-level translation — correct layer for DB error handling ✅ |

---

## NATIVE PARITY STATUS

Not in scope for this audit cycle.

---

## SENTRY FINDINGS

---

### SENTRY FINDING

**Finding ID:** SF-BOOK-001
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js` line 34
**Drift Level:** NONE (RESOLVED — production stub confirmed)
**Severity:** INFO
**Contract Violated:** None

**Current behavior:**
```js
import { useActorConsistencyCheck } from "@debuggers/identity/useActorConsistencyCheck";
```
This import is unconditional and at the module top level. `@debuggers` resolves to a dev-only diagnostics directory. This hook is called on line 42: `useActorConsistencyCheck('booking', viewerActorId, identity?.kind)`.

**Expected behavior:**
Debugger tooling must never be imported unconditionally in production-shipped code. The contract requires:
- Debuggers are dev-only
- Debuggers must render on screen (no `console.log`) and be in `zNOTFORPRODUCTION/debuggers/`
- Debuggers must never ship to production

The `@debuggers` path alias likely resolves to `zNOTFORPRODUCTION/debuggers/` — which is explicitly listed as a directory that **must NEVER ship to production** (CLAUDE.md production safety rules).

**RESOLVED (2026-05-27 — Vite config inspection):**

`vite.config.js` lines 49–52 confirm the `@debuggers` alias is mode-gated:
```js
{
  find: '@debuggers',
  replacement: mode === 'production'
    ? fileURLToPath(new URL('./src/debuggers-stub', import.meta.url))
    : fileURLToPath(new URL('../../zNOTFORPRODUCTION/_ACTIVE/debuggers', import.meta.url)),
}
```

In production builds, `@debuggers/identity/useActorConsistencyCheck` resolves to `src/debuggers-stub/identity/useActorConsistencyCheck.js`:
```js
// Production stub — no-op hook
export function useActorConsistencyCheck() {}
```

The stub is a pure no-op with no side effects. The production bundle correctly replaces all debugger imports with the stub. This is a well-designed debugger isolation pattern — unconditional imports are safe because the Vite alias swap handles environment gating at bundle time.

**Risk:** NONE — production bundle stubs all debugger hooks.

**Recommended correction:** None required. Pattern is correct. Document in Logan doc as an approved production-safe debug import pattern.

---

### SENTRY FINDING

**Finding ID:** SF-BOOK-002
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/view/VportBookingView.jsx` line 25
**Drift Level:** MINOR DRIFT
**Severity:** LOW
**Contract Violated:** None directly — informational

**Current behavior:**
```jsx
export default function VportBookingView({ profile, isOwner = false }) {
  if (!isOwner) return <VportPublicBookingFlow profile={profile} />;
  return <VportOwnerBookingView profile={profile} />;
}
```

The `book` tab has two structurally distinct rendering + data paths:
- **Visitor** (`!isOwner`): `VportPublicBookingFlow → useVportPublicBooking` — 14-day strip, simplified wizard, uses dashboard-local controller via `useVportBookingOps`
- **Owner** (`isOwner`): `VportOwnerBookingView → useVportBookingView` — full calendar grid, availability management, uses engine hooks via `booking.adapter`

**Expected behavior:**
Owner/visitor presentation splits are acceptable. The concern is that the two paths diverge significantly:
1. Different hooks (`useVportPublicBooking` vs `useVportBookingView`)
2. Different data sources (dashboard controller vs engine hooks)
3. Different availability window strategies (2-month visitor vs 1-month owner)
4. Different mutation patterns (`useVportBookingMutations` vs `createVportPublicBookingController` direct)

A future regression in one path may not surface as a regression in the other.

**Risk:** LOW — intentional design; the visitor simplicity vs owner complexity distinction is valid. MINOR DRIFT because the two paths could diverge further over time without explicit governance.

**Recommended correction:** Document the dual-path design explicitly in Logan doc (in progress). Consider a shared booking state model or merge point in a future refactor if paths continue to diverge. No immediate action required.

---

### SENTRY FINDING

**Finding ID:** SF-BOOK-003
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx` lines 9, 68–73
**Drift Level:** NONE
**Severity:** INFO

**Current behavior:**
```jsx
import VportBookingView from "@/features/profiles/kinds/vport/screens/views/tabs/VportBookingView";
...
{tab === "book" && vportType === "barbershop" && (
  <VportBarberShopBookingView profile={profile} isOwner={isOwner} />
)}
{tab === "book" && vportType !== "barbershop" && (
  <VportBookingView profile={profile} isOwner={isOwner} />
)}
```

**Observation:**
- `VportBookingView` is imported from the `views/tabs/` thin wrapper — correct adapter use ✅
- `VportBarberShopBookingView` is imported directly from `barbershop/` — DTAB-006 (confirmed MODERATE DRIFT, P2 deferred)
- The barbershop booking branch is a type-conditional split at the tab container level — intentional design for barbershop-specific team booking flow

**Risk:** NONE additional beyond DTAB-006 already documented. The `VportBookingView` import path is correct. The barbershop conditional is an intentional type override.

---

## FINAL SENTRY STATUS: **MINOR DRIFT**

**Primary concern:** SF-BOOK-001 — debugger import in production hook. MEDIUM severity. Requires investigation of whether `@debuggers` is excluded from the production Vite bundle before deciding remediation level.

**Secondary:** SF-BOOK-002 — dual hook path design. LOW severity. Document, no immediate action.

**Release gate:** CAUTION — SF-BOOK-001 must be verified (bundle exclusion confirmed OR debugger removed/guarded) before THOR can declare RELEASE APPROVED. All ownership, identity surface, and engine isolation checks passed.

---

## FOLLOW-UP REQUIRED: **REQUIRED BEFORE RELEASE**

1. Verify whether `@debuggers` alias is excluded from Vite production bundle config.
   - If excluded → downgrade SF-BOOK-001 to LOW, document the exclusion in Logan, no code change needed.
   - If NOT excluded → remove or guard the import with `import.meta.env.DEV`.
2. Update Logan doc with dual-path design note (SF-BOOK-002).
