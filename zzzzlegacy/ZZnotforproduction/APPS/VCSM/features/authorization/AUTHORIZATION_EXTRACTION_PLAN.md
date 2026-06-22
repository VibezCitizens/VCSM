# Authorization Feature — Extraction Plan
<!-- Generated: 2026-06-08 | Scope: VCSM apps/VCSM/src | Read-only analysis -->
<!-- Status: PLAN ONLY — no patches applied, no files modified, no DB changes -->

---

## A. Executive Summary

### Current State: FAIL

Authorization logic in VCSM is fragmented across at least **7 features**, with **no canonical home**.
The platform has a de-facto gate (`assertActorOwnsVportActorController`) that works correctly, but
it lives inside `features/booking/` — a domain feature — and is cross-consumed by 40+ controllers
across settings, vportDashboard, profiles, and join via an approved §5.3 adapter exception.

This is architecturally unstable: booking owns a platform-wide security primitive that has nothing
to do with the booking domain.

### Target Architecture

```
auth        = session / account authentication    (features/auth)
identity    = who is acting                       (features/identity, state/identity)
authorization = what the actor may do             (features/authorization) ← NEW
hydration   = enrich actor with display data      (features/hydration)
```

**Rule post-extraction:** No production feature may query `vc.actor_owners` directly except:
- `features/authorization` — all authorization decisions
- `features/auth/onboarding` — actor-owner creation at registration only
- DB/RLS layer
- dev diagnostics (read-only, never in production paths)

### Highest-Risk Current Issue

`assertActorOwnsVportActorController` is the platform-wide VPORT ownership gate.
It is defined in `features/booking/` but called by **40+ controllers across 6 features**
via `booking.adapter.js`. This creates an invisible coupling: any refactor of booking
internals (DAL layer rename, Supabase client swap, error format change) silently breaks
every ownership gate on the platform.

Secondary risk: **6 inline actor_owners queries** exist in non-DAL layers
(`notifications/publish.js`, `upload/createPost.controller.js`, engine setup callbacks,
a flyer builder DAL, and a notifications inbox controller) — all bypassing any controller gate.

---

## B. actor_owners Inventory

### Table Legend
- **Classification**: what kind of reference this is
- **Current Risk**: impact of leaving it in place
- **Recommendation**: what to do during migration

