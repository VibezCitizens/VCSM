# IRONMAN — Dashboard Team + Booking History Ownership Record
**Run date:** 2026-05-18  
**Branch:** `vport-booking-feed-security-updates`  
**Triggered by:** CEREBRO orchestration — SENTRY findings SENTRY-2026-01 through -04  
**Authority:** GOVERNANCE_WRITABLE  

---

## IRONMAN TARGET

```text
IRONMAN TARGET
Feature / Engine:   VCSM Dashboard — Team subsystem + Booking History subsystem
Application Scope:  VCSM
Reason:             Post-SENTRY finding — 1 blocking boundary violation + 3 medium layer
                    violations in newly added files; booking history migrated to booking
                    engine since last ownership review; fix plan confirmation required
```

---

## 1. Purpose

The dashboard feature owns the VPORT owner's management surface: team membership, booking history + scheduling, availability, portfolio, leads, settings, and design studio. It is the primary operator dashboard for Vport actors.

Since 2026-05-14, two responsibilities have been migrated to the booking engine:
- **Booking history listing** — now owned by `engines/booking` via `useBookingHistory`
- **Availability write path** — now owned by `engines/booking` via `useManageAvailability`

The dashboard feature retains ownership of the team management surface, which has grown significantly with new controllers, components, and cross-feature dependencies.

---

## 2. Application Scope

**VCSM**  
Primary root: `apps/VCSM/src/features/dashboard/`  
Cross-feature dependency: `apps/VCSM/src/features/booking/` (via adapter only — see SENTRY-2026-01 finding below)

---

## 3. Code Roots

```text
CODE ROOTS
Primary path:  apps/VCSM/src/features/dashboard/
Team subpath:  apps/VCSM/src/features/dashboard/vport/
Entry files:   vport/screens/VportDashboardTeamScreen.jsx
               vport/screens/VportDashboardBookingHistoryScreen.jsx
               vport/screens/VportDashboardBookingHistoryView.jsx (new)
```

---

## 4. Layer Map (Team + Booking History — post-migration)

```text
LAYER MAP

DAL (team):
  vportTeam.read.dal.js    — reads resources table (staff list) — owns profile-based team reads
  vportTeam.write.dal.js   — writes resources table (insert/update/delete staff) — owns writes
  vportTeamInvite.read.dal.js   — reads invite/request rows in resources
  vportTeamInvite.write.dal.js  — writes invite/request state in resources

DAL (availability read):
  vportAvailabilityRules.read.dal.js — batch-capable since 2026-05-18 delta
  [DELETED: vportAvailabilityRules.write.dal.js — migrated to booking engine]

DAL (booking history):
  [DELETED: vportBookingHistory.read.dal.js — migrated to booking engine]

Model (team — none currently):
  MISSING — team list filtering/shape logic lives directly in hook (useVportTeamAccess normalizeRow)
  MISSING — no dedicated team model file

Model (booking history — new):
  vport/screens/model/vportBookingHistoryView.model.js — REQUIRED (see SENTRY-2026-04 fix plan)

Controller (team):
  vportTeam.controller.js      — barber/invite flow (findEligibleBarbers, sendTeamRequest, removeTeamMember)
  vportTeamAccess.controller.js — full team CRUD + role/status mgmt + searchTeamCandidates (new)
  vportTeamInvite.controller.js — invite accept/decline from barber side
  [DELETED: manageVportAvailabilityRule.controller.js — migrated]
  [DELETED: listVportBookingHistory.controller.js — migrated]

Hook (team):
  useVportTeam.js             — barber-shop style team read + invite-send ops
  useVportTeamAccess.js       — full team CRUD (new implementation, richer)
  useBarberTeamRequests.js    — barber-side: view/accept/decline incoming requests

Hook (booking history):
  [no longer owns — delegates to booking.adapter useBookingHistory + useOwnerBookingResources]

Adapter:
  vport.adapter.js            — cross-feature boundary for profiles feature
  [consumed]: booking.adapter.js — useOwnerBookingResources, useBookingHistory (cross-feature)
  [consumed]: actors.adapter.js  — searchActorsAdapter for team candidate search (cross-feature)

Component:
  BarberPickerModal.jsx       — DEAD (zero callers, hooks in component — DELETE CANDIDATE)
  ConfirmRemoveModal.jsx      — LAYER VIOLATION: calls useActorSummary hook (fix: use member.name)
  TeamMemberCard.jsx          — (not inspected; assumed presentational)
  AddTeamMemberSheet.jsx      — contains CandidateRow sub-component calling useActorSummary

View Screen:
  VportDashboardBookingHistoryView.jsx — new; contains inline business logic (filterBookings, groupByDate)

Final Screen:
  VportDashboardTeamScreen.jsx     — route entry + identity gate + rendering ✓
  VportDashboardBookingHistoryScreen.jsx — route entry + identity gate + delegates to View Screen ✓
```

