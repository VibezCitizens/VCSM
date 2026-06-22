# SENTRY — Dashboard DAL Layer & Boundary Violations
**Run date:** 2026-05-18  
**Branch:** `vport-booking-feed-security-updates`  
**Triggered by:** CEREBRO orchestration run on `vcsm.dal.dashboard.md`  
**Scope:** `apps/VCSM/src/features/dashboard/` — all new and modified files since 2026-05-14 VERIFIED status  
**Authority:** GOVERNANCE_WRITABLE  

---

## Files Reviewed

- `checkVportOwnership.controller.js` — modified since last audit
- `BarberPickerModal.jsx` — new since last audit
- `ConfirmRemoveModal.jsx` — new since last audit
- `VportDashboardBookingHistoryView.jsx` — new since last audit
- `vportTeam.controller.js` — modified since last audit
- `vportTeamAccess.controller.js` — modified since last audit

---

## SENTRY-2026-01 — BLOCKING: Cross-Feature DAL Import in Dashboard Controller

**File:** `features/dashboard/vport/controller/checkVportOwnership.controller.js`  
**Line:** 2  
**Import:** `import getActorByIdDAL from "@/features/booking/dal/getActorById.dal";`

**Violation:**  
A dashboard controller directly imports a DAL file from the `booking` feature's internal `dal/` directory. This bypasses the adapter boundary. The architecture contract is explicit:

> "Cross-feature access: One feature must never import directly from another feature's internals. All cross-feature access must go through adapters only."

**Evidence — adapter boundary is available:**  
`features/booking/adapters/booking.adapter.js` already exports `assertActorOwnsVportActorController` with an approved §5.3 exception comment. The `getActorByIdDAL` is NOT exported through the adapter.

**Why this is blocking:**  
- `getActorByIdDAL` is a raw DB call with no ownership check — its internals can change independently of the dashboard feature's assumed interface
- If the booking feature refactors its `dal/` structure, this import silently breaks with no adapter contract to catch it
- Creates a hidden dependency on `booking` feature internals from `dashboard` feature source

**Required fix:**  
Either:
1. Add `getActorByIdDAL` (or a wrapper) to `booking.adapter.js` with an approved §5.3 comment and import from there, OR
2. Create a small `resolveActorKind(actorId)` helper inside the booking adapter that the controller can call
3. Do NOT expose raw `getActorByIdDAL` through the adapter — wrap it

**Classification:** **BLOCKING — architecture contract violation**  
**Owner:** IRONMAN (feature ownership) + VENOM (trust boundary review of actor kind check)

---

## SENTRY-2026-02 — MEDIUM: Hooks in Component Layer (`BarberPickerModal.jsx`)

**File:** `features/dashboard/vport/screens/components/team/BarberPickerModal.jsx`  
**Hooks used:** `useState` (×4), `useEffect` (×1)

**Violation:**  
Components must be presentational only — no hooks, no data fetching, no side effects. `BarberPickerModal.jsx` manages its own data-fetch lifecycle (`findEligibleBarbers()` is called in a `useEffect`), maintains loading/error/barber state, and performs local filtering.

**Contract rule:**  
> "Components | Presentational only | No hooks, no data fetching, no side effects"

**Assessment:**  
The `findEligibleBarbers` function is passed as a prop (not directly imported), so it does not import cross-feature dependencies. However, the component manages state and side effects that should live in a hook (`useBarberPicker.js` or similar) that the parent View Screen owns.

**Note:** The `useEffect` call uses the anti-pattern of calling an async function passed as a prop with no cleanup for the prop reference change — this could cause stale closure issues if the parent re-renders.

**Required fix:**  
- Extract state + effect into `useBarberPicker.js` hook in the `hooks/` directory
- `BarberPickerModal.jsx` receives fully-resolved `barbers`, `loading`, `loadError`, `search`, `selected` as props and handles only render