| # | File | Function / Line | Classification | Current Risk | Recommendation |
|---|------|----------------|----------------|--------------|----------------|
| 1 | `features/booking/controllers/assertActorOwnsVportActor.controller.js` | `assertActorOwnsVportActorController` | **Authorization gate** | CRITICAL — domain mis-ownership; 40+ cross-feature callers | Move to `features/authorization/controllers/assertActorOwnsActor.controller.js` |
| 2 | `features/booking/controllers/assertSessionOwnsVportActor.controller.js` | `assertSessionOwnsVportActorController` | **Authorization gate** | HIGH — session ownership gate lives in booking domain | Move to `features/authorization/controllers/assertSessionOwnsActor.controller.js` |
| 3 | `features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js` | `readActorOwnerLinkByActorAndUserProfileDAL` | **Authorization DAL** | HIGH — canonical DAL for the gate lives in booking | Move to `features/authorization/dal/actorOwners.read.dal.js` |
| 4 | `features/booking/dal/readOwnerLinkByActorAndSession.dal.js` | `readOwnerLinkByActorAndSessionDAL` | **Authorization DAL** | HIGH — session DAL for the session gate lives in booking | Move to `features/authorization/dal/actorOwners.read.dal.js` |
| 5 | `features/vportDashboard/dal/read/actorOwners.read.dal.js` | `readActorOwnersByActorIdDAL` | **Duplicate ownership DAL** | MEDIUM — reads actor_owners by actorId; 1 caller (probeVportPortfolio) | Replace caller with authorization controller; delete this file |
| 6 | `features/settings/vports/dal/actorOwners.read.dal.js` | `readActorOwnersByUserDAL` | **Duplicate ownership DAL** | MEDIUM — reads all actors owned by userId; 1 caller (getProfileActorId.controller) + 1 diagnostic | Caller should use authorization adapter; delete this file |
| 7 | `features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js` | `dalReadActorOwnerRow` | **Duplicate ownership DAL** | MEDIUM — reads actor+user ownership row; callers in profiles/rates | Replace callers with authorization controller; delete this file |
| 8 | `features/wanders/core/dal/read/actorOwners.read.dal.js` | `readPrimaryUserActorOwnerByUserIdDAL` | **Enrichment/read-only context** | LOW — resolves primary user actor; identity-adjacent, not a gate | Evaluate: keep in wanders or extract to identity; does NOT own authorization meaning |
| 9 | `state/identity/identity.read.dal.js` | `readActorOwnerUserDAL` (line ~144) | **Enrichment/read-only context** | LOW — resolves user_id from actor_id; used by hydration | Keep in identity.read.dal (enrichment, not a gate); no behavior change needed |
| 10 | `features/auth/onboarding/dal/actorOwnerCreate.dal.js` | insert into `actor_owners` | **Actor-owner creation** | NONE — correctly placed; only onboarding creates ownership rows | STAY in `features/auth/onboarding` — this is the one correct location |
| 11 | `features/notifications/publish.js` | `publishVcsmNotification` + `publishVcsmNotificationBatch` (lines ~65–68, ~136) | **Inline DAL query violation** | HIGH — two direct actor_owners Supabase queries in application-layer publish adapter; bypasses all controller gates | Phase 3: replace both inline queries with `assertSessionOwnsActorController` call from authorization |
| 12 | `features/upload/controllers/createPost.controller.js` | `createPostController` (lines ~38–44) | **Inline DAL query violation** | HIGH — inline actor_owners query in a controller; should delegate to authorization | Phase 3: replace with `assertSessionOwnsActorController` call |
| 13 | `features/portfolio/setup.js` | `isActorOwner` engine callback (lines ~48–54) | **Engine setup callback** | MEDIUM — inline actor_owners query in engine DI; relies on RLS for user_id scope | Phase 4: provide wrapper function from authorization adapter as engine callback |
| 14 | `features/reviews/setup.js` | `isActorOwner` engine callback (lines ~47–53) | **Engine setup callback** | MEDIUM — inline actor_owners query in engine DI; relies on RLS for user_id scope | Phase 4: provide wrapper function from authorization adapter as engine callback |
| 15 | `features/flyerBuilder/designStudio/dal/designStudio.read.dal.js` | `dalReadActorOwnerRow` (lines ~5–14) | **Inline DAL query violation** | HIGH — authorization logic (ownership check) inside a DAL file; layer contract violation | Phase 3: caller (unknown — needs trace) should use authorization controller |
| 16 | `features/notifications/inbox/controller/resolveVportOwnerActor.controller.js` | `resolveVportOwnerActorId` (line ~6) | **Enrichment/read-only context** | MEDIUM — reads actor_owners to resolve the owner's user actor; enrichment, not authorization | Phase 4: candidate for `features/authorization/controllers/resolveActorOwnerActor.controller.js` |
| 17 | `features/vportDashboard/dashboard/cards/team/dal/vportTeam.read.dal.js` | two inline queries (lines ~48–60) | **Enrichment/read-only context** | MEDIUM — resolves VPORT actors from user followers via actor_owners; reads, not gates | Phase 4: extract DAL to authorization or identity; current context is a read join, not a gate |
| 18 | `features/vportDashboard/dashboard/cards/gasprices/controller/publishFuelPriceUpdateAsPost.controller.js` | delegates via `checkVportOwnershipController` | **Authorization decision (indirect)** | LOW — correctly delegates to a wrapper controller; no direct actor_owners query | Trace `checkVportOwnershipController` — it should eventually use the authorization feature |
| 19 | `features/settings/vports/dal/vports.read.dal.js` | lines ~31, ~72 (actor_owners join queries) | **Enrichment/read-only context** | LOW — reads VPORTs owned by userId as a list operation, not a gate | STAY — this is VPORT list hydration, not authorization. owner_user_id notes are defense-in-depth |
| 20 | `features/CentralFeed/dal/feed.read.debugPrivacyRows.dal.js` | line ~47 | **Dev/diagnostic only** | NONE — debug-only query path | EXCLUDE from migration; dev-only |
| 21 | `features/vportDashboard/dashboard/cards/portfolio/components/PortfolioDevDiagnosticPanel.jsx` | line ~90 | **Dev/diagnostic only** | NONE — UI dev panel reference | EXCLUDE from migration; dev-only |
| 22 | `scripts/load/simulateAuthenticatedActors.mjs` | line ~224 | **Script/tooling** | NONE — simulation script | EXCLUDE from migration |
| 23 | `shared/ui/dashboard/__tests__/backButton.spiderman.test.js` | line ~57 | **Test contract assertion** | NONE — regex verifying ownership checks exist | EXCLUDE — test artifact |

---

## C. Current Gate Behavior

### Gate 1: assertActorOwnsVportActorController

**Location:** `features/booking/controllers/assertActorOwnsVportActor.controller.js`
**Exported via:** `features/booking/adapters/booking.adapter.js` (§5.3 approved exception)

**Exact behavior (must be preserved in migration):**

