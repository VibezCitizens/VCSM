# VPORT First-Class Actor Ownership Architecture Review
**Date:** 2026-06-08  
**Branch:** vport-booking-feed-security-updates  
**Scope:** actor_owners usage, ownership inference violations, DAL structure, authorization consolidation

---

## CONTRACT RULES (review baseline)

| Rule | Contract |
|---|---|
| actorId is canonical identity | All ownership decisions rooted in actorId |
| VPORT actors are first-class | No special-case paths for VPORT vs user actors |
| Ownership resolved through vc.actor_owners | Only valid ownership oracle |
| No inference from profileId, vportId, userId, owner_user_id | These fields must never determine ownership |
| Controllers decide authorization | DALs execute queries only |
| RLS is final enforcement | App layer is defense-in-depth |

---

## SCHEMA BASELINE (confirmed from migrations)

```
auth.users.id = auth.uid()
actor.profile_id = auth.uid()           ← confirmed: 20260606000001 comment
actor_owners.user_id = auth.uid()       ← confirmed: RLS policies across migrations
```

**Critical implication:** `actor.profile_id === actor_owners.user_id` is a schema invariant — they are the same value (auth UUID). This makes the current profile_id-derived ownership lookup technically correct but architecturally non-compliant with the contract.

---

## FINDING INVENTORY

### F-001 — PRIMARY GATE: `actor.profile_id` Used as `user_id` in Ownership Resolution
**Severity:** MEDIUM  
**Classification:** DAL authorization violation (spirit) / Contract drift

**File:**
- `apps/VCSM/src/features/booking/controllers/assertActorOwnsVportActor.controller.js` (line 49)
- `apps/VCSM/src/features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js` (line 27)

**Current path:**
```
requestActorId
  → getActorByIdDAL({ actorId })           # hits actors table
  → actor.profile_id                       # = auth.uid() (schema invariant)
  → actor_owners WHERE user_id = profile_id AND actor_id = targetActorId
```

**Contract-compliant path:**
```
requestActorId
  → actor_owners WHERE actor_id = requestActorId  # resolve user_id without actors table
  → user_id
  → actor_owners WHERE actor_id = targetActorId AND user_id = <resolved>
```

**Why this matters:**
- The actors table JOIN is a hidden coupling. If `actor.profile_id` is ever deprecated or migrated away from `auth.uid()`, this silently breaks.
- The contract says ownership must never be inferred from `profileId`. Even though `profile_id === auth.uid()` today, using it as the ownership resolution key violates the stated contract.
- A fully compliant resolution path would stay entirely within `vc.actor_owners`.

**Status:** Contract drift. Technically functional. No immediate security risk. Needs migration to compliant path.

---

### F-002 — INLINE actor_owners QUERY in `createPost.controller.js`
**Severity:** HIGH  
**Classification:** DAL authorization violation

**File:** `apps/VCSM/src/features/upload/controllers/createPost.controller.js` (lines 38–46)

**Pattern:**
```javascript
const { data: ownerRow } = await supabase
  .schema('vc')
  .from('actor_owners')
  .select('actor_id')
  .eq('user_id', user.id)       // user.id = auth.uid() — correct value
  .eq('actor_id', identity.actorId)
  .maybeSingle()
if (!ownerRow) throw new Error('createPostController: actor not owned by session user')
```

**Issues:**
1. Controller performs raw DB query instead of delegating to a DAL function. Controllers must not construct Supabase queries directly.
2. The authorization check is embedded inside the controller body, not routed through the canonical ownership gate (`assertActorOwnsVportActorController`).
3. `user.id` is used correctly (= auth.uid()), but the query pattern creates a second non-canonical ownership surface.

**Required fix:** Route through `assertActorOwnsVportActorController` or a new canonical DAL. Remove inline supabase query from controller.

---

### F-003 — INLINE actor_owners QUERIES in `notifications/publish.js`
**Severity:** HIGH  
**Classification:** DAL authorization violation (service layer doing auth queries)

