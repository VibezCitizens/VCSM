# SENTRY COMPLIANCE REPORT

**Application Scope:** VCSM
**Review reason:** ARCHITECT gate pass — barber, locksmith, barbershop modules cleared VENOM + ELEKTRA + BLACKWIDOW + ARCHITECT. SENTRY is the next required checkpoint before KRAVEN → SPIDER-MAN → THOR.
**Date:** 2026-06-01
**Architecture contract:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`
**Boundary contract:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

---

## BOUNDARY COMPLIANCE STATUS

| Protected Root | In Scope | Modified | Violation | Notes |
|---|---|---|---|---|
| apps/VCSM | YES | NO (read-only audit) | NO | All reviewed files within VCSM boundary |
| apps/wentrex | NO | NO | NO | Not in scope |
| apps/Traffic | NO | NO | NO | Not in scope |
| engines | YES (read) | NO | NO | Portfolio engine consumed via approved interface — no engine modification |

---

## ARCHITECTURE ALIGNMENT STATUS

| Area | Status | Drift Level | Notes |
|---|---|---|---|
| Import path contract | PASS | NONE | All cross-feature imports via `@/...` absolute paths + approved adapters |
| DAL layer responsibility | PASS | NONE | DALs contain persistence access only; no business logic detected |
| Controller layer responsibility | PARTIAL | MODERATE DRIFT | `getLocksmithProfileController` contains model transform functions |
| Hook layer responsibility | PASS | MINOR DRIFT | Hooks are thin orchestrators; one duplicate import in join hook |
| Screen/component purity | PARTIAL | MODERATE DRIFT | Barbershop screens mix owner + public rendering (Final/View split violation) |
| Engine isolation | PASS | NONE | Portfolio engine consumed through DAL/model boundary |
| Adapter boundary compliance | PASS | NONE | All cross-feature access via approved adapters |
| Void realm compliance | PASS | NONE | All system posts use `PUBLIC_REALM_ID` — no viewer session realmId used |
| Code duplication | PARTIAL | MODERATE DRIFT | `sanitizeBlocks()`/`buildHoursText()` duplicated across locksmith + barbershop controllers |

---

## ACTOR OWNERSHIP STATUS

| Flow | Status | Risk | Notes |
|---|---|---|---|
| Locksmith add service area | PASS | LOW | `assertActorOwnsVportActorController` present |
| Locksmith update service area | **FAIL** | **HIGH** | No session ownership assertion — `actorId` trusted as-is |
| Locksmith delete service area | **FAIL** | **HIGH** | No session ownership assertion — `actorId` trusted as-is |
| Locksmith save service detail | PASS | LOW | `assertActorOwnsVportActorController` present |
| Locksmith delete service detail | **FAIL** | **HIGH** | No session ownership assertion — `actorId` trusted as-is |
| Locksmith save portfolio detail | PASS | LOW | `assertActorOwnsVportActorController` present |
| Locksmith post publish (hours) | PASS | LOW | `assertActorOwnsVportActorController` present |
| Locksmith post publish (service area) | PASS | LOW | `assertActorOwnsVportActorController` present |
| Locksmith post publish (portfolio) | PASS | LOW | `assertActorOwnsVportActorController` present |
| Barbershop post publish (hours) | PASS | LOW | `assertActorOwnsVportActorController` present |
| Barbershop post publish (portfolio) | PASS | LOW | `assertActorOwnsVportActorController` present |
| Barber QR join accept | PASS | LOW | `assertActorOwnsVportActorController` present |
| Barber QR join create+accept | PASS | LOW | `assertActorOwnsVportActorController` present post-create |
| Barber auto-resume onboarding | PASS | LOW | `callerActorId` bootstrapped from `bootstrapJoinOnboardingController` before assertion |
| Barbershop team view (owner actions) | PASS | LOW | `isOwner` prop scopes UI; dashboard routes are authenticated |

---

## IDENTITY SURFACE STATUS

| Surface | Status | Risk | Notes |
|---|---|---|---|
| Locksmith public read (`getLocksmithProfileController`) | PASS | LOW | Returns service areas/details — no internal UUID fields in public surface |
| Barbershop team member cards | PASS | LOW | Routes via `actorSummary.route` (slug-resolved) |
| Barbershop Book button | PASS | NONE | `navigate('/profile/${shopSlug}?tab=booking')` — uses slug |
| Barbershop owner dashboard navigation | LOW RISK | LOW | `navigate('/actor/${shopActorId}/dashboard/team')` — raw UUID in owner-only authenticated route |
| Join flow | PASS | LOW | Token is a resource UUID (opaque, not correlated to actor identity) |

---

## ENGINE ISOLATION STATUS

| Engine Area | Status | Drift | Notes |
|---|---|---|---|
| Portfolio engine (barber details) | PASS | NONE | Consumed via DAL + model interface — no app logic in engine |
| Portfolio engine (locksmith details) | PASS | NONE | Same — clean engine boundary |
| Hydration engine (actor summaries) | PASS | NONE | Accessed via `@hydration` alias in screen layer |

---

## NATIVE PARITY STATUS

| Native Area | Status | Drift | Notes |
|---|---|---|---|
| Join flow (QR scan) | NOT_AUDITED | UNKNOWN | FALCON pass not yet run — iOS QR join flow parity not confirmed |
| Team view | NOT_AUDITED | UNKNOWN | FALCON pass not yet run |
| Locksmith owner CRUD | NOT_AUDITED | UNKNOWN | FALCON pass not yet run |

---

## SENTRY FINDINGS

---

### SENTRY FINDING S-BLK-001

- **Finding ID:** S-BLK-001
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js` — `ctrlUpdateServiceArea` (line 48) + `ctrlDeleteServiceArea` (line 67) + `ctrlDeleteServiceDetail` (line 101)
- **Drift Level:** MAJOR DRIFT
- **Severity:** HIGH
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:**
  - `ctrlUpdateServiceArea(actorId, areaId, updates)` — accepts `actorId` and passes it to DAL `.eq('actor_id', actorId)`. No session ownership verification. Any authenticated caller who knows a VPORT's `actorId` and an `areaId` can update or delete its service areas.
  - `ctrlDeleteServiceArea(actorId, areaId)` — same pattern.
  - `ctrlDeleteServiceDetail(actorId, serviceId)` — same pattern.
  - Compare: `ctrlAddServiceArea`, `ctrlSaveServiceDetail`, `ctrlSavePortfolioDetail` all require `identityActorId` and call `assertActorOwnsVportActorController`.