```
Input: { requestActorId, targetActorId }

Step 1 — Required field guard
  throws if requestActorId is missing
  throws if targetActorId is missing

Step 2 — Requester actor lookup (unconditional — runs before self-shortcut)
  calls getActorByIdDAL({ actorId: requestActorId })
  throws "Requester actor not found." if actor is null OR is_void === true

Step 3 — Kind gate (unconditional — runs before self-shortcut)
  throws "Only actor owners can manage this booking resource." if kind !== "user"
  captures warning via captureVcsmError on kind rejection

Step 4 — Self-ownership shortcut (only fires if kind === "user" already confirmed)
  if String(requestActorId) === String(targetActorId) → return { ok: true, mode: "self" }
  NOTE: This allows user actors to manage their own actor without DB query

Step 5 — Profile identity check
  reads requesterActor.profile_id
  throws "Requester actor is missing profile ownership identity." if profile_id is null

Step 6 — actor_owners DB verification
  calls readActorOwnerLinkByActorAndUserProfileDAL({ targetActorId, userProfileId: requesterActor.profile_id })
  throws "Actor does not own this vport actor." if no link found or link.is_void === true
  captures warning via captureVcsmError on denial

Step 7 — Target actor validation
  calls getActorByIdDAL({ actorId: targetActorId })
  throws "Target vport actor is not available." if null or is_void === true

Return: { ok: true, mode: "actor_owner", ownerLink }
```

**Errors thrown (must match post-migration):**
- `assertActorOwnsVportActorController: requestActorId is required`
- `assertActorOwnsVportActorController: targetActorId is required`
- `Requester actor not found.`
- `Only actor owners can manage this booking resource.`
- `Requester actor is missing profile ownership identity.`
- `Actor does not own this vport actor.`
- `Target vport actor is not available.`

**Callers (40+ production sites across 6 features):**
- `features/booking/controllers/` — cancelBooking, createBooking, setAvailabilityException, confirmBooking, ensureOwnerBookingResource, setResourceSlotDuration, setAvailabilityRule, listOwnerBookingResources
- `features/settings/` — vportDirectoryVisibility, vportBusinessCardSettings, vportBusinessCard, vportSocialSettings, account/account
- `features/vportDashboard/controller/` — vportOwnerStats, checkVportOwnership, saveVportPublicDetails, loadDaySchedule, updateVportBooking, createOwnerBooking, vportLeads (×4 calls), vportTeam, vportTeamAccess (×6), vportTeamInvite (×4), probeVportPortfolio
- `features/profiles/kinds/vport/controller/` — rates/upsertVportRate, exchange/publishExchangeRate, locksmith/locksmithOwner (×7), locksmith/publishLocksmithHoursUpdateAsPost, locksmith/publishLocksmithPortfolioUpdateAsPost, locksmith/publishLocksmithServiceAreaUpdateAsPost, barbershop/publishBarbershopPortfolioUpdateAsPost, barbershop/publishBarbershopHoursUpdateAsPost, menu/deleteVportActorMenuItem, menu/publishMenuUpdateAsPost, menu/deleteVportActorMenuCategory, services/getVportServices, services/upsertVportServices, services/deleteVportServiceAddon
- `features/join/controllers/` — joinBarbershopAccount (×3 calls), joinBarbershopQr

**Import path used by all callers:** `@/features/booking/adapters/booking.adapter`

---

### Gate 2: assertSessionOwnsVportActorController

**Location:** `features/booking/controllers/assertSessionOwnsVportActor.controller.js`
**Exported via:** `features/booking/adapters/booking.adapter.js` (§5.3 approved exception)

**Exact behavior (must be preserved in migration):**

```
Input: { targetActorId }

Step 1 — Required field guard
  throws if targetActorId is missing

Step 2 — Target actor lookup
  calls getActorByIdDAL({ actorId: targetActorId })
  throws "Target vport actor is not available." if null or is_void === true

Step 3 — Kind gate
  throws "Target actor is not a vport." if kind !== "vport"

Step 4 — Session-derived ownership query
  calls readOwnerLinkByActorAndSessionDAL({ targetActorId })
    which internally: getUser() → profiles.id → actor_owners.user_id = profile.id AND actor_id = targetActorId
  throws "Session user does not own this vport actor." if ownerLink is null or is_void === true

Return: { ok: true }
```

**Callers (2 production sites):**
- `features/vportDashboard/dashboard/cards/leads/controller/vportLeads.controller.js` (lines 62, 75)

**Key design note:** This gate was designed to avoid requiring `callerActorId` from the UI.
It derives the caller entirely from the Supabase auth session. The session ownership path
assumes the actor is always a VPORT kind and must be explicitly owned (no self-shortcut).

---

### Compatibility Requirements