**File:** `apps/VCSM/src/features/notifications/publish.js`  
- Single publish: lines 64–72  
- Batch publish: lines 133–141

**Pattern (both paths):**
```javascript
const { data: ownerLink } = await supabase
  .schema('vc')
  .from('actor_owners')
  .select('actor_id')
  .eq('user_id', session.user.id)    // session.user.id = auth.uid() — correct value
  .eq('actor_id', actorId)
  .maybeSingle()
if (!ownerLink) return false
```

**Issues:**
1. `publish.js` is a service/utility file, not a controller. Service files must not make authorization decisions via direct DB queries.
2. Two identical inline queries (single + batch) — duplicated logic.
3. These bypass the canonical ownership gate entirely.

**Required fix:** Extract into a shared ownership DAL call or route callers through a controller that performs the ownership gate before calling `publish`.

---

### F-004 — WEAK isActorOwner CALLBACKS in `portfolio/setup.js` and `reviews/setup.js`
**Severity:** MEDIUM  
**Classification:** Incomplete ownership check (no user_id binding)

**Files:**
- `apps/VCSM/src/features/portfolio/setup.js` (lines 39–58)
- `apps/VCSM/src/features/reviews/setup.js` (lines 44–60)

**Pattern:**
```javascript
isActorOwner: async (actorId) => {
  const { data } = await supabase
    .schema('vc')
    .from('actor_owners')
    .select('actor_id')
    .eq('actor_id', actorId)
    .eq('is_void', false)
    .limit(1)
  return !!data?.[0]
}
```

**Issue:** This callback checks whether the actor has ANY owner — not whether the current session user owns it. `user_id` is never bound. A deleted actor with a historical `actor_owners` row would pass this check.

**Mitigation in place:** RLS is described as "real enforcement" in setup.js comments. The callback is a pre-guard, not the authorization decision.

**Required fix:** Either bind `user_id = auth.uid()` in the query, or document explicitly that this is a non-security-relevant existence check and rename the callback to `isActorActive` or `actorExists`.

---

### F-005 — FOUR DUPLICATE actorOwners DAL FILES
**Severity:** MEDIUM  
**Classification:** Duplicated ownership logic

**Files:**
```
apps/VCSM/src/features/vportDashboard/dal/read/actorOwners.read.dal.js
  → readActorOwnersByActorIdDAL({ actorId })
  → SELECT actor_id, user_id WHERE actor_id = actorId

apps/VCSM/src/features/settings/vports/dal/actorOwners.read.dal.js
  → readActorOwnersByUserDAL({ userId })
  → SELECT actors(id, kind) WHERE user_id = userId

apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js
  → dalReadActorOwnerRow({ actorId, userId })
  → SELECT full row WHERE actor_id = actorId AND user_id = userId

apps/VCSM/src/features/wanders/core/dal/read/actorOwners.read.dal.js
  → readPrimaryUserActorOwnerByUserIdDAL({ userId })
  → SELECT with actors join, kind=user, order by is_primary
```

Plus booking:
```
apps/VCSM/src/features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js
  → readActorOwnerLinkByActorAndUserProfileDAL({ targetActorId, userProfileId })
  → SELECT full row WHERE actor_id = targetActorId AND user_id = userProfileId
```

**Issues:**
1. Five separate files implementing variations of the same query against `vc.actor_owners`.
2. Divergent naming conventions (`dal` prefix, `DAL` suffix, no prefix).
3. Divergent return shapes (some return arrays, some single rows, some stripped to actor only).
4. Callers import from feature-local paths — tight coupling to whichever feature the DAL lives in.

**Required fix:** Consolidate into a single canonical DAL in `engines/identity/` or a shared location. Expose a typed API with named variants.

---

### F-006 — CANONICAL OWNERSHIP GATE LIVES IN `booking/` FEATURE
**Severity:** MEDIUM  
**Classification:** Architectural misplacement

**File:** `apps/VCSM/src/features/booking/controllers/assertActorOwnsVportActor.controller.js`