---

## 5. Dependency Ownership

```text
DEPENDENCY OWNERSHIP

Engines used:
  @hydration       — actor hydration (hydrateActorsByIds, useActorSummary)
  @booking         — listBookingHistory controller (via booking.adapter.js)

Shared modules:
  booking.adapter.js    — approved cross-feature boundary for booking hooks + assertActorOwnsVportActorController
  actors.adapter.js     — approved cross-feature boundary for actor search
  identity.adapter.js   — viewer identity resolution

External services:
  Supabase (vportSchema + vc schema for actor reads)
```

---

## 6. Database / Schema Ownership

| Table | Primary Owner | Read Consumers | Write Owner | Notes |
|---|---|---|---|---|
| `resources` | Dashboard (team) | team controllers, invite controllers | dashboard team write DAL | Both profile-based and actor-based lookups |
| `availability_rules` | Booking Engine | loadDaySchedule.controller | Booking Engine (upsert via engine) | Write DAL deleted from dashboard — engine owns |
| `bookings` | Booking Engine | Booking Engine | Booking Engine | Dashboard no longer reads/writes directly |
| `actor_follows` | Social Engine | vportTeam.read.dal (findEligibleBarberActorIdsDAL) | Social Engine | Dashboard only reads for eligibility check |
| `actors` | Identity System | checkVportOwnership.controller, vportTeamAccess | Identity System | Dashboard reads kind + is_void for self-ownership check |
| `actor_owners` | Identity System | designStudio controllers, actorOwners.read.dal | Identity System | Dashboard reads for ownership gate |

---

## 7. Rule Ownership

| Rule | Owner | Enforcement Layer | Risk |
|---|---|---|---|
| Actor owns VPORT (team mutation gate) | Booking feature / assertActorOwnsVportActorController | Controller | HIGH — gate used across all team mutations |
| Cannot remove last active owner | Dashboard team | vportTeamAccess.controller.js (assertOwnerRemains) | HIGH — local enforcement, no DB-level constraint |
| Cannot deactivate self | Dashboard team | vportTeamAccess.controller.js | MEDIUM |
| Cannot add duplicate team member | Dashboard team | vportTeamAccess.controller.js (alreadyMember check) | MEDIUM |
| Self-ownership shortcut (callerActorId === targetActorId → check kind) | Dashboard team | checkVportOwnership.controller.js | MEDIUM — cross-feature DAL violation here (SENTRY-2026-01) |

---

## 8. Ownership Findings

### IRONMAN-FINDING-01 — BLOCKING

```text
IRONMAN OWNERSHIP FINDING
Finding ID:             IRONMAN-FINDING-01
Feature / Engine:       dashboard/vport → booking/dal
Application Scope:      VCSM
Responsibility Type:    DAL ownership / Cross-root boundary
Ownership Clarity:      CONFLICTED
Boundary Risk:          CRITICAL
Severity:               BLOCKING

Current ambiguity:
  checkVportOwnership.controller.js (dashboard feature) directly imports
  getActorByIdDAL from @/features/booking/dal/getActorById.dal. This creates
  a hidden hard dependency from the dashboard feature's controller layer into
  the booking feature's DAL layer, bypassing the approved booking.adapter.js
  boundary.

Risk:
  The booking feature's DAL is an internal implementation detail. If the
  booking feature refactors getActorByIdDAL (signature, location, schema
  changes), the dashboard controller breaks silently with no adapter contract
  to catch the drift.

Recommended ownership clarification:
  getActorByIdDAL is owned by the booking feature. The dashboard feature
  must only access it through booking.adapter.js. Add an approved §5.3
  exception export to booking.adapter.js for this specific use case.

Fix plan:
  1. Add to booking.adapter.js:
       // Approved §5.3 exception: actor kind/void check for self-ownership shortcut
       //   in checkVportOwnership — 1 call site, dashboard controller only.
       export { default as getActorByIdDAL } from "@/features/booking/dal/getActorById.dal";
  2. In checkVportOwnership.controller.js, change import source from
     @/features/booking/dal/getActorById.dal → @/features/booking/adapters/booking.adapter

Recommended handoff: SENTRY re-verify after fix
```

---

### IRONMAN-FINDING-02 — MEDIUM

```text
IRONMAN OWNERSHIP FINDING
Finding ID:             IRONMAN-FINDING-02
Feature / Engine:       dashboard/vport — component layer
Application Scope:      VCSM
Responsibility Type:    Layer ownership
Ownership Clarity:      CONFLICTED
Boundary Risk:          MEDIUM
Severity:               MEDIUM

Current ambiguity:
  BarberPickerModal.jsx lives in the component layer but:
  (a) Has zero callers — it is dead code
  (b) Uses useState ×4 and useEffect ×1 — hooks in a component
  The AddTeamMemberSheet already handles the candidate-search UX.
  BarberPickerModal appears to be an abandoned parallel implementation.

Recommended ownership clarification:
  DELETE BarberPickerModal.jsx — it is dead code with a layer violation.
  If barber-specific picker UI is needed in future, create a proper
  presentational component + useBarberPicker.js hook.

Recommended handoff: SENTRY re-verify (confirm deletion)
```