1. Error messages must be preserved verbatim — tests assert exact error strings.
2. Return shapes `{ ok: true, mode: "self" }` and `{ ok: true, mode: "actor_owner", ownerLink }` are read by callers in tests.
3. `getActorByIdDAL` must remain accessible during migration — currently lives in `features/booking/dal/getActorById.dal.js`. It is used by both gates and must move or be re-accessed.
4. The self-shortcut logic (user-kind actor managing itself) must be preserved exactly.
5. `captureVcsmError` calls in the gate must be preserved with the same `feature` and `behavior_id` fields — changing these would break Sentry alert routing.

---

## D. Proposed Authorization Feature Structure

### Folder Tree

```
apps/VCSM/src/features/authorization/
├── adapters/
│   └── authorization.adapter.js
├── controllers/
│   ├── assertActorOwnsActor.controller.js      ← moved from booking
│   ├── assertSessionOwnsActor.controller.js    ← moved from booking
│   ├── assertActorCanManageActor.controller.js ← new: delegation check (actor-as-manager)
│   ├── resolveActorOwnerActor.controller.js    ← extracted from notifications/inbox
│   └── __tests__/
│       ├── assertActorOwnsActor.controller.test.js
│       └── assertSessionOwnsActor.controller.test.js
├── dal/
│   └── actorOwners.read.dal.js                 ← canonical DAL for all ownership reads
├── model/
│   └── authorizationDecision.model.js          ← normalizes decision output shape
└── README.md                                   ← feature scope doc (not doc — required by CLAUDE.md exception)
```

### File Responsibilities

#### `dal/actorOwners.read.dal.js`
Canonical single DAL for all `vc.actor_owners` reads.
Merges the following existing DALs:
- `readActorOwnerLinkByActorAndUserProfileDAL` (targetActorId + userProfileId → ownerLink)
- `readOwnerLinkByActorAndSessionDAL` (targetActorId + session → ownerLink)
- `readActorOwnersByActorIdDAL` (actorId → owner rows)

Public functions:
```
readActorOwnerLinkByProfileDAL({ targetActorId, userProfileId }) → ownerLink | null
readActorOwnerLinkBySessionDAL({ targetActorId }) → ownerLink | null
readActorOwnersByActorIdDAL({ actorId }) → row[] 
readActorOwnerRowDAL({ actorId, userId }) → row | null  (for engine callbacks)
```

Note: `readActorOwnersByUserDAL` (userId → actors list) and `readPrimaryUserActorOwnerByUserIdDAL`
are enrichment/hydration queries. They MAY be added here later but are not authorization gates.
Initial scope: only the gate-supporting DALs.

#### `controllers/assertActorOwnsActor.controller.js`
Exact behavioral clone of current `assertActorOwnsVportActorController`.
File rename only — behavior is identical.
Depends on:
- `dal/actorOwners.read.dal.js` (internal)
- `features/booking/dal/getActorById.dal.js` (still in booking — cross-feature DAL import is a contract violation)

⚠️ **Contract issue — see Section G.** `getActorByIdDAL` must be resolved before Phase 1 is complete.

#### `controllers/assertSessionOwnsActor.controller.js`
Exact behavioral clone of current `assertSessionOwnsVportActorController`.
Same cross-feature DAL issue with `getActorByIdDAL`.

#### `controllers/assertActorCanManageActor.controller.js`
NEW: higher-level check — "can actor A manage actor B as manager or owner?"
Combines: owner check + delegation check (for team management flows).
Not used in Phase 1. Defined in Phase 1 but not called until Phase 2+.

```
Input: { requestActorId, targetActorId }
Returns: { ok: true, mode: "self" | "actor_owner" | "team_member" }
```

#### `controllers/resolveActorOwnerActor.controller.js`
Extracted from `features/notifications/inbox/controller/resolveVportOwnerActor.controller.js`.
Resolves a VPORT actor's owner user actor.

```
Input: { vportActorId }
Returns: userActorId | null
```

#### `model/authorizationDecision.model.js`
Normalizes decision return shapes.

```javascript
// Shapes:
{ ok: true, mode: "self" }
{ ok: true, mode: "actor_owner", ownerLink: { actor_id, user_id, is_primary, is_void, created_at } }
{ ok: false, reason: string }
```

#### `adapters/authorization.adapter.js`
Public surface of the feature.

```javascript
/**
 * @adapter
 * @feature authorization
 * @lastReviewed 2026-06-08
 * @blastRadius critical
 * @publicSurface approved-services
 * @requiresDeepReview true
 */

// Approved cross-feature service boundary: platform-wide authorization gate.
// Callers: 40+ controllers across booking, settings, vportDashboard, profiles, join.
// Exception basis: §5.3 — authorization is a platform primitive, not feature logic.
export { assertActorOwnsActorController } from './controllers/assertActorOwnsActor.controller';
export { assertSessionOwnsActorController } from './controllers/assertSessionOwnsActor.controller';
export { assertActorCanManageActorController } from './controllers/assertActorCanManageActor.controller';
export { resolveActorOwnerActorController } from './controllers/resolveActorOwnerActor.controller';

// Engine setup callbacks — for portfolio/reviews engine DI
export { isActorOwnerCallback } from './dal/actorOwners.read.dal';
```