- **Expected behavior:** All write paths — add, update, delete — must verify that the session actor (from `useIdentity`) owns the target VPORT before mutating. Update and delete paths must accept an `identityActorId` parameter and call `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })`.
- **Risk:** A non-owner who knows the target VPORT's `actorId` and any `areaId`/`serviceId` can mutate locksmith service data. DB-layer RLS on `locksmith_service_areas` / `locksmith_service_details` is unconfirmed — application layer is the only enforcement.
- **Recommended correction:**
  1. Add `identityActorId` as first parameter to `ctrlUpdateServiceArea`, `ctrlDeleteServiceArea`, `ctrlDeleteServiceDetail`
  2. Add `await assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })` at the top of each
  3. Update `useLocksmithOwner.js` call sites to pass `identityActorId` (already resolved in hook as `const identityActorId = useMemo(...)`)
- **Architectural rationale:** Per Actor Ownership Contract — DALs must not trust caller actorId. All ownership enforcement must live in the controller layer with session identity verification.

---

### SENTRY FINDING S-BLK-002

- **Finding ID:** S-BLK-002
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView.jsx` + `VportBarberShopTeamView.jsx`
- **Drift Level:** MODERATE DRIFT
- **Severity:** MEDIUM
- **Contract Violated:** Architecture Contract (Final/View screen split)
- **Current behavior:**
  - `VportBarberShopBookingView` branches on `isOwner`: if owner → renders `VportDashboardScheduleScreen`; else → renders `VportPublicBookingFlow`. One component owns two completely different runtime surfaces.
  - `VportBarberShopTeamView` branches on `isOwner`: owner sees schedule/hours management buttons with owner-only navigation; public sees book/view buttons. Same component, two rendering modes.
- **Expected behavior:** Per architecture contract — Final Screen (owner) and View Screen (public) are separate components. Owner management surfaces must be Final Screens. Public display surfaces must be View Screens. `isOwner` prop-branching inside a single component is the pattern that Final/View split was designed to eliminate.
- **Risk:** LOW for current release (pre-existing pattern, no auth bypass). MEDIUM architectural risk: as these screens evolve, owner-only capabilities can accidentally bleed into the public rendering path. FALCON native transfer also requires clean separation.
- **Recommended correction:**
  1. Split `VportBarberShopBookingView` → `VportBarberShopBookingViewScreen` (public) + `VportBarberShopScheduleFinalScreen` (owner)
  2. Split `VportBarberShopTeamView` → `VportBarberShopTeamViewScreen` (public) + `VportBarberShopTeamFinalScreen` (owner with management controls)
  3. Caller (shared profile screen tab system) selects correct component based on ownership — not a prop branch inside the component
- **Architectural rationale:** Component purity rule — screens must not switch rendering mode based on ownership flags. Ownership determines which component to mount, not what a component renders.
- **Sprint target:** Dashboard Structural Sprint (consistent with DEFER-004 pattern)

---

### SENTRY FINDING S-BLK-003

- **Finding ID:** S-BLK-003
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/getLocksmithProfile.controller.js` — `mapServiceArea()` (line ~8) + `mapServiceDetail()` (line ~23)
- **Drift Level:** MODERATE DRIFT
- **Severity:** MEDIUM
- **Contract Violated:** Architecture Contract (layer responsibility)
- **Current behavior:** `getLocksmithProfileController` contains two private transform functions `mapServiceArea()` and `mapServiceDetail()` that normalize raw DB rows to domain objects. These are pure transformations — model-layer work.
- **Expected behavior:** Model transforms belong in the Model layer (`model/locksmith/`). The controller should import a model and call it. Controllers own orchestration + authorization, not data shape normalization.
- **Risk:** LOW (no security risk). MEDIUM architectural risk: transform logic is hidden inside controller, not reusable by other consumers, not discoverable by ARCHITECT/IRONMAN as a model boundary.
- **Recommended correction:** Extract `mapServiceArea` and `mapServiceDetail` into `apps/VCSM/src/features/profiles/kinds/vport/model/locksmith/locksmithServiceArea.model.js` and `locksmithServiceDetail.model.js`. Import into controller.
- **Architectural rationale:** Model layer owns data shape normalization. Controllers orchestrate — they don't transform.
- **Sprint target:** Dashboard Structural Sprint (P3 cleanup)