**Classification:** MEDIUM — layer violation, not immediately blocking if no new callers added  
**Owner:** IRONMAN (confirm fix plan)

---

## SENTRY-2026-03 — MEDIUM: Hook in Component Layer (`ConfirmRemoveModal.jsx`)

**File:** `features/dashboard/vport/screens/components/team/ConfirmRemoveModal.jsx`  
**Line:** 2–5  
**Hook used:** `useActorSummary` from `@hydration`

**Violation:**  
Same contract breach as above. `ConfirmRemoveModal.jsx` calls `useActorSummary(member?.actor_id)` — a hook — to resolve the display name of the actor being removed. Components may not call hooks.

**Required fix:**  
The parent View Screen or hook layer should resolve the actor display name and pass it as a plain `displayName` string prop to the modal component.

**Classification:** MEDIUM — layer violation  
**Owner:** IRONMAN (confirm fix plan)

---

## SENTRY-2026-04 — MEDIUM: Business Logic in View Screen (`VportDashboardBookingHistoryView.jsx`)

**File:** `features/dashboard/vport/screens/VportDashboardBookingHistoryView.jsx`  
**Lines:** ~17–46  
**Functions:** `filterBookings(bookings, tab)`, `groupByDate(bookings)`

**Violation:**  
View Screens perform "Hooks + component composition — no business logic." `filterBookings` and `groupByDate` are pure data transforms (domain logic) defined inline in the View Screen file. These belong in a model file.

**Contract rule:**  
> "Model | Domain shape translation, pure transforms | No side effects, no DB access"

**Required fix:**  
Move `filterBookings` and `groupByDate` to a new model file:  
`features/dashboard/vport/screens/model/vportBookingHistoryView.model.js`  
Import and call from the View Screen.

**Classification:** MEDIUM — layer violation; logic is correct but misplaced  
**Owner:** IRONMAN (confirm fix scope)

---

## SENTRY-2026-05 — COMPLIANT (Noted): `vportTeamAccess.controller.js` Cross-Feature Search

**File:** `features/dashboard/vport/controller/vportTeamAccess.controller.js`  
**Import:** `searchActorsAdapter` from `@/features/actors/adapters/actors.adapter`

**Assessment:** Cross-feature access is routed through the `actors` adapter boundary — COMPLIANT with architecture contract.  
**Classification:** PASS — no action required

---

## SENTRY-2026-06 — COMPLIANT (Noted): `VportDashboardBookingHistoryView` Cross-Feature Hooks

**File:** `features/dashboard/vport/screens/VportDashboardBookingHistoryView.jsx`  
**Imports:** `useOwnerBookingResources`, `useBookingHistory` from `@/features/booking/adapters/booking.adapter`

**Assessment:** Both hooks imported via the booking adapter boundary — COMPLIANT.  
**Classification:** PASS — no action required

---

## Summary Table

| Finding | File | Severity | Status |
|---|---|---|---|
| SENTRY-2026-01 | `checkVportOwnership.controller.js` — direct booking DAL import | **BLOCKING** | OPEN |
| SENTRY-2026-02 | `BarberPickerModal.jsx` — hooks in component | MEDIUM | OPEN |
| SENTRY-2026-03 | `ConfirmRemoveModal.jsx` — hook in component | MEDIUM | OPEN |
| SENTRY-2026-04 | `VportDashboardBookingHistoryView.jsx` — business logic in View Screen | MEDIUM | OPEN |
| SENTRY-2026-05 | `vportTeamAccess.controller.js` — cross-feature via adapter | COMPLIANT | CLOSED |
| SENTRY-2026-06 | `VportDashboardBookingHistoryView.jsx` — booking hooks via adapter | COMPLIANT | CLOSED |

**Blocking:** 1  
**Medium open:** 3  
**SENTRY Verdict:** PARTIAL — SENTRY-2026-01 is a live architecture boundary violation. Must be fixed before any new callers are added to `checkVportOwnership.controller.js`.