### Adapter Stamp Recommendation

```
@blastRadius: critical     (40+ cross-feature consumers on day 1 of migration)
@publicSurface: approved-services   (controllers, not hooks — called by other controllers)
@requiresDeepReview: true  (mutation functions, session state, cross-feature permission gate)
```

**Adapter Contract note:** The adapter contract (§5.3) states adapters re-export hooks/components/screens.
Controllers are not in the default permitted list. The pattern of "approved §5.3 exception" already exists
in `booking.adapter.js` for exactly this reason. The authorization adapter should formalize this exception
with explicit documentation in the adapter stamp and a note that authorization controllers are a
platform-wide service boundary, not feature-internal logic.

---

## E. Migration Plan

### Phase 1 — Create authorization feature (no caller changes)

**Goal:** Create the new feature, establish canonical DAL and controllers, add tests.
Zero behavior change. Zero caller changes. Old booking exports remain.

**Files to CREATE:**
```
apps/VCSM/src/features/authorization/
  adapters/authorization.adapter.js
  controllers/assertActorOwnsActor.controller.js   (copy of booking gate)
  controllers/assertSessionOwnsActor.controller.js (copy of booking gate)
  controllers/assertActorCanManageActor.controller.js (stub — not yet called)
  dal/actorOwners.read.dal.js                      (merges 2 booking DALs)
  model/authorizationDecision.model.js
  controllers/__tests__/assertActorOwnsActor.controller.test.js
  controllers/__tests__/assertSessionOwnsActor.controller.test.js
```

**Files NOT touched:** all callers, booking.adapter.js, booking controllers

**Risk:** LOW — no callers change. New code only.

**Expected behavior change:** None. The new feature exists but nothing calls it yet.

**Tests required:**
- Port all existing tests from `features/booking/controllers/__tests__/assertActorOwnsVportActor.controller.test.js`
- Port all existing tests from the session gate (if tests exist; only test file found was for `assertActorOwnsVportActor`)
- All tests must pass against new controller location

**Rollback plan:** Delete the new `features/authorization/` folder. No impact on anything.

**Critical blocker — getActorByIdDAL:**
Both gate controllers depend on `features/booking/dal/getActorById.dal.js`.
Options:
1. Copy `getActorById.dal.js` into `features/authorization/dal/` — creates duplicate
2. Keep importing from `features/booking/dal/getActorById.dal.js` — cross-feature DAL import (contract violation)
3. Move `getActorById.dal.js` to a shared location first — requires separate ticket

**Decision required before Phase 1:** See Section G, Open Question #1.

---

### Phase 2 — Booking gate delegates to authorization

**Goal:** Make `assertActorOwnsVportActorController` in booking delegate to
`assertActorOwnsActorController` from authorization. All 40+ callers auto-migrate
via the re-export without changing a single import path.

**Files to EDIT:**
- `features/booking/controllers/assertActorOwnsVportActor.controller.js`
  - Replace implementation with: `export { assertActorOwnsActorController as assertActorOwnsVportActorController } from '@/features/authorization'`
  - OR: make the function call `assertActorOwnsActorController` internally and re-export
- `features/booking/controllers/assertSessionOwnsVportActor.controller.js`
  - Same pattern
- `features/booking/adapters/booking.adapter.js`
  - No change needed yet — still re-exports from booking/controllers

**Files NOT touched:** all 40+ callers (they still import from booking.adapter — no change needed)

**Risk:** MEDIUM — touches the live gate. If Phase 1 tests pass, this is a delegate-only change.
The behavior must be identical — function signature, error messages, return shapes.

**Expected behavior change:** None. All callers call the same function via the same import.

**Tests required:**
- All existing booking gate tests must still pass (they now test via the delegation layer)
- Add integration test verifying delegation: `assertActorOwnsVportActorController === assertActorOwnsActorController`

**Rollback plan:** Revert the booking controller files to their direct implementations.
No callers need to change.

---

### Phase 3 — Migrate inline actor_owners violations

**Goal:** Remove direct Supabase `actor_owners` queries from non-DAL layers.
Replace with calls to authorization controllers.

**Files to EDIT:**

**3a. `features/upload/controllers/createPost.controller.js`**
- Lines ~38–44: inline actor_owners query
- Replace with: `await assertSessionOwnsActorController({ targetActorId: identity.actorId })`
  OR: `await assertActorOwnsActorController({ requestActorId: ..., targetActorId: identity.actorId })`