---

### SENTRY FINDING S-BLK-004

- **Finding ID:** S-BLK-004
- **Location:**
  - `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js`
  - `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller.js`
- **Drift Level:** MODERATE DRIFT
- **Severity:** MEDIUM
- **Contract Violated:** Architecture Contract (duplicate implementation)
- **Current behavior:** `sanitizeBlocks()` and `buildHoursText()` (with `fmtMinutes()` and `DAY_ABBR`) are duplicated verbatim across both controllers. `sanitizeText()` is also duplicated in the portfolio post controllers. Total: ~60 lines of identical code across 4 controller files.
- **Expected behavior:** Shared transform/sanitization logic belongs in a model utility: `model/post/vportPostHelpers.model.js` (or equivalent). Controllers import helpers; they don't define them inline.
- **Risk:** LOW security risk. HIGH maintenance risk: a fix in one copy must be manually replicated to all others. Drift between copies has already occurred — the locksmith portfolio controller has an additional `JOB_TYPE_LABELS` allowlist that the barbershop version doesn't have.
- **Recommended correction:** Extract to `apps/VCSM/src/features/profiles/kinds/vport/model/post/vportPostHelpers.model.js` with exports: `sanitizeBlocks`, `sanitizeText`, `buildHoursText`, `fmtMinutes`, `DAY_ABBR`. Import in all 4 post controllers.
- **Sprint target:** Dashboard Structural Sprint (P2 cleanup)