---

### IRONMAN-FINDING-03 — MEDIUM

```text
IRONMAN OWNERSHIP FINDING
Finding ID:             IRONMAN-FINDING-03
Feature / Engine:       dashboard/vport — component layer
Application Scope:      VCSM
Responsibility Type:    Layer ownership
Ownership Clarity:      PARTIAL
Boundary Risk:          MEDIUM
Severity:               MEDIUM

Current ambiguity:
  ConfirmRemoveModal.jsx calls useActorSummary(member?.actor_id) to resolve
  the display name of the member being removed. useActorSummary is a hook.
  Components must not call hooks.

  However: the member object passed by VportDashboardTeamScreen already
  carries member.name (populated by normalizeRow in useVportTeamAccess).
  The hook call is unnecessary — the data is already available as a prop.

Fix plan:
  Remove useActorSummary import and call. Replace with:
    const displayName = member?.name || "this member";
  No parent change needed — member.name is already present.

Recommended handoff: SENTRY re-verify after fix
```

---

### IRONMAN-FINDING-04 — MEDIUM

```text
IRONMAN OWNERSHIP FINDING
Finding ID:             IRONMAN-FINDING-04
Feature / Engine:       dashboard/vport — View Screen
Application Scope:      VCSM
Responsibility Type:    Layer ownership
Ownership Clarity:      PARTIAL
Boundary Risk:          MEDIUM
Severity:               MEDIUM

Current ambiguity:
  VportDashboardBookingHistoryView.jsx (View Screen) contains two business
  logic functions — filterBookings and groupByDate — defined inline. View
  Screens may only perform hooks + component composition. Pure transforms
  belong in the model layer.

Fix plan:
  1. Create apps/VCSM/src/features/dashboard/vport/screens/model/vportBookingHistoryView.model.js
     Export: filterBookings(bookings, tab), groupByDate(bookings)
  2. Remove inline definitions from VportDashboardBookingHistoryView.jsx
  3. Import from model file

Recommended handoff: SENTRY re-verify after fix
```

---

## 9. Ownership Boundary Risk Summary

| Area | Risk | Reason |
|---|---|---|
| `checkVportOwnership.controller.js` → booking DAL | CRITICAL | Cross-feature DAL access bypasses adapter |
| `BarberPickerModal.jsx` — dead + layer violation | MEDIUM | Dead code with hooks in component |
| `ConfirmRemoveModal.jsx` — hook in component | MEDIUM | useActorSummary unnecessary; data in prop |
| `VportDashboardBookingHistoryView.jsx` — logic in View | MEDIUM | filterBookings/groupByDate misplaced |
| Booking history ownership migrated to engine | LOW | Completed correctly via adapter; no boundary risk |
| Availability write path migrated to engine | LOW | Completed correctly via engine; no boundary risk |

---

## 10. Fix Execution Plan (handed off to Codex)

| Fix | Files Changed | Type |
|---|---|---|
| IRONMAN-FINDING-01 | booking.adapter.js + checkVportOwnership.controller.js | Import boundary fix |
| IRONMAN-FINDING-02 | BarberPickerModal.jsx | DELETE (dead code + layer violation) |
| IRONMAN-FINDING-03 | ConfirmRemoveModal.jsx | Remove hook, use prop |
| IRONMAN-FINDING-04 | vportBookingHistoryView.model.js (new) + VportDashboardBookingHistoryView.jsx | Extract to model |

---

## 11. Ownership Clarity Classification

| Area | Ownership Clarity | Confidence |
|---|---|---|
| Dashboard feature code roots | CLEAR | HIGH |
| Booking history → booking engine migration | CLEAR | HIGH |
| Availability write → booking engine migration | CLEAR | HIGH |
| Team subsystem (controller/hook/DAL) | CLEAR | HIGH |
| checkVportOwnership actor kind check | CONFLICTED | HIGH — violation confirmed |
| BarberPickerModal caller | MISSING (dead) | HIGH — zero callers confirmed |
| ConfirmRemoveModal hook usage | PARTIAL | HIGH — fix is trivial |

---

## 12. IRONMAN Verdict

**Ownership Clarity: PARTIAL**  
One CRITICAL cross-feature boundary violation confirmed (IRONMAN-FINDING-01). Three medium layer violations documented with clear fix plans. All deletions and fixes can be executed without schema changes or migration. No user decision required — fixes are architectural corrections, not feature removals.

**Fix execution: proceed immediately.**