- Note: the current query uses `session.user.id` (auth UUID) — this is a session-derived check.
  The `assertSessionOwnsActorController` is the right gate IF the actor is a VPORT kind.
  If the actor is a user kind, the self-shortcut in `assertActorOwnsActorController` handles it.
  Requires careful mapping — see Section G, Open Question #2.

**3b. `features/notifications/publish.js`**
- Lines ~65–68 (publishVcsmNotification): inline actor_owners query
- Lines ~136 (publishVcsmNotificationBatch): inline actor_owners query
- Replace both with: a call to `assertSessionOwnsActorController` or a dedicated
  `verifyActorBelongsToSession()` helper in authorization
- Note: these currently use `session.user.id` directly (auth UUID), which differs from the
  existing gate (which uses `profile.id`). **This is a data shape mismatch — see Section G, Open Question #3.**

**3c. `features/flyerBuilder/designStudio/dal/designStudio.read.dal.js`**
- `dalReadActorOwnerRow` is a DAL function that does an authorization check
- This function must be moved out of the DAL — trace callers first
- Caller likely a flyerBuilder controller; replace with authorization controller call
- DAL should only read design documents, never check ownership

**Risk:** HIGH per file — each inline query replacement touches live auth paths.
Do each sub-item in isolation. Test each controller route affected.

**Expected behavior change:**
- None if implemented correctly. The session-guard logic is equivalent.
- Risk: the current `notifications/publish.js` queries `session.user.id` (Supabase auth UUID)
  directly against `actor_owners.user_id`. The gate DALs use `profiles.id` (profile UUID).
  These are different columns. **This must be verified before Phase 3b** — see Section G.

**Tests required:**
- For each file edited: test that ownership is still enforced (mocked DB test + integration)
- Specifically for notifications: test that non-owners cannot trigger actorId-sourced notifications

**Rollback plan:** Per-file revert. Each sub-item is independent.

---

### Phase 4 — Migrate duplicate DALs and enrichment queries

**Goal:** Remove the 5 duplicate `actorOwners.read.dal.js` files that exist across features.
Migrate their callers to use authorization controllers or the canonical authorization DAL.

**Files to DELETE (after callers migrated):**
1. `features/vportDashboard/dal/read/actorOwners.read.dal.js` — `readActorOwnersByActorIdDAL`
   - Caller: `features/vportDashboard/dashboard/cards/portfolio/controller/probeVportPortfolio.controller.js`
   - Replace with: authorization controller call
2. `features/settings/vports/dal/actorOwners.read.dal.js` — `readActorOwnersByUserDAL`
   - Caller: `features/settings/vports/controller/getProfileActorId.controller.js`
   - Replace with: authorization adapter call OR keep as enrichment (not a gate)
   - Dev caller: `src/dev/diagnostics/groups/settingsFeature.group.js` — exclude from migration
3. `features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js` — `dalReadActorOwnerRow`
   - Caller: trace required (in `features/profiles/kinds/vport/controller/rates/`)
   - Replace caller with authorization controller
4. `features/notifications/inbox/controller/resolveVportOwnerActor.controller.js`
   - Move inline logic to `authorization/controllers/resolveActorOwnerActor.controller.js`
   - Update caller (notifications inbox) to use authorization adapter

**Files to EDIT:**
- `features/portfolio/setup.js`: `isActorOwner` callback
  - Replace inline actor_owners query with an exported callback from authorization adapter
  - Exported as: `isActorOwnerCallback` from `authorization.adapter.js`
- `features/reviews/setup.js`: `isActorOwner` callback
  - Same pattern as portfolio setup

**NOTE on wanders `actorOwners.read.dal.js`:**
`readPrimaryUserActorOwnerByUserIdDAL` in `features/wanders/core/dal/read/actorOwners.read.dal.js`
reads the primary **user** actor owned by a userId. This is identity enrichment (finding which
user-kind actor a user owns), not authorization. It should be evaluated separately:
- If it can be served by the identity/hydration layer, move it there
- If it stays in wanders, it's acceptable — wanders is resolving its own inbox actor context
- Do NOT force it into authorization; it is not a gate function

**Risk:** MEDIUM — each DAL deletion must be preceded by caller migration.
The engine setup callbacks (portfolio, reviews) are initialization-time code; regression
risk is lower since engine is set up once at startup.

**Expected behavior change:**
- None for individual migrations
- Engine callback shape: `isActorOwner: async (actorId) => boolean` — authorization adapter
  must export a function with this exact signature

**Tests required:**
- Each deleted DAL must have its test coverage transferred to the authorization DAL
- Engine setup tests (if they exist) must verify isActorOwner still works