---

### SENTRY FINDING S-BLK-005

- **Finding ID:** S-BLK-005
- **Location:** `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js` — top-level imports
- **Drift Level:** MINOR DRIFT
- **Severity:** LOW
- **Contract Violated:** None — code quality only
- **Current behavior:**
  ```js
  import {
    loadInviteForJoin,
    checkJoinAuthState,
    signUpForBarbershopInvite,
    loginForInvite,      // ← imported here
    ...
  } from "@/features/join/controllers/joinBarbershopAccount.controller";
  
  import { loginForInvite as loginController } from "@/features/join/controllers/joinBarbershopAccount.controller";  // ← imported again, aliased
  ```
  The same function `loginForInvite` is imported twice from the same module. The body uses `loginController`; the first `loginForInvite` import is unused dead code.
- **Expected behavior:** Single import of `loginForInvite as loginController`. Remove the duplicate from the first import block.
- **Risk:** None — dead import, no runtime impact. Confusing for code reviewers.
- **Recommended correction:** Remove `loginForInvite` from the first import block. Keep `import { loginForInvite as loginController } from ...` or fold it into the first block as `loginForInvite as loginController`.
- **Sprint target:** Next surgical pass (5-minute fix)

---

## FINAL SENTRY STATUS: MAJOR DRIFT

**Reason:** S-BLK-001 is a confirmed ACTOR OWNERSHIP CONTRACT VIOLATION — `ctrlUpdateServiceArea`, `ctrlDeleteServiceArea`, and `ctrlDeleteServiceDetail` in the locksmith module lack session-level ownership verification on write paths. DB-layer RLS on the affected tables is unconfirmed, making the application controller the only safeguard — which is absent.

---

## FOLLOW-UP REQUIRED: REQUIRED BEFORE RELEASE

| Finding | Severity | Sprint | Command |
|---|---|---|---|
| S-BLK-001 — locksmith update/delete ownership gates | HIGH | Surgical fix (WOLVERINE) | WOLVERINE |
| S-BLK-002 — barbershop Final/View screen split | MEDIUM | Dashboard Structural Sprint | SENTRY (re-verify post-split) |
| S-BLK-003 — model transforms in controller | MEDIUM | Dashboard Structural Sprint | WOLVERINE (extraction) |
| S-BLK-004 — sanitizeBlocks/buildHoursText duplication | MEDIUM | Dashboard Structural Sprint | WOLVERINE (extraction) |
| S-BLK-005 — duplicate import in useJoinBarbershop | LOW | Next surgical pass | WOLVERINE |

**S-BLK-001 is the only BEFORE-RELEASE blocker.** S-BLK-002 through S-BLK-004 are structural improvements recommended for the Dashboard Structural Sprint. S-BLK-005 is a 5-minute cleanup.

**After S-BLK-001 is resolved:** SENTRY status upgrades to MODERATE DRIFT (S-BLK-002 through S-BLK-004 remain for structural sprint). THOR gate can evaluate with CAUTION notation on structural items.

---

## MODULE SENTRY STATUS SUMMARY

| Module | Status | Primary Finding |
|---|---|---|
| barber | ALIGNED | S-BLK-005 (LOW — duplicate import only) |
| locksmith | MAJOR DRIFT | S-BLK-001 (HIGH — ownership gate missing on update/delete) |
| barbershop | MODERATE DRIFT | S-BLK-002 (MEDIUM — Final/View split) + S-BLK-004 (MEDIUM — code duplication) |
