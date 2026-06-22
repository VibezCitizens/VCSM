---
# profiles — CURRENT_STATUS.md
# Last Updated: 2026-06-02
# Source: Audit sprint 2026-05-22 to 2026-05-23 (CEREBRO-triggered)
# Status: CURRENT SOURCE OF TRUTH

## Feature Status

Status: ACTIVE
Security Tier: HIGH
Feature Path: apps/VCSM/src/features/profiles/
Size: 416 files (72 DAL, 61 controller, 132 component files)

## Command Audit Status

| Command | Status | Date | Open Findings |
|---|---|---|---|
| VENOM | COMPLETE | 2026-05-22 | VF-001 CLOSED; VF-002 CLOSED; VF-003 OPEN (HIGH); VF-004 OPEN (HIGH); VF-005 OPEN (HIGH); VF-006 OPEN (MEDIUM) |
| SENTRY | COMPLETE | 2026-05-22 to 2026-05-23 | SF-001 CLOSED; SF-002 OPEN (HIGH); SF-003 OPEN (HIGH); SF-004 OPEN (HIGH); SF-005 OPEN (MEDIUM); SF-006 OPEN (MEDIUM) |
| CARNAGE | PRESENT | 2026-05-22 | Migration `20260522010000_vc_posts_insert_ownership_rls.sql` endorsed; STAGING PENDING |
| DB | PRESENT | 2026-05-22 | DR-001 CRITICAL — `vc.posts` INSERT RLS gap (pre-existing); multiple tables RLS unverified |
| LOKI | PRESENT | 2026-05-22 | Serial waterfall (slug→kind→gate→posts); no post cache — WATCH, non-blocking |
| KRAVEN | COMPLETE | 2026-05-22 | Hot path bottlenecks documented; non-blocking for code release |
| IRONMAN | COMPLETE | 2026-05-22 | Ownership PARTIAL — post data reads conflicted; photo reactions ownership unresolved; no Logan owner doc |
| THOR | PRESENT | 2026-05-23 | Code release CONDITIONAL PASS; DB migration BLOCKED until staged |
| LOGAN | PRESENT | 2026-05-22 | MAJOR DRIFT; no `vcsm.profiles.owner.md` exists; non-blocking |
| ARCHITECT | PRESENT | 2026-05-22 | Stale counts, naming violations; non-blocking |
| FALCON | OUT OF SCOPE | — | Source document declares N/A |
| BLACKWIDOW | MISSING | — | Not run this audit cycle |
| SHIELD | NOT_STARTED | — | — |

## Release Gate State (THOR 2026-05-23)

| Gate | Status | Notes |
|---|---|---|
| No CRITICAL unresolved security findings (code) | CONDITIONAL PASS | VF-001/002 closed; DR-001 pre-existing; Carnage migration pending staging |
| No contract violations in changed files | PASS | SF-001 closed via SENTRY re-verification |
| Boundary contract respected | PASS | All 4 changed files inside `apps/VCSM/src/features/profiles/` |
| Actor ownership checks — write paths (changed files) | PASS | `upsertVportServices` now calls `assertActorOwnsVportActorController` |
| No raw UUIDs in public-facing routes (changed files) | PASS | `UsernameProfileRedirect` no longer resolves to UUID |
| DB migration (vc.posts INSERT RLS) | BLOCKED | Endorsed by Carnage; staging PENDING |
| Feed attribution (vc.posts INSERT RLS gap) | CONDITIONAL | DR-001 pre-existing; application guards in place; API-bypass path exists until migration staged |

## Changes Applied This Sprint (THOR record)

| File | Change | Finding Closed |
|---|---|---|
| `features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js` | Added `assertActorOwnsVportActorController(identityActorId, targetActorId)` | VF-002 / R-BLOCK-01 |
| `features/profiles/kinds/vport/hooks/services/useUpsertVportServices.js` | Added `useIdentity` import; resolved `identityActorId`; threaded to controller | VF-002 / R-BLOCK-01 |
| `features/profiles/screens/UsernameProfileRedirect.jsx` | Simplified to pass slug directly; removed UUID-exposing resolution | VF-001 / R-BLOCK-02 |
| `features/profiles/controller/post/getActorPosts.controller.js` | Changed `PostModel` import from screens layer to `model/postCanonical.model` | SF-001 / R-BLOCK-04 |

## Pending Migration

| Migration | Status | Endorser | Notes |
|---|---|---|---|
| `20260522010000_vc_posts_insert_ownership_rls.sql` | PENDING STAGING | CARNAGE | Rollback = FULL (DROP + re-CREATE original policy; no data affected) |

## Open High-Severity Findings

### OPEN — VF-003 (HIGH)
`checkActorOwnership.controller.js` is a hollow pass-through to DAL. Ownership check business logic lives in DAL layer — architectural security debt. All callers of `checkActorOwnershipController` affected.

### OPEN — VF-004 (HIGH)
`useProfileGate.js` enforces profile privacy entirely client-side. Client gate can be bypassed via devtools. Relies on unverified RLS on `vc.posts` for server-side enforcement. DB audit required.

### OPEN — VF-005 (HIGH)
`ActorProfileScreen.jsx` imports `ActorProfileProdDebugPanel` debug component. Component is bundled in production build regardless of render guard. Should move to `zNOTFORPRODUCTION/debuggers/`.

### OPEN — DR-001 (CRITICAL — pre-existing, DB-blocked)
`vc.posts` INSERT RLS gap: any authenticated user can POST as any actor via direct Supabase API call. Application-layer guards in place but DB-level enforcement absent until migration is staged.

### OPEN — SF-002 through SF-006 (HIGH to MEDIUM)
- SF-002: `checkActorOwnership` ownership logic in DAL (HIGH architectural debt)
- SF-003: `fetchPostsForActor.dal.js` god method — 262-line multi-schema DAL (HIGH, major refactor)
- SF-004: Post data DALs owned by profiles — cross-feature boundary (HIGH)
- SF-005: Re-export controller in screens layer (MEDIUM)
- SF-006: Adapter naming violations x3 (MEDIUM)
---