**Rollback plan:** Restore deleted DAL files from git. Callers are reverted individually.

---

### Phase 5 — Clean deprecated owner_user_id filters (DB Audit Gate)

**Goal:** Remove `owner_user_id` as an authorization filter in DAL WHERE clauses.

**THIS PHASE IS BLOCKED until:**
1. DB/RLS audit confirms `actor_owners` RLS fully covers what `owner_user_id = auth.uid()` covered
2. All `actor_owners` authorization is routed through `features/authorization`
3. Owner approves the DB/RLS changes

**Files that use `owner_user_id` as authorization (not just as data column):**
- `features/settings/vports/dal/vports.read.dal.js` (lines ~111, ~134) — reads vport by `owner_user_id`
- `features/settings/vports/dal/vports.write.dal.js` (lines ~44, ~75, ~106) — writes filtered by `owner_user_id`
- `features/vport/dal/vport.core.dal.js` (lines ~126) — lists vports by `owner_user_id`
- `features/vport/dal/vport.read.vportRecords.dal.js` (line ~20)
- `features/join/dal/barberVport.read.dal.js` (lines ~10, ~26)

**Files that use `owner_user_id` as a data field only (safe — not authorization):**
- `features/wanders/` — inboxes, mailbox, droplinks use `owner_user_id` as a domain data field (not ownership gate)
- `features/settings/profile/dal/profile.read.dal.js` — selects `owner_user_id` as data field for display
- `state/identity/identity.read.dal.js::readVportIdentityDAL` — selects `owner_user_id` as data for enrichment

**Risk:** HIGH — changing DB WHERE clauses for ownership checks is a DB mutation path.
Must be a separate DB Audit Phase.

**Expected behavior change:**
- Post-cleanup: all VPORT ownership checked via `actor_owners` only; `owner_user_id` is treated
  as a data field, not an authorization filter

**Tests required:**
- Before deleting `owner_user_id` filters: prove via DB test that RLS on `actor_owners`
  provides equivalent protection
- Must be verified by DB/Carnage review, not app-layer test only

**Rollback plan:** Revert DAL files. No DB schema changes in this phase — only WHERE clause removal.

---

## F. Files Not To Touch Yet

The following must be deferred to later phases or explicit authorization from the owner:

| Category | Files | Reason |
|----------|-------|--------|
| DB/RLS | All Supabase policies for `vc.actor_owners` | DB Audit Phase only |
| Migrations | `supabase/migrations/` | Owner deploys manually — never touched by agent |
| owner_user_id cleanup | `vports.read.dal.js`, `vports.write.dal.js`, `vport.core.dal.js`, `vport.read.vportRecords.dal.js`, `join/dal/barberVport.read.dal.js` | Requires DB/RLS audit confirmation first (Phase 5) |
| Dev diagnostics | `CentralFeed/dal/feed.read.debugPrivacyRows.dal.js`, `PortfolioDevDiagnosticPanel.jsx`, `dev/diagnostics/groups/settingsFeature.group.js` | Dev-only; excluded from production authorization scope |
| Scripts | `scripts/load/simulateAuthenticatedActors.mjs` | Tooling; not a production path |
| Wanders mailbox/inbox/droplinks `owner_user_id` | `features/wanders/core/dal/` | `owner_user_id` here is a domain data field, not an authorization gate |
| Engine DB-side enforcement | Reviews `upsert_neutral_review()` SECURITY DEFINER | DB-side; owner deploys; referenced in reviews/setup.js comment |
| Notification engine DB trigger | TICKET-ARCH-NOTI-SESSION-001 (source_actor_id ownership trigger) | DB-side backstop; confirmed in memory; not to be touched |
| CARNAGE note | `actor_can_manage_profile` / `actor_can_view_profile` DB functions with legacy `owner_user_id` branch | Referenced in booking controller comment; DB audit deferred |

---

## G. Open Questions / DB Audit Notes

### Open Question #1 — getActorByIdDAL ownership

**Issue:** Both authorization gate controllers depend on `features/booking/dal/getActorById.dal.js`.
This file lives inside the booking feature domain. Authorization importing from booking DAL is a
cross-feature DAL import — a contract violation per §8 Dependency Rules.

**Options:**
1. **Copy** `getActorById.dal.js` to `features/authorization/dal/getActorById.dal.js`
   - Pro: no cross-feature violation
   - Con: duplication; two files to maintain
2. **Move** `getActorById.dal.js` to `shared/` or a new `features/actors/dal/`
   - Pro: single source; no duplication
   - Con: requires separate ticket, may have other callers in booking