**Issue:** `assertActorOwnsVportActorController` is the platform's universal VPORT ownership gate, used by:
- `vportDashboard` (8+ controllers)
- `settings/vports` (4 controllers)
- `settings/privacy` (1 controller)
- `profiles/kinds/vport` (10+ controllers)
- `upload` (should use it — currently doesn't)
- `notifications` (should use it — currently doesn't)

But it lives in `features/booking/`. Every non-booking feature that uses it is importing a platform primitive from a feature. This creates a feature-to-feature dependency that violates isolation contracts.

**Required fix:** Move to `engines/identity/src/authorization/` or `shared/authorization/` and re-export from there. All importers update to the canonical path.

---

### F-007 — `assertSessionOwnsVportActorController` DUPLICATES IDENTITY RESOLUTION
**Severity:** LOW  
**Classification:** Duplicated ownership logic

**File:** `apps/VCSM/src/features/booking/controllers/assertSessionOwnsVportActor.controller.js`
**DAL:** `apps/VCSM/src/features/booking/dal/readOwnerLinkByActorAndSession.dal.js`

**Issue:** The session controller derives the caller's profile.id from the Supabase session internally, then queries `actor_owners`. The `assertActorOwnsVportActorController` does the same via `actor.profile_id`. Two paths exist for the same operation:
1. "Caller is a known actorId" → `assertActorOwnsVportActorController`
2. "Caller is a session user" → `assertSessionOwnsVportActorController`

These could be unified: a session-based gate should resolve the session to an `actorId` first (via identity), then delegate to the actorId-based gate.

---

### F-008 — `owner_user_id` STILL USED IN VPORTS DAL WHERE CLAUSES
**Severity:** LOW  
**Classification:** Deprecated field in active use

**Files:**
- `apps/VCSM/src/features/settings/vports/dal/vports.write.dal.js` (lines 44, 75, 106)
- `apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js` (lines 111, 134)

**Pattern:**
```javascript
.eq("owner_user_id", userId)   // in WHERE clause of read/write operations
```

**Context from comments:** Described as "defense-in-depth secondary check after actor_owners primary gate." Migration `20260527090000` confirms owner_user_id rows were backfilled to have actor_owners coverage.

**Issue:** The deprecated field is still used as a secondary filter. Per contract, ownership must be resolved through `actor_owners` exclusively. Using `owner_user_id` in DAL queries means DALs are making ownership assertions, not just executing queries.

**DB AUDIT NOTE:**  
- DB object: `vport` table `owner_user_id` column  
- Risk: Deprecated ownership field still used for filtering; may diverge from actor_owners if a VPORT changes hands  
- Why deferred: RLS is the real guard; app-layer usage is secondary  
- Suggested later SQL review: Remove `owner_user_id` from DAL WHERE clauses after confirming `actor_owners` covers all rows; track in TICKET-PLATFORM-RLS-001

---

### F-009 — `vport_id` FIELD USED IN actorIdBySubject LOOKUP
**Severity:** INFO  
**Classification:** Lookup (not ownership inference) — review for contract clarity

**File:** `apps/VCSM/src/features/settings/profile/dal/actorIdBySubject.read.dal.js` (line 36)

**Pattern:**
```javascript
.eq('vport_id', vportId)
```

**Context:** Used to resolve `actorId` from a `vportId` — not used as an ownership check. This is a lookup operation.

**Status:** Not a contract violation. Document why vport_id is an acceptable lookup key for this specific DAL.

---

### F-010 — DIAGNOSTIC QUERIES (SAFE — dev only)
**Severity:** INFO  
**Classification:** dev/diagnostic only

**Files:** All files under `apps/VCSM/src/dev/diagnostics/`

The following diagnostic groups query `actor_owners` directly:
- `settingsAccountFeature.group.helpers.js`
- `chatStartFeature.group.js`
- `chatFeature.group.js`
- `chatInboxFeature.group.js`
- `vports.group.js`
- `social.group.helpers.js`
- `settingsProfileFeature.group.helpers.js`
- `publicFeature.group.helpers.js`
- `schemaIntegrity.group.js`
- `chatConversationFeature.group.helpers.js`
- `posts.group.helpers.js`
- `actorSystem.group.js`
- `profilesFeature.group.helpers.js`
- `profilesKindsFeature.group.helpers.js`
- `ensureActorContext.js`
- `ensureBookingSeed.js`
- `ensureVportSeed.js`

**Status:** All diagnostic. No authorization decisions made. Safe to leave as-is under dev-only build guard.

---

## FULL actor_owners REFERENCE CLASSIFICATION

| File | Lines | Classification |
|---|---|---|
| `booking/controllers/assertActorOwnsVportActor.controller.js` | 54 | Valid authorization boundary (via DAL) |
| `booking/controllers/assertSessionOwnsVportActor.controller.js` | — | Valid authorization boundary (via DAL) |
| `booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js` | 22–28 | Valid DAL read |
| `booking/dal/readOwnerLinkByActorAndSession.dal.js` | 39–45 | Valid DAL read |
| `upload/controllers/createPost.controller.js` | 38–46 | **DAL authorization violation** |
| `notifications/publish.js` | 64–72, 133–141 | **DAL authorization violation** (×2) |
| `portfolio/setup.js` | 39–58 | **Incomplete ownership check** (no user_id) |
| `reviews/setup.js` | 44–60 | **Incomplete ownership check** (no user_id) |
| `vportDashboard/dal/read/actorOwners.read.dal.js` | 8–14 | Valid DAL read (duplicated) |
| `settings/vports/dal/actorOwners.read.dal.js` | 8–15 | Valid DAL read (duplicated) |
| `profiles/kinds/vport/dal/rates/actorOwners.read.dal.js` | 9–13 | Valid DAL read (duplicated) |
| `wanders/core/dal/read/actorOwners.read.dal.js` | 10–29 | Valid DAL read (duplicated) |
| `settings/vports/dal/vports.write.dal.js` | 44, 75, 106 | owner_user_id secondary filter (deprecated field) |
| `settings/vports/dal/vports.read.dal.js` | 111, 134 | owner_user_id secondary filter (deprecated field) |
| `join/dal/barberVport.read.dal.js` | 10, 26 | owner_user_id legacy pattern |
| `vport/dal/vport.core.dal.js` | 126, 153 | owner_user_id legacy pattern |
| `notifications/inbox/controller/resolveVportOwnerActor.controller.js` | 8 | Valid controller read |
| `state/identity/identity.read.dal.js` | 148–151 | Valid DAL read |
| `auth/onboarding/dal/actorOwnerCreate.dal.js` | 6–14 | Valid write (upsert ownership link) |
| `vportDashboard/dashboard/cards/team/dal/vportTeam.read.dal.js` | 47–57 | Valid DAL read (enrichment, not auth) |
| `flyerBuilder/designStudio/dal/designStudio.read.dal.js` | 7 | Valid DAL read |
| `CentralFeed/dal/feed.read.debugPrivacyRows.dal.js` | 47–52 | Dev/diagnostic |
| `engines/booking/src/dal/actor.read.dal.js` | 39–46 | Valid engine DAL read |
| All `dev/diagnostics/` files | various | Dev/diagnostic only |
| All comment-only references | various | Comment only |

---

## OWNERSHIP INFERENCE VIOLATIONS INVENTORY

### profileId used as ownership input
| File | Line | Pattern | Assessment |
|---|---|---|---|
| `booking/controllers/assertActorOwnsVportActor.controller.js` | 49 | `actor.profile_id → user_id in actor_owners` | Technically valid (profile_id = auth.uid()), contract drift |
| `vportDashboard/.../updateVportBooking.controller.js` | 40, 65, 149 | `profile_id → resolveVportActorFromProfileId → actorId → gate` | Acceptable: uses profile_id to resolve actorId, then gates |
| `vportDashboard/.../createOwnerBooking.controller.js` | 30, 33, 46 | `resource.profile_id → getVportActorIdByProfileIdDAL` | Acceptable: profile_id used as lookup key, not ownership decision |

### userId / owner_user_id used in WHERE clauses (ownership filter)
| File | Lines | Pattern | Assessment |
|---|---|---|---|
| `settings/vports/dal/vports.write.dal.js` | 44, 75, 106 | `.eq("owner_user_id", userId)` | Deprecated field — DAL making ownership assertion |
| `settings/vports/dal/vports.read.dal.js` | 111, 134 | `.eq("owner_user_id", userId)` | Same |
| `join/dal/barberVport.read.dal.js` | 10, 26 | `.eq("owner_user_id", userId)` | Legacy pattern |
| `vport/dal/vport.core.dal.js` | 126, 153 | `.eq("owner_user_id", user.id)` | Legacy pattern |

### session.user.id used directly as actor_owners.user_id
| File | Lines | Pattern | Assessment |
|---|---|---|---|
| `upload/controllers/createPost.controller.js` | 42 | `.eq('user_id', user.id)` | Correct value (auth.uid()), wrong structure (inline query) |
| `notifications/publish.js` | 69, 138 | `.eq('user_id', session.user.id)` | Correct value (auth.uid()), wrong structure (inline query) |

---

## VportDashboard: actorId vs profileId Usage Assessment

**Overall verdict: COMPLIANT**

VportDashboard controllers consistently follow the correct pattern:
1. Accept `callerActorId` and `targetActorId` from identity (never from URL or props)
2. Call `assertActorOwnsVportActorController({ requestActorId, targetActorId })` as first step
3. Resolve `profileId` from `actorId` ONLY AFTER the ownership gate passes
4. Pass `profileId` to DALs for read/write operations (as a join key, not an auth decision)

The only structural issue is F-001: the gate itself uses `actor.profile_id` as the `user_id` lookup key. This is internal to the gate — callers pass actorIds correctly.

---

## PROPOSED CENTRAL AUTHORIZATION MODULE

### Location
`engines/identity/src/authorization/assertActorOwnsActor.js`

### API surface
```javascript
/**
 * Verifies requestActorId owns targetActorId via vc.actor_owners.
 * Ownership resolution stays entirely within actor_owners — no actors table join.
 *
 * @param {{ requestActorId: string, targetActorId: string }} params
 * @returns {{ ok: true, mode: 'self' | 'actor_owner' }}
 * @throws if requestActorId is not kind=user, actor is void, or no ownership link found
 */
export async function assertActorOwnsActorEngine({ requestActorId, targetActorId })
```

### Implementation shape
```javascript
// 1. Fetch requester from actors (kind check only — no profile_id extraction)
const requesterActor = await getActorByIdDAL({ actorId: requestActorId })
if (!requesterActor || requesterActor.is_void) throw ...
if (requesterActor.kind !== 'user') throw ...

// 2. Self-ownership shortcut (kind already confirmed above)
if (String(requestActorId) === String(targetActorId)) return { ok: true, mode: 'self' }

// 3. Resolve requester's user_id from actor_owners (no profile_id)
const requesterOwnerRow = await readActorOwnerRowByActorIdDAL({ actorId: requestActorId })
if (!requesterOwnerRow) throw ...

// 4. Verify requester's user_id owns targetActorId
const targetOwnerRow = await readActorOwnerRowByActorAndUserIdDAL({
  actorId: targetActorId,
  userId: requesterOwnerRow.user_id     // ← from actor_owners, not actor.profile_id
})
if (!targetOwnerRow || targetOwnerRow.is_void) throw ...

return { ok: true, mode: 'actor_owner', ownerLink: targetOwnerRow }
```

### DAL consolidation (same module)
```
engines/identity/src/dal/actorOwners/
  readActorOwnerRowByActorIdDAL.js           // replaces vportDashboard variant
  readActorOwnerRowByActorAndUserIdDAL.js    // replaces booking + rates variants
  readActorOwnersByUserIdDAL.js              // replaces settings/vports variant
  readPrimaryUserActorOwnerByUserIdDAL.js    // replaces wanders variant
```

---

## RECOMMENDED MIGRATION ORDER

### Phase 1 — Consolidate DALs (no behavior change, structural cleanup)

**Order:**
1. Create `engines/identity/src/dal/actorOwners/` with all 4 canonical variants
2. Update `vportDashboard/dal/read/actorOwners.read.dal.js` → re-export from engine
3. Update `settings/vports/dal/actorOwners.read.dal.js` → re-export from engine
4. Update `profiles/kinds/vport/dal/rates/actorOwners.read.dal.js` → re-export from engine
5. Update `wanders/core/dal/read/actorOwners.read.dal.js` → re-export from engine
6. Delete feature-local files (callers import from engine)

**Risk:** Low. No behavior change. Structural re-export.

---

### Phase 2 — Fix Inline Queries (high priority, security-adjacent)

**Order:**
1. **`upload/controllers/createPost.controller.js`** — replace inline actor_owners query with `assertActorOwnsActorEngine` (or interim: route through `assertActorOwnsVportActorController`)
2. **`notifications/publish.js`** — extract ownership check into a dedicated controller or require callers to pre-verify; remove both inline queries (single + batch)
3. **`portfolio/setup.js`** — add `user_id` binding to `isActorOwner` callback OR rename to `actorExists` and document as non-security check
4. **`reviews/setup.js`** — same as portfolio

**Risk:** Medium. Behavioral changes to authorization path. Test each against booking + post + notification flows.

---

### Phase 3 — Migrate Canonical Ownership Gate Out of `booking/`

**Order:**
1. Create `engines/identity/src/authorization/assertActorOwnsActor.js` with contract-compliant implementation (resolves user_id via actor_owners, not profile_id)
2. Update `assertActorOwnsVportActorController` to delegate to engine function
3. Migrate all callers from `booking/controllers/assertActorOwnsVportActor` → `engines/identity/authorization/assertActorOwnsActor`
4. Retire the session-based controller (`assertSessionOwnsVportActor`) by routing callers through identity → actorId → engine gate

**Caller list (confirmed):**
```
features/vportDashboard/ (8+ controllers)
features/settings/vports/ (4 controllers)
features/settings/privacy/ (1 controller)
features/profiles/kinds/vport/ (10+ controllers)
features/upload/  ← Phase 2 will add this
features/notifications/  ← Phase 2 will add this
```

**Risk:** High. Wide surface. Must trace each caller to confirm actorId resolution before migration.

---

### Phase 4 — Remove Deprecated owner_user_id from DALs (DB AUDIT scope)

**Order:**
1. Confirm with DB audit that all `vports` rows with `owner_user_id` also have `actor_owners` coverage
2. Remove `.eq("owner_user_id", userId)` from `vports.write.dal.js` (lines 44, 75, 106)
3. Remove `.eq("owner_user_id", userId)` from `vports.read.dal.js` (lines 111, 134)
4. Audit `join/dal/barberVport.read.dal.js` and `vport/dal/vport.core.dal.js`
5. Flag for `TICKET-PLATFORM-RLS-001` — column deprecation tracking

**Risk:** Medium. Requires DB audit confirmation first. Do not execute until Phase 3 is complete.

---

## SUMMARY COUNTS

| Classification | Count |
|---|---|
| Valid authorization boundary | 4 |
| Duplicated ownership logic (DAL) | 5 |
| DAL authorization violation | 3 |
| Incomplete ownership check | 2 |
| Deprecated field in active use | 6 |
| Dev/diagnostic only | 20+ |
| Comment only | 20+ |

| Severity | Findings |
|---|---|
| HIGH | 2 (F-002, F-003) |
| MEDIUM | 4 (F-001, F-004, F-005, F-006) |
| LOW | 2 (F-007, F-008) |
| INFO | 2 (F-009, F-010) |

**DB AUDIT NOTES:** 1 deferred (F-008 — owner_user_id column deprecation)

---

*Written by architecture review pass — 2026-06-08*  
*No DB objects modified. No code patched. Read-only analysis.*