3. **Import from booking during Phase 1 only** (temporary — mark with `// TODO: deref post-Phase-2`)
   - Pro: unblocks Phase 1 immediately
   - Con: creates a known contract violation in the new feature (must be fixed before Phase 2 ships)

**Decision needed from owner.**

---

### Open Question #2 — createPost.controller.js session check shape

**Issue:** The inline actor_owners query in `createPost.controller.js` uses `session.user.id`
(the Supabase **auth UUID**) directly as the `user_id` filter. The canonical gate DAL
(`readOwnerLinkByActorAndSessionDAL`) resolves this through an intermediate step:
`auth UUID → profiles.id → actor_owners.user_id`. This means `actor_owners.user_id`
stores **profile IDs**, not auth UUIDs.

**Consequence:** If `actor_owners.user_id = profile.id` (not `auth.uid()`), then the current
inline query in `createPost.controller.js` filtering by `session.user.id` (auth UUID) is
**querying the wrong column** and would never find a row — unless `user_id` stores auth UUIDs,
not profile IDs.

**This must be clarified by DB schema inspection before Phase 3.**

DB Audit Note:
- Verify: what does `vc.actor_owners.user_id` store — profile ID or auth UUID?
- If profile ID: the upload controller's inline query is currently broken (never matches → auth check silently fails to find row)
- If auth UUID: the booking gate's DAL is doing an unnecessary profile join
- Look at the onboarding create DAL (`actorOwnerCreate.dal.js`) to confirm what is inserted

---

### Open Question #3 — notifications/publish.js session query shape

**Same issue as #2.** `notifications/publish.js` filters `actor_owners` by `session.user.id`
(auth UUID). Same potential mismatch with the canonical DAL which uses `profiles.id`.

If the mismatch is real, the app-layer session guard in `publishVcsmNotification` is currently
a no-op (silently passes all calls through because the query returns no rows, and the code
treats `null ownerLink` as a failure — but the `if (!ownerLink) return false` would then block
**all** notifications). Something is clearly working, so either:
1. The schema stores auth UUID in `actor_owners.user_id`, OR
2. The RLS policy for `actor_owners_read_own` auto-scopes results correctly so a session-auth query works without explicit user_id filter

DB Audit Note:
- Inspect `vc.actor_owners` table schema: `user_id` column type and source
- Inspect RLS policy `actor_owners_read_own` — does it filter by `auth.uid()` matching `user_id`?
- If RLS auto-scopes: the inline queries in notifications and upload are relying on RLS-scoped reads
  (no explicit user_id filter = trust RLS), not explicit app-layer user_id checks
- This would be a significant trust model difference from the booking gate (explicit filter)

---

### DB Audit Note #1 — `actor_owners` RLS coverage

When Phase 5 owner_user_id cleanup is considered, a full DB audit must confirm:
- What tables currently use `owner_user_id = auth.uid()` as their primary RLS row filter?
- Is `actor_owners` RLS covering the same populations?
- Are there any tables where `owner_user_id` is the only ownership signal (no `actor_owners` row)?
- The CARNAGE-flagged `actor_can_manage_profile` and `actor_can_view_profile` DB functions
  with legacy `owner_user_id` branch must be reviewed before Phase 5.

---

### DB Audit Note #2 — notification DB trigger

The DB BEFORE INSERT trigger on `notification.events` (TICKET-ARCH-NOTI-SESSION-001) enforces
`source_actor_id` ownership via `vc.actor_owners`. This is the DB-layer backstop for notification
publisher security. When Phase 3 replaces the inline app-layer guard in `notifications/publish.js`,
the DB trigger remains the true enforcement point. The app-layer guard becomes defense-in-depth only.

---

### DB Audit Note #3 — owner_user_id as authorization filter

Multiple DAL WHERE clauses use `.eq("owner_user_id", userId)` as ownership enforcement.
These are listed in Phase 5. Before they can be removed:
- Confirm `actor_owners` RLS provides equivalent protection for each table
- Identify tables that have both `owner_user_id` AND `actor_owners` coverage vs. only `owner_user_id`
- Tables with only `owner_user_id` coverage cannot have that filter removed until RLS is updated

---

## Summary Counts (Classification)

| Classification | Count |
|---|---|
| Authorization gate controllers | 2 |
| Authorization DALs (in booking) | 2 |
| Duplicate ownership DALs | 4 |
| Enrichment/read-only context | 4 |
| Inline DAL query violations | 3 |
| Engine setup callbacks | 2 |
| Actor-owner creation (correct location) | 1 |
| Dev/diagnostic only | 3 |
| Script/tooling | 1 |
| Comment only | many |

**Total production files requiring action:** ~14 across 5 phases
**Zero-touch files:** auth/onboarding, dev/diagnostics, scripts, wanders mailbox/inbox/droplinks
