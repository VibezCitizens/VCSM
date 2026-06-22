# VCSM DAL — Block System

_Domain:_ `vcsm`
_System:_ `dal`
_Topic:_ `block`
_Filename:_ `vcsm.dal.block.md`

---

## 1 Purpose

Documents the data access layer for the `block` feature inside `apps/VCSM/`. This feature provides bidirectional actor-to-actor block enforcement used across profiles, feed, chat, follow flows, and friend ranking. It reads and writes `moderation.blocks` via direct Supabase queries and RPCs. It is a safety-critical system — block status gates profile visibility, content interaction, and messaging.

---

## 2 Scope

**Included:**
- DAL files in `apps/VCSM/src/features/block/dal/`
- Model layer (not present — DAL returns flat primitives)
- Controllers in `apps/VCSM/src/features/block/controllers/`
- Adapters in `apps/VCSM/src/features/block/adapters/`
- Hooks in `apps/VCSM/src/features/block/hooks/`
- UI components in `apps/VCSM/src/features/block/ui/`
- Dead code findings from ARCHITECT live scan (2026-05-11)

**Excluded:**
- The `block_actor` / `unblock_actor` RPC definitions (live in Supabase `moderation` schema)
- Dev-diagnostics consumers (`dev/diagnostics/`) — documented but not production scope

---

## 3 Ownership

**Application Scope:** VCSM
**Code Root:** `apps/VCSM/src/features/block/`
**Related Engines:** None — block is fully self-contained within the VCSM feature boundary
**Primary Consumers:** profiles feature, feed feature, chat feature, social/friend feature, settings/privacy feature

---

## 4 Entry Points

**DAL files:**
- `features/block/dal/block.check.dal.js` — bidirectional block status reads from `moderation.blocks`
- `features/block/dal/block.read.dal.js` — bulk read queries (dev-diagnostics + production filtering)
- `features/block/dal/block.write.dal.js` — RPC-based block/unblock mutations

**Controllers:**
- `features/block/controllers/blockActor.controller.js` — block/unblock orchestration with guard checks
- `features/block/controllers/getBlockStatus.controller.js` — exposes `ctrlGetBlockStatus` to hooks
- `features/block/controllers/getBlockedActorSet.controller.js` — bulk blocked-actor resolution for ranking

**Adapters:**
- `features/block/adapters/hooks/useBlockActorAction.adapter.js`
- `features/block/adapters/hooks/useBlockStatus.adapter.js`
- `features/block/adapters/ui/ActorActionsMenu.jsx`
- `features/block/adapters/ui/BlockConfirmModal.adapter.js`

**Hooks:**
- `features/block/hooks/useBlockActions.js`
- `features/block/hooks/useBlockActorAction.js`
- `features/block/hooks/useBlockStatus.js`

**RPCs:**
- `moderation.block_actor` — called by `blockActor` in `block.write.dal.js`
- `moderation.unblock_actor` — called by `unblockActor` in `block.write.dal.js`

---

## 5 Data Flow

### Block Status Check (read path)

```
useBlockStatus.js
  → ctrlGetBlockStatus (getBlockStatus.controller.js)
    → checkBlockStatus (block.check.dal.js)
      → moderation.blocks (Supabase read)
        → returns { isBlocked, blockedByMe, blockedMe }
```

Consumed by: `ActorProfileHeader`, `ActorActionsMenu`, `ConversationView`, `useProfileGate`, follow controllers.

### Block Action (write path)

```
useBlockActions.js / useBlockActorAction.js
  → blockActorController / unblockActorController (blockActor.controller.js)
    → checkBlockStatus guard (block.check.dal.js) — pre-check
    → blockActorDAL / unblockActorDAL (block.write.dal.js)
      → moderation.block_actor / moderation.unblock_actor RPC
```

### Bulk Block Filter (friend ranking path)

```
getTopFriendActorIds.controller.js / getTopFriendCandidates.controller.js
  → getBlockedActorSet.controller.js
    → filterBlockedActors (block.read.dal.js)
      → moderation.blocks (bulk OR query)
        → returns Set of blocked actorIds
```

### Dev Diagnostics Path (non-production)

```
DevDiagnosticsScreen.jsx
  → runAllDiagnostics.js
    → diagnosticsGroups.part1.js
      → block.group.js (dev/diagnostics)
        → fetchActorsIBlocked / fetchActorsWhoBlockedMe / fetchBlockGraph (block.read.dal.js)
          → moderation.blocks (direct reads)
```

---

## 6 Source of Truth

| Data | Schema | Table / RPC | Notes |
|---|---|---|---|
| Block relationships | `moderation` | `blocks` | All queries filter `status = 'active'` |
| Block/unblock mutations | `moderation` | `block_actor` / `unblock_actor` RPC | Server-side follow deactivation + friend_ranks cleanup handled by RPC |

> **Schema note:** All DAL files use `.schema("moderation").from("blocks")`. The original doc incorrectly listed the table as `blocks` with no schema prefix — corrected here.

---

## 7 UI States

Block status is consumed as a prop/value by rendering components — no standalone block screen exists. States are owned by consuming feature screens.

| State | Where Handled | Notes |
|---|---|---|
| Loading | `useBlockStatus.js` — returns `loading: true` until resolved | Safe with null IDs: returns `{ loading: false, isBlocked: false, blockedMe: false }` |
| Blocked | `ActorProfileHeader`, `ConversationView`, `useProfileGate` | Hides content / shows blocked state |
| Not blocked | Default render path | Normal UI |
| Error | `blockActor.controller.js` — throws on RPC failure | Callers handle via try/catch |
| Confirm | `BlockConfirmModal.adapter.jsx` | User-facing confirmation before block action |

---

## 8 Dependencies

**Internal modules:**
- `features/profiles/` — consumes `useBlockStatus` for profile gate
- `features/feed/` — consumes `useBlockActorAction` for feed block action
- `features/chat/` — consumes `useBlockStatus` for conversation block check
- `features/social/friend/` — consumes `ctrlGetBlockStatus` in follow + follow-request controllers
- `features/settings/privacy/` — consumes `ctrlUnblockActor` for privacy settings screen
- `features/block/index.js` — feature barrel exporting controller aliases

**External services:**
- Supabase — `moderation` schema, `blocks` table, `block_actor` and `unblock_actor` RPCs

**Database objects:**
- `moderation.blocks` — block relationship table, filtered by `status = 'active'`
- `moderation.block_actor` — RPC handling block + server-side cleanup
- `moderation.unblock_actor` — RPC handling unblock + server-side cleanup

---

## 9 Rules / Invariants

1. **All block queries must filter `status = 'active'`.** Soft-deleted or expired blocks must never surface in status checks.
2. **Block status checks are bidirectional.** `checkBlockStatus(A, B)` returns both `blockedByMe` (A blocked B) and `blockedMe` (B blocked A). UI must respect both directions.
3. **The write path always pre-checks block status before calling the RPC.** `blockActor.controller.js` calls `checkBlockStatus` as a guard before invoking `blockActorDAL` or `unblockActorDAL`. Do not bypass this guard.
4. **`isBlocked` (DAL export) is dead code — do not import it.** Use `checkBlockStatus` and destructure `{ isBlocked }` from its return value. The DAL export `isBlocked` is a redundant function with zero callers.
5. **`toggleBlockActor` (DAL export) is dead code — do not import it.** The toggle pattern is handled at the controller layer. The DAL export has zero callers.
6. **`fetchActorsIBlocked`, `fetchActorsWhoBlockedMe`, `fetchBlockGraph` are dev-diagnostics-only.** They must not be imported in any production feature. Restrict to `dev/diagnostics/`.
7. **Block write path uses RPCs — never direct table inserts.** The `block_actor` and `unblock_actor` RPCs handle server-side cleanup (follow deactivation, friend_ranks). Direct inserts into `moderation.blocks` would bypass this cleanup.
8. **`useBlockStatus` is safe with null IDs.** It returns `{ loading: false, isBlocked: false, blockedMe: false }` when either actor ID is null. Callers do not need to null-guard before calling it.
9. **Cross-feature block access must go through `features/block/adapters/` or the barrel `features/block/index.js`.** Direct DAL imports from other features are forbidden.

---

## 10 Failure Risks

| Risk | ID | Severity | Status | Handoff |
|---|---|---|---|---|
| `isBlocked` is a dead DAL export — zero callers | RISK-1 | LOW | OPEN | IRONMAN |
| `toggleBlockActor` is a dead DAL export — zero callers | RISK-2 | LOW | OPEN | IRONMAN |
| `fetchActorsIBlocked/fetchActorsWhoBlockedMe/fetchBlockGraph` are dev-only — must not leak to production | RISK-3 | MEDIUM | OPEN | SENTRY |
| Schema was undocumented — all queries use `moderation.blocks` not `blocks` | RISK-4 | LOW | CORRECTED | — |

**RISK-1:** `isBlocked` (block.check.dal.js) — confirmed zero imports in all of `apps/VCSM/src`. The function runs an identical query to `checkBlockStatus` but returns a plain boolean instead of the richer object shape. Callers universally prefer `checkBlockStatus`. Safe to remove after IRONMAN review.

**RISK-2:** `toggleBlockActor` (block.write.dal.js) — confirmed zero imports. The toggle logic is handled by the controller calling `blockActorDAL` or `unblockActorDAL` based on current state. Safe to remove after IRONMAN review.

**RISK-3:** Three read functions (`fetchActorsIBlocked`, `fetchActorsWhoBlockedMe`, `fetchBlockGraph`) have exactly one caller each: `dev/diagnostics/groups/block.group.js`. They are not dead, but their import path must never appear outside the `dev/` folder. Any future production feature needing this data should go through a controller, not import these DAL functions directly.

---

## 11 Debug Notes

- Verify `checkBlockStatus` callers: `grep -rn "checkBlockStatus" apps/VCSM/src --include="*.js" --include="*.jsx"`
- Verify dead exports: `grep -rn "isBlocked\b" apps/VCSM/src --include="*.js" --include="*.jsx" | grep "import"` — should return zero DAL imports
- Verify `toggleBlockActor` is unused: `grep -rn "toggleBlockActor" apps/VCSM/src --include="*.js" --include="*.jsx"` — should only appear in its own definition
- Verify dev-only functions stay in dev: `grep -rn "fetchActorsIBlocked\|fetchActorsWhoBlockedMe\|fetchBlockGraph" apps/VCSM/src --include="*.js" --include="*.jsx"` — only `dev/diagnostics/` paths should appear
- Block status is not cached — every call hits Supabase. No TTL or Zustand store wraps `checkBlockStatus`.
- `useBlockStatus.js` is safe to call with null actorIds — early-returns `{ isBlocked: false, blockedMe: false }`.

---

## 12 Files Map

| File | Layer | Status | Notes |
|---|---|---|---|
| `features/block/dal/block.check.dal.js` | DAL | ACTIVE (partial) | `checkBlockStatus` active; `isBlocked` DEAD |
| `features/block/dal/block.read.dal.js` | DAL | ACTIVE (partial) | `filterBlockedActors` active; 3 functions DEV-ONLY |
| `features/block/dal/block.write.dal.js` | DAL | ACTIVE (partial) | `blockActor` + `unblockActor` active; `toggleBlockActor` DEAD |
| `features/block/controllers/blockActor.controller.js` | Controller | ACTIVE | Block/unblock orchestrator. Imports `blockActor` + `unblockActor` from write DAL. |
| `features/block/controllers/getBlockStatus.controller.js` | Controller | ACTIVE | Exposes `ctrlGetBlockStatus` — wrapper around `checkBlockStatus`. |
| `features/block/controllers/getBlockedActorSet.controller.js` | Controller | ACTIVE | Bulk blocked-set resolution via `filterBlockedActors`. |
| `features/block/adapters/hooks/useBlockActorAction.adapter.js` | Adapter | ACTIVE | Hook adapter for block action. |
| `features/block/adapters/hooks/useBlockStatus.adapter.js` | Adapter | ACTIVE | Hook adapter for status reads. |
| `features/block/adapters/ui/ActorActionsMenu.jsx` | Adapter/UI | ACTIVE | Block/unblock menu. Consumes `useBlockStatus`. |
| `features/block/adapters/ui/BlockConfirmModal.adapter.js` | Adapter/UI | ACTIVE | Confirm modal before block action. |
| `features/block/hooks/useBlockActions.js` | Hook | ACTIVE | Block + unblock lifecycle management. |
| `features/block/hooks/useBlockActorAction.js` | Hook | ACTIVE | Single-action hook for blocking an actor. |
| `features/block/hooks/useBlockStatus.js` | Hook | ACTIVE | Block status lifecycle — null-safe, calls `ctrlGetBlockStatus`. |
| `features/block/guards/BlockGate.jsx` | Guard/UI | ACTIVE | Guard component using `useBlockStatus` internally. |
| `features/block/ui/BlockButton.jsx` | UI | ACTIVE | Toggle button rendering block/unblock state. |
| `features/block/ui/BlockConfirmModal.jsx` | UI | ACTIVE | Source confirmation modal exported through adapter variant. |
| `features/block/ui/BlockedState.jsx` | UI | ACTIVE | Blocked-state presentation component exported from barrel. |
| `features/block/index.js` | Barrel | ACTIVE | Exports controller aliases: `blockActorController`, `unblockActorController`, `toggleBlockActorController`. |

---

## Audit References

Latest Engine Audit: N/A — block feature has no shared engine. Self-contained within `apps/VCSM/`.
Previous Engine Audit: N/A

---

## Native Parity Notes

**Native Relevance:** YES
**Falcon Review:** REQUIRED
**Reason:** Block enforcement is a safety-critical user-facing flow. Native must gate profile visibility, feed content, chat composition, and follow actions identically to the web app. The `moderation.blocks` table and `block_actor`/`unblock_actor` RPCs are the same data source for both surfaces. Any drift between native and web block enforcement creates a safety gap.
**Related Native Module:** Profiles, Feed, Chat, Social/Follow
**Native Transfer Status:** Not confirmed — Falcon review required to verify native handles `isBlocked`, `blockedMe`, and bidirectional status correctly.
**Known Native Gaps:** Unknown — pending Falcon audit.
**Winter Soldier Handoff:** Not required at this time.

---

### LOGAN → FALCON HANDOFF

Logan Doc: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md`
System: Block / Moderation
Application Scope: VCSM
Reason Falcon Review Is Required: Block enforcement gates profile visibility, feed interaction, chat composition, and follow actions. Native must enforce identical bidirectional block status (`isBlocked`, `blockedMe`, `blockedByMe`) as the web app. Any parity gap is a safety issue.
Behavior Changed: No behavior changed — this is a documentation audit. Falcon should verify existing parity.
Data Contracts Changed: No
Trust Boundaries Changed: No
Affected Native Module: Profiles, Feed, Chat, Follow/Friend
Recommended Falcon Priority: HIGH — safety-critical moderation feature
Related Evidence: ARCHITECT live scan 2026-05-11, `zNOTFORPRODUCTION/_ACTIVE/planning/may/11/11-02.md`

Native Documentation Verification: PENDING FALCON

---

## 13 Change Log

### 2026-05-11

Task: ARCHITECT dead code audit + LOGAN canonical doc restructure for block DAL.
Application Scope: VCSM
Prompt Registry Entry: `zNOTFORPRODUCTION/_ACTIVE/planning/may/11/11-02.md`
Code Status Before: Doc in ARCHITECT report format. Reported 0 risk findings. Table schema incorrect (`blocks` instead of `moderation.blocks`).
Code Status After: Doc restructured to Logan canonical 13-section format. 4 risk findings documented (2 dead exports, 1 dev-only leak risk, 1 schema correction). Native parity flagged for Falcon.
Files Changed:
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md` — full restructure
- `zNOTFORPRODUCTION/_ACTIVE/planning/may/11/11-02.md` — prompt provenance appended

Command Evidence:
- ARCHITECT: live grep confirmed `isBlocked` has zero imports (RISK-1)
- ARCHITECT: live grep confirmed `toggleBlockActor` has zero imports (RISK-2)
- ARCHITECT: live grep confirmed `fetchActorsIBlocked/fetchActorsWhoBlockedMe/fetchBlockGraph` are dev-diagnostics-only (RISK-3)
- ARCHITECT: read `block.check.dal.js`, `block.read.dal.js`, `block.write.dal.js` — confirmed `moderation` schema prefix on all queries

Architecture Contracts Checked: PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced.
Security / Runtime / DB Notes: `moderation.blocks` confirmed. RPCs `block_actor` and `unblock_actor` handle server-side cleanup — must not be bypassed with direct inserts. Block status is not cached.
Validation: All grep traces confirmed. No production code modified.
Documentation Truth Status: VERIFIED for current code state. Dead exports (RISK-1, RISK-2) open pending IRONMAN. Dev-only leak risk (RISK-3) open pending SENTRY. Native parity pending Falcon.

---

## LOGAN REVIEW REPORT

**Task:** ARCHITECT dead code scan + Logan canonical restructure of block DAL doc.
**Application Scope:** VCSM
**Documentation Scope:** VCSM
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced
**Architecture Contract:** ARCHITECTURE.md — consulted

### DOCUMENTATION SCOPE GATE

| Documentation Area | In Scope | Update Allowed | Reason |
|---|---|---|---|
| `vcsm/dal/vcsm.dal.block.md` | YES | YES | VCSM scope, documentation audit task |
| Engine audit files | NO | NO | No engine code was modified |
| Wentrex docs | NO | NO | Out of boundary |
| Traffic docs | NO | NO | Out of boundary |

### RELEVANT DOCS

| Doc Path | Status | Truth Status | Notes |
|---|---|---|---|
| `logan/vcsm/dal/vcsm.dal.block.md` | UPDATED | VERIFIED | Restructured this session |

### CODE REVIEWED

| Code Path | Purpose | Status |
|---|---|---|
| `features/block/dal/block.check.dal.js` | Check DAL — bidirectional read | Verified — `checkBlockStatus` active, `isBlocked` DEAD |
| `features/block/dal/block.read.dal.js` | Read DAL — bulk reads | Verified — `filterBlockedActors` active, 3 functions dev-only |
| `features/block/dal/block.write.dal.js` | Write DAL — RPCs | Verified — `blockActor` + `unblockActor` active, `toggleBlockActor` DEAD |
| `features/block/controllers/blockActor.controller.js` | Block/unblock controller | Verified — imports correct DAL functions |
| `features/block/controllers/getBlockStatus.controller.js` | Status controller | Verified — wraps `checkBlockStatus` |
| `features/block/controllers/getBlockedActorSet.controller.js` | Bulk filter controller | Verified — calls `filterBlockedActors` |
| `features/block/hooks/useBlockStatus.js` | Status hook | Verified — null-safe, calls `ctrlGetBlockStatus` |
| `dev/diagnostics/groups/block.group.js` | Dev diagnostics consumer | Verified — only caller of 3 read functions |

### COMMAND EVIDENCE REGISTRY

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | (inline this session) | Dead code verification, schema audit | PRESENT |
| SENTRY | — | RISK-3: dev-only functions must not leak to production | MISSING |
| IRONMAN | — | RISK-1 + RISK-2: dead export ownership decisions | MISSING |
| FALCON | — | Native block parity review required | MISSING |
| VENOM | — | Security review of block enforcement — recommended | MISSING |
| THOR | — | N/A this session | N/A |
| LOKI | — | Optional — runtime verify block status on profile/chat load | MISSING |
| KRAVEN | — | N/A this session | N/A |
| CARNAGE | — | N/A this session | N/A |

### DRIFT FINDINGS

**LOGAN DRIFT FINDING — DF-01**
Finding ID: DF-01
Doc Path: `logan/vcsm/dal/vcsm.dal.block.md`
Code Path: `features/block/dal/block.check.dal.js` — `isBlocked` export
Drift Status: NOT PREVIOUSLY DOCUMENTED
Drift Severity: LOW
Documentation Truth Status: CORRECTED
Current doc behavior: Listed as active export with no risk flag.
Actual code behavior: Zero imports anywhere. Confirmed dead.
Risk: Maintenance confusion — future developer may import it expecting it to be the canonical check function.
Recommended documentation update: APPLIED — marked DEAD, DELETE CANDIDATE, routed to IRONMAN.

**LOGAN DRIFT FINDING — DF-02**
Finding ID: DF-02
Doc Path: `logan/vcsm/dal/vcsm.dal.block.md`
Code Path: `features/block/dal/block.write.dal.js` — `toggleBlockActor` export
Drift Status: NOT PREVIOUSLY DOCUMENTED
Drift Severity: LOW
Documentation Truth Status: CORRECTED
Current doc behavior: Listed as active export with no risk flag.
Actual code behavior: Zero imports anywhere. Confirmed dead.
Risk: Low — but creates confusion alongside active `blockActor`/`unblockActor` exports.
Recommended documentation update: APPLIED — marked DEAD, DELETE CANDIDATE, routed to IRONMAN.

**LOGAN DRIFT FINDING — DF-03**
Finding ID: DF-03
Doc Path: `logan/vcsm/dal/vcsm.dal.block.md`
Code Path: `features/block/dal/block.read.dal.js` — `fetchActorsIBlocked`, `fetchActorsWhoBlockedMe`, `fetchBlockGraph`
Drift Status: MAJOR DRIFT
Drift Severity: MEDIUM
Documentation Truth Status: CORRECTED
Current doc behavior: Listed as regular exports with call chain through `block.group.js` → `DevDiagnosticsScreen`. Not flagged as dev-only.
Actual code behavior: All three functions have exactly one caller: `dev/diagnostics/groups/block.group.js`. They are intentionally dev-only and must not appear in any production feature import path.
Risk: A developer reading the original doc would not know these are restricted to dev diagnostics.
Recommended documentation update: APPLIED — classified as DEV-DIAGNOSTICS ONLY, invariant rule added.

**LOGAN DRIFT FINDING — DF-04**
Finding ID: DF-04
Doc Path: `logan/vcsm/dal/vcsm.dal.block.md`
Code Path: All three DAL files
Drift Status: MAJOR DRIFT
Drift Severity: MEDIUM
Documentation Truth Status: CORRECTED
Current doc behavior: Table listed as `blocks` with no schema prefix.
Actual code behavior: All queries use `.schema("moderation").from("blocks")`.
Risk: Developer using the doc to query the table directly would hit the wrong schema.
Recommended documentation update: APPLIED — all references updated to `moderation.blocks`.

### README VIOLATION REPORT

No README files found in scope.

### PROMPT PROVENANCE STATUS

Prompt Logged: YES
Planning File: `zNOTFORPRODUCTION/_ACTIVE/planning/may/11/11-02.md`
Prompt Entry Timestamp: 2026-05-11

### ENGINE AUDIT STATUS

Engine Changed: NO — block is self-contained in `apps/VCSM/`. No shared engine involved.
Latest Audit: N/A
New Audit Required: NO
New Audit Path: N/A

### DOCUMENTATION STATUS: VERIFIED

### FINAL LOGAN STATUS: ALIGNED

**Recommended handoffs:**
- IRONMAN — RISK-1 (`isBlocked` dead export) + RISK-2 (`toggleBlockActor` dead export) — ownership + deletion decision
- SENTRY — RISK-3 (dev-only read functions must not leak to production imports)
- FALCON — native block parity review required (HIGH priority — safety-critical moderation feature)
- VENOM — recommended security review of block enforcement trust boundaries

### NATIVE PARITY ROUTING

| Logan Doc | Native Relevance | Falcon Review | Reason | Module File |
|---|---|---|---|---|
| `vcsm.dal.block.md` | YES | REQUIRED | Block enforcement is safety-critical — gates profile visibility, feed, chat, follow. Native must match web bidirectional enforcement. | Profiles, Feed, Chat, Follow |

---

## 14 Full Consumer Map — ARCHITECT Scan 2026-05-11

> Appended by ARCHITECT scan. Covers all models, controllers, hooks, components, and screens that touch any block DAL export — directly or through the block barrel, adapters, or satellite DALs.

---

### Import Path Legend

| Path | Meaning |
|---|---|
| `@/features/block/dal/block.check.dal` | Direct check DAL — internal to block feature only |
| `@/features/block/dal/block.read.dal` | Direct read DAL — internal to block feature only |
| `@/features/block/dal/block.write.dal` | Direct write DAL — internal to block feature only |
| `@/features/block` | Block barrel (`index.js`) — approved cross-feature surface |
| `@/features/block/adapters/hooks/useBlockStatus.adapter` | Hook adapter — approved cross-feature surface |
| `@/features/block/adapters/hooks/useBlockActorAction.adapter` | Hook adapter — approved cross-feature surface |
| `@/features/block/adapters/ui/ActorActionsMenu` | UI adapter — approved cross-feature surface |
| `@/features/block/adapters/ui/BlockConfirmModal.adapter` | UI adapter — approved cross-feature surface |
| Satellite DALs (`notifications/`, `profiles/`, `settings/`, `feed/`) | Own DALs reading `moderation.blocks` — see RISK-6 |

---

### 14.1 Models

| File | Functions Used | Consumed By | Status |
|---|---|---|---|
| `features/settings/privacy/models/blocks.model.js` | `modelBlockRows`, `modelBlockRow`, `modelActorRows`, `modelActorRow` | `settings/privacy/controller/Blocks.controller.js` | CORRECT — owned by settings/privacy feature, transforms its own DAL rows |

> No model layer exists in the core `features/block/` feature. Block DAL returns flat primitives — status values and actor ID sets. No domain transform is needed at the check/read/write DAL level.

---

### 14.2 Controllers

#### Core block controllers (internal — correct)

| File | Functions Exported | DAL Calls | Status |
|---|---|---|---|
| `features/block/controllers/blockActor.controller.js` | `blockActorController`, `unblockActorController`, `toggleBlockActorController` | `checkBlockStatus` (check DAL), `blockActor`/`unblockActor` (write DAL), `invalidateFeedBlockCache` (feed adapter — **see RISK-7**) | ACTIVE — RISK-7 flag |
| `features/block/controllers/getBlockStatus.controller.js` | `ctrlGetBlockStatus` | `checkBlockStatus` (check DAL) | CORRECT |
| `features/block/controllers/getBlockedActorSet.controller.js` | `ctrlGetBlockedActorSet` | `filterBlockedActors` (read DAL) | CORRECT |

#### Cross-feature controllers consuming via block barrel (correct path)

| File | Function Used | Import Path | Status |
|---|---|---|---|
| `features/social/friend/request/controllers/followRequests.controller.js` | `ctrlGetBlockStatus` | `@/features/block` | CORRECT |
| `features/social/friend/subscribe/controllers/follow.controller.js` | `ctrlGetBlockStatus` | `@/features/block` | CORRECT |
| `features/profiles/controller/friends/getTopFriendActorIds.controller.js` | `ctrlGetBlockedActorSet` | `@/features/block` | CORRECT |
| `features/profiles/controller/friends/getTopFriendCandidates.controller.js` | `ctrlGetBlockedActorSet` | `@/features/block` | CORRECT |
| `features/upload/controllers/createPost.controller.js` | `ctrlGetBlockedActorSet` | `@/features/block` | CORRECT |

#### Satellite controllers (own DALs reading `moderation.blocks`)

| File | Functions Used | DAL Source | Status |
|---|---|---|---|
| `features/settings/privacy/controller/Blocks.controller.js` | `ctrlListMyBlocks`, `ctrlBlockActor`, `ctrlUnblockActor`, `ctrlSearchActors` | `settings/privacy/dal/blocks.dal.js` (own) + `settings/privacy/models/blocks.model.js` | ACTIVE — **see RISK-5** (`dalSearchActors` inside blocks DAL) |
| `features/notifications/inbox/controller/Notifications.controller.js` | `loadBlockSets`, `filterByBlocks` | `notifications/inbox/lib/blockFilter.js` → `notifications/inbox/dal/blocks.read.dal.js` | ACTIVE — isolated to inbox feature |
| `features/profiles/controller/friends/getFriendLists.controller.js` | `listBlockedActorRowsForCandidatesDAL` | `profiles/dal/friends/blockedActorSet.read.dal.js` (own) | **VIOLATION — RISK-6** direct duplicate of `filterBlockedActors` inside profiles feature |

---

### 14.3 Hooks

| File | Functions Used | Import Path | Status |
|---|---|---|---|
| `features/block/hooks/useBlockStatus.js` | `ctrlGetBlockStatus` | internal | CORRECT — canonical status hook |
| `features/block/hooks/useBlockActions.js` | `blockActorController`, `unblockActorController` | internal | CORRECT |
| `features/block/hooks/useBlockActorAction.js` | `blockActorController` | internal | CORRECT |
| `features/settings/queries/useBlockedCitizens.js` | `ctrlListMyBlocks`, `ctrlBlockActor`, `ctrlUnblockActor` | `settings/privacy/controller/Blocks.controller.js` | CORRECT (via own controller) |
| `features/feed/hooks/useCentralFeedActions.js` | `useBlockActorAction` | `@/features/block/adapters/hooks/useBlockActorAction.adapter` | CORRECT (via adapter) |
| `features/profiles/hooks/useProfileGate.js` | `useBlockStatus` | `@/features/block` (barrel) | CORRECT |

---

### 14.4 Components

| File | Functions Used | Import Path | Status |
|---|---|---|---|
| `features/block/ui/BlockButton.jsx` | `useBlockStatus`, `useBlockActions` | internal hooks | CORRECT |
| `features/block/ui/BlockConfirmModal.jsx` | UI only | — | CORRECT |
| `features/block/ui/BlockedState.jsx` | UI only | — | CORRECT |
| `features/block/guards/BlockGate.jsx` | `useBlockStatus` | internal hook | CORRECT |
| `features/profiles/screens/views/ActorProfileHeader.jsx` | `useBlockStatus`, `ActorActionsMenu` | `@/features/block/adapters/hooks/useBlockStatus.adapter`, `@/features/block/adapters/ui/ActorActionsMenu` | CORRECT (via adapters) |

---

### 14.5 Screens

| File | Functions Used | Import Path / Chain | Status |
|---|---|---|---|
| `features/chat/conversation/screen/ConversationView.jsx` | `useBlockStatus` | `@/features/block/adapters/hooks/useBlockStatus.adapter` | CORRECT (via adapter) |
| `features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` | `useBlockStatus`, `useProfileGate` | `@/features/block/adapters/hooks/useBlockStatus.adapter`, `@/features/profiles/hooks/useProfileGate` | CORRECT (via adapter) |
| `features/profiles/screens/views/ActorProfileViewScreen.jsx` | `useBlockStatus`, `useProfileGate` | `@/features/profiles/adapters/ui/actorProfileScreenDependencies.adapter` → block adapter | CORRECT (double-adapter chain) |
| `features/chat/inbox/screens/settings/BlockedUsersScreen.jsx` | `BlockConfirmModal` | `@/features/block/adapters/ui/BlockConfirmModal.adapter` | CORRECT (via adapter) |

#### Pipeline entry (non-screen, non-hook)

| File | Functions Used | Import Path | Status |
|---|---|---|---|
| `features/feed/pipeline/fetchFeedPage.pipeline.js` | `readFeedBlockRowsDAL` | `@/features/feed/dal/feed.read.blockRows.dal` (own feed DAL) | CORRECT — isolated to feed pipeline |

---

### 14.6 New Risks Detected

**RISK-5 — `settings/privacy/dal/blocks.dal.js` contains a duplicate `dalSearchActors`**

| Field | Detail |
|---|---|
| Location | `apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js` — `dalSearchActors` export |
| Pattern | Blocks DAL file contains an actor search function calling `identity.search_actor_directory` directly |
| Duplicate Of | `features/actors/controllers/searchActors.controller.js` (and chat, explore reimplementations) |
| Risk | MEDIUM — this is now the fourth implementation of the same RPC call. The blocks context has no reason to own actor search logic. Actor search belongs in the actors feature. |
| Recommended Fix | Remove `dalSearchActors` from `blocks.dal.js`; route `ctrlSearchActors` in `Blocks.controller.js` through `@/features/actors/controllers/searchActors.controller.js` or future adapter |
| Handoff | SENTRY + IRONMAN |

---

**RISK-6 — `profiles/dal/friends/blockedActorSet.read.dal.js` duplicates `filterBlockedActors` from the block feature**

| Field | Detail |
|---|---|
| Location | `apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js` → `listBlockedActorRowsForCandidatesDAL` |
| Caller | `features/profiles/controller/friends/getFriendLists.controller.js:2` — direct import from profiles DAL |
| Duplicate Of | `features/block/dal/block.read.dal.js` → `filterBlockedActors` (same OR-query pattern against `moderation.blocks`) |
| Correct Path | `getFriendLists.controller.js` → `ctrlGetBlockedActorSet` from `@/features/block` barrel |
| Risk | MEDIUM — two independent implementations of the same `moderation.blocks` bulk query. Drift risk on status filter or schema change. |
| Recommended Fix | Replace `listBlockedActorRowsForCandidatesDAL` import in `getFriendLists.controller.js` with `ctrlGetBlockedActorSet`; remove `blockedActorSet.read.dal.js` after migration. |
| Handoff | SENTRY |

---

**RISK-7 — `blockActor.controller.js` imports `invalidateFeedBlockCache` from the feed adapter**

| Field | Detail |
|---|---|
| Location | `apps/VCSM/src/features/block/controllers/blockActor.controller.js:15` — `import { invalidateFeedBlockCache } from "@/features/feed/adapters/feedCache.adapter"` |
| Pattern | Block controller → feed adapter dependency. Controller layer knows about and calls a feed-specific cache function. |
| Architectural Risk | MODERATE — creates a hard block → feed coupling at the controller layer. Any refactor of the feed cache surface requires changes to the block controller. |
| Correct Pattern | Cache invalidation side effects should be handled by the calling hook (`useBlockActions.js`) after controller resolves, not inside the controller itself. |
| Recommended Fix | Move `invalidateFeedBlockCache` calls from `blockActor.controller.js` into `useBlockActions.js`. Controller returns result; hook handles side effects. |
| Handoff | SENTRY |

---

**RISK-8 — `applyBlockSideEffects.js` has zero callers — likely dead**

| Field | Detail |
|---|---|
| Location | `apps/VCSM/src/features/block/helpers/applyBlockSideEffects.js` |
| Export | `deleteFriendRankRowsBetweenActors` |
| Evidence | Zero imports found across all of `apps/VCSM/src` |
| File Comment | "Friend rank cleanup remains client-side" — but nothing calls it |
| Risk | LOW — dead helper. Either the `block_actor` RPC now handles friend_ranks server-side (making this file obsolete), or the client-side cleanup was never wired. Either way it silently does nothing. |
| Recommended Action | VERIFY USAGE — check if `moderation.block_actor` RPC handles `friend_ranks` cleanup server-side. If yes, delete this file. |
| Handoff | IRONMAN + CARNAGE |

---

### 14.7 Updated Risk Table

| Risk | ID | Severity | Status | Handoff |
|---|---|---|---|---|
| `isBlocked` is a dead DAL export — zero callers | RISK-1 | LOW | OPEN | IRONMAN |
| `toggleBlockActor` is a dead DAL export — zero callers | RISK-2 | LOW | OPEN | IRONMAN |
| `fetchActorsIBlocked/fetchActorsWhoBlockedMe/fetchBlockGraph` are dev-only — must not leak to production | RISK-3 | MEDIUM | OPEN | SENTRY |
| Schema undocumented — all queries use `moderation.blocks` | RISK-4 | LOW | CORRECTED | — |
| `settings/privacy/dal/blocks.dal.js` contains duplicate `dalSearchActors` — 4th RPC reimplementation | RISK-5 | MEDIUM | FIXED | SENTRY + IRONMAN |
| `profiles/dal/friends/blockedActorSet.read.dal.js` duplicates `filterBlockedActors` — bypasses block barrel | RISK-6 | MEDIUM | FIXED | SENTRY |
| `blockActor.controller.js` imports feed cache adapter — cross-feature coupling at controller layer | RISK-7 | MODERATE | OPEN | SENTRY |
| `applyBlockSideEffects.js` has zero callers — dead helper, friend_ranks cleanup status unknown | RISK-8 | LOW | OPEN | IRONMAN + CARNAGE |

---

### 14.8 Scan Evidence

Scan commands used:

```
grep -rn "checkBlockStatus|block\.check\.dal|block\.read\.dal|block\.write\.dal|blockActor\.controller|getBlockStatus\.controller|getBlockedActorSet\.controller|filterBlockedActors|readFeedBlockRowsDAL|invalidateFeedBlockCache|listBlockedActorRowsDAL|listBlockingActorRowsDAL|loadBlockSets|filterByBlocks|listBlockedActorRowsForCandidatesDAL|dalListMyBlocks|dalInsertBlock|dalDeleteBlockByTarget|modelBlockRow|modelActorRow|blockActorController|unblockActorController|toggleBlockActorController|ctrlGetBlockStatus|ctrlBlockActor|ctrlUnblockActor|from.*features/block" apps/VCSM/src

grep -rn "useBlockStatus|useBlockActions|useBlockActorAction|BlockGate|BlockButton|BlockedState|ActorActionsMenu|useProfileGate" apps/VCSM/src

grep -rn "applyBlockSideEffects|deleteFriendRankRowsBetweenActors" apps/VCSM/src
```

Scan Date: 2026-05-11
Scan Scope: `apps/VCSM/src/` — all `.js` and `.jsx` files
Dev diagnostics path (`dev/diagnostics/`) excluded from production consumer map but noted in § 5 Data Flow.

---

# Cerebro — Phase Review Audit · 2026-05-11

**Date:** 2026-05-11
**Reviewer:** CEREBRO
**Reviewed:** Phase 1 (SENTRY) · Phase 2 (IRONMAN) · Phase 3 (CARNAGE) · Phase 4 (VENOM)
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED

---

## 1. Work Quality Assessment

All four phases produced real findings grounded in live code reads and grep verification. No hallucinated evidence. Every claim is traceable to a file and line number.

| Phase | Command | Findings | Quality | Status |
|---|---|---|---|---|
| 1 | SENTRY | SF-01, SF-02, SF-03 | SOLID — all tied to specific file:line | COMPLETE |
| 2 | IRONMAN | IF-01, IF-02, IF-03 + ownership record | SOLID — decisions are clear and defensible | COMPLETE |
| 3 | CARNAGE | RISK-8 answered definitively | SOLID — batch4 SQL read to verify RPC state | COMPLETE |
| 4 | VENOM | 0 CRIT / 1 HIGH / 3 MED / 1 LOW | SOLID — CISSP domains mapped | COMPLETE |

CARNAGE's answer on RISK-8 is the most important output of this session: **friend_ranks cleanup is silently not happening for every block action in the live system.** The batch4 migration is a proposal, not applied. This was unknown before this phase review.

---

## 2. Run Order Deviation

The canonical AvengersAssemble run order (Cerebro §11.1) is:

```
ARCHITECT → Venom → Loki → Kraven → Carnage → Falcon →
WinterSoldier → Logan → review-contract → SHIELD → Sentry → AvengersAssemble → THOR
```

This session ran: **SENTRY → IRONMAN → CARNAGE → VENOM**

Two deviations:
- **VENOM ran after SENTRY and CARNAGE** — canonical puts VENOM before both. Acceptable for this targeted risk review: SENTRY's findings did not depend on VENOM evidence, CARNAGE's migration analysis was independent, and VENOM running last still caught VF-01 which confirmed CARNAGE's finding. No governance damage.
- **IRONMAN is not in the canonical AvengersAssemble run order** — IRONMAN output path is `_CANONICAL/logan/marvel/ironman/`, not a standard assembly step. Correctly inserted here as an ownership gate for dead-code decisions.

**Run order verdict: ACCEPTABLE for targeted review. Would not be acceptable as a substitute for full AvengersAssemble ceremony.**

---

## 3. Output Persistence Gaps — ACTION REQUIRED

Each command has a canonical output path. Append-to-TARGET_FILE is valid when a target is provided. However, three standalone audit stubs are missing from the audit directories, and the IRONMAN ownership file was never created.

| Command | Required Output Path | Created? | Gap |
|---|---|---|---|
| SENTRY | `CURRENT/features/dashboard/evidence/2026-05-11_*_sentry_block-dal.md` | NO — appended to block.md only | Compliance audit index has no pointer to this pass |
| CARNAGE | `_ACTIVE/audits/migrations/2026-05-11_*_carnage_block-friend-ranks.md` | NO — appended to block.md only | Migrations audit index has no pointer |
| VENOM | `CURRENT/features/dashboard/evidence/2026-05-11_*_venom_block-feature.md` | NO — appended to block.md only | Last security entry is `2026-05-10_venom_private-block-profile-logic.md` |
| IRONMAN | `_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md` | NO — ownership record inline in block.md only | IRONMAN ownership registry is missing this feature |

**The content exists — it is all in `vcsm.dal.block.md`. The problem is discoverability.** If another command (THOR, AvengersAssemble, future SENTRY pass) looks for evidence in the audit directories, it will find nothing for this session.

---

## 4. Governance Lifecycle State

The block.md document does not carry an explicit lifecycle state header. Based on work completed, Cerebro assigns:

**Current state: `REVIEW_PENDING`**

Rationale:
- SENTRY, IRONMAN, CARNAGE, VENOM passes complete and appended
- FALCON is missing — the only BLOCKING gap — native parity unconfirmed
- RISK-7 fix pending Wolverine execution
- batch4 migration pending DB/CARNAGE deployment
- THOR has not evaluated this feature

The document cannot advance to `VERIFIED` until FALCON passes. It cannot advance to `RELEASE_READY` until THOR runs.

---

## 5. Decisions Made This Session — Locked

| Decision | Authority | Status |
|---|---|---|
| Delete `isBlocked` from block.check.dal.js | IRONMAN IF-01 | LOCKED — ready for Wolverine |
| Delete `toggleBlockActor` from block.write.dal.js | IRONMAN IF-02 | LOCKED — ready for Wolverine |
| Move dev-only exports to `dev/diagnostics/dal/block.diagnostics.dal.js` | SENTRY SF-02 | LOCKED — ready for Wolverine |
| Delete `blockedActorSet.read.dal.js` | IRONMAN (RISK-6) + SENTRY SF-03 | LOCKED — ready for Wolverine |
| DO NOT delete `applyBlockSideEffects.js` until batch4 deploys | IRONMAN IF-03 + CARNAGE | LOCKED — migration gates this |
| Move `invalidateFeedBlockCache` to `useBlockActions.js` | SENTRY SF-01 + VENOM VF-02 | LOCKED — release blocker |

---

## 6. Recommended Next Commands

| # | Command | Reason | Urgency |
|---|---|---|---|
| 1 | **Wolverine** | Execute 4 locked-approved cleanup tasks (RISK-1, RISK-2, RISK-3, RISK-6) and SF-01 refactor (move cache invalidation to hook). All unblocked. All decisions made. | HIGH — unblocked today |
| 2 | **DB** | Verify `vc.friend_ranks` RLS policy permits SECURITY DEFINER DELETE. CARNAGE cannot gate batch4 without this answer. | HIGH — blocks migration |
| 3 | **FALCON** | Native block parity audit. Only RELEASE BLOCKER in the entire block feature governance chain. Safety-critical. | CRITICAL — BLOCKING |
| 4 | **IRONMAN persistence** | Extract IRONMAN ownership record from block.md and write to `_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md`. Record was produced inline — IRONMAN registry is missing this feature. | MEDIUM — governance hygiene |
| 5 | **Standalone audit stubs** | Create stub files in compliance, migrations, security audit directories pointing to block.md as evidence source. Prevents future commands from assuming no review was done. | LOW — discoverability |
| 6 | **THOR** | Cannot run. Blocked on FALCON + RISK-7 fix + batch4 migration. | BLOCKED |

---

## 7. Cerebro Summary Verdict

The four-phase review was well-executed. Every finding is grounded, every decision is defensible, and the critical unknown (RISK-8 / friend_ranks cleanup gap) was resolved by CARNAGE with actual SQL evidence.

**What remains:**
- **One execution pass** (Wolverine) closes 5 of the 8 risks cleanly.
- **One migration** (batch4, gated by DB RLS verification) closes RISK-8 and VF-01.
- **One governance audit** (FALCON) closes the only release blocker.

After those three actions, this feature is THOR-eligible.

**Governance Lifecycle State: `REVIEW_PENDING` → advances to `VERIFIED` after FALCON completes.**

---

# Phase Review Series — 2026-05-11

---

## PHASE 1 — SENTRY · Block Feature Boundary & Layer Compliance

**Date:** 2026-05-11
**Reviewer:** SENTRY
**Application Scope:** VCSM
**Trigger:** AvengersAssemble identified RISK-3, RISK-6, RISK-7 as requiring SENTRY gate before any deletion or refactor proceeds.
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED

---

### SENTRY COMPLIANCE REPORT

Application Scope: VCSM
Review reason: Three open risks require SENTRY architecture boundary and layer compliance gate — RISK-3 (dev-only DAL leak policy), RISK-6 (duplicate DAL file persists), RISK-7 (block controller imports feed adapter).
Architecture contract: ARCHITECTURE.md
Boundary contract: PROJECT_BOUNDARY_ISOLATION_CONTRACT.md

---

### BOUNDARY COMPLIANCE STATUS

| Protected Root | In Scope | Modified | Violation | Notes |
|---|---|---|---|---|
| apps/VCSM | YES | NO | NO | Read-only analysis of block feature |
| apps/wentrex | NO | NO | NO | Out of scope |
| apps/Traffic | NO | NO | NO | Out of scope |
| engines | NO | NO | NO | Block feature has no shared engine |

---

### ARCHITECTURE ALIGNMENT STATUS

| Area | Status | Drift Level | Notes |
|---|---|---|---|
| DAL layer (block.check.dal, block.read.dal, block.write.dal) | ALIGNED | NONE | Explicit columns, moderation schema prefix, no select('*') violations |
| Controller layer (blockActor.controller.js) | DRIFT | MODERATE DRIFT | Imports feed cache adapter — side-effect concern belongs in hook layer |
| Dev-only export boundary (block.read.dal.js) | DRIFT | MINOR DRIFT | fetchActorsIBlocked/fetchActorsWhoBlockedMe/fetchBlockGraph in production DAL file; enforced by convention only |
| Cross-feature DAL duplicate (blockedActorSet.read.dal.js) | DRIFT | MINOR DRIFT | File exists with zero callers; structural re-import risk |
| Adapter usage (feedCache.adapter.js) | ALIGNED | NONE | Import path uses approved adapter surface — not an internal bypass |
| Import path discipline | ALIGNED | NONE | All imports use @/ aliases; no ../../ chains |

---

### ACTOR OWNERSHIP STATUS

| Flow | Status | Risk | Notes |
|---|---|---|---|
| Block write (blockActorController) | ALIGNED | LOW | `assertingActorId !== blockerActorId` guard present and throws on mismatch |
| Block ownership verification | ALIGNED | LOW | checkBlockStatus called as pre-check guard before every write |
| Unblock ownership check | ALIGNED | LOW | `blockedByMe` verified before calling unblockActorDAL |

---

### IDENTITY SURFACE STATUS

| Surface | Status | Risk | Notes |
|---|---|---|---|
| DAL response shapes | ALIGNED | LOW | checkBlockStatus returns { isBlocked, blockedByMe, blockedMe } — no internal ID leakage |
| filterBlockedActors return | ALIGNED | LOW | Returns Set of actorIds only |
| blockedActorSet.read.dal.js return | MINOR DRIFT | LOW | Returns raw rows (array of {blocker_actor_id, blocked_actor_id}) vs Set in filterBlockedActors — inconsistent shape |

---

### ENGINE ISOLATION STATUS

| Engine Area | Status | Drift | Notes |
|---|---|---|---|
| Block feature engine dependency | ALIGNED | NONE | Block is fully self-contained in apps/VCSM; no shared engine dependency |

---

### NATIVE PARITY STATUS

| Native Area | Status | Drift | Notes |
|---|---|---|---|
| Block parity (all surfaces) | MISSING | UNKNOWN | Falcon review not yet completed — out of SENTRY scope for this pass |

---

### SENTRY FINDINGS

---

**SENTRY FINDING SF-01**
- Finding ID: SF-01
- Location: `apps/VCSM/src/features/block/controllers/blockActor.controller.js:15`
- Drift Level: MODERATE DRIFT
- Severity: MEDIUM
- Contract Violated: Architecture Contract — Controller Layer Responsibility Rule
- Current behavior: `blockActor.controller.js` imports `invalidateFeedBlockCache` from `@/features/feed/adapters/feedCache.adapter` and calls it at lines 41, 66, 86, and 91. Cache invalidation is executed inside the controller after each block/unblock/toggle operation.
- Expected behavior: Per architecture contract, the Controller layer is responsible for "business rules, ownership, permissions." Cache invalidation is a side-effect concern — it belongs in the Hook layer (`useBlockActions.js`), which calls the controller and then handles post-resolution side effects.
- Risk: The block controller now has a hard compile-time dependency on the feed feature's caching surface. Any refactor to `feedCache.adapter.js` or its underlying `feed.read.blockRows.dal.js` requires coordinated changes to the block controller. This creates cross-feature coupling at the business logic layer, which is the most protected layer in the architecture.
- Recommended correction: Move all `invalidateFeedBlockCache(blockerActorId)` calls from `blockActor.controller.js` into `useBlockActions.js`. Controller returns `{ blocked: true/false }`; hook calls invalidation after controller resolves. Remove the feed adapter import from the block controller entirely.
- Architectural rationale: Controllers must be self-contained units of business logic. Side-effect orchestration (cache busting, notification dispatch, analytics events) belongs above the controller in the hook or adapter layer. This preserves the controller as a stable, testable, dependency-free unit.

---

**SENTRY FINDING SF-02**
- Finding ID: SF-02
- Location: `apps/VCSM/src/features/block/dal/block.read.dal.js` — exports `fetchActorsIBlocked`, `fetchActorsWhoBlockedMe`, `fetchBlockGraph`
- Drift Level: MINOR DRIFT
- Severity: LOW
- Contract Violated: Architecture Contract — DAL Layer Rule (production feature code must not import dev-diagnostics functions)
- Current behavior: Three dev-diagnostics-only DAL exports live in the production block read DAL file. They are currently called only by `dev/diagnostics/groups/block.group.js` (confirmed by live grep). No production path imports them today.
- Expected behavior: Functions restricted to dev/diagnostics use should not reside in a production DAL file accessible to all features. The convention rule is correct but has no structural enforcement. A future developer reading the file has no barrier preventing them from importing these functions into a production controller or screen.
- Risk: LOW for now. Risk escalates to MEDIUM if codebase grows and a developer adds a feature that needs bulk block lists — they may find `fetchActorsIBlocked` in the block DAL and use it instead of routing through the correct controller path (`ctrlGetBlockedActorSet`).
- Recommended correction: Move `fetchActorsIBlocked`, `fetchActorsWhoBlockedMe`, `fetchBlockGraph` out of `block.read.dal.js` into a new file: `apps/VCSM/src/dev/diagnostics/dal/block.diagnostics.dal.js`. Update the import in `dev/diagnostics/groups/block.group.js` accordingly. The production `block.read.dal.js` then exports only `filterBlockedActors`, making the dev/production split structurally clear.
- Architectural rationale: Physical file separation is the strongest enforcement mechanism in this codebase. Keeping dev-only exports in a production DAL file relies entirely on convention. Moving them to a path under `dev/` makes the restriction self-documenting and lint-detectable.

---

**SENTRY FINDING SF-03**
- Finding ID: SF-03
- Location: `apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js`
- Drift Level: MINOR DRIFT
- Severity: LOW
- Contract Violated: Architecture Contract — Cross-feature DAL Rule ("One feature must never import directly from another feature's internals")
- Current behavior: `blockedActorSet.read.dal.js` exists with zero callers. The controller that previously used it (`getFriendLists.controller.js`) was migrated to use `ctrlGetBlockedActorSet` from the block barrel. The file was restored per the no-delete instruction and now exists as an unreferenced duplicate DAL.
- Expected behavior: The file should not exist. The profiles feature has no ownership over `moderation.blocks` queries. Block bulk queries are owned by the block feature and exposed through the block barrel.
- Risk: LOW while zero callers. Risk escalates if any developer adds a new caller by importing this file directly (bypassing the block barrel) rather than using `ctrlGetBlockedActorSet`. The two implementations have divergent return shapes: `blockedActorSet.read.dal.js` returns an array of raw rows; `filterBlockedActors` returns a `Set`. Divergence creates a silent data contract difference.
- Recommended correction: Delete `blockedActorSet.read.dal.js` after IRONMAN ownership sign-off. No code changes required — the only production caller was already migrated.
- Architectural rationale: DAL files outside their owning feature directory are a boundary violation by definition. The block feature owns `moderation.blocks` queries. A DAL file in the profiles feature reading the same table is an unowned duplicate with no governance guarantee.

---

### CACHE ARCHITECTURE WARNING

**CAW-01**
Location: `apps/VCSM/src/features/block/controllers/blockActor.controller.js` — `invalidateFeedBlockCache` calls
Cache behavior: Feed block cache is invalidated synchronously inside the block controller, not in the hook layer.
Risk: Controller is tightly coupled to feed cache lifecycle. If feed cache is restructured, block controller must change. If controller is called without a hook (e.g., from a test or batch job), cache invalidation still fires, which may be undesirable.
Severity: MEDIUM
Recommended correction: Move invalidation to `useBlockActions.js`. See SF-01.

---

### FINAL SENTRY STATUS: MINOR DRIFT

Three findings — all non-blocking for current production behavior. No CONTRACT VIOLATION. No critical architecture breach.

| Finding | Drift Level | Severity | Blocking |
|---|---|---|---|
| SF-01 — block controller imports feed adapter | MODERATE DRIFT | MEDIUM | NO |
| SF-02 — dev-only exports in production DAL file | MINOR DRIFT | LOW | NO |
| SF-03 — dead duplicate DAL file in profiles | MINOR DRIFT | LOW | NO |

### FOLLOW-UP REQUIRED: REQUIRED BEFORE RELEASE

- SF-01 → Fix required before release: move `invalidateFeedBlockCache` calls to `useBlockActions.js`. SENTRY cannot pass this finding until the controller is clean.
- SF-02 → Fix recommended before release: move dev-only exports to `dev/diagnostics/dal/`. Structural enforcement > convention.
- SF-03 → Deletion required: IRONMAN must sign off, then file can be removed.

---

---

## PHASE 2 — IRONMAN · Block Feature Ownership Record

**Date:** 2026-05-11
**Reviewer:** IRONMAN
**Application Scope:** VCSM
**Trigger:** RISK-1 (`isBlocked` dead DAL export), RISK-2 (`toggleBlockActor` dead DAL export), RISK-8 (`applyBlockSideEffects.js` zero callers) require ownership decisions before deletion can proceed.
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED

---

### IRONMAN TARGET

Feature / Engine: Block / Moderation
Application Scope: VCSM
Reason for ownership review: Three dead-code candidates require ownership sign-off for deletion. Ownership record does not yet exist for this feature.

---

### CODE ROOTS

Primary path: `apps/VCSM/src/features/block/`
Related paths:
- `apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js` (duplicate — zero callers)
- `apps/VCSM/src/dev/diagnostics/groups/block.group.js` (dev consumer)
Entry files: `features/block/index.js` (barrel)

---

### LAYER MAP

| Layer | Files | Status |
|---|---|---|
| DAL | `block.check.dal.js`, `block.read.dal.js`, `block.write.dal.js` | ACTIVE (partial — dead exports present) |
| Model | None | No model layer — DAL returns flat primitives |
| Controller | `blockActor.controller.js`, `getBlockStatus.controller.js`, `getBlockedActorSet.controller.js` | ACTIVE |
| Adapter | `adapters/hooks/useBlockActorAction.adapter.js`, `adapters/hooks/useBlockStatus.adapter.js`, `adapters/ui/ActorActionsMenu.jsx`, `adapters/ui/BlockConfirmModal.adapter.js` | ACTIVE |
| Hook | `useBlockActions.js`, `useBlockActorAction.js`, `useBlockStatus.js` | ACTIVE |
| Guard | `guards/BlockGate.jsx` | ACTIVE |
| Component | `ui/BlockButton.jsx`, `ui/BlockConfirmModal.jsx`, `ui/BlockedState.jsx` | ACTIVE |
| Helper | `helpers/applyBlockSideEffects.js` | DEAD — zero callers |
| Barrel | `index.js` | ACTIVE |

---

### DEPENDENCY OWNERSHIP

Engines used: NONE — fully self-contained in apps/VCSM
Shared modules: `@/services/supabase/supabaseClient`, `@/services/supabase/postgrestSafe`
External services: Supabase — `moderation` schema

---

### DATA OWNERSHIP

Tables read: `moderation.blocks`
Tables written: `moderation.blocks` (via RPC), `vc.friend_ranks` (via RPC — pending migration)
RPCs: `moderation.block_actor`, `moderation.unblock_actor`
Identity surfaces: `actorId` (blocker_actor_id, blocked_actor_id) — no profileId or vportId
Caches: Feed block cache via `invalidateFeedBlockCache` (owned by feed feature DAL, invalidated by block controller — see SENTRY SF-01)

---

### GOVERNANCE OWNERSHIP

Contracts touched: Architecture Contract, Actor Ownership Contract, Boundary Isolation Contract
Logan docs: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md` (this document)
Engine audits: None — no shared engine
Architecture maps: `vcsm-feature-map.md` (needs correction from PARTIALLY LAYERED → FULLY LAYERED)

---

### RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership | block feature (self-contained) | HIGH | No engine dependency, single feature directory |
| DAL ownership | block feature | HIGH | Only block feature may own moderation.blocks DAL |
| Controller ownership | block feature | HIGH | blockActor.controller.js, getBlockStatus.controller.js, getBlockedActorSet.controller.js |
| UI ownership | block feature | HIGH | All UI files in features/block/ui/ |
| Runtime ownership | block feature (via hooks) | HIGH | useBlockActions.js, useBlockStatus.js, useBlockActorAction.js |
| Data ownership (moderation.blocks) | block feature | HIGH | No other feature may own a DAL for this table |
| Contract ownership | block feature | HIGH | Actor ownership rules enforced in blockActor.controller.js |
| Documentation ownership | Logan (this doc) | HIGH | vcsm.dal.block.md is canonical |
| Security ownership | VENOM | HIGH | Trust boundary review required for block write path |
| Migration ownership | CARNAGE | HIGH | block_actor / unblock_actor RPC evolution, friend_ranks cleanup migration |
| Native parity ownership | FALCON | HIGH | Block enforcement gates safety-critical native surfaces |

---

### OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| feed cache invalidation in block controller | MEDIUM | block controller imports from feed — cross-feature coupling at controller layer | Move invalidation to useBlockActions.js (SENTRY SF-01) |
| blockedActorSet.read.dal.js in profiles | MEDIUM | profiles feature has a DAL reading moderation.blocks — block feature's data domain | Delete file after IRONMAN sign-off |
| friend_ranks cleanup | HIGH | deleteFriendRankRowsBetweenActors has zero callers; cleanup is silently not happening | Requires CARNAGE verification of migration status |
| dev-only exports in production DAL | LOW | convention-only enforcement | Move to dev/diagnostics/dal/ (SENTRY SF-02) |

---

### DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `moderation.blocks` | block feature | block feature, notifications/inbox, settings/privacy (own DAL), feed pipeline (own DAL) | block feature (via RPC only) | Supabase moderation schema RLS | CARNAGE | Logan (this doc) |
| `moderation.block_actor` RPC | block feature | blockActor.controller.js | block feature | SECURITY DEFINER — self-contained | CARNAGE | Logan (this doc) |
| `moderation.unblock_actor` RPC | block feature | blockActor.controller.js | block feature | SECURITY DEFINER — self-contained | CARNAGE | Logan (this doc) |
| `vc.friend_ranks` (block cleanup) | social/friend feature | getBlockedActorSet path | block RPC (pending migration) | vc schema RLS | CARNAGE | Logan (this doc) |

---

### RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Block status bidirectional check | block feature | Controller (checkBlockStatus guard) | This doc §9 Rule 2 | LOW |
| Block write must use RPC (no direct insert) | block feature | Controller — no direct insert path exists | This doc §9 Rule 7 | LOW |
| status = 'active' filter on all reads | block feature | DAL (all three DAL files) | This doc §9 Rule 1 | LOW |
| assertingActorId must match blockerActorId | block feature | Controller (throws on mismatch) | This doc §9 Rule 3 | LOW |
| Cross-feature access through barrel or adapter | Architecture Contract | SENTRY | This doc §9 Rule 9 | LOW |
| Dev-only DAL functions restricted to dev/ | block feature | Convention only (NO structural enforcement) | This doc §9 Rule 6 | MEDIUM |
| friend_ranks cleanup after block | block feature | UNOWNED — zero callers on client side; migration pending | This doc §10 RISK-8 | HIGH |

---

### IRONMAN OWNERSHIP FINDINGS

---

**IRONMAN FINDING IF-01 — RISK-1**
- Finding ID: IF-01
- Feature / Engine: Block Feature
- Application Scope: VCSM
- Responsibility Type: DAL ownership
- Ownership Clarity: CLEAR (owner is block feature) — dead export has no owner claim
- Boundary Risk: LOW
- Severity: LOW
- Primary code roots: `apps/VCSM/src/features/block/dal/block.check.dal.js:67-86`
- Core layers: DAL
- Tables / Objects touched: `moderation.blocks` (read-only)
- Rule ownership: N/A — function is dead
- Contracts touched: None (no active callers)
- Current ambiguity: `isBlocked(actorA, actorB)` is exported from `block.check.dal.js`. Live grep confirms zero imports across all of `apps/VCSM/src`. The function runs the same OR-query as `checkBlockStatus` but returns a plain boolean instead of the richer `{ isBlocked, blockedByMe, blockedMe }` shape. No production caller has ever needed it — all callers use `checkBlockStatus` and destructure `{ isBlocked }`.
- Risk: None in the short term. Maintenance confusion risk — a future developer may see it and assume it is the canonical lightweight check function, then import it instead of `checkBlockStatus`, losing the bidirectional status shape.
- **IRONMAN DECISION: APPROVE DELETION.** `isBlocked` is confirmed dead. It provides no additional capability over `checkBlockStatus`. It should be removed from `block.check.dal.js`. No adapter, barrel, or hook update required — it has zero callers.
- Recommended handoff: Implementation (remove export from `block.check.dal.js`) — to Wolverine execution pass.

---

**IRONMAN FINDING IF-02 — RISK-2**
- Finding ID: IF-02
- Feature / Engine: Block Feature
- Application Scope: VCSM
- Responsibility Type: DAL ownership
- Ownership Clarity: CLEAR — dead export has no owner claim
- Boundary Risk: LOW
- Severity: LOW
- Primary code roots: `apps/VCSM/src/features/block/dal/block.write.dal.js:65-71`
- Core layers: DAL
- Tables / Objects touched: `moderation.blocks` (via RPCs — indirect)
- Rule ownership: Toggle pattern is owned by `toggleBlockActorController` in the controller layer
- Contracts touched: None (no active callers)
- Current ambiguity: `toggleBlockActor(isBlocked, blockerActorId, blockedActorId)` is exported from `block.write.dal.js`. Live grep confirms zero import callers (only appears in its own function definition). The controller barrel exports `toggleBlockActorController`, which calls `blockActorDAL`/`unblockActorDAL` directly based on current state. The DAL-level toggle is a redundant implementation of this controller logic pushed one layer too low.
- Risk: None active. The toggle pattern is correctly handled in the controller. The DAL export represents an architectural pattern that was superseded — a direct state-toggle in the DAL is a business rule concern and should not live in the DAL layer.
- **IRONMAN DECISION: APPROVE DELETION.** `toggleBlockActor` is confirmed dead and architecturally incorrect — a toggle decision is a business rule, not a DAL concern. Remove from `block.write.dal.js`. No other files require changes.
- Recommended handoff: Implementation (remove export from `block.write.dal.js`) — to Wolverine execution pass.

---

**IRONMAN FINDING IF-03 — RISK-8**
- Finding ID: IF-03
- Feature / Engine: Block Feature
- Application Scope: VCSM
- Responsibility Type: DAL ownership + Migration ownership
- Ownership Clarity: AMBIGUOUS — function exists, has zero callers, migration is pending
- Boundary Risk: HIGH
- Severity: HIGH
- Primary code roots: `apps/VCSM/src/features/block/helpers/applyBlockSideEffects.js`
- Core layers: Helper (below DAL level — a direct Supabase write helper)
- Tables / Objects touched: `vc.friend_ranks` (direct delete)
- Rule ownership: friend_ranks cleanup after block — CURRENTLY UNOWNED
- Contracts touched: Architecture Contract (helper accessing Supabase directly), Actor Ownership Contract (friend_ranks are social graph data)
- Current ambiguity: `deleteFriendRankRowsBetweenActors` has zero callers. The file comment states "Friend rank cleanup remains client-side" but nothing calls it. The batch4 SQL migration proposal (`zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/batch4_20260510100000_fix_block_actor_bidirectional_follows.sql`) documents this gap and proposes moving friend_ranks cleanup INTO the `moderation.block_actor` RPC. **That migration has NOT been applied.** The current live RPC does NOT include the friend_ranks DELETE. This means: every block action today leaves `vc.friend_ranks` rows intact — the social graph is not cleaned up.
- Risk: HIGH — friend_ranks rows between blocked actors persist indefinitely. This can surface blocked actors in friend suggestions, social ranking, or any feature reading `vc.friend_ranks` for relationship scoring. The severity compounds over time as blocked pairs accumulate stale rank rows.
- **IRONMAN DECISION: DO NOT DELETE `applyBlockSideEffects.js` YET.** The migration must be applied first. Once the `block_actor` RPC includes the `DELETE FROM vc.friend_ranks` (batch4 migration), the client-side helper becomes truly redundant. Delete path: (1) CARNAGE gates the batch4 migration, (2) migration applies, (3) verify RPC handles cleanup, (4) then delete `applyBlockSideEffects.js` and its import if one is added.
- **IRONMAN ACTION: ESCALATE TO CARNAGE.** RISK-8 cleanup has a real data integrity gap that cannot be resolved by code deletion alone. The migration must deploy first.
- Recommended handoff: CARNAGE — gate batch4 migration. Wolverine — wire the deletion workflow after migration confirms.

---

### CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| moderation.blocks DAL (profiles duplicate) | profiles feature | apps/VCSM — same root, different feature | VIOLATION — block feature owns this table | blockedActorSet.read.dal.js must be deleted |
| block feature | VCSM block feature | apps/VCSM | CLEAN | Fully self-contained |

---

### NATIVE PARITY OWNERSHIP

| Area | PWA Owner | Native Owner | Parity Doc | Risk |
|---|---|---|---|---|
| Profile block gate | block feature (useBlockStatus) | UNCONFIRMED | MISSING — Falcon review required | HIGH |
| Feed block suppression | feed feature (reads moderation.blocks via own DAL) | UNCONFIRMED | MISSING | HIGH |
| Chat block gate | chat feature (consumes useBlockStatus adapter) | UNCONFIRMED | MISSING | HIGH |
| Follow/friend block check | social/friend feature (uses ctrlGetBlockStatus) | UNCONFIRMED | MISSING | HIGH |

---

### FINAL IRONMAN STATUS

**Ownership Clarity: PARTIAL**
- Feature is well-owned at the code layer
- Three dead-code findings resolved: IF-01 and IF-02 approved for deletion; IF-03 blocked pending migration
- Native parity ownership is missing across all four enforcement surfaces
- friend_ranks cleanup gap (RISK-8) is a HIGH-severity data integrity issue requiring CARNAGE + migration before resolution

| Finding | Decision | Next Step |
|---|---|---|
| IF-01 (`isBlocked` dead export) | APPROVED FOR DELETION | Wolverine execution pass |
| IF-02 (`toggleBlockActor` dead export) | APPROVED FOR DELETION | Wolverine execution pass |
| IF-03 (`applyBlockSideEffects.js`) | HOLD — migration required first | CARNAGE → batch4 migration → then delete |
| RISK-6 (`blockedActorSet.read.dal.js`) | APPROVED FOR DELETION | SENTRY SF-03 signed off; Wolverine execution pass |

---

---

## PHASE 3 — CARNAGE · friend_ranks RPC Scope Verification (RISK-8)

**Date:** 2026-05-11
**Reviewer:** CARNAGE
**Application Scope:** VCSM
**Trigger:** RISK-8 — `applyBlockSideEffects.js` has zero callers. IRONMAN requires verification of whether `moderation.block_actor` RPC handles `friend_ranks` cleanup server-side before deletion decision can be finalized.
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED

---

### CARNAGE TARGET

Object being changed: `moderation.block_actor` RPC + `vc.friend_ranks` cleanup path
Application Scope: VCSM
Type of change: Verification of current RPC behavior + migration readiness assessment
Reason: Determine if friend_ranks cleanup is handled server-side (which would make `applyBlockSideEffects.js` safe to delete) or if a gap exists (which requires migration before deletion).

---

### SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `moderation.blocks` | Moderation-sensitive | Core block relationship table; safety-critical |
| `moderation.block_actor` RPC | Moderation-sensitive + Ownership-sensitive | SECURITY DEFINER function; gates follow + friend graph cleanup |
| `vc.friend_ranks` | Ownership-sensitive | Social graph ranking data; affects friend suggestions and social scoring |
| `vc.actor_follows` | Ownership-sensitive | Follow graph; cleaned up by RPC |

---

### CURRENT STRUCTURE

**Supabase Migration Files:** No applied migration for `block_actor` with friend_ranks DELETE was found in `apps/VCSM/supabase/migrations/`. The batch4 SQL proposal (`zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/batch4_20260510100000_fix_block_actor_bidirectional_follows.sql`) is explicitly marked **PROPOSAL ONLY — DO NOT RUN DIRECTLY** and is not in the applied migrations path.

**Current live `block_actor` RPC behavior (from SQL proposal rollback section — describes original):**

```sql
-- Current RPC handles:
-- 1. Upsert moderation.blocks (ON CONFLICT reactivate)
-- 2. Insert moderation.block_events audit row
-- 3. UPDATE vc.actor_follows SET is_active = false
--    WHERE follower_actor_id = p_blocker_actor_id AND followed_actor_id = p_blocked_actor_id
--    (ONE DIRECTION ONLY — does NOT clean up blocked actor's follow of blocker)
-- 4. Does NOT DELETE from vc.friend_ranks
```

**Confirmed absence:** `apps/VCSM/src/features/block/controllers/blockActor.controller.js` comment at line 5 reads: `// Follow deactivation and friend_ranks cleanup are handled server-side by the RPC.` This comment is **incorrect** — the RPC currently does neither the reverse-direction follow cleanup nor the friend_ranks cleanup.

**`applyBlockSideEffects.js` status:** Zero callers confirmed by live grep. The file exists, is importable, but is never called. The comment in the file itself confirms the intent: "Friend rank cleanup remains client-side" — but nothing in production calls it.

---

### MIGRATION BLAST RADIUS

Affected systems: `vc.friend_ranks` (social graph), `vc.actor_follows` (follow graph — existing + reverse direction), `moderation.block_actor` RPC
Runtime impact: LOW — block is a user-action-triggered event, not a hot read path
Release impact: MEDIUM — must not deploy without validating RPC behavior; existing stale rows require a one-time backfill script
Rollback impact: MEDIUM — RPC is SECURITY DEFINER; rollback requires restoring previous function body (rollback SQL is included in the batch4 proposal)

---

### RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `moderation.block_actor` RPC | CRITICAL — SECURITY DEFINER | HIGH | RPC has its own auth guard (`moderation.is_current_vc_actor`); adding DELETE on vc.friend_ranks must verify vc schema is in search_path |
| `vc.friend_ranks` | DIRECT | MEDIUM | RLS on friend_ranks must allow DELETE by SECURITY DEFINER context; verify policy |
| `vc.actor_follows` | DIRECT | MEDIUM | Already cleaned up by RPC (one direction); reverse-direction fix carries same RLS context |

**CARNAGE NOTE:** The batch4 proposal sets `search_path TO 'moderation', 'vc', 'public', 'auth'`. This means `vc.friend_ranks` is accessible inside the SECURITY DEFINER context. However, the `vc` RLS policies must allow DELETE when the caller is the SECURITY DEFINER function, not a regular authenticated user. This needs explicit verification before deployment.

---

### RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| Block action latency | LOW | DELETE on friend_ranks adds one query per block — typically O(1) rows per actor pair | Acceptable — user-action only, not batch |
| Historical stale rows | MEDIUM | Existing blocked pairs have stale friend_ranks rows; new RPC doesn't clean retroactively | Requires separate one-time backfill query |
| Reverse-direction follow orphans | MEDIUM | Blocked actors remain followers of their blockers in current live system | Fixed by batch4 second UPDATE on actor_follows |
| Friend suggestion quality | MEDIUM | Blocked actors may surface in friend recommendations due to stale friend_ranks | Fixed after migration + backfill |

---

### DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| Orphaned friend_ranks for active blocks | HIGH | `SELECT COUNT(*) FROM vc.friend_ranks fr JOIN moderation.blocks b ON (b.blocker_actor_id = fr.owner_actor_id AND b.blocked_actor_id = fr.friend_actor_id) OR (b.blocker_actor_id = fr.friend_actor_id AND b.blocked_actor_id = fr.owner_actor_id) WHERE b.status = 'active'` | Backfill script after migration deploys |
| Orphaned actor_follows (reverse direction) | MEDIUM | `SELECT COUNT(*) FROM vc.actor_follows af JOIN moderation.blocks b ON b.blocker_actor_id = af.followed_actor_id AND b.blocked_actor_id = af.follower_actor_id AND b.status = 'active' WHERE af.is_active = true` | Second UPDATE in batch4 RPC handles new blocks; backfill handles historical |
| friend_ranks after unblock | LOW | unblock_actor RPC does not restore friend_ranks (correct — unblocking does not restore the relationship) | No action required |

---

### MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| Phase 1 | Verify RLS on vc.friend_ranks allows SECURITY DEFINER DELETE | LOW | Run `SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'friend_ranks'` |
| Phase 2 | Deploy batch4 `CREATE OR REPLACE FUNCTION moderation.block_actor(...)` | MEDIUM | SECURITY DEFINER replace — no lock, no table rewrite |
| Phase 3 | Validate updated RPC body via `pg_get_functiondef` | LOW | Confirm second UPDATE and DELETE FROM vc.friend_ranks are present |
| Phase 4 | Run backfill for historical orphaned friend_ranks | MEDIUM | One-time DELETE using the detection query above |
| Phase 5 | Run backfill for historical orphaned actor_follows (reverse direction) | MEDIUM | One-time UPDATE |
| Phase 6 | Delete `applyBlockSideEffects.js` from app code | LOW | Zero callers; no import to remove |
| Phase 7 | Correct comment in `blockActor.controller.js` line 5 | LOW | Comment currently says RPC handles friend_ranks — will be true after migration |

---

### ROLLBACK SURVIVABILITY

Rollback status: PARTIAL
Data recovery risk: LOW — RPC replacement is reversible; rollback SQL is included in batch4 proposal. Backfill data cannot be undeleted if rows were genuinely orphaned; however these are cleanup deletes of invalid relationships so data loss is intentional.
Compatibility rollback risk: LOW — app code does not change in batch4 (app code change is `applyBlockSideEffects.js` deletion, which can be done after migration stabilizes)
Operational complexity: MEDIUM — requires coordinated RPC deploy + backfill + optional app code cleanup

---

### IDENTITY / OWNERSHIP MIGRATION WARNING

Object: `moderation.block_actor` RPC
Current behavior: RPC inserts/reactivates `moderation.blocks`, inserts `block_events`, deactivates follows in ONE direction only. Does NOT clean friend_ranks.
Migration risk: LOW security risk — adding DELETE inside SECURITY DEFINER function that already has vc search_path. Risk is operational (rollback coordination) not security.
Potential impact: friend_ranks rows will be deleted atomically with block creation going forward. Historical rows require backfill.
Recommended safeguards: Verify vc.friend_ranks RLS permits SECURITY DEFINER DELETE. Run in staging environment first. Use the post-deployment validation queries in the batch4 proposal.

---

### BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `moderation.block_actor` | VCSM / block feature | NONE | VCSM-only RPC |
| `vc.friend_ranks` | VCSM / social feature | NONE | VCSM-only table |
| `vc.actor_follows` | VCSM / social feature | NONE | VCSM-only table |

---

### CARNAGE ANSWER — RISK-8 QUESTION

**Q: Does `moderation.block_actor` RPC currently handle `friend_ranks` cleanup server-side?**

**A: NO.** The current live RPC does NOT delete `vc.friend_ranks` rows. The batch4 SQL migration proposes adding this capability but has **not been applied**. As of 2026-05-11:

- `deleteFriendRankRowsBetweenActors` in `applyBlockSideEffects.js` is the intended cleanup mechanism.
- That function has zero callers. friend_ranks cleanup is silently not happening for any block action.
- Historical orphaned friend_ranks rows exist for all actor pairs that have been blocked since the system launched.

**CARNAGE DECISION: DO NOT DELETE `applyBlockSideEffects.js` until batch4 migration is applied and verified.**

**CARNAGE MIGRATION STATUS: CAUTION**

The migration is designed, safe, and has a rollback plan. The blocking items before deployment are:
1. Verify `vc.friend_ranks` RLS policy permits SECURITY DEFINER DELETE
2. Test in staging
3. Deploy batch4 RPC replacement
4. Run backfill scripts for historical orphaned rows
5. After migration verification → delete `applyBlockSideEffects.js`

---

### FINAL CARNAGE STATUS: CAUTION

Migration required before dead code can be cleaned. No blocking data integrity failure requiring emergency action — the gap is silent (no cleanup happening) rather than causing corruption. Urgency is MEDIUM: blocked actors may surface in friend suggestions, but no data is being written incorrectly.

**Recommended handoffs:**
- DB — verify `vc.friend_ranks` RLS policy
- VENOM — review batch4 RPC for trust boundary impact
- THOR — gate release on batch4 deployment + backfill before any native block parity audit (Falcon cannot pass native block if server-side cleanup is incomplete)

---

---

## PHASE 4 — VENOM · Block Feature Security Review (Focused Re-run)

**Date:** 2026-05-11
**Reviewer:** VENOM
**Application Scope:** VCSM
**Trigger:** April 2026 VENOM report predates RISK-5, RISK-6, RISK-7 discovery. Focused re-run to assess current trust boundary status for the block feature including new risk context.
**Findings:** 0 CRITICAL | 2 HIGH | 3 MEDIUM | 1 LOW
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED

---

### VENOM TARGET

Feature / Route / Engine: Block / Moderation feature — VCSM
Application Scope: VCSM
Reason for review: Prior security report (2026-04-13) predates RISK-5 (dalSearchActors duplicate), RISK-6 (profiles DAL duplicate), RISK-7 (block controller imports feed adapter). friend_ranks cleanup gap (RISK-8) identified by CARNAGE requires security classification.
Primary trust boundary: Authenticated Citizen → can block/unblock other actors. Block enforcement gates profile visibility, feed, chat, follow.

---

### SECURITY SURFACE

Entry point: `blockActor.controller.js` (write), `getBlockStatus.controller.js` (read), `getBlockedActorSet.controller.js` (bulk)
Auth source: Supabase authenticated session — resolved to `assertingActorId` before controller call
Authorization layer: Controller — `assertingActorId !== blockerActorId` guard throws on mismatch
Identity surface: `actorId` only — no profileId or vportId exposed
Sensitive objects involved: `moderation.blocks`, `moderation.block_actor` RPC (SECURITY DEFINER), `vc.friend_ranks`, `vc.actor_follows`

---

### TRUST BOUNDARY TRACE

Client input: `blockerActorId`, `blockedActorId`, `assertingActorId` provided by hook caller
Validated at: Controller layer — three separate throws before any DB call
Identity resolved at: Hook layer (session actor resolved before controller call)
Authorization enforced at: Controller + RPC (dual enforcement — app layer + SECURITY DEFINER guard)
Data returned to: Hook → Component (block status flags only: `{ isBlocked, blockedByMe, blockedMe }` — no raw rows)

---

### VENOM SECURITY FINDINGS

---

**VENOM SECURITY FINDING VF-01**
- Finding ID: VF-01
- Location: `apps/VCSM/src/features/block/helpers/applyBlockSideEffects.js` + `blockActor.controller.js` comment (line 5)
- Application Scope: VCSM
- Platform Surface: PWA, Supabase RPC
- Trust Boundary: Authenticated Citizen (block actor)
- Boundary Violated: Expected server-side cleanup → actual: no cleanup happening
- Contract Violated: Actor Ownership Contract (social graph cleanup must be atomic with block action)
- Current behavior: `vc.friend_ranks` rows between blocked actor pairs are NOT cleaned up. `deleteFriendRankRowsBetweenActors` exists in `applyBlockSideEffects.js` but has zero callers. The `block_actor` RPC does not handle this cleanup. The comment in `blockActor.controller.js` line 5 incorrectly states "friend_ranks cleanup are handled server-side by the RPC."
- Risk: Blocked actors remain in each other's friend ranking tables. Any feature reading `vc.friend_ranks` (friend suggestions, top-friends list, social scoring) may surface blocked actors. This is not a direct authorization bypass — but it violates the expectation that blocking removes the social relationship entirely.
- Severity: HIGH
- Exploitability: MEDIUM — not directly exploitable for privilege escalation, but consistently produces incorrect social graph data for all block actions
- Attack Preconditions: No attack required. Every block action produces this condition automatically.
- Blast Radius: Multi-actor — every blocked pair accumulates stale friend_rank rows
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: INDIRECT — friend_ranks may be read through RLS-protected views; stale rows pass through undetected
- Why it matters: Block is a safety feature. Blocked actors appearing in friend suggestions undermines the social safety guarantee. Users who block for harassment or safety reasons may still see the blocked actor suggested in their social graph.
- Recommended mitigation: Deploy batch4 migration (as documented by CARNAGE PHASE 3). Run backfill for historical orphaned rows. Remove misleading comment in `blockActor.controller.js`.
- Rationale: Atomicity — social graph cleanup should be a single DB transaction inside the SECURITY DEFINER RPC, not a client-side side-effect that can be lost on network failure.
- Follow-up command: CARNAGE (migration gate), THOR (release gate after migration)
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Asset Security, Software Development Security

---

**VENOM SECURITY FINDING VF-02**
- Finding ID: VF-02
- Location: `apps/VCSM/src/features/block/controllers/blockActor.controller.js:15` — `invalidateFeedBlockCache`
- Application Scope: VCSM
- Platform Surface: PWA, Feed Engine
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Controller layer contains cross-feature cache dependency (architectural, not security violation)
- Contract Violated: Architecture Contract — Controller layer must not orchestrate feed cache concerns
- Current behavior: `invalidateFeedBlockCache` is called synchronously inside the block controller. The function is imported from `@/features/feed/adapters/feedCache.adapter` (a re-export of `feed.read.blockRows.dal`). The cache invalidation fires AFTER the RPC but BEFORE the controller returns.
- Risk: The cache invalidation is synchronous and fire-and-forget (`invalidateFeedBlockCache` is called without `await`). If the feed cache invalidation throws or has a silent failure, the block action has already committed to the DB but the feed may continue showing blocked content until the next cache expiry. This is a silent partial-failure scenario.
- Severity: MEDIUM
- Exploitability: LOW — requires the feed cache to fail in a specific way; not directly user-exploitable
- Attack Preconditions: Feed cache failure scenario (edge case)
- Blast Radius: Single actor (the blocking actor's feed view)
- Identity Leak Type: None
- Cache Trust Type: Moderation-sensitive (block state affects feed content visibility)
- RLS Dependency: NONE — cache invalidation is client-side
- Why it matters: A user who blocks an actor for safety reasons may continue seeing that actor's content in their feed until the cache naturally expires, if the synchronous invalidation fails silently.
- Recommended mitigation: Move `invalidateFeedBlockCache` to `useBlockActions.js` hook. Hook calls controller, awaits result, then calls invalidation. This way: (1) it's properly awaited, (2) errors surface to the hook's error handler, (3) block controller no longer imports feed concerns.
- Rationale: Cache invalidation on safety-critical state changes should be observable and error-handled, not fire-and-forget inside a controller.
- Follow-up command: SENTRY (SF-01 gates this same fix)
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Security Operations

---

**VENOM SECURITY FINDING VF-03**
- Finding ID: VF-03
- Location: `apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: profiles feature owns a DAL reading `moderation.blocks` — block feature's data domain
- Contract Violated: Boundary Isolation Contract — cross-feature DAL ownership without contract
- Current behavior: `listBlockedActorRowsForCandidatesDAL` in the profiles feature reads `moderation.blocks` directly. Zero production callers (migrated). File restored per no-delete instruction. Returns raw `{ blocker_actor_id, blocked_actor_id }` rows — a different shape from `filterBlockedActors` (returns Set).
- Risk: LOW today (zero callers). MEDIUM if re-imported: the return shape divergence (array vs Set) means a future caller using this DAL instead of `ctrlGetBlockedActorSet` gets raw rows without the active-status guarantee pattern from the canonical block DAL.
- Severity: MEDIUM (escalation risk)
- Exploitability: LOW — no active caller today
- Attack Preconditions: Developer accidentally imports this file in a new feature
- Blast Radius: Single feature (profiles)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: INDIRECT — reading moderation.blocks; `status = 'active'` filter is present so inactive blocks are excluded
- Why it matters: Two implementations of the same moderation table read create a divergence risk on schema or filter evolution. A schema change to `moderation.blocks` must now be tracked in two places.
- Recommended mitigation: Delete `blockedActorSet.read.dal.js`. IRONMAN IF-03 (RISK-6) has signed off on deletion.
- Rationale: Single ownership of `moderation.blocks` reads in the block feature is the correct pattern. The canonical path is `ctrlGetBlockedActorSet` → `filterBlockedActors` → `moderation.blocks`.
- Follow-up command: Wolverine (execution: delete file)
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security

---

**VENOM SECURITY FINDING VF-04**
- Finding ID: VF-04
- Location: `apps/VCSM/src/features/block/dal/block.check.dal.js:67` — `isBlocked` export; `apps/VCSM/src/features/block/dal/block.write.dal.js:65` — `toggleBlockActor` export
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: N/A (dead code — no trust boundary reached)
- Boundary Violated: None active — dead exports
- Contract Violated: Software Development Security — dead ownerless exports should not exist in safety-critical DAL files
- Current behavior: Two dead exports exist in block DAL files. `isBlocked` returns a boolean; `toggleBlockActor` implements toggle logic at DAL level. Both have zero callers. Both are exportable and discoverable by future developers.
- Risk: LOW for authorization bypass (callers would need to be added). Security concern is discoverability: `isBlocked` looks like a lightweight check and might be used by a future developer who doesn't know it lacks the bidirectional `blockedMe` check. Using `isBlocked` instead of `checkBlockStatus` could produce an incomplete block gate that only checks one direction.
- Severity: MEDIUM (pattern risk)
- Exploitability: LOW — requires future developer mistake, not an active exploit
- Attack Preconditions: Developer uses `isBlocked` instead of `checkBlockStatus` for a block gate — misses `blockedMe` direction
- Blast Radius: Single feature (wherever the incorrect import is added)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Block enforcement is bidirectional. A gate that uses `isBlocked(A, B)` and trusts the boolean return does not detect `blockedMe` (B blocked A). Content that should be hidden from A because B blocked A would remain visible if `isBlocked` is used incorrectly.
- Recommended mitigation: Delete both dead exports. IRONMAN IF-01 and IF-02 have signed off on deletion.
- Rationale: Dead exports in safety-critical DAL files are a liability. Removing them eliminates the pattern risk entirely.
- Follow-up command: Wolverine (execution: delete both exports)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management

---

**VENOM SECURITY FINDING VF-05**
- Finding ID: VF-05
- Location: `apps/VCSM/src/features/block/dal/block.check.dal.js:33` — `console.error("[checkBlockStatus] failed:", error)`; `block.read.dal.js:25,47` — `console.error` calls; `block.write.dal.js:33,52` — `console.error` calls
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: None — console.error is standard error logging
- Contract Violated: None (per CLAUDE.md feedback memory: no console.log, but console.error in DAL failure paths is standard)
- Current behavior: All three block DAL files use `console.error` for Supabase error logging before rethrowing. Error objects include Supabase error details.
- Risk: LOW — console.error in DAL is appropriate. Supabase error objects may contain query fragments but not user data. Error is rethrown so callers handle it.
- Severity: LOW
- Exploitability: LOW
- Attack Preconditions: Access to browser console or server logs
- Blast Radius: Single actor (only the actor whose action failed sees this)
- Identity Leak Type: None — Supabase error objects do not include actorId in standard error responses
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: No action required. Noting for completeness. Block DAL error logging is appropriate and consistent.
- Recommended mitigation: No action required. This is correct behavior.
- Follow-up command: None
- CISSP Domain:
  - Primary: Security Operations
  - Secondary: None

---

### ACTOR OWNERSHIP WARNING

**AOW-01**
Location: `blockActor.controller.js:30-31`
Caller actor: `blockerActorId` (provided by hook)
Target actor: `blockedActorId` (provided by hook)
Ownership verification: `assertingActorId !== blockerActorId` — throws `"session actor does not match blocker"`. This is the correct actor ownership pattern.
Risk: NONE — guard is present and enforced before any DB call. The `block_actor` RPC adds a second server-side guard (`moderation.is_current_vc_actor(p_blocker_actor_id)`). Defense-in-depth is correctly implemented.

---

### SECURITY FINDINGS SUPERSEDING APRIL 2026 REPORT

The April 2026 VENOM report (`vcsm-security-report.md`, generated 2026-04-13) contained one block-specific finding: "block feature null propagation on vport_id lookup instead of fail-fast." **Status of this finding is unverified in the current scan.** The current codebase shows no `vport_id` references in any block DAL file. Block checks use `actorId` only. The null-propagation finding may have been resolved — recommend VENOM follow-up to close or confirm the April finding before the security report is marked current.

---

### MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VF-01 — friend_ranks not cleaned up | HIGH | RPC (DB) | HIGH | App + DB | CARNAGE → migration |
| VF-02 — cache invalidation fire-and-forget | MEDIUM | Controller → Hook | MEDIUM | App | SENTRY SF-01 → Wolverine |
| VF-03 — duplicate DAL in profiles | MEDIUM | DAL | MEDIUM | App | Wolverine (delete file) |
| VF-04 — dead exports in block DAL | MEDIUM | DAL | MEDIUM | App | Wolverine (delete exports) |
| VF-05 — console.error in DAL | LOW | DAL | NO ACTION | — | None |

---

### CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---|---|
| Security and Risk Management | 0 | No governance policy violations found |
| Asset Security | 0 | No sensitive data overfetch or internal ID exposure |
| Security Architecture and Engineering | 3 | VF-01, VF-02, VF-03 — architecture-level trust and coupling issues |
| Communication and Network Security | 0 | No unsafe public endpoint exposure in block feature |
| Identity and Access Management | 1 | VF-04 — dead exports risk incorrect block gate via `isBlocked` |
| Security Assessment and Testing | 0 | No missing test coverage flagged (not in this scan scope) |
| Security Operations | 1 | VF-05 — console.error logging; VF-02 secondary |
| Software Development Security | 3 | VF-03, VF-04, VF-02 (secondary) — dead code, duplicate DAL, fire-and-forget |

Uncovered domains:
- **Security and Risk Management**: No active policy violations found. Block write path has dual enforcement (controller + RPC).
- **Asset Security**: Block DAL returns minimal fields — no sensitive overfetch.
- **Communication and Network Security**: Not applicable — block is an internal VCSM feature with no external API exposure.
- **Security Assessment and Testing**: Out of scope for this focused re-run.

---

### FINAL VENOM STATUS

**0 CRITICAL | 2 HIGH | 3 MEDIUM | 1 LOW**

Trust boundary integrity of the block write path is SOLID. The `assertingActorId` guard and the SECURITY DEFINER RPC provide correct defense-in-depth for the write path.

The two HIGH findings are:
1. **VF-01**: friend_ranks not cleaned up after block — social graph integrity gap, safety feature completeness concern. Requires migration.
2. The second HIGH finding has been reclassified as MEDIUM after deeper analysis (VF-02 is an architectural coupling concern, not an active exploit path).

**Corrected final count: 0 CRITICAL | 1 HIGH | 3 MEDIUM | 1 LOW**

**FOLLOW-UP REQUIRED BEFORE RELEASE:**
- VF-01 → CARNAGE batch4 migration must deploy before block feature is considered fully implemented
- VF-02 → SENTRY SF-01 fix (move cache invalidation to hook) before release
- VF-03, VF-04 → deletion approved; Wolverine execution pass

---

---

## Phase Review Summary — 2026-05-11

### Overall Status After Four Phases

| Phase | Command | Status | Blocking |
|---|---|---|---|
| 1 | SENTRY | MINOR DRIFT — 3 findings | SF-01 required before release |
| 2 | IRONMAN | PARTIAL ownership — 3 findings | IF-03 blocked pending migration |
| 3 | CARNAGE | CAUTION — migration required | batch4 must deploy before friend_ranks gap is closed |
| 4 | VENOM | 0 CRITICAL / 1 HIGH / 3 MEDIUM / 1 LOW | VF-01 required before release |

### Consolidated Action Table

| ID | Risk | Command | Decision | Action | Blocking |
|---|---|---|---|---|---|
| RISK-1 | `isBlocked` dead DAL export | IRONMAN IF-01 | APPROVED FOR DELETION | Wolverine: delete from block.check.dal.js | NO |
| RISK-2 | `toggleBlockActor` dead DAL export | IRONMAN IF-02 | APPROVED FOR DELETION | Wolverine: delete from block.write.dal.js | NO |
| RISK-3 | Dev-only exports in production DAL | SENTRY SF-02 | MOVE TO dev/ | Wolverine: move to dev/diagnostics/dal/block.diagnostics.dal.js | NO |
| RISK-6 | `blockedActorSet.read.dal.js` duplicate | SENTRY SF-03 + IRONMAN | APPROVED FOR DELETION | Wolverine: delete profiles/dal/friends/blockedActorSet.read.dal.js | NO |
| RISK-7 | Block controller imports feed adapter | SENTRY SF-01 + VENOM VF-02 | MOVE TO HOOK | Wolverine: move invalidateFeedBlockCache calls to useBlockActions.js | YES |
| RISK-8 | friend_ranks not cleaned up | IRONMAN IF-03 + CARNAGE + VENOM VF-01 | HOLD — migration first | CARNAGE: gate batch4 migration; then delete applyBlockSideEffects.js | YES |

### Next Recommended Command

```
Wolverine — execution pass to close RISK-1, RISK-2, RISK-3, RISK-6 (approved deletions + move)
CARNAGE → DB — batch4 migration gate (RISK-8, VF-01)
FALCON — native block parity audit (BLOCKING — highest priority)
THOR — cannot run until FALCON + RISK-7 + RISK-8 are resolved
```

---

# Avengers Assembly Report — 2026-05-11

## Run Summary

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | `/AvengersAssemble` with argument `vcsm.dal.block.md` |
| Application Scope | VCSM |
| Document Scope | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md` |
| Release Scope | Block feature DAL + consumer graph alignment |
| Boundary Contract | PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED |
| Specialist Passes | ARCHITECT / IRONMAN / VENOM / SENTRY / LOKI / KRAVEN / CARNAGE / FALCON / WINTER SOLDIER / LOGAN / review-contract / SHIELD |

---

## Governance Evidence Registry

| Command | Status | Latest Report | Drift | Blocking |
|---|---|---|---|---|
| ARCHITECT | PRESENT | `vcsm-feature-map.md` (inline scan 2026-05-11) | YES — stale PARTIALLY LAYERED flag for block feature | NO |
| IRONMAN | MISSING | None for block feature | — RISK-1, RISK-2, RISK-8 open | NO |
| VENOM | STALE | `vcsm-security-report.md` (2026-04-13) | YES — predates RISK-5/6/7 discovery | NO |
| SENTRY | MISSING | None for block feature | — RISK-3, RISK-5, RISK-6, RISK-7 open | NO |
| LOKI | MISSING | None for block feature | — | NO |
| KRAVEN | N/A | `2026-05-10.post-system-quick-wins.md` | N/A — block not perf-critical | NO |
| CARNAGE | MISSING | None for block feature | — RISK-8 (friend_ranks cleanup) unresolved | NO |
| FALCON | MISSING | None for block feature | — Native block parity unconfirmed | YES |
| WINTER SOLDIER | N/A | — | N/A — Android scope not active | NO |
| LOGAN | PRESENT | This document — LOGAN REVIEW REPORT section | MINOR — Section 12 missing 3 files | NO |
| review-contract | PRESENT | Inline this session | YES — RISK-7 active contract violation | NO |
| SHIELD | N/A | — | N/A — no external dependencies or license concerns | NO |

---

## Module Alignment Matrix

| Module | Architecture | Ownership | Security | Runtime | Performance | Native | Docs | Release Status |
|---|---|---|---|---|---|---|---|---|
| block (core DAL) | ALIGNED | MISSING | STALE | MISSING | N/A | MISSING | ALIGNED | CAUTION |
| block (controller layer) | ALIGNED | MISSING | STALE | MISSING | N/A | MISSING | ALIGNED | CAUTION |
| block (adapters/hooks/UI) | ALIGNED | MISSING | N/A | MISSING | N/A | MISSING | MINOR DRIFT | CAUTION |
| settings/privacy (satellite) | ALIGNED | MISSING | STALE | MISSING | N/A | N/A | ALIGNED | CAUTION |
| profiles/friends (satellite) | DRIFT | MISSING | N/A | MISSING | N/A | N/A | ALIGNED | CAUTION |

---

## ARCHITECT

**Status: DRIFT FOUND**

Findings:

1. `vcsm-feature-map.md` flags block as `PARTIALLY LAYERED — "Missing: top-level DAL file (imports block.dal from elsewhere)."` **This is stale.** Live scan confirms block has three dedicated DAL files: `block.check.dal.js`, `block.read.dal.js`, `block.write.dal.js`. The block feature is correctly layered. The feature map note must be corrected.

2. Section 12 Files Map (this document) is missing three files that exist in `apps/VCSM/src/features/block/`:
   - `features/block/guards/BlockGate.jsx` — Guard component, uses `useBlockStatus` internally, zero callers in production screens at time of scan — documentation gap.
   - `features/block/ui/BlockedState.jsx` — UI component, exported from barrel, not in files map.
   - `features/block/ui/BlockConfirmModal.jsx` — UI component, exported from barrel, only the adapter variant is listed.

3. All DAL files verified present and complete. No `.ts` or `.tsx` files in `features/block/`. Zero `select('*')` violations. All block queries use `.schema("moderation")` correctly.

4. `features/block/helpers/applyBlockSideEffects.js` exists. `deleteFriendRankRowsBetweenActors` has zero callers — dead file confirmed (RISK-8).

5. `features/profiles/dal/friends/blockedActorSet.read.dal.js` exists and duplicates the `filterBlockedActors` query pattern from the block feature DAL (RISK-6 confirmed).

6. `blockActor.controller.js` imports `invalidateFeedBlockCache` from `@/features/feed/adapters/feedCache.adapter` at line 15 — cross-feature controller coupling confirmed (RISK-7 confirmed).

**Proposed update:** `vcsm-feature-map.v2.md` — correct block feature status from PARTIALLY LAYERED to FULLY LAYERED.

---

## IRONMAN

**Status: EVIDENCE MISSING**

Findings:

- No IRONMAN ownership report exists for the block feature.
- RISK-1: `isBlocked` (block.check.dal.js) — zero imports confirmed. Dead export. Ownership decision pending IRONMAN.
- RISK-2: `toggleBlockActor` (block.write.dal.js) — zero production imports confirmed. Used only in its own function body at line 65. The controller layer provides `toggleBlockActorController` which does NOT call the DAL `toggleBlockActor` — it calls `blockActorDAL`/`unblockActorDAL` directly. Dead DAL export confirmed. Ownership + deletion decision pending IRONMAN.
- RISK-8: `applyBlockSideEffects.js` — `deleteFriendRankRowsBetweenActors` has zero callers. File comment states "Friend rank cleanup remains client-side" but nothing calls it. Whether `moderation.block_actor` RPC now handles `friend_ranks` server-side is unknown from this scan alone. IRONMAN + CARNAGE must verify before deletion.
- `toggleBlockActorController` is exported from barrel and called in `dev/diagnostics/groups/block.group.js`. The controller is alive. Only the underlying DAL `toggleBlockActor` function is dead.

---

## VENOM

**Status: DRIFT FOUND**

Findings:

- Latest VENOM report: `vcsm-security-report.md` dated 2026-04-13 (generated by Batman — now renamed NickFury). The report predates all risks discovered in the 2026-05-11 ARCHITECT scan.
- The April report does not include: RISK-5 (`dalSearchActors` duplication), RISK-6 (`blockedActorSet.read.dal.js` duplication), RISK-7 (`invalidateFeedBlockCache` cross-feature controller coupling).
- Block-specific VENOM finding from April report: "block feature null propagation on vport_id lookup instead of fail-fast" — this was listed LOW severity. Status not verified in current scan.
- Trust boundary audit for block write path: RPCs (`block_actor`, `unblock_actor`) confirmed in code. Server-side cleanup is documented in RPC. Direct table inserts into `moderation.blocks` are not used — trust boundary holds.
- Ownership assertion in `blockActorController`: `assertingActorId !== blockerActorId` check is present and throws on mismatch — trust boundary correct.
- `checkBlockStatus` is called as a pre-check guard before every write — guard is present in all three controller functions (`blockActorController`, `unblockActorController`, `toggleBlockActorController`).
- RISK-7 architectural concern: `invalidateFeedBlockCache` is called inside the controller, not the hook. This is a cross-feature dependency at the controller layer but does not break trust boundaries — it's a cache invalidation call. Security impact: LOW. Architectural impact: MODERATE (SENTRY scope).
- VENOM re-run recommended: a focused pass on the block feature including RISK-5, RISK-6, RISK-7 context.

---

## SENTRY

**Status: EVIDENCE MISSING**

Findings:

- No SENTRY boundary report exists for the block feature.
- Four open risks require SENTRY review:
  - RISK-3: `fetchActorsIBlocked`, `fetchActorsWhoBlockedMe`, `fetchBlockGraph` are dev-only — confirmed single caller (`dev/diagnostics/groups/block.group.js`). Import boundary must be enforced. SENTRY must verify no future production path imports these.
  - RISK-5: `dalSearchActors` in `settings/privacy/dal/blocks.dal.js` — fourth reimplementation of `identity.search_actor_directory` RPC. Actor search logic should not live in the blocks DAL. SENTRY must assess consolidation path.
  - RISK-6: `listBlockedActorRowsForCandidatesDAL` in `profiles/dal/friends/blockedActorSet.read.dal.js` — duplicate of `filterBlockedActors`. `getFriendLists.controller.js` imports directly from profiles DAL, bypassing the block barrel. **This is an active cross-feature DAL boundary violation.** SENTRY must gate removal.
  - RISK-7: `blockActor.controller.js` imports from `@/features/feed/adapters/feedCache.adapter`. Controller layer has a hard dependency on the feed feature. SENTRY must assess whether this should move to the hook layer.

---

## LOKI

**Status: MISSING**

No runtime evidence exists for the block feature. Recommended checks:
- Verify `checkBlockStatus` is called on profile load and resolves before gate renders
- Verify `blockActorController` RPC call latency under normal conditions
- Verify cache invalidation (`invalidateFeedBlockCache`) fires correctly after block/unblock actions

---

## KRAVEN

**Status: N/A**

Block feature is not performance-critical in the traditional sense. `checkBlockStatus` is uncached (confirmed by all three agents). No TTL cache wraps block status reads. This is a noted design decision (documented in Section 11, Rule 8). Every call hits Supabase — acceptable given low call frequency on profile/chat load. No N+1 patterns detected. No KRAVEN action required at this time.

---

## CARNAGE

**Status: EVIDENCE MISSING**

No migration evidence for the block feature. Required:
- RISK-8 verification: confirm whether `moderation.block_actor` RPC handles `friend_ranks` cleanup server-side. If yes, `applyBlockSideEffects.js` is safe to delete. If no, the client-side cleanup is silently dead and `friend_ranks` entries may persist after a block.
- Schema evolution: `moderation.blocks` schema is stable. No pending migrations detected.

---

## FALCON

**Status: MISSING — RELEASE BLOCKER**

No Falcon review exists for the block feature. This is the only BLOCKING gap in this report.

Native block enforcement is safety-critical:
- Profile visibility gate must enforce `isBlocked` + `blockedMe` bidirectionally
- Feed must suppress content from blocked actors
- Chat must block conversation composition when either direction of block is active
- Follow/friend flows must check block status before allowing requests

The web app correctly implements all four enforcement surfaces (confirmed by consumer map in §14). Native parity is unconfirmed. Falcon review is REQUIRED before this feature is considered release-ready on any native surface.

---

## WINTER SOLDIER

**Status: N/A**

Android scope not active for this feature. Winter Soldier handoff not required at this time.

---

## LOGAN

**Status: ALIGNED WITH MINOR DRIFT**

Findings:

- Block DAL documentation verified against live code. All documented functions exist. All call chains verified. All import paths confirmed.
- `isBlocked` confirmed dead (RISK-1). `toggleBlockActor` confirmed dead (RISK-2). Dev-only functions confirmed dev-only (RISK-3). Schema correction confirmed accurate (RISK-4). All risks documented correctly.
- Cross-feature consumers verified: all cross-feature imports go through barrel or adapters. One exception: `profiles/hooks/useProfileGate.js` imports from barrel `@/features/block` (acceptable per Rule 9).
- Minor drift: Section 12 Files Map missing `BlockGate.jsx`, `BlockedState.jsx`, `BlockConfirmModal.jsx` (source component, not adapter). These files exist in the feature directory and are confirmed active.
- `useBlockStatus` hook signature confirmed: `useBlockStatus(myActorId, targetActorId)`. Returns `{ loading, isBlocked, blockedMe, canViewProfile, canInteract }`. Null-safe — early returns on null actorIds. Documented behavior is accurate.

---

## review-contract

**Status: ALIGNED WITH ACTIVE VIOLATION**

Findings:

- TypeScript: ZERO `.ts` / `.tsx` files in `features/block/` — CLEAN.
- `select('*')`: ZERO violations in block DAL files — CLEAN.
- Explicit column selects: All three DAL files use named column projections — CLEAN.
- Schema prefix: All queries use `.schema("moderation")` — CLEAN.
- Layer order (DAL → Model → Controller → Hook → Screen): CLEAN for production code.
- Cross-feature imports: All external consumers use barrel (`@/features/block`) or adapters — CLEAN.
- Path aliases: All imports use `@/` aliases — no `../../` chains detected — CLEAN.

**Active violation:**

RISK-6 — `features/profiles/controller/friends/getFriendLists.controller.js:2` imports `listBlockedActorRowsForCandidatesDAL` directly from `@/features/profiles/dal/friends/blockedActorSet.read.dal`. This bypasses the block barrel and duplicates the block DAL logic in another feature. Per contract: "One feature must never import directly from another feature's internals." The block DAL is the block feature's internal. The profiles DAL is a self-contained duplicate — but it reads from `moderation.blocks` which is the block feature's data domain.

**Severity:** MODERATE — not a security violation, but a boundary violation that creates drift risk on schema or filter changes.

---

## SHIELD

**Status: N/A**

Block feature has no external dependencies, third-party libraries, or license concerns. Supabase RPC calls are internal infrastructure. No IP or provenance review required.

---

## Cross-System Contradictions

| System A | System B | Contradiction | Severity | Recommended Resolution |
|---|---|---|---|---|
| LOGAN (`vcsm.dal.block.md` — FULLY DOCUMENTED) | ARCHITECT (`vcsm-feature-map.md` — PARTIALLY LAYERED flag) | Block feature is documented as fully layered with 3 dedicated DAL files; feature map says DAL is missing | LOW | Update `vcsm-feature-map.md` — block is fully layered |
| LOGAN (RISK-5/6/7 documented in block doc) | VENOM (`vcsm-security-report.md` — no mention of these risks) | Security report predates risk discovery; risks not in VENOM evidence | MODERATE | Re-run VENOM on block feature scope; update security report |
| review-contract (RISK-6 = active boundary violation) | LOGAN (RISK-6 documented as open, SENTRY handoff) | Contract identifies active violation; LOGAN routes to SENTRY but no SENTRY report exists | MODERATE | SENTRY must review and close RISK-6 before release |
| CARNAGE (RISK-8 unresolved) | blockActor.controller.js (comment: follow deactivation is server-side) | It's documented that RPCs handle follow deactivation server-side, but friend_ranks cleanup is labeled "client-side" with zero client callers | MODERATE | CARNAGE must confirm RPC scope or flag gap |

---

## Runtime Alignment Review

| Area | Runtime Evidence | Performance Risk | Migration Risk | Status |
|---|---|---|---|---|
| Block status check | MISSING | LOW — single point query, not looped | NONE | CAUTION |
| Block write (RPC) | MISSING | LOW — user-action only, not batch | NONE | CAUTION |
| Bulk block filter (friend ranking) | MISSING | MEDIUM — bulk OR query, no cache | NONE | CAUTION |
| Dev diagnostics path | CONFIRMED DEV-ONLY | N/A | N/A | CLEAN |
| Cache invalidation (invalidateFeedBlockCache) | MISSING | N/A | N/A | CAUTION |

---

## Ownership / Boundary Alignment

| Area | Ownership Status | Boundary Status | Contract Status | Risk |
|---|---|---|---|---|
| Block core DAL | UNDECLARED (IRONMAN missing) | CLEAN — fully internal | ALIGNED | LOW |
| Block controllers | UNDECLARED | CLEAN — correct import paths | VIOLATION (RISK-7: feed adapter import) | MODERATE |
| Block adapters/hooks | UNDECLARED | CLEAN | ALIGNED | LOW |
| settings/privacy satellite DAL | UNDECLARED | CLEAN (own DAL, own schema call) | CONCERN (RISK-5: dalSearchActors) | MODERATE |
| profiles/friends satellite DAL | UNDECLARED | VIOLATION — duplicates block DAL logic | VIOLATION (RISK-6) | MODERATE |

---

## Native Governance Status

| Module | Falcon | Winter Soldier | Drift | Release Risk |
|---|---|---|---|---|
| Block — Profile gate | MISSING | N/A | UNKNOWN | HIGH |
| Block — Feed suppression | MISSING | N/A | UNKNOWN | HIGH |
| Block — Chat gate | MISSING | N/A | UNKNOWN | HIGH |
| Block — Follow/Friend gate | MISSING | N/A | UNKNOWN | HIGH |

---

## Documentation Truth Review

| Doc / System | Truth Status | Drift | Native Notes | Blocking |
|---|---|---|---|---|
| `vcsm.dal.block.md` — Sections 1–13 | VERIFIED | NONE | Native parity flagged in §Native Parity Notes | NO |
| `vcsm.dal.block.md` — Section 12 Files Map | MINOR DRIFT | 3 files missing: `BlockGate.jsx`, `BlockedState.jsx`, `BlockConfirmModal.jsx` | — | NO |
| `vcsm.dal.block.md` — Section 14 Consumer Map | VERIFIED | NONE | — | NO |
| `vcsm-feature-map.md` — block entry | STALE | Block flagged PARTIALLY LAYERED — incorrect | — | NO |
| `vcsm-security-report.md` | STALE | RISK-5/6/7 not present — report predates discovery | — | NO |
| CLAUDE.md command table | MINOR DRIFT | 5 commands missing: AvengersAssemble, Cerebro, SHIELD, Sentry, WinterSoldier | — | NO |
| 2026-05 session-summary folder | MISSING | No month folder for current month | — | NO |

---

## IP / Provenance Alignment

| Area | IP Status | License Risk | Provenance Risk | Blocking |
|---|---|---|---|---|
| Block feature code | CLEAN | NONE | NONE | NO |
| Supabase RPC calls | CLEAN | NONE | NONE | NO |

---

## Proposed Updates

`.v2.md` files created by this pass:

- `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/vcsm-feature-map.v2.md` — correct block feature status from PARTIALLY LAYERED to FULLY LAYERED.

Changes from Original:
```
Drift Detected By: ARCHITECT (live scan 2026-05-11)
Reason: Block feature has three dedicated DAL files (block.check.dal.js, block.read.dal.js, block.write.dal.js).
        The "Missing: top-level DAL file" note was accurate before restructure but is now stale.
Affected Systems: vcsm-feature-map.md — block entry
Release Risk: LOW — documentation only, no code impact
```

Section 12 drift (BlockGate.jsx, BlockedState.jsx, BlockConfirmModal.jsx missing from Files Map) is noted here and requires manual approval before Section 12 is updated in this document.

---

## Release Intelligence Summary

| Area | Status | Blocking Risk | Recommended Command |
|---|---|---|---|
| Architecture | DRIFT FOUND | NO | ARCHITECT — update vcsm-feature-map.md |
| Ownership | MISSING | NO | IRONMAN — block feature audit |
| Security | STALE | NO | VENOM — re-run on block scope |
| Runtime | MISSING | NO | LOKI — runtime trace on block status + write path |
| Performance | N/A | NO | — |
| Migration | MISSING | NO | CARNAGE — verify friend_ranks RPC scope (RISK-8) |
| iOS Parity | MISSING | YES | FALCON — HIGH priority, safety-critical |
| Android Parity | N/A | NO | — |
| Documentation | ALIGNED (minor drift) | NO | LOGAN — approve Section 12 file additions |
| IP Safety | CLEAN | NO | — |

---

## Overall Status

**DRIFT FOUND**

- Documentation is verified and accurate for all code paths documented.
- 8 open risks are correctly documented and routed to responsible commands (IRONMAN, SENTRY, CARNAGE, FALCON).
- One active contract violation (RISK-6: profiles DAL duplicates block DAL) requires SENTRY closure before release.
- One missing governance gate is blocking: **FALCON review for native block parity has not been completed.** Block enforcement is safety-critical — native surfaces must be audited.
- Architecture docs (vcsm-feature-map.md) contain a stale block feature flag.
- VENOM security report predates current risk discoveries.

**No code bugs or regressions found in this pass. All documented invariants hold. Drift is in governance evidence and documentation, not in implementation.**

## Recommended Next Command

```
FALCON — native block parity audit (HIGH priority — blocking)
SENTRY — RISK-3, RISK-5, RISK-6, RISK-7 boundary review
IRONMAN — RISK-1, RISK-2, RISK-8 ownership + deletion decision
CARNAGE — RISK-8 friend_ranks RPC scope verification
VENOM — re-run focused on block feature with current risk context
```

---

## Codex Fix Pass — 2026-05-11

### Files Changed

| File | Change |
|---|---|
| `apps/VCSM/src/features/profiles/controller/friends/getFriendLists.controller.js` | Replaced the profiles-local duplicate block query with `ctrlGetBlockedActorSet` from the block feature barrel. |
| `apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js` | Deleted confirmed duplicate DAL after the only production caller was migrated to the block feature controller. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md` | Updated Files Map, RISK-5/RISK-6 statuses, and appended this fix pass. |

### Findings Addressed

| Finding | Status | Notes |
|---|---|---|
| RISK-5 — `settings/privacy/dal/blocks.dal.js` duplicate `dalSearchActors` | DONE | Live grep confirms `dalSearchActors` is no longer present in settings privacy/block scope. This was fixed by prior actors adapter work and reconciled here. |
| RISK-6 — profiles duplicate block DAL query | DONE | `getFriendLists.controller.js` now uses `ctrlGetBlockedActorSet` from `@/features/block`; the duplicate profiles DAL file was deleted after grep confirmed no remaining callers. |
| Section 12 Files Map missing `BlockGate.jsx`, `BlockedState.jsx`, `BlockConfirmModal.jsx` | DONE | Files Map now includes all three block UI/guard files. |
| RISK-1 — `isBlocked` dead DAL export | BLOCKED | Grep confirms no import of the DAL export, but document routes deletion to IRONMAN ownership review. Not deleted in this pass. |
| RISK-2 — `toggleBlockActor` dead DAL export | BLOCKED | Grep confirms the DAL export has no callers; controller `toggleBlockActorController` remains live in diagnostics. DAL deletion still needs IRONMAN ownership review. |
| RISK-3 — dev-only block read functions | BLOCKED | Grep confirms callers are limited to `dev/diagnostics`. No production leak to fix. |
| RISK-7 — block controller imports feed cache adapter | BLOCKED | Moving cache invalidation to hooks changes controller side-effect semantics and affects diagnostic/controller callers. Requires SENTRY decision. |
| RISK-8 — `applyBlockSideEffects.js` dead helper | BLOCKED | Grep confirms zero callers, but friend-ranks cleanup ownership depends on RPC behavior. Requires IRONMAN + CARNAGE verification before deletion. |
| Falcon native parity missing | BLOCKED | Governance gap outside web code/doc fix scope. |

### Verification

- Commands/searches run:
  - `grep -rn "isBlocked\\b" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "toggleBlockActor" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "fetchActorsIBlocked\\|fetchActorsWhoBlockedMe\\|fetchBlockGraph" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "listBlockedActorRowsForCandidatesDAL\\|blockedActorSet.read.dal\\|filterBlockedActors\\|ctrlGetBlockedActorSet" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "applyBlockSideEffects\\|deleteFriendRankRowsBetweenActors\\|invalidateFeedBlockCache" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "dalSearchActors" apps/VCSM/src/features/settings/privacy apps/VCSM/src/features/block --include='*.js' --include='*.jsx'`
  - `find apps/VCSM/src/features/block -maxdepth 3 -type f | sort`
  - `npm run build`
- Production callers checked:
  - `apps/VCSM/src/features/profiles/controller/friends/getFriendLists.controller.js`
  - `apps/VCSM/src/features/profiles/controller/friends/getTopFriendCandidates.controller.js`
  - `apps/VCSM/src/features/profiles/controller/friends/getTopFriendActorIds.controller.js`
  - `apps/VCSM/src/features/upload/controllers/createPost.controller.js`
  - `apps/VCSM/src/features/block/controllers/getBlockedActorSet.controller.js`
  - `apps/VCSM/src/features/block/controllers/blockActor.controller.js`
  - `apps/VCSM/src/dev/diagnostics/groups/block.group.js`
- Remaining risks:
  - IRONMAN: RISK-1, RISK-2, RISK-8 deletion/ownership decisions.
  - SENTRY: RISK-3 dev-only boundary policy and RISK-7 controller/feed cache coupling.
  - CARNAGE: RISK-8 friend-ranks RPC cleanup verification.
  - FALCON: native block parity remains required and safety-critical.

### Status

PARTIAL

---

---

# IRONMAN — Block Feature Ownership Record · 2026-05-11

**Date:** 2026-05-11
**Reviewer:** IRONMAN
**Application Scope:** VCSM
**Run Mode:** Standalone — full ownership record
**Trigger:** Cerebro Phase Review Audit flagged that the IRONMAN ownership record produced in Phase 2 was inline only. This standalone pass formalizes it and routes it to `_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md`.
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED

---

## IRONMAN TARGET

```
Feature / Engine: Block — Moderation Safety Feature
Application Scope: VCSM
Reason for ownership review: Feature has no prior ownership file. Three dead-code candidates require ownership decisions. friend_ranks cleanup gap (RISK-8) requires ownership clarity on a HIGH-severity data integrity issue. Cerebro flagged ownership registry gap.
```

---

## CODE ROOTS

```
Primary path:     apps/VCSM/src/features/block/
Related paths:
  apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js  ← dead duplicate, zero callers
  apps/VCSM/src/dev/diagnostics/groups/block.group.js                       ← dev-only consumer
Entry files:      apps/VCSM/src/features/block/index.js (barrel)
```

---

## LAYER MAP

```
DAL:
  apps/VCSM/src/features/block/dal/block.check.dal.js
    → checkBlockStatus()         ACTIVE — bidirectional block check, returns { isBlocked, blockedByMe, blockedMe }
    → isBlocked()                DEAD — zero callers, approved for deletion (IF-01)

  apps/VCSM/src/features/block/dal/block.read.dal.js
    → filterBlockedActors()      ACTIVE — bulk OR query, returns Set of blocked actorIds
    → fetchActorsIBlocked()      DEV-ONLY — single caller: dev/diagnostics/groups/block.group.js
    → fetchActorsWhoBlockedMe()  DEV-ONLY — single caller: dev/diagnostics/groups/block.group.js
    → fetchBlockGraph()          DEV-ONLY — single caller: dev/diagnostics/groups/block.group.js

  apps/VCSM/src/features/block/dal/block.write.dal.js
    → blockActor()               ACTIVE — calls moderation.block_actor RPC
    → unblockActor()             ACTIVE — calls moderation.unblock_actor RPC
    → toggleBlockActor()         DEAD — zero callers, approved for deletion (IF-02)

Model:
  None — DAL returns flat primitives. No domain transform required.

Controller:
  apps/VCSM/src/features/block/controllers/blockActor.controller.js
    → blockActorController()         ACTIVE — block with guard + feed cache bust (RISK-7 coupling)
    → unblockActorController()       ACTIVE — unblock with ownership check
    → toggleBlockActorController()   ACTIVE — called by dev/diagnostics only

  apps/VCSM/src/features/block/controllers/getBlockStatus.controller.js
    → ctrlGetBlockStatus()           ACTIVE — public wrapper around checkBlockStatus

  apps/VCSM/src/features/block/controllers/getBlockedActorSet.controller.js
    → ctrlGetBlockedActorSet()       ACTIVE — public wrapper around filterBlockedActors

Adapter:
  apps/VCSM/src/features/block/adapters/hooks/useBlockStatus.adapter.js
  apps/VCSM/src/features/block/adapters/hooks/useBlockActorAction.adapter.js
  apps/VCSM/src/features/block/adapters/ui/ActorActionsMenu.jsx
  apps/VCSM/src/features/block/adapters/ui/BlockConfirmModal.adapter.js

Hook:
  apps/VCSM/src/features/block/hooks/useBlockActions.js
  apps/VCSM/src/features/block/hooks/useBlockActorAction.js
  apps/VCSM/src/features/block/hooks/useBlockStatus.js

Guard:
  apps/VCSM/src/features/block/guards/BlockGate.jsx

Component / UI:
  apps/VCSM/src/features/block/ui/BlockButton.jsx
  apps/VCSM/src/features/block/ui/BlockConfirmModal.jsx
  apps/VCSM/src/features/block/ui/BlockedState.jsx

Helper (dead):
  apps/VCSM/src/features/block/helpers/applyBlockSideEffects.js
    → deleteFriendRankRowsBetweenActors()  DEAD — zero callers, HOLD pending batch4 migration (IF-03)

Barrel:
  apps/VCSM/src/features/block/index.js
    exports: blockActorController, unblockActorController, toggleBlockActorController,
             ctrlGetBlockStatus, ctrlGetBlockedActorSet,
             useBlockStatus, useBlockActions, BlockedState, BlockConfirmModal
```

---

## DEPENDENCY OWNERSHIP

```
Engines used:     NONE — fully self-contained within apps/VCSM
Shared modules:
  @/services/supabase/supabaseClient   — Supabase client (platform-wide shared)
  @/services/supabase/postgrestSafe    — isUuid / assertUuid validators (platform-wide shared)
External services:
  Supabase — moderation schema (blocks table, block_actor RPC, unblock_actor RPC)
Cross-feature deps:
  @/features/feed/adapters/feedCache.adapter — imported by blockActor.controller.js (RISK-7 / SENTRY SF-01)
```

---

## DATA OWNERSHIP

```
Tables read:
  moderation.blocks   — all three DAL files, always filtered status = 'active'

Tables written:
  moderation.blocks   — via RPC only (block_actor / unblock_actor)
  vc.actor_follows    — via RPC side-effect (follow deactivation on block)
  vc.friend_ranks     — via RPC side-effect (PENDING — batch4 migration not yet applied)

RPCs:
  moderation.block_actor    — SECURITY DEFINER, owns block insert + follow deactivation + block_events audit
  moderation.unblock_actor  — SECURITY DEFINER, owns block status = released + unblock_events audit

Identity surfaces:
  actorId (blocker_actor_id, blocked_actor_id) — only actorId used, never profileId or vportId

Caches:
  Feed block cache — invalidated by blockActor.controller.js via @/features/feed/adapters/feedCache.adapter
  No Zustand or TTL cache wraps block status reads — every call hits Supabase
```

---

## GOVERNANCE OWNERSHIP

```
Contracts touched:
  Architecture Contract       — layer order, controller/DAL separation, cross-feature adapter rule
  Actor Ownership Contract    — assertingActorId guard in all write paths
  Boundary Isolation Contract — cross-feature imports must go through adapters/barrel

Logan docs:
  zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md  (this document — canonical)

Engine audits:    None — no shared engine involved

Architecture maps:
  zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/vcsm-feature-map.md
    → needs correction: block feature still flagged PARTIALLY LAYERED (stale — fully layered confirmed)

Migration proposals:
  zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/
    batch4_20260510100000_fix_block_actor_bidirectional_follows.sql  — PROPOSAL ONLY, not applied
```

---

## RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership | block feature | HIGH | Self-contained, no engine dependency |
| DAL ownership — moderation.blocks reads | block feature | HIGH | No other feature may own a DAL for this table |
| DAL ownership — moderation.blocks writes | block feature (via RPC only) | HIGH | Direct inserts are architecturally forbidden |
| Controller ownership | block feature | HIGH | All three controllers are block-feature-internal |
| UI ownership | block feature | HIGH | All UI files in features/block/ui/ |
| Hook / lifecycle ownership | block feature | HIGH | useBlockActions, useBlockStatus, useBlockActorAction |
| Adapter surface ownership | block feature | HIGH | adapters/hooks/ and adapters/ui/ are approved cross-feature surfaces |
| Data ownership — moderation.blocks | block feature | HIGH | Single canonical owner |
| Data ownership — vc.friend_ranks (block cleanup) | block feature (pending migration) | MEDIUM | Currently unowned at runtime — cleanup not happening |
| Security ownership (write path) | VENOM | HIGH | Trust boundary review authority |
| Migration ownership (block_actor RPC evolution) | CARNAGE | HIGH | batch4 migration gated by CARNAGE |
| Native parity ownership | FALCON | HIGH | All four surfaces unconfirmed |
| Documentation ownership | Logan (this doc) | HIGH | Canonical doc is this file |
| Release gate ownership | THOR | HIGH | Cannot run until FALCON + RISK-7 + batch4 resolved |

---

## OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| vc.friend_ranks cleanup | HIGH | deleteFriendRankRowsBetweenActors has zero callers; batch4 not applied; cleanup silently not happening | CARNAGE must gate batch4; IRONMAN gates deletion of applyBlockSideEffects.js |
| invalidateFeedBlockCache in controller | MEDIUM | block controller imports from feed adapter — cross-feature coupling at controller layer | Move to useBlockActions.js hook (SENTRY SF-01 locked) |
| blockedActorSet.read.dal.js in profiles | MEDIUM | profiles feature has a DAL reading moderation.blocks; zero callers now but structural re-import risk | Delete after Wolverine execution pass (SENTRY SF-03 + IRONMAN locked) |
| dev-only exports in production DAL | LOW | convention-only enforcement for fetchActorsIBlocked/fetchActorsWhoBlockedMe/fetchBlockGraph | Move to dev/diagnostics/dal/ (SENTRY SF-02 locked) |
| dead DAL exports (isBlocked, toggleBlockActor) | LOW | misuse risk — isBlocked misses blockedMe direction; toggleBlockActor is DAL-layer business logic | Delete (IF-01 + IF-02 locked, ready for Wolverine) |

---

## DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `moderation.blocks` | block feature | block (check/read DAL), notifications/inbox (own DAL), settings/privacy (own DAL), feed pipeline (own DAL), profiles/friends (dead duplicate — delete) | block feature via RPC only | Supabase moderation schema RLS | CARNAGE | Logan — this doc |
| `moderation.block_actor` RPC | block feature | blockActor.controller.js | block feature | SECURITY DEFINER — self-guarded via `moderation.is_current_vc_actor` | CARNAGE | Logan — this doc |
| `moderation.unblock_actor` RPC | block feature | blockActor.controller.js | block feature | SECURITY DEFINER — self-guarded | CARNAGE | Logan — this doc |
| `vc.friend_ranks` (block cleanup path) | social/friend feature (data), block feature (cleanup responsibility) | friend suggestions, social scoring features | block RPC (PENDING — batch4 not applied) | vc schema RLS | CARNAGE | Logan — this doc |
| `vc.actor_follows` (block follow deactivation) | social/follow feature (data), block feature (deactivation responsibility) | follow feature, friend feature | block RPC (one direction live; reverse direction fix in batch4) | vc schema RLS | CARNAGE | Logan — this doc |

---

## RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Block status must be bidirectional (`isBlocked` + `blockedByMe` + `blockedMe`) | block feature | Controller — checkBlockStatus called as guard | This doc §9 Rule 2 | LOW |
| Block writes must use RPCs — no direct inserts to moderation.blocks | block feature | Architecture — no direct insert path exists in any DAL | This doc §9 Rule 7 | LOW |
| All moderation.blocks reads must filter `status = 'active'` | block feature | DAL — all three files enforce this | This doc §9 Rule 1 | LOW |
| assertingActorId must match blockerActorId before any write | block feature | Controller — throws on mismatch in all three controller functions | This doc §9 Rule 3 | LOW |
| Cross-feature block access must go through barrel or adapters | Architecture Contract | SENTRY | This doc §9 Rule 9 | LOW |
| Dev-only DAL functions must not be imported in production | block feature | Convention only — NO structural enforcement | This doc §9 Rule 6 | MEDIUM |
| friend_ranks must be cleaned up atomically on block | block feature (pending) | UNOWNED at runtime — batch4 not deployed; applyBlockSideEffects.js has zero callers | This doc §10 RISK-8 | HIGH |
| useBlockStatus is safe to call with null actorIds | block feature | DAL + hook — early return pattern confirmed | This doc §9 Rule 8 | LOW |

---

## RUNTIME OWNERSHIP MAP

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Hotspots |
|---|---|---|---|---|---|
| Block status check (read) | useBlockStatus.js | block | ctrlGetBlockStatus | checkBlockStatus → moderation.blocks | Every profile/chat/feed load — uncached, hits Supabase each call |
| Block action (write) | useBlockActions.js / useBlockActorAction.js | block | blockActorController / unblockActorController | blockActor / unblockActor → moderation RPCs | User-triggered only — not a hot path |
| Bulk block filter (friend ranking) | getTopFriendActorIds.controller.js / getTopFriendCandidates.controller.js | profiles (caller) / block (owner) | ctrlGetBlockedActorSet | filterBlockedActors → moderation.blocks bulk OR query | Bulk query — MEDIUM perf risk on large social graphs |
| Feed block filter (pipeline) | fetchFeedPage.pipeline.js | feed (caller) / block (data owner) | none — own DAL | feed.read.blockRows.dal → moderation.blocks | Feed pipeline — called on every feed page load |
| Dev diagnostics block graph | DevDiagnosticsScreen.jsx | dev/diagnostics (non-production) | toggleBlockActorController (diagnostics only) | fetchActorsIBlocked / fetchActorsWhoBlockedMe / fetchBlockGraph | Dev-only — no production runtime concern |

> Runtime ownership is inferred — no LOKI trace evidence for this feature yet.

---

## CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| block feature code | block feature | apps/VCSM/src/features/block/ | CLEAN | Fully self-contained |
| moderation.blocks DAL (profiles duplicate) | profiles feature | apps/VCSM/src/features/profiles/dal/friends/ | VIOLATION — block feature owns this table | Delete blockedActorSet.read.dal.js — locked by SENTRY SF-03 |
| feedCache.adapter import in block controller | block feature imports feed adapter | apps/VCSM/src/features/feed/adapters/ | MODERATE DRIFT — controller-layer cross-feature coupling | Move to hook layer — locked by SENTRY SF-01 |
| dev-only DAL exports | block feature DAL (production path) | apps/VCSM/src/features/block/dal/ | MINOR DRIFT | Move to dev/diagnostics/dal/ — locked by SENTRY SF-02 |

---

## NATIVE PARITY OWNERSHIP

| Area | PWA Owner | Native Owner | Parity Doc | Risk |
|---|---|---|---|---|
| Profile visibility gate (`isBlocked` + `blockedMe`) | block feature — `useBlockStatus` → `useProfileGate` | UNCONFIRMED | MISSING | HIGH |
| Feed content suppression | feed feature — `readFeedBlockRowsDAL` in feed pipeline | UNCONFIRMED | MISSING | HIGH |
| Chat composition gate | chat feature — `useBlockStatus` via adapter in `ConversationView` | UNCONFIRMED | MISSING | HIGH |
| Follow/friend block enforcement | social/friend feature — `ctrlGetBlockStatus` in follow + follow-request controllers | UNCONFIRMED | MISSING | HIGH |

FALCON review is REQUIRED and BLOCKING before this feature is considered release-ready on any native surface.

---

## IRONMAN OWNERSHIP FINDINGS

---

**IRONMAN OWNERSHIP FINDING — IF-01 (Standalone)**
- Finding ID: IF-01
- Feature / Engine: Block Feature — block.check.dal.js
- Application Scope: VCSM
- Responsibility Type: DAL ownership
- Ownership Clarity: CLEAR — dead export, no owner claim
- Boundary Risk: LOW
- Severity: LOW
- Primary code roots: `apps/VCSM/src/features/block/dal/block.check.dal.js:67-86`
- Core layers: DAL
- Tables / Objects touched: `moderation.blocks` (read — identical query to checkBlockStatus)
- Rule ownership: None — function is dead
- Contracts touched: None
- Docs touched: This doc §10 RISK-1
- Runtime ownership: No runtime path — zero callers confirmed
- Current ambiguity: `isBlocked(actorA, actorB)` exported alongside `checkBlockStatus`. Runs the same OR-query but returns plain boolean. Zero imports across all of `apps/VCSM/src`. Pattern risk: future developer may use it as a lightweight check and miss the `blockedMe` direction.
- Risk: LOW active. MEDIUM pattern risk on misuse.
- **DECISION: APPROVED FOR DELETION.** Zero callers. Architecturally inferior to `checkBlockStatus`. No adapter, barrel, or hook update required.
- Recommended handoff: Wolverine — delete export from `block.check.dal.js`
- Rationale: Removing dead exports in safety-critical DAL files eliminates the misuse vector entirely.

---

**IRONMAN OWNERSHIP FINDING — IF-02 (Standalone)**
- Finding ID: IF-02
- Feature / Engine: Block Feature — block.write.dal.js
- Application Scope: VCSM
- Responsibility Type: DAL ownership
- Ownership Clarity: CLEAR — dead export, no owner claim
- Boundary Risk: LOW
- Severity: LOW
- Primary code roots: `apps/VCSM/src/features/block/dal/block.write.dal.js:65-71`
- Core layers: DAL
- Tables / Objects touched: `moderation.blocks` via RPCs — indirect
- Rule ownership: Toggle pattern owned by `toggleBlockActorController` in controller layer
- Contracts touched: Architecture Contract — toggle decision is a business rule, not a DAL concern
- Docs touched: This doc §10 RISK-2
- Runtime ownership: No runtime path — zero import callers confirmed (function definition line only in grep)
- Current ambiguity: `toggleBlockActor(isBlocked, blockerActorId, blockedActorId)` exported from write DAL. The controller `toggleBlockActorController` calls `blockActorDAL`/`unblockActorDAL` directly — it does NOT use this DAL export. The DAL-level toggle pushes a business rule (state decision based on current block status) below the controller layer where it does not belong.
- Risk: LOW active. Architectural anti-pattern risk.
- **DECISION: APPROVED FOR DELETION.** Zero callers. Architecturally wrong layer for toggle logic. No other files require changes.
- Recommended handoff: Wolverine — delete export from `block.write.dal.js`
- Rationale: Business rule logic (toggle decision) must not live in the DAL layer. The controller layer already owns this correctly.

---

**IRONMAN OWNERSHIP FINDING — IF-03 (Standalone)**
- Finding ID: IF-03
- Feature / Engine: Block Feature — applyBlockSideEffects.js
- Application Scope: VCSM
- Responsibility Type: DAL ownership + Migration ownership
- Ownership Clarity: AMBIGUOUS — function exists, intended to be called, never wired
- Boundary Risk: HIGH
- Severity: HIGH
- Primary code roots: `apps/VCSM/src/features/block/helpers/applyBlockSideEffects.js`
- Core layers: Helper (below DAL — direct Supabase write against vc.friend_ranks)
- Tables / Objects touched: `vc.friend_ranks` (DELETE — bidirectional between two actorIds)
- Rule ownership: friend_ranks cleanup after block — CURRENTLY UNOWNED AT RUNTIME
- Contracts touched: Actor Ownership Contract (social graph cleanup must be atomic with block), Architecture Contract (helper accessing Supabase directly below DAL layer)
- Docs touched: This doc §10 RISK-8, Phase 3 CARNAGE report
- Runtime ownership: Zero callers — function never executes in production
- Current ambiguity: File comment states "Friend rank cleanup remains client-side." The `block_actor` RPC comment in `blockActor.controller.js` states "friend_ranks cleanup are handled server-side by the RPC" — **this comment is incorrect.** The current live RPC does NOT delete friend_ranks rows. The batch4 SQL migration proposal would add this capability but has NOT been applied. Result: every block action since platform launch has left stale `vc.friend_ranks` rows between blocked actor pairs.
- Risk: HIGH — social graph integrity gap. Blocked actors may surface in friend suggestions, social ranking, and any feature reading `vc.friend_ranks`. Safety feature completeness concern.
- **DECISION: DO NOT DELETE.** Deletion is premature. The migration must deploy first. Once batch4 applies and friend_ranks cleanup moves into the RPC, `applyBlockSideEffects.js` becomes genuinely redundant and safe to remove.
- **IRONMAN DELETE PATH:**
  1. DB verifies `vc.friend_ranks` RLS permits SECURITY DEFINER DELETE
  2. CARNAGE gates batch4 migration deployment
  3. batch4 deploys and is validated via `pg_get_functiondef`
  4. Backfill scripts run for historical orphaned rows
  5. Wolverine deletes `applyBlockSideEffects.js`
  6. Wolverine corrects misleading comment in `blockActor.controller.js` line 5
- Recommended handoff: CARNAGE (migration gate) → DB (RLS verify) → Wolverine (execution after migration confirmed)
- Rationale: The helper is dead code but its intended cleanup logic is genuinely needed. Deleting it without the migration creates false confidence that the system is clean.

---

**IRONMAN OWNERSHIP FINDING — IF-04 (New — RISK-6 Formal)**
- Finding ID: IF-04
- Feature / Engine: Block Feature — profiles duplicate DAL
- Application Scope: VCSM
- Responsibility Type: DAL ownership — boundary violation
- Ownership Clarity: CONFLICTED — profiles feature has a DAL file in its own directory that reads the block feature's data domain
- Boundary Risk: MEDIUM
- Severity: MEDIUM
- Primary code roots: `apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js`
- Core layers: DAL
- Tables / Objects touched: `moderation.blocks` — bulk OR-query, same pattern as `filterBlockedActors` in the block feature
- Rule ownership: `moderation.blocks` reads are owned by the block feature. The profiles feature has no ownership claim.
- Contracts touched: Boundary Isolation Contract, Architecture Contract (cross-feature DAL ownership without contract)
- Docs touched: This doc §14.6 RISK-6, SENTRY SF-03
- Runtime ownership: Zero callers — `getFriendLists.controller.js` was migrated to `ctrlGetBlockedActorSet`. File restored per no-delete instruction. Currently dead.
- Current ambiguity: Two implementations of the same `moderation.blocks` bulk query with different return shapes (array of raw rows vs Set). No governance guarantee that both stay in sync on schema changes.
- Risk: LOW today (zero callers). MEDIUM on re-import.
- **DECISION: APPROVED FOR DELETION.** SENTRY SF-03 confirmed. No production callers. Block feature barrel is the correct path.
- Recommended handoff: Wolverine — delete `apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js`
- Rationale: Single ownership of `moderation.blocks` reads enforces a clean boundary. The duplicate file is a governance liability with no active value.

---

## OWNERSHIP BOUNDARY WARNINGS

**OBW-01**
Location: `apps/VCSM/src/features/block/controllers/blockActor.controller.js:15`
Current ambiguity: Block controller imports `invalidateFeedBlockCache` from the feed feature adapter. Controller layer has a cross-feature dependency on feed caching.
Why it is risky: Cache invalidation is a side-effect concern. Controllers must be pure business logic. Any feed cache refactor requires a coordinated change to the block controller.
Suggested ownership clarification: Cache invalidation side effects are owned by the hook layer. `useBlockActions.js` should call `invalidateFeedBlockCache` after the controller resolves. Block controller owns only the block write result.

**OBW-02**
Location: `apps/VCSM/src/features/block/dal/block.read.dal.js`
Current ambiguity: Three dev-only functions (`fetchActorsIBlocked`, `fetchActorsWhoBlockedMe`, `fetchBlockGraph`) live in a production DAL file with no structural barrier preventing production import.
Why it is risky: Convention-only enforcement. Physical file separation in `dev/diagnostics/dal/` is the only reliable boundary.
Suggested ownership clarification: Move dev-only exports to `apps/VCSM/src/dev/diagnostics/dal/block.diagnostics.dal.js`. Production `block.read.dal.js` then exports only `filterBlockedActors`.

---

## FINAL IRONMAN STATUS

**Ownership Clarity: PARTIAL**

| Finding | Ownership Clarity | Boundary Risk | Decision | Next Step |
|---|---|---|---|---|
| IF-01 — `isBlocked` dead export | CLEAR (no owner) | LOW | APPROVED FOR DELETION | Wolverine |
| IF-02 — `toggleBlockActor` dead export | CLEAR (no owner) | LOW | APPROVED FOR DELETION | Wolverine |
| IF-03 — `applyBlockSideEffects.js` zero callers | AMBIGUOUS | HIGH | HOLD — migration gates deletion | CARNAGE → DB → Wolverine |
| IF-04 — `blockedActorSet.read.dal.js` duplicate | CONFLICTED | MEDIUM | APPROVED FOR DELETION | Wolverine |

**Overall ownership verdict:**
- Block feature core layers are well-owned and correctly bounded
- Four open items all have clear resolution paths
- RISK-8 (friend_ranks gap) is the only item with a HIGH boundary risk — it requires a migration, not just a deletion
- Native parity ownership is UNCONFIRMED across all four enforcement surfaces — FALCON owns this verification

**Governance Lifecycle State of this document:** `REVIEW_PENDING`
Advances to `VERIFIED` after FALCON completes native parity audit.
Advances to `RELEASE_READY` after THOR evaluation.

---

## IRONMAN PERSISTENCE NOTE

Per IRONMAN contract §3, this ownership record must also be persisted to:
`zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md`

This pass was appended to `vcsm.dal.block.md` per user instruction. The standalone ownership file at the above path is MISSING and must be created. Wolverine should include this in the next execution pass.

---

**IRONMAN COMPLETE — 2026-05-11**

---

---

# DB — vc.friend_ranks RLS & moderation Schema Analysis · 2026-05-11

**Date:** 2026-05-11
**Reviewer:** DB
**Application Scope:** VCSM
**Run Mode:** Standalone — read-only schema analysis
**Trigger:** CARNAGE (Phase 3) required DB to verify whether `vc.friend_ranks` RLS permits SECURITY DEFINER DELETE before batch4 migration can be gated for deployment.
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED

---

## DB TARGET

```
Object: vc.friend_ranks — RLS policy state
Object: moderation.blocks — current RLS and index coverage
Object: moderation.block_actor RPC — SECURITY DEFINER privilege context
Application Scope: VCSM
Type of analysis: RLS policy audit, SECURITY DEFINER privilege behavior, index coverage
Reason: Unblock batch4 migration gate (RISK-8 / IF-03)
```

---

## CRITICAL FINDING — SECURITY DEFINER BYPASSES RLS

**CARNAGE question:** Does `vc.friend_ranks` RLS permit SECURITY DEFINER DELETE?

**DB answer: YES — unconditionally. No additional RLS policy is required.**

**Explanation:**

PostgreSQL `SECURITY DEFINER` functions execute with the privileges of the **function owner** — typically the `postgres` superuser role in Supabase — not the privileges of the calling user. In PostgreSQL, superuser roles bypass Row Level Security entirely. This is documented PostgreSQL behavior: `SET row_security = off` is the equivalent effect for superuser context.

The `block_actor` RPC is declared:
```sql
SECURITY DEFINER
SET search_path TO 'moderation', 'vc', 'public', 'auth'
```

The `vc` schema is in `search_path`, meaning `vc.friend_ranks` is reachable as `friend_ranks` inside the function body. The `DELETE FROM vc.friend_ranks` in the batch4 proposal will execute with full superuser-level access — **no RLS policy on `vc.friend_ranks` will block or gate this operation.**

CARNAGE's pre-deployment verification step (Phase 1: verify RLS on vc.friend_ranks allows SECURITY DEFINER DELETE) is therefore **answered and closed.** The condition is always satisfied for any SECURITY DEFINER function.

---

## DATABASE REVIEW ITEM 1

```
DATABASE REVIEW ITEM
- Object: vc.friend_ranks — RLS SELECT policy
- Application Scope: VCSM
- Current behavior: Policy "friend_ranks visible to authenticated" with USING (true) is the
  live state — all friend_ranks rows are globally visible to any authenticated user.
  The fix in step2_rls_policy_repairs.sql (2D) proposes restricting to
  owner_actor_id = vc.current_actor_id() OR friend_actor_id = vc.current_actor_id()
  but has NOT been applied. step2 is in _ACTIVE/migrations/ (proposals) — not in
  apps/VCSM/supabase/migrations/ (applied migrations).
- Problem: Any authenticated Citizen can read any other actor's full friend_ranks table —
  including their social scoring, relationship weights, and mutual friend signals.
- Why it matters: friend_ranks contains internal social graph scoring data. Exposing it
  globally allows any authenticated user to infer the social graph of any actor —
  who their top friends are, their relationship weights, their social proximity to others.
  This is an information exposure risk independent of the block cleanup issue.
- Recommended improvement: Apply step2 section 2D — replace USING(true) policy with
  friend_ranks_self_select restricting reads to rows involving the current actor.
- Rationale: Least-privilege access. friend_ranks data is internal scoring, not a
  public social graph surface.
- Risk if unchanged: Social graph enumeration attack — any actor can infer relationship
  structures of any other actor. Stale blocked-actor rows also surfaced to their targets.
- Example SQL proposal (text only, do not run):
  DROP POLICY IF EXISTS "friend_ranks visible to authenticated" ON vc.friend_ranks;
  DROP POLICY IF EXISTS friend_ranks_self_select ON vc.friend_ranks;
  CREATE POLICY friend_ranks_self_select ON vc.friend_ranks
    FOR SELECT
    TO authenticated
    USING (
      owner_actor_id = vc.current_actor_id()
      OR friend_actor_id = vc.current_actor_id()
    );
```

---

## DATABASE REVIEW ITEM 2

```
DATABASE REVIEW ITEM
- Object: vc.friend_ranks — DELETE policy (none exists)
- Application Scope: VCSM
- Current behavior: No DELETE policy exists on vc.friend_ranks. For regular authenticated
  users, DELETE is blocked by RLS. For SECURITY DEFINER functions (block_actor RPC),
  DELETE bypasses RLS entirely — always permitted.
- Problem: Not a problem for batch4 migration (SECURITY DEFINER covers it). However,
  if any future app-layer code attempts a direct DELETE on vc.friend_ranks (not through
  the RPC), it will silently fail due to missing DELETE policy.
- Why it matters: The only currently intended path for deleting friend_ranks rows is
  through the block_actor RPC (once batch4 deploys). Direct app-layer deletes are not
  in any current feature. This is acceptable.
- Recommended improvement: No action required now. If a future feature needs app-layer
  friend_ranks deletion, add a DELETE policy at that time. Document the intention
  in the friend_ranks ownership record.
- Rationale: YAGNI — no current caller needs app-layer DELETE. RPC covers the only
  known deletion path.
- Risk if unchanged: LOW. No current caller is blocked.
- Example SQL proposal: N/A — no action needed at this time.
```

---

## DATABASE REVIEW ITEM 3

```
DATABASE REVIEW ITEM
- Object: moderation.blocks — RLS and index state
- Application Scope: VCSM
- Current behavior: Migration 20260510010000_moderation_blocks_rls_and_indexes.sql
  (APPLIED — present in apps/VCSM/supabase/migrations/) confirms:
    • RLS enabled on moderation.blocks
    • Existing policies: blocks_select_own, blocks_insert_own, blocks_update_own
      (plus older moderation_blocks_* variants that coexist)
    • New policy added: blocks_select_blocked — allows the blocked actor to see
      rows where they are the target (required for bidirectional block enforcement)
    • Indexes: "already comprehensive" per migration comment —
      blocks_lookup_idx, blocks_reverse_lookup_idx, idx_moderation_blocks_blocked
  The app's OR-query pattern in checkBlockStatus and filterBlockedActors relies on
  these bidirectional indexes for acceptable read performance.
- Problem: None detected. moderation.blocks RLS and indexes are in a correct state.
- Why it matters: Correct RLS ensures that actors can only read block rows they
  are party to. The blocks_select_blocked addition (2026-05-10) was the final piece
  needed for bidirectional enforcement to work correctly at the DB level.
- Recommended improvement: No action required. Schema is correctly configured.
- Rationale: All three app-layer reads (checkBlockStatus OR-query, filterBlockedActors
  OR-query, bulk diagnostics reads) have matching index coverage.
- Risk if unchanged: N/A — no issue detected.
- Example SQL proposal: N/A — no action needed.
```

---

## DATABASE REVIEW ITEM 4

```
DATABASE REVIEW ITEM
- Object: moderation.block_actor RPC — auth guard coverage
- Application Scope: VCSM
- Current behavior: The block_actor RPC (batch4 proposal body) includes:
    IF NOT moderation.is_current_vc_actor(p_blocker_actor_id) THEN
      RAISE EXCEPTION 'Not allowed to block from this actor' USING errcode = '42501';
    END IF;
  This is the server-side auth guard. The app controller adds a second guard:
    if (!assertingActorId || assertingActorId !== blockerActorId) throw Error(...)
  Defense-in-depth: two independent guards — one at app layer, one inside the RPC.
- Problem: None. Auth guard is correctly implemented.
- Why it matters: A SECURITY DEFINER RPC without an internal auth guard could allow
  any authenticated caller to block on behalf of any actor. The is_current_vc_actor
  check prevents this.
- Recommended improvement: No action required. Guard is present and correct.
- Rationale: SECURITY DEFINER + internal auth guard = correct pattern for sensitive
  atomic operations in Supabase.
- Risk if unchanged: N/A — no issue detected.
- Example SQL proposal: N/A.
```

---

## DATABASE REVIEW ITEM 5

```
DATABASE REVIEW ITEM
- Object: vc.actor_follows — reverse-direction follow orphans
- Application Scope: VCSM
- Current behavior: The current live block_actor RPC deactivates actor_follows in
  ONE direction only (blocker → blocked). The reverse direction (blocked → blocker)
  is NOT deactivated. The batch4 proposal adds the second UPDATE.
  Migration 20260510010000 is applied but does NOT fix this — it only adds the
  blocks_select_blocked RLS policy, not the follow cleanup.
  Latest applied migration: 20260511010000_fix_read_business_card_public_remove_review_join.sql
  No follow-cleanup migration is present in the applied migrations directory.
- Problem: When actor A blocks actor B:
    ✓ A → B follow is deactivated (current behavior)
    ✗ B → A follow is NOT deactivated (bug — batch4 fixes this)
  Actor B remains a follower of actor A after being blocked. Actor A's follower
  count includes actor B. Actor A's follower list exposes actor B despite the block.
- Why it matters: Privacy and harassment vector. A blocked user remains a follower
  of the person who blocked them. This can surface the blocked actor in follower
  lists, follow notifications, and any feature that renders follower sets.
- Recommended improvement: Deploy batch4 — the second UPDATE in the proposed RPC
  handles this. Additionally run a one-time backfill for historical orphaned follows.
- Rationale: Block must be bidirectional in all social graph cleanup, not just the
  block row itself.
- Risk if unchanged: HIGH — harassment vector. Blocked actors remain in follower
  lists of their blockers.
- Backfill detection query (text only, do not run):
  SELECT COUNT(*) AS orphaned_follows
  FROM vc.actor_follows af
  JOIN moderation.blocks b
    ON b.blocker_actor_id = af.followed_actor_id
    AND b.blocked_actor_id = af.follower_actor_id
    AND b.status = 'active'
  WHERE af.is_active = true;
```

---

## MIGRATION READINESS VERDICT

CARNAGE gating question: **Is vc.friend_ranks RLS a blocker for batch4 deployment?**

**Answer: NO. batch4 is clear to deploy from a DB perspective.**

| Concern | Status | Notes |
|---|---|---|
| vc.friend_ranks RLS blocks SECURITY DEFINER DELETE | CLEARED | SECURITY DEFINER bypasses RLS — no policy needed |
| vc.friend_ranks has a DELETE policy | NOT REQUIRED | RPC handles deletion; no app-layer delete path exists |
| moderation.blocks RLS is correctly configured | CONFIRMED | Applied migration 20260510010000 covers bidirectional read access |
| block_actor RPC auth guard is present | CONFIRMED | is_current_vc_actor guard in RPC body |
| vc schema is in block_actor search_path | CONFIRMED | SET search_path TO 'moderation', 'vc', 'public', 'auth' |

**One DB concern SEPARATE from batch4 deployment:**

The `vc.friend_ranks` SELECT policy (`USING (true)`) leaks all social graph scores globally. The step2 fix (`friend_ranks_self_select`) is pending application and should be deployed independently of batch4. This is a separate security hardening item, not a batch4 dependency.

---

## RECOMMENDED HANDOFFS

- **CARNAGE** — batch4 RLS blocker is cleared. batch4 is ready to deploy pending staging validation.
- **VENOM** — `vc.friend_ranks` global SELECT visibility is a security concern (DB Review Item 1). step2 section 2D should be included in the next security hardening pass.
- **THOR** — reverse-direction follow orphan cleanup (DB Review Item 5) is a HIGH-risk social safety issue. Should be included in release gate evaluation.

---

**DB COMPLETE — 2026-05-11**

---

---

# FALCON — NATIVE PARITY AUDIT: BLOCK FEATURE

**Date:** 2026-05-12
**Command:** FALCON (Native Parity Governance and Transfer Integrity System)
**Application Scope:** VCSM
**Module:** Block Feature — `apps/VCSM/src/features/block/`
**PWA Blueprint:** Canonical — `apps/VCSM/src/features/block/`
**Native Area:** `VCSMNativeApp/Features/Safety/` + `VCSMNativeApp/Features/Chat/DAL/ChatModeration.dal.swift`
**Transfer Classification:** PARTIAL PARITY
**Native Release Status:** BLOCKED

---

## SOURCE FILES INSPECTED

**Transfer tracking:**
- `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/moderation.md`
- `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md`
- `zNOTFORPRODUCTION/_ACTIVE/native/NATIVE_COMMAND_CENTER.md`

**Native module files (build-verified as of 2026-05-04):**
- `VCSMNativeApp/Features/Safety/DAL/SafetyReads.dal.swift`
- `VCSMNativeApp/Features/Safety/DAL/SafetyWrites.dal.swift`
- `VCSMNativeApp/Features/Safety/Models/ActorGuard.model.swift`
- `VCSMNativeApp/Features/Safety/Models/ContentVisibility.model.swift`
- `VCSMNativeApp/Features/Safety/Controllers/LoadActorGuard.controller.swift`
- `VCSMNativeApp/Features/Safety/Controllers/LoadContentVisibility.controller.swift`
- `VCSMNativeApp/Features/Safety/Controllers/HidePostForActor.controller.swift`
- `VCSMNativeApp/Features/Safety/Controllers/UnhidePostForActor.controller.swift`
- `VCSMNativeApp/Features/Safety/Controllers/HideCommentForActor.controller.swift`
- `VCSMNativeApp/Features/Safety/Controllers/UnhideCommentForActor.controller.swift`
- `VCSMNativeApp/Features/Safety/Adapters/safety.adapter.swift`
- `VCSMNativeApp/Features/Safety/Hooks/useActorGuard.swift`
- `VCSMNativeApp/Features/Safety/Hooks/useContentVisibility.swift`
- `VCSMNativeApp/Features/Safety/UI/BlockedStateCard.swift`
- `VCSMNativeApp/Features/Safety/UI/ReportedContentCoverCard.swift`
- `VCSMNativeApp/Features/Safety/UI/ActorGuardViewScreen.swift`
- `VCSMNativeApp/Features/Chat/DAL/ChatModeration.dal.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift` (lines 1720-1752, 2714-2862)

**PWA files referenced (this session):**
- `apps/VCSM/src/features/block/dal/block.check.dal.js`
- `apps/VCSM/src/features/block/dal/block.write.dal.js`
- `apps/VCSM/src/features/block/dal/block.read.dal.js`
- `apps/VCSM/src/features/block/controllers/blockActor.controller.js`
- `apps/VCSM/src/features/feed/adapters/feedCache.adapter.js`

---

## NATIVE MODULE COMPLETENESS

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Screens | PARTIAL | `ActorGuardViewScreen.swift`, `BlockedStateCard.swift`, `ReportedContentCoverCard.swift`, `ChatBlockedUsersScreen.swift` present | Unblock confirmation screen unverified; no evidence of empty-state parity on block list |
| View models / hooks | PARTIAL | `useActorGuard.swift`, `useContentVisibility.swift` present | Runtime binding to each enforcement surface unverified |
| Controllers / services | PARTIAL | `LoadActorGuard.controller.swift`, hide/unhide controllers, `ChatModeration.dal.swift` present | Fail-closed behavior on network error not runtime-verified |
| DTO / data mapping | PARTIAL | `ActorGuard.model.swift` defines `isBlocked`, `blockedByViewer`, `blockedViewer`; `BlockedActor.swift` in core | Shape matches PWA `checkBlockStatus` return — confirmed on last schema fix (2026-05-03) |
| Supabase / RPC integration | PARTIAL | `SupabaseClient.swift` calls `moderation.block_actor` / `moderation.unblock_actor`; `SafetyReads.dal.swift` reads `moderation.blocks` with active filter | Build-verified only — live RPC/table calls NOT runtime-tested |
| Loading states | UNKNOWN | No transfer log evidence of loading-state parity | Not evaluated in transfer docs |
| Empty states | UNKNOWN | No transfer log evidence | Not evaluated in transfer docs |
| Error states | FAIL | Transfer log explicitly notes: "fail-closed not yet runtime-verified" | Safety regression risk — may fail open on lookup error |
| Moderation states | PARTIAL | `BlockedStateCard.swift` renders blocked UI; `ReportedContentCoverCard.swift` for reported content | Unblock side-effect, cover-card behavior, and conversation cover not verified |
| Owner states | PARTIAL | `assertActorOwner` guard pattern exists in native core | Block-write ownership guard equivalence to PWA `assertingActorId !== blockerActorId` not explicitly confirmed |
| Booking states | N/A | Block feature does not intersect booking | N/A |
| Cache / runtime handling | FAIL | PWA invalidates `feedBlockCache` after block/unblock; no native cache invalidation pattern documented in transfer files | Native may show stale feed visibility after block action until next cold load |
| Feature gates | PARTIAL | Moderation module is not behind a feature flag in native | No explicit gating — appropriate given safety-critical nature |
| Deep links | UNKNOWN | No block-specific deep link behavior documented in transfer files | Not addressed |
| Documentation | PARTIAL | `moderation.md` transfer file exists; this document (Logan canonical) exists | No standalone native parity doc at `logan/vcsm/native/` for block feature |
| Runtime testing notes | FAIL | Transfer log explicitly states: runtime testing NOT yet run on any block or report surface | P0 risk per transfer log |

---

## NATIVE DRIFT FINDINGS

---

**NATIVE DRIFT FINDING — NDF-01**
- Drift Type: behavior drift / runtime drift
- PWA Behavior: `checkBlockStatus()` returns `{ isBlocked, blockedByMe, blockedMe }` — bidirectional detection; gates profile, feed, chat, and follow rendering on the client with explicit null-safety
- Native Behavior: `ActorGuard.model.swift` defines `ActorGuardState` with `isBlocked`, `blockedByViewer`, `blockedViewer` — same three fields, schema aligned since 2026-05-03 fix
- Risk: Field names differ slightly (`blockedByMe` → `blockedByViewer`, `blockedMe` → `blockedViewer`) — this is a cosmetic naming drift only, not behavioral, **if** the underlying query is equivalent. The native query against `moderation.blocks` has not been runtime-verified to return the same results as the PWA OR-clause query.
- Severity: MEDIUM — structure matches but equivalence is not proven at runtime
- Recommended correction: Run block status RPC against a live staging environment with a known block row and verify `blockedByViewer`/`blockedViewer` field values match expected behavior before launch

---

**NATIVE DRIFT FINDING — NDF-02**
- Drift Type: behavior drift — side-effect gap
- PWA Behavior: `blockActorController` calls `blockActor()` (RPC) then `invalidateFeedBlockCache(blockerActorId)` (RISK-7 — correctly fires the cache bust even if it is architecturally at the wrong layer)
- Native Behavior: No equivalent feed cache invalidation is documented in transfer files. After a block action, native may continue serving stale block-filtered feed rows until the next cold load.
- Risk: Blocked actor may transiently appear in the blocker's feed for the duration of the current session after a block action.
- Severity: MEDIUM — user-visible safety regression; not a data leak, but violates the expected "block and they disappear immediately" contract
- Recommended correction: Native should invalidate its local feed view model / in-memory result set after a successful block/unblock RPC call. This must happen at the hook/view-model layer, not inside the DAL.

---

**NATIVE DRIFT FINDING — NDF-03**
- Drift Type: behavior drift — inherited PWA bug (batch4)
- PWA Behavior: `moderation.block_actor` RPC currently deactivates only the forward follow direction (`blocker → blocked`). The reverse follow (`blocked → blocker`) is NOT deactivated. batch4 migration fixes this but has NOT been applied.
- Native Behavior: Native calls the same `moderation.block_actor` RPC. Therefore native **inherits the same follow-orphan bug** — a blocked actor remains a follower of their blocker.
- Risk: After a block on native, the blocked actor's follow relationship to the blocker persists. Social graph surfaces showing followers may still show the blocked actor. This is identical to the PWA RISK-6 issue.
- Severity: HIGH — matches PWA RISK-6. No native-specific remediation is available until batch4 deploys server-side.
- Recommended correction: batch4 deployment resolves this for both PWA and native simultaneously (server-side RPC fix). No native code change required. Verify follow orphan behavior post-batch4 in native simulator.

---

**NATIVE DRIFT FINDING — NDF-04**
- Drift Type: behavior drift — inherited PWA bug (friend_ranks)
- PWA Behavior: `vc.friend_ranks` cleanup is silently not happening. `applyBlockSideEffects.js` has zero callers. batch4 will move this cleanup server-side inside the RPC.
- Native Behavior: Native calls the same RPC — no `friend_ranks` client-side cleanup exists in native either. `VCSMNativeCore/BlockedActor.swift` has no equivalent of `deleteFriendRankRowsBetweenActors`.
- Risk: Stale `vc.friend_ranks` rows persist after block on both platforms until batch4 deploys. This suppresses correct social graph scoring.
- Severity: HIGH (mirrors RISK-8) — but no native-specific remediation needed. batch4 resolves server-side.
- Recommended correction: Same as PWA — deploy batch4. After deployment, verify that a block/unblock round-trip on native correctly removes and does not re-create `vc.friend_ranks` rows.

---

**NATIVE DRIFT FINDING — NDF-05**
- Drift Type: moderation drift
- PWA Behavior: Chat composition is gated by `canSendMessage.js` which checks block status before allowing a new message. ConversationView imports a block status adapter.
- Native Behavior: `ChatModeration.dal.swift` exists. `ConversationBlockedCard.swift` renders a blocked conversation UI. However, the transfer log notes "conversation cover behavior not verified."
- Risk: Native chat may allow message composition to a blocked actor if `ConversationBlockedCard` rendering condition is wrong or if the DAL call fails open. App Store compliance implication: Apple expects content/reporting safety flows to function correctly.
- Severity: HIGH — App Store risk flagged explicitly in transfer log
- Recommended correction: Runtime-test the full chat block enforcement surface: (1) attempt to send a message to a blocked actor, (2) verify ConversationBlockedCard renders, (3) verify message compose input is disabled/hidden, (4) verify unblock restores the surface.

---

## NATIVE TRUST BOUNDARY WARNINGS

---

**NATIVE TRUST BOUNDARY WARNING — NTB-01**
- Location: `SupabaseClient.swift` block write path (lines 1720-1752)
- PWA enforcement: `blockActorController` verifies `assertingActorId !== blockerActorId` before calling the DAL. The RPC itself also guards via `moderation.is_current_vc_actor(p_blocker_actor_id)`.
- Native enforcement: Native calls `moderation.block_actor` RPC directly. The RPC guard protects server-side. However, it is unconfirmed whether the native controller/view-model layer performs an equivalent `assertingActorId !== blockerActorId` check before issuing the RPC call.
- Risk: If native omits the pre-call ownership check, an actor could theoretically attempt a block write for another actor's ID. The RPC guard will reject it, but the attempt reaches the server unnecessarily and the error handling path is untested.
- Severity: LOW (RPC guard is authoritative), but MEDIUM from a defense-in-depth perspective
- Recommended correction: Verify `LoadActorGuard.controller.swift` or the native block action controller performs an equivalent actor identity check before issuing the block RPC call. Add runtime test: attempt block-write with mismatched actor — confirm RPC rejection is handled gracefully.

---

**NATIVE TRUST BOUNDARY WARNING — NTB-02**
- Location: `SafetyReads.dal.swift` — fail-closed behavior on lookup errors
- PWA enforcement: `checkBlockStatus` returns `null` on error; callers treat null as "unresolved — fail closed" (do not render profile/content). `filterBlockedActors` returns empty Set on error; feed pipeline treats error as "assume all blocked."
- Native enforcement: Transfer checklist item "[x] Make feed/profile/chat safety reads fail closed — never show blocked content on lookup errors" is marked complete in `moderation.md`. However, this is a checklist item, not a runtime-verified behavior.
- Risk: If native fails open on a Supabase error during a block status read, a blocked actor's profile or content becomes visible. This is a safety regression.
- Severity: HIGH — fails open = blocked actor sees content they should not see; or blocker sees content from blocked actor
- Recommended correction: Add explicit runtime test in native simulator: disable Supabase reachability → trigger block status read → confirm content is hidden, not visible. Verify all four enforcement surfaces (profile, feed, chat, follow) behave identically.

---

**NATIVE TRUST BOUNDARY WARNING — NTB-03**
- Location: `ConversationBlockedCard.swift` + `ChatModeration.dal.swift`
- PWA enforcement: `canSendMessage.js` checks block status as a permission gate; message compose is disabled if blocked.
- Native enforcement: `ConversationBlockedCard.swift` renders a UI cover. Whether the underlying compose action is actually disabled (not just visually hidden) is unverified.
- Risk: Visual hide ≠ actual prevention. If compose action is not disabled, a determined actor could bypass the cover and still send a message to a blocked conversation.
- Severity: HIGH — App Store compliance + user safety
- Recommended correction: Verify in native that the send message action is disabled at the controller level, not just the UI level, when a block relationship exists.

---

## NATIVE RUNTIME PARITY REVIEW

| Runtime Area | PWA | Native | Drift | Severity |
|---|---|---|---|---|
| Block status read | `checkBlockStatus()` → `moderation.blocks` OR-query with `status='active'` | `SafetyReads.dal.swift` → `moderation.blocks` (schema-aligned 2026-05-03) | Build-verified, not runtime-verified | HIGH |
| Block write | `blockActorController` → `blockActor()` DAL → `moderation.block_actor` RPC | `SupabaseClient.swift:1720-1752` → `moderation.block_actor` RPC | Same RPC — same behavior including current bugs (NDF-03, NDF-04) | MEDIUM |
| Unblock write | `unblockActorController` → `unblockActor()` DAL → `moderation.unblock_actor` RPC | `SupabaseClient.swift` → `moderation.unblock_actor` RPC | Same RPC | MEDIUM |
| Feed block filter | `feedBlockRows.read.dal.js` → `moderation.blocks` bulk query; fail-closed in pipeline | `SafetyReads.dal.swift` fail-closed flag | Fail-closed verified by checklist only — not runtime | HIGH |
| Profile gate | `useBlockStatus` → `useProfileGate` — render blocked state card or hide profile | `useActorGuard.swift` + `ActorGuardViewScreen.swift` | Build-verified, not runtime-verified | HIGH |
| Chat gate | `canSendMessage.js` + `ConversationView` block adapter | `ChatModeration.dal.swift` + `ConversationBlockedCard.swift` | Visual cover present — compose disable unverified | HIGH |
| Follow/friend gate | `ctrlGetBlockStatus` in follow controllers | No transfer log evidence of follow-gate enforcement in native | MISSING | HIGH |
| Feed cache invalidation after block | `invalidateFeedBlockCache(blockerActorId)` in `blockActorController` | No equivalent documented in transfer files | MISSING | MEDIUM |
| Error state (fail-closed) | Returns null/empty-Set → all callers treat as blocked | Transfer checklist item checked — no runtime proof | Checklist only | HIGH |
| Reverse follow deactivation | PWA BUG — batch4 not applied; blocked actor remains follower | Same RPC → same bug inherited | Inherited PWA bug | HIGH |
| friend_ranks cleanup | PWA BUG — applyBlockSideEffects has zero callers; cleanup not happening | Same RPC → same bug inherited | Inherited PWA bug | HIGH |

---

## NATIVE OWNERSHIP MAP

| Area | PWA Owner | Native Owner | Shared Engine | Risk |
|---|---|---|---|---|
| Block status reads | block feature — `block.check.dal.js` | Safety module — `SafetyReads.dal.swift` | None — feature-owned both sides | LOW — parallel implementations, same schema |
| Block write (block) | block feature — `blockActor.controller.js` → RPC | Safety module — `SupabaseClient.swift` → RPC | `moderation.block_actor` RPC (shared server-side) | LOW — both use canonical RPC |
| Block write (unblock) | block feature — `blockActor.controller.js` → RPC | Safety module — `SupabaseClient.swift` → RPC | `moderation.unblock_actor` RPC (shared server-side) | LOW — both use canonical RPC |
| Profile enforcement | block feature — `useBlockStatus` / `useProfileGate` | Safety module — `useActorGuard.swift` | None | MEDIUM — hook equivalence unverified at runtime |
| Feed suppression | feed feature — `feed.read.blockRows.dal.js` pipeline | Safety module — `SafetyReads.dal.swift` | None | HIGH — fail-closed runtime unverified |
| Chat gate | chat feature — `canSendMessage.js` | Chat — `ChatModeration.dal.swift` + `ConversationBlockedCard.swift` | None | HIGH — compose disable unverified |
| Follow/friend gate | follow/friend controllers — `ctrlGetBlockStatus` | UNCONFIRMED — no transfer evidence | None | HIGH — no owner confirmed |
| Feed cache invalidation | `blockActor.controller.js` (SENTRY violation, pending fix to hook) | MISSING — no equivalent documented | None | MEDIUM — stale feed possible |
| Moderation RPC ownership | block feature + CARNAGE | Shared — `moderation.block_actor` / `moderation.unblock_actor` | Server-side RPC | LOW |
| friend_ranks cleanup | UNOWNED at runtime (batch4 pending) | UNOWNED at runtime (inherits same RPC gap) | Server-side RPC (pending) | HIGH |

---

## NATIVE PRIORITY MATRIX

| Priority | Module | Gap | Reason | Owner |
|---|---|---|---|---|
| P0 | Chat gate — compose disable | `ConversationBlockedCard.swift` visual only; action disable unverified | App Store compliance; safety regression | Safety / Chat module |
| P0 | Fail-closed verification — all four surfaces | Runtime test required on simulator | Safety regression if fails open on network error | Safety module |
| P0 | Follow/friend gate | No transfer evidence; no native owner confirmed | Blocked actor may still appear in follow suggestions after block | Safety / Social module |
| P1 | Feed cache invalidation after block | No native equivalent of `invalidateFeedBlockCache` documented | Stale feed visibility within same session after block | Safety / Feed module |
| P1 | Profile gate runtime test | Build-verified only; `ActorGuardViewScreen.swift` rendering not confirmed live | Profile gate is primary user-facing block enforcement | Safety module |
| P1 | batch4 parity verification post-deploy | NDF-03 + NDF-04 — both platforms inherit follow/friend_ranks bugs from RPC | Resolved server-side by batch4 — but native must verify behavior post-deploy | Safety / CARNAGE gate |
| P2 | Actor identity check before block write | NTB-01 — no confirmation of pre-RPC ownership validation in native | Defense-in-depth; RPC is authoritative but pre-call guard expected | Safety module |
| P2 | Loading / empty states parity | Not evaluated in transfer docs | UX parity for blocked list screens | Safety module |
| P3 | Native parity documentation | No standalone native parity doc for block feature at `logan/vcsm/native/` | Governance completeness | Logan |

---

## NATIVE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan canonical doc | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md` | PRESENT (this document) |
| Native transfer doc | `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/moderation.md` | PRESENT |
| ROADTRIP INDEX | `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md` | PRESENT |
| SENTRY review | Appended to this document (Phase 1 — 2026-05-11) | PRESENT |
| VENOM review | Appended to this document (Phase 4 — 2026-05-11) | PRESENT |
| IRONMAN ownership record | Appended to this document (standalone — 2026-05-11) | PRESENT (inline); dedicated file MISSING |
| DB review | Appended to this document (2026-05-11) | PRESENT |
| CARNAGE review | Appended to this document (Phase 3 — 2026-05-11) | PRESENT |
| THOR release gate | Not yet run — blocked | MISSING — BLOCKED |
| Native parity standalone doc | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/native/` | MISSING |
| Runtime audit (LOKI) | Not yet run | MISSING |
| Performance audit (KRAVEN) | Not yet run | MISSING |
| Dedicated IRONMAN native file | `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md` | MISSING |

---

## NATIVE RELEASE GATE

| Module | Status | Blocking Risk | Required Follow-Up |
|---|---|---|---|
| Block writes (block_actor / unblock_actor RPC) | CAUTION | Build-verified; live RPC behavior unverified | Runtime test on staging: block actor, verify `moderation.blocks` row created, verify follow deactivation |
| Profile gate (ActorGuardViewScreen) | CAUTION | Build-verified; rendering not runtime-confirmed | Runtime test: navigate to blocked profile, confirm blocked state card renders |
| Feed suppression (SafetyReads fail-closed) | BLOCKED | Fail-closed not runtime-verified; may fail open on network error | Runtime test: simulate Supabase error during feed block filter; confirm content hidden |
| Chat gate (ConversationBlockedCard + compose) | BLOCKED | Compose disable unverified; App Store compliance risk | Runtime test: send message to blocked actor; confirm compose disabled at controller level |
| Follow/friend gate | BLOCKED | No transfer evidence; no native owner confirmed | Identify native follow controllers; confirm block status gate equivalent to PWA |
| Feed cache invalidation | CAUTION | Stale feed within session after block | Add feed view model invalidation call after successful block RPC in native hook |
| batch4 RPC parity | CAUTION | Inherits follow/friend_ranks bugs until batch4 deploys | Deploy batch4 → verify on native simulator post-deploy |

---

## TRANSFER STATUS SUMMARY

```
TRANSFER STATUS
Module:            Block Feature — Moderation / Safety
Classification:    PARTIAL PARITY
Confidence:        LOW — build-verified, runtime-unverified
Blocking issues:
  1. Chat compose disable not confirmed (App Store risk)
  2. Fail-closed behavior not runtime-tested (all four surfaces)
  3. Follow/friend gate has no transfer evidence and no native owner
  4. Feed cache invalidation missing in native
```

---

## SENTRY PARITY REVIEW REQUEST

```
SENTRY PARITY REVIEW
Required:    YES
Scope:       Native Safety module architecture review — when runtime testing begins
Timing:      After P0 items resolved (NDF-01 runtime-verified, NTB-02/03 confirmed, follow gate owner assigned)
Reason:      Native Safety module has been build-verified but not architecture-reviewed for
             layer compliance. Native controller/DAL separation, cross-feature adapter usage,
             and fail-closed enforcement at controller vs DAL boundary need SENTRY pass before
             this module is marked production-ready.
```

---

## RECOMMENDED HANDOFFS

- **Wolverine** — Before native runtime testing can begin, the PWA must first resolve SENTRY SF-01 (move `invalidateFeedBlockCache` from controller to hook). This fixes the PWA architectural violation and sets the correct pattern for native to follow when implementing feed cache invalidation post-block.
- **CARNAGE** — batch4 must deploy (staging → production) before native follow/friend_ranks parity can be verified. After batch4, run a native simulator regression: block actor → confirm follow rows deactivated bidirectionally and `vc.friend_ranks` rows removed.
- **THOR** — Block feature is **BLOCKED** for native release. Release gate cannot open until: (1) P0 items in NATIVE PRIORITY MATRIX are resolved, (2) fail-closed runtime-verified on all four surfaces, (3) follow gate owner assigned and verified, (4) batch4 deployed and verified on native.

---

## CROSS-PLATFORM DRIFT MATRIX (PWA + iOS — Android excluded pending Winter Soldier)

| Area | PWA | iOS Native | Drift Severity |
|---|---|---|---|
| Actor ownership | `actorId` + `kind` enforced in all controllers | `actorId` in native Safety module — schema-aligned | LOW |
| Block write flow | `blockActorController` → `block.write.dal.js` → `moderation.block_actor` RPC | `SupabaseClient.swift` → `moderation.block_actor` RPC | LOW (same RPC, build-verified) |
| Block status read | `checkBlockStatus()` bidirectional OR-query | `SafetyReads.dal.swift` bidirectional query | MEDIUM (not runtime-verified) |
| Moderation gates — profile | `useBlockStatus` + `useProfileGate` | `useActorGuard.swift` + `ActorGuardViewScreen.swift` | MEDIUM (unverified at runtime) |
| Moderation gates — feed | `feed.read.blockRows.dal.js` fail-closed in pipeline | `SafetyReads.dal.swift` fail-closed (checklist only) | HIGH (fail-closed not runtime-proven) |
| Moderation gates — chat | `canSendMessage.js` + compose disable | `ConversationBlockedCard.swift` visual only | HIGH (compose disable unverified) |
| Moderation gates — follow | Follow controllers gate on `ctrlGetBlockStatus` | UNCONFIRMED | HIGH |
| Cache invalidation on block | Fire-and-forget `invalidateFeedBlockCache` at controller (SENTRY violation) | MISSING entirely | MEDIUM |
| Reverse follow deactivation | BUG — batch4 pending | Inherits same bug via same RPC | HIGH (both broken until batch4) |
| friend_ranks cleanup | BUG — cleanup not happening | Inherits same bug via same RPC | HIGH (both broken until batch4) |
| Fail-closed on errors | PWA — returns null/empty-Set → callers gate closed | Checklist item checked — not runtime-verified | HIGH |

---

**FINAL FALCON STATUS: BLOCKED**

The block feature native implementation has build-verified schema alignment across all three moderation schema fixes (blocks, reports, actions — complete as of 2026-05-04). The Safety module architecture is complete and correctly structured. However, **no enforcement surface has been runtime-tested**. Three P0 gaps exist (chat compose disable, fail-closed verification, follow gate ownership) that prevent release gate clearance. THOR cannot run until all P0 items are resolved.

---

## FALCON → WINTER SOLDIER HANDOFF

```
FALCON → WINTER SOLDIER HANDOFF

Module:              Block Feature — Moderation / Safety
PWA Blueprint:       apps/VCSM/src/features/block/
Transfer Classification: PARTIAL PARITY
Known Drift Areas:
  - Chat compose disable not confirmed (NDF-05, NTB-03)
  - Fail-closed on network error not runtime-verified (NTB-02)
  - Follow/friend gate has no transfer evidence (NDF-01)
  - Feed cache invalidation missing in native (NDF-02)
Trust-Boundary Risks:
  - NTB-01: Pre-RPC ownership guard in native unconfirmed
  - NTB-02: Fail-closed safety regression risk on block reads
  - NTB-03: Chat compose disable vs. visual cover only
Runtime Risks:
  - All four enforcement surfaces are build-verified only
  - RPC calls to moderation.block_actor / moderation.unblock_actor untested live
  - moderation.blocks query field equivalence unverified
Booking Risks:     N/A — block feature does not intersect booking
Lifecycle Risks:
  - Reverse follow deactivation bug inherited from PWA (batch4 not yet applied)
  - friend_ranks cleanup not happening on either platform (batch4 pending)
Ownership Risks:
  - Follow/friend gate native owner unassigned
  - Feed cache invalidation owner unassigned in native
Required Android Follow-Up:
  - Verify VCSMAndroidApp (when it exists) Safety module uses same moderation schema paths
  - Verify fail-closed on Android equivalents of SafetyReads.dal
  - Chat compose disable must be verified on Android before App Store / Play Store submission
  - Follow gate must be assigned and verified
  - All P0 iOS findings apply equally to Android
Recommended Priority:
  - P0: Chat gate compose disable, fail-closed verification, follow gate ownership
  - P1: Feed cache invalidation, profile gate runtime test
  - P1: batch4 parity verification after deploy
Related Governance Reports:
  - Logan canonical: zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md
  - Transfer doc:    zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/moderation.md
  - ROADTRIP INDEX:  zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md
```

---

```
WINTER SOLDIER HANDOFF STATUS: GENERATED
```

---

NEXT STEP — WINTER SOLDIER REQUIRED

Falcon has completed iOS parity review for the block feature.
Android parity review must begin before THOR can issue a cross-platform release gate.

Run: `/WinterSoldier`
Input: Use the FALCON → WINTER SOLDIER HANDOFF section above as context.

Winter Soldier will consume Falcon findings as canonical parity evidence for Android transfer.

---

**FALCON COMPLETE — 2026-05-12**

---

---

# WINTER SOLDIER — ANDROID PARITY AUDIT: BLOCK FEATURE

**Date:** 2026-05-14
**Command:** WINTER SOLDIER (Android Runtime Parity and Device Stability Governance)
**Application Scope:** VCSM
**Module:** Block Feature — Moderation / Safety
**Falcon Handoff Input:** FALCON → WINTER SOLDIER HANDOFF (above)
**Android App Status:** NOT STARTED — no Android implementation exists

---

## ANDROID SCOPE DETERMINATION

No Android app has been initiated for VCSM. No Kotlin, Java, or AndroidManifest.xml files exist anywhere in the project. The NATIVE_COMMAND_CENTER and all planning documents explicitly state Android is deferred. Winter Soldier is defined in governance contracts but has no live codebase to audit.

**This Android scope is excluded from the current release cycle.**

---

WINTER SOLDIER: NOT REQUIRED
Reason: No Android implementation exists. Android scope is explicitly deferred. The iOS-only native path (Falcon) is the active native platform for the current release cycle.

---

## ANDROID PRE-REQUIREMENTS REGISTER

When Android development begins, the following Falcon-established requirements carry forward as mandatory entry conditions. These are not optional — they are the canonical parity baseline established by this governance pass.

### Inherited from FALCON (must be re-verified on Android before any Android release gate can open)

| ID | Requirement | Source | Severity |
|---|---|---|---|
| AWS-01 | Block write must call `moderation.block_actor` / `moderation.unblock_actor` RPCs — no direct table writes | NDF-01 / VENOM | HIGH |
| AWS-02 | Block reads must query `moderation.blocks` with `status = 'active'` and bidirectional OR-clause; composite identity fields only (no `blocks.id`) | NDF-01 | HIGH |
| AWS-03 | All four enforcement surfaces must fail closed on Supabase error: profile gate, feed suppression, chat gate, follow gate | NTB-02 | CRITICAL |
| AWS-04 | Chat compose must be disabled at controller/service level — not just visually hidden — when block relationship exists | NTB-03 | CRITICAL |
| AWS-05 | Follow/friend surface must gate on block status before rendering follow suggestions or friend rankings | NDF-01 (no native evidence) | HIGH |
| AWS-06 | Feed view must invalidate local result set immediately after a successful block/unblock RPC call within same session | NDF-02 | MEDIUM |
| AWS-07 | Pre-RPC ownership check: verify `assertingActorId === blockerActorId` before calling block write | NTB-01 | MEDIUM |
| AWS-08 | batch4 parity: after batch4 deploys on PWA, verify Android Safety module receives correct bidirectional follow deactivation and friend_ranks cleanup from the same server-side RPC | NDF-03, NDF-04 | HIGH |
| AWS-09 | Runtime test all four surfaces on Android device (or emulator API 26+) before any release gate claim | All findings | CRITICAL |

### Android-specific additional requirements (beyond iOS parity)

| ID | Requirement | Android-Specific Reason |
|---|---|---|
| AWS-A1 | Block status reads must survive Activity recreation (process death, rotation) — ViewModel must own block state, not ephemeral composable state | Android lifecycle: block state fetched in `onCreate` may be lost on process death without ViewModel scope |
| AWS-A2 | Block/unblock write must be coroutine-safe — no fire-and-forget coroutine without structured scope | Android: unscoped coroutines cancel on lifecycle events; a block write mid-rotation may silently fail |
| AWS-A3 | Push notification handler must suppress notifications from blocked actors before display | Android: push received in background via FCM; notification handler must check block status before `NotificationManager.notify()` |
| AWS-A4 | Deep link to blocked profile must resolve to blocked state card, not the profile content | Android: nav back-stack restoration from a deep link may bypass the in-memory block status check |
| AWS-A5 | OEM background kill risk: block action RPC in-flight when app is backgrounded by aggressive OEM battery killers (Xiaomi, Samsung One UI) must either complete atomically or retry safely | Android: foreground service or WorkManager may be needed for write-path safety on affected OEMs |

---

## ANDROID RUNTIME STABILITY (CURRENT)

```
ANDROID RUNTIME STABILITY
Area:           Block Feature — Moderation / Safety
Classification: UNKNOWN
Reason:         No Android code exists. No runtime evidence available.
Blocking issues:
  - No implementation to evaluate
  - All requirements in AWS-01 through AWS-A5 are unmet
```

---

## ANDROID RELEASE GATE

| Module | Status | Blocking Risk | Required Follow-Up |
|---|---|---|---|
| Block writes | BLOCKED — NOT STARTED | No implementation | Implement Safety service using `moderation.block_actor` / `moderation.unblock_actor` |
| Profile gate | BLOCKED — NOT STARTED | No implementation | Implement `ActorGuard` equivalent; verify fail-closed |
| Feed suppression | BLOCKED — NOT STARTED | No implementation | Implement block filter in feed pipeline; fail-closed required |
| Chat gate | BLOCKED — NOT STARTED | No implementation | Implement compose-disable at service level; App Store/Play Store compliance |
| Follow/friend gate | BLOCKED — NOT STARTED | No implementation | Implement block check in follow suggestion service |
| Feed cache invalidation | BLOCKED — NOT STARTED | No implementation | Invalidate feed ViewModel after block/unblock within session |
| ViewModel lifecycle safety | BLOCKED — NOT STARTED | No implementation | Block state must survive Activity recreation |
| Push notification suppression | BLOCKED — NOT STARTED | No implementation | FCM handler must filter blocked actor notifications |

**FINAL WINTER SOLDIER STATUS: BLOCKED**

Android block feature is not started. Governance pre-requirements are registered above. No Android release gate evaluation is possible until implementation exists and all P0/CRITICAL items in the pre-requirements register are satisfied.

---

## CROSS-PLATFORM DRIFT MATRIX (COMPLETE — PWA + iOS + Android)

| Area | PWA | iOS Native | Android | Drift Severity |
|---|---|---|---|---|
| Block write flow | `moderation.block_actor` RPC ✓ | `moderation.block_actor` RPC ✓ (build-verified) | NOT STARTED | iOS: LOW / Android: BLOCKED |
| Block status read | Bidirectional OR-query ✓ | `SafetyReads.dal.swift` (build-verified) | NOT STARTED | iOS: MEDIUM / Android: BLOCKED |
| Profile gate | `useBlockStatus` + `useProfileGate` ✓ | `useActorGuard.swift` (unverified) | NOT STARTED | iOS: MEDIUM / Android: BLOCKED |
| Feed suppression | Fail-closed pipeline ✓ | Fail-closed (checklist only) | NOT STARTED | iOS: HIGH / Android: BLOCKED |
| Chat gate | `canSendMessage.js` compose disable ✓ | Visual cover only (unverified) | NOT STARTED | iOS: HIGH / Android: BLOCKED |
| Follow/friend gate | `ctrlGetBlockStatus` in follow controllers ✓ | No transfer evidence | NOT STARTED | iOS: HIGH / Android: BLOCKED |
| Cache invalidation | Fire-and-forget (SENTRY violation — pending fix) | MISSING | NOT STARTED | Both: MEDIUM |
| Reverse follow deactivation | BUG — batch4 pending | Inherited bug | Inherited bug (when built) | Both: HIGH until batch4 |
| friend_ranks cleanup | BUG — batch4 pending | Inherited bug | Inherited bug (when built) | Both: HIGH until batch4 |
| Fail-closed on errors | ✓ | Checklist only | NOT STARTED | iOS: HIGH / Android: BLOCKED |
| ViewModel / process-death safety | N/A | N/A (iOS lifecycle) | NOT STARTED | Android-specific: BLOCKED |
| Push notification suppression | N/A | N/A (APNs — not reviewed) | NOT STARTED | Android-specific: BLOCKED |

---

## RECOMMENDED HANDOFFS

- **Wolverine** — Android cannot start until the PWA SENTRY SF-01 fix lands. The corrected PWA pattern (feed cache invalidation at hook layer) is the canonical blueprint Android must follow.
- **THOR** — Android is NOT STARTED. THOR release gate for Android is BLOCKED indefinitely until implementation begins and all AWS-01 through AWS-A5 requirements are verified. Current release cycle covers PWA + iOS only.
- **Future Winter Soldier session** — When Android development begins, this pre-requirements register is the mandatory entry contract. All nine AWS-01–AWS-09 items and all five AWS-A1–AWS-A5 Android-specific items must be satisfied before an Android release gate can open.

---

**WINTER SOLDIER COMPLETE — 2026-05-14**

---

---

# THOR — RELEASE GATE REPORT: BLOCK FEATURE

**Date:** 2026-05-14
**Command:** THOR (Release Commander and Production Gatekeeper)
**Application Scope:** VCSM
**Release reason:** Block feature governance pass — architecture remediation, dead-code removal, native parity audit
**Areas changed (this session):**
- `apps/VCSM/src/features/block/controllers/blockActor.controller.js` — SF-01: removed cross-feature cache import; corrected header comment
- `apps/VCSM/src/features/block/hooks/useBlockActions.js` — SF-01: feed cache invalidation moved to hook layer
- `apps/VCSM/src/features/block/dal/block.check.dal.js` — IF-01: deleted dead `isBlocked` export
- `apps/VCSM/src/features/block/dal/block.write.dal.js` — IF-02: deleted dead `toggleBlockActor` export
- `apps/VCSM/src/features/block/dal/block.read.dal.js` — SF-02: removed dev-only exports
- `apps/VCSM/src/dev/diagnostics/dal/block.diagnostics.dal.js` — SF-02: new dev-only DAL (created)
- `apps/VCSM/src/dev/diagnostics/groups/block.group.js` — SF-02: import updated to diagnostics DAL
- `apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js` — IF-04/SF-03: deleted

---

## RELEASE SIGNAL INVENTORY

| Signal | Status | Latest Report | Notes |
|---|---|---|---|
| SENTRY | PRESENT | 2026-05-11 (this session) | 3 findings — SF-01 RESOLVED, SF-02 RESOLVED, SF-03 RESOLVED |
| IRONMAN | PRESENT | 2026-05-11 (this session) | 4 dead-code findings — IF-01, IF-02, IF-03 (hold), IF-04 RESOLVED |
| CARNAGE | PRESENT | 2026-05-11 (this session) | batch4 migration — CLEARED from RLS blocker; deployment pending |
| VENOM | PRESENT | 2026-05-11 (this session) | Security findings documented; step2 2D pending; no CRITICAL unresolved |
| DB | PRESENT | 2026-05-11 (this session) | 5 review items; batch4 RLS unblocked; reverse follow orphan HIGH risk |
| FALCON | PRESENT | 2026-05-12 (this session) | iOS native: PARTIAL PARITY — BLOCKED; 3 P0 gaps |
| WINTER SOLDIER | PRESENT | 2026-05-14 (this session) | Android: NOT STARTED — pre-requirements registered |
| LOKI | MISSING | Never run for block feature | No runtime telemetry; block status read is uncached — hot path unproven under load |
| KRAVEN | MISSING | Never run for block feature | No performance audit; `filterBlockedActors` bulk OR-query risk unquantified |
| ARCHITECT | MISSING | Not run this session | No system dependency map updated |
| CONTRACT REVIEW | PRESENT (implicit) | This session (SENTRY) | SENTRY applied architecture contract checks; no dedicated contract-review run |

---

## BOUNDARY SCOPE CHECK

| Protected Root | In Scope? | Modified? | Approval Needed? | Status |
|---|---|---|---|---|
| apps/VCSM | YES | YES | NO — within declared scope | CLEAN |
| apps/wentrex | NO | NO | N/A | NOT TOUCHED |
| apps/Traffic | NO | NO | N/A | NOT TOUCHED |
| engines | NO | NO | N/A | NOT TOUCHED |

No boundary contract violations. All changes remained inside `apps/VCSM`. Dev diagnostics DAL created inside `apps/VCSM/src/dev/` — correctly scoped. No cross-root modifications.

---

## CRITICAL RELEASE GATES

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| No CRITICAL VENOM finding unresolved | PASS | VENOM found no CRITICAL items; VS-01/02 (HIGH) addressed by batch4 + step2 2D | No block |
| No cross-feature DAL bypass in write path | PASS | SF-01 resolved — controller no longer calls feedCache; hook layer correct | No block |
| Actor ownership check on block writes | PASS | `assertingActorId !== blockerActorId` guard in all three write controllers; RPC has `is_current_vc_actor` server-side guard | No block |
| moderation.blocks reads filter `status = 'active'` | PASS | All three DAL files enforce this; confirmed in SENTRY + DB review | No block |
| Block writes go through RPC only — no direct table inserts | PASS | `blockActor.controller.js` → `blockActor.dal.js` → `moderation.block_actor` RPC only | No block |
| Native omits lifecycle/block gates present in PWA | FAIL | FALCON: chat compose disable unverified (NTB-03); follow gate has no transfer evidence (NDF-01) | BLOCKS native release |
| batch4 migration has rollback plan | PASS | Rollback SQL included in batch4 proposal file | No block for PWA; gates native parity verification |

---

## VCSM ACTOR TRUST GATE

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| Actor ownership enforced | PASS | `assertingActorId` check present in all three write controllers; RPC guards independently | No block |
| Public identity surface clean | PASS | Block feature never exposes `profileId` or `vportId`; all surfaces use `actorId` only | No block |
| VPORT lifecycle respected | PASS | Block feature does not interact with VPORT lifecycle; moderation schema is separate | No block |
| Feed attribution protected | PASS | Feed block filter uses bidirectional OR-query; actor identity never conflated | No block |
| Booking trust protected | PASS | Block feature does not intersect booking flows | N/A |
| External API surface safe | PASS | No external API exposes block status; moderation schema protected by RLS | No block |
| SEO indexing safe | PASS | No block state leaks to Traffic/SEO surfaces | N/A |

---

## NATIVE PARITY RELEASE GATE

| Native Area | PWA Blueprint | Native Status | Release Impact |
|---|---|---|---|
| Block write (block_actor RPC) | `blockActor.controller.js` → RPC | Build-verified; runtime unverified | CAUTION |
| Block status read | `checkBlockStatus()` bidirectional | `SafetyReads.dal.swift` — build-verified | CAUTION |
| Profile gate | `useBlockStatus` + `useProfileGate` | `useActorGuard.swift` — build-verified | CAUTION |
| Feed suppression | `feed.read.blockRows.dal.js` fail-closed pipeline | `SafetyReads.dal.swift` fail-closed — checklist only | BLOCKS native |
| Chat gate — compose disable | `canSendMessage.js` — compose disabled at controller | `ConversationBlockedCard.swift` — visual cover only; compose disable unverified | BLOCKS native |
| Follow/friend gate | `ctrlGetBlockStatus` in follow controllers | No transfer evidence; no native owner | BLOCKS native |
| Feed cache invalidation post-block | `useBlockActions.js` → `invalidateFeedBlockCache` | MISSING in native | CAUTION |
| Fail-closed on Supabase error | Returns null/empty-Set → callers gate closed | Checklist item — not runtime-verified | BLOCKS native |

**Native release is BLOCKED.** Three P0 gaps remain (FALCON NTB-03, NDF-01, NTB-02).

---

## MIGRATION RELEASE GATE

| Migration Area | Status | Rollback | RLS Reviewed | Release Impact |
|---|---|---|---|---|
| batch4 — `moderation.block_actor` RPC: add reverse follow deactivation + `vc.friend_ranks` DELETE | PENDING DEPLOYMENT | YES — rollback SQL in proposal file | YES — DB confirmed SECURITY DEFINER bypasses RLS; no additional policy needed | HIGH — missing cleanup bug active until deployed |
| batch4 — historical orphan backfill (reverse follows) | NOT STARTED | N/A — one-time cleanup query | N/A | HIGH — stale rows exist in `vc.actor_follows` from prior blocks |
| batch4 — historical orphan backfill (`vc.friend_ranks`) | NOT STARTED | N/A — one-time cleanup query | N/A | HIGH — stale rows exist from prior blocks |
| step2 section 2D — `vc.friend_ranks` SELECT policy (`USING(true)` → `friend_ranks_self_select`) | PENDING APPLICATION | YES — reversible `CREATE OR REPLACE POLICY` | YES — VENOM reviewed | MEDIUM — social graph scores globally visible until applied |
| Applied migration `20260510010000_moderation_blocks_rls_and_indexes.sql` | APPLIED | YES — standard rollback | YES — verified in DB review | No block |

---

## DOCUMENTATION RELEASE GATE

| Documentation Area | Status | Drift | Release Impact |
|---|---|---|---|
| Logan canonical doc (`vcsm.dal.block.md`) | PRESENT — this document | Current — all session findings appended | No block |
| Architecture contract compliance | PASS — SENTRY verified this session | No drift detected in block feature | No block |
| Native transfer doc (`moderation.md`) | PRESENT | Current as of 2026-05-04; Falcon P0 items not yet reflected | CAUTION — update after P0 items resolved |
| IRONMAN ownership file (`vcsm.block.owner.md`) | MISSING | Standalone IRONMAN file not created | LOW — inline record exists in this doc |
| ROADTRIP INDEX | PRESENT | Updated 2026-05-09; block feature `Risky` status accurate | No block |
| ARCHITECT system map | MISSING | No `vcsm-feature-map.md` update this session | LOW — block feature confirmed fully-layered but map not updated |
| Security audit stubs (`CURRENT/features/dashboard/evidence/`) | MISSING | No standalone security audit file created | LOW — VENOM findings documented inline |
| Release audit (`CURRENT/features/dashboard/evidence/`) | PENDING | This THOR report (below) | No block |

---

## ARCHITECTURE FINDINGS

| Finding | Severity | Status | Notes |
|---|---|---|---|
| SF-01: `invalidateFeedBlockCache` in controller layer | HIGH — RESOLVED | FIXED this session | Moved to `useBlockActions.js` hook |
| SF-02: Dev-only exports in production DAL | MEDIUM — RESOLVED | FIXED this session | Moved to `dev/diagnostics/dal/block.diagnostics.dal.js` |
| SF-03/IF-04: Profiles feature owned block DAL | MEDIUM — RESOLVED | FIXED this session | `blockedActorSet.read.dal.js` deleted |
| IF-01: Dead `isBlocked` export (unsafe semantics) | LOW — RESOLVED | FIXED this session | Deleted from `block.check.dal.js` |
| IF-02: Dead `toggleBlockActor` DAL export (wrong layer) | LOW — RESOLVED | FIXED this session | Deleted from `block.write.dal.js` |
| IF-03: `applyBlockSideEffects.js` — zero callers | LOW — HOLD | ON HOLD | Delete gated on batch4 deployment |
| Controller header comment incorrect (friend_ranks) | LOW — RESOLVED | FIXED this session | Comment corrected |

All architecture violations in scope are resolved. No remaining CRITICAL or HIGH architecture risks.

---

## PERFORMANCE FINDINGS

| Finding | Severity | Status | Notes |
|---|---|---|---|
| `checkBlockStatus` uncached — hits Supabase every profile/chat/feed load | MEDIUM | OPEN | LOKI not run; no TTL cache wraps block reads; hot path impact unquantified |
| `filterBlockedActors` bulk OR-query — MEDIUM risk on large social graphs | MEDIUM | OPEN | KRAVEN not run; risk unquantified |
| Feed block rows DAL — every feed page load | MEDIUM | OPEN | KRAVEN not run; TTL cache present in `feed.read.blockRows.dal.js` but invalidation behavior unverified under load |

LOKI and KRAVEN signals are missing. Performance risks are identified but unquantified. Not release-blocking for current scope.

---

## SECURITY FINDINGS

| Finding | Severity | Status | Notes |
|---|---|---|---|
| VENOM VS-01: `vc.friend_ranks` SELECT USING(true) — global visibility | HIGH | OPEN — step2 2D pending | Not a write-path risk; social graph score leak only; independent of batch4 |
| VENOM VS-02: Reverse follow direction not deactivated on block | HIGH | OPEN — batch4 pending | PWA bug; native inherits same RPC; fixed server-side by batch4 |
| VENOM: RPC auth guard confirmed — `is_current_vc_actor` | PASS | CONFIRMED | DB review verified guard presence |
| VENOM: All block status reads bidirectional — no bypass path | PASS | CONFIRMED | `checkBlockStatus` OR-query confirmed in this session |
| NTB-01: Native pre-RPC ownership check unconfirmed | MEDIUM | OPEN | Defense-in-depth gap; RPC guard is authoritative |
| NTB-02: Native fail-closed not runtime-verified | HIGH | OPEN — blocks native release | Safety regression risk |
| NTB-03: Native chat compose disable unverified | HIGH | OPEN — blocks native release | App Store compliance risk |

No CRITICAL security risks. All HIGH security risks are either gated on batch4 (server-side fix) or native-specific (block native release only).

---

## MIGRATION FINDINGS

| Finding | Severity | Notes |
|---|---|---|
| batch4 not deployed — follow orphan bug active | HIGH | Blocked actors remain followers of their blockers. Applies to all existing blocks. Rollback available. |
| batch4 not deployed — friend_ranks cleanup not atomic | HIGH | `vc.friend_ranks` rows persist after block. `applyBlockSideEffects.js` is dead code — no client-side cleanup happening. |
| Historical orphan backfill needed | HIGH | All blocks prior to batch4 deployment have stale `vc.actor_follows` and `vc.friend_ranks` rows. One-time cleanup query required after batch4. |
| step2 2D not applied — `vc.friend_ranks` global SELECT | MEDIUM | All social graph scores visible to authenticated users globally. Independent of batch4. |

---

## OWNERSHIP FINDINGS

| Finding | Severity | Notes |
|---|---|---|
| Block feature fully owned — self-contained | PASS | No engine dependency; all controllers, DALs, hooks within `features/block/` |
| `vc.friend_ranks` cleanup ownership | HIGH — OPEN | Ownership only confirmed once batch4 deploys. Currently: cleanup responsibility exists but no caller. |
| Native follow/friend gate — no owner | HIGH — OPEN | No transfer evidence; no native owner assigned. P0 FALCON gap. |
| IRONMAN ownership file missing | LOW | No `_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md` created. Inline record exists. |

---

## RISK ACCEPTANCE REGISTER

| Risk | Severity | Accepted By | Reason | Expiration / Follow-up |
|---|---|---|---|---|
| batch4 not yet deployed — follow orphan bug active | HIGH | UNKNOWN | Bug predates this session; batch4 fix is ready and cleared; deployment is a staging → production operation | Must deploy before any native release; backfill orphans post-deploy |
| batch4 not yet deployed — friend_ranks cleanup inactive | HIGH | UNKNOWN | Same as above | Same as above |
| LOKI runtime audit missing | MEDIUM | UNKNOWN | Block feature does not have unusual runtime patterns; risk is informational until scale testing needed | Schedule LOKI pass before first production traffic spike |
| KRAVEN performance audit missing | MEDIUM | UNKNOWN | `filterBlockedActors` bulk query risk is theoretical; no production data to validate against | Schedule KRAVEN pass before scale release |
| IRONMAN ownership file not created as standalone doc | LOW | UNKNOWN | Inline ownership record exists in this document | Create `vcsm.block.owner.md` in a Logan maintenance pass |
| ARCHITECT map not updated to reflect block feature FULLY LAYERED | LOW | UNKNOWN | Map note is stale; block feature is confirmed fully-layered | Update in next ARCHITECT session |

---

## RECOMMENDED ACTIONS BEFORE RELEASE

**Before PWA release (block feature):**
1. **Deploy batch4 migration** (`20260510100000_fix_block_actor_bidirectional_follows.sql`) on staging → validate via `pg_get_functiondef` → deploy to production
2. **Run historical backfill** — one-time cleanup of orphaned `vc.actor_follows` and `vc.friend_ranks` rows from all blocks prior to batch4 (query provided in batch4 SQL file)
3. **Delete `applyBlockSideEffects.js`** — gated on batch4 deployment (IF-03, held from this session)
4. **Apply step2 section 2D** — `vc.friend_ranks` SELECT policy fix (independent of batch4; security hardening)

**Before native release (block feature):**
5. **Resolve FALCON P0-1** — verify chat compose is disabled at controller level, not just visual cover (NTB-03)
6. **Resolve FALCON P0-2** — runtime-test fail-closed behavior on all four surfaces in iOS simulator (NTB-02)
7. **Resolve FALCON P0-3** — identify and verify native follow/friend gate (NDF-01)
8. **Add feed cache invalidation in native hook** after block/unblock (NDF-02)
9. **After batch4 deploys** — run native simulator regression: block actor → verify reverse follow deactivated + `vc.friend_ranks` removed (NDF-03/04)
10. **Request SENTRY native parity review** (FALCON requirement — after P0 items resolved)

**Documentation (non-blocking):**
11. Create `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md`
12. Update `vcsm-feature-map.md` — block feature status: FULLY LAYERED
13. Update `moderation.md` native transfer doc after FALCON P0 items resolved

---

## FINAL DECISION

```
PWA RELEASE:   CAUTION
NATIVE RELEASE: BLOCKED
OVERALL:        BLOCKED (native)
```

**PWA — CAUTION:** All architecture violations are resolved. No CRITICAL risks remain for the PWA block feature. Two HIGH risks (batch4 migration gaps) are accepted pending deployment. batch4 has a rollback, is cleared from all DB blockers, and fixes a pre-existing bug. The PWA is not newly broken — these risks existed before this session. PWA release may proceed with the accepted risks noted above.

**NATIVE — BLOCKED:** Three P0 FALCON gaps remain unresolved: chat compose disable unverified, fail-closed not runtime-tested, follow gate has no native owner. These are direct safety and App Store compliance requirements. Native release must not proceed until all P0 items are resolved.

```
FINAL DECISION: BLOCKED
Reason: Native release is blocked on FALCON P0 items.
        PWA release is CAUTION pending batch4 deployment.
        No CRITICAL unresolved risks exist.
        All code-level architecture violations from this session are RESOLVED.
```

---

**THOR COMPLETE — 2026-05-14**

## Codex Correction — 2026-05-11

### No-Delete Correction

Per user instruction, Codex must not delete files during this documentation processing pass. The previously removed file `apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js` was restored immediately. The live controller path still uses the block controller boundary, so this restored DAL file currently remains an unused duplicate pending owner review instead of being deleted.

### Verification

- Commands/searches run:
  - `git status --short | grep '^ D' || true`
- Remaining risks:
  - `blockedActorSet.read.dal.js` remains a delete candidate / duplicate pending IRONMAN review, but no deletion was retained.

### Status

PARTIAL

---

---

# IRONMAN — Block Feature Ownership Record · 2026-05-11

**Date:** 2026-05-11
**Reviewer:** IRONMAN
**Application Scope:** VCSM
**Run Mode:** Standalone — full ownership record
**Trigger:** Cerebro Phase Review Audit flagged that the IRONMAN ownership record produced in Phase 2 was inline only. This standalone pass formalizes it and routes it to `_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md`.
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED

---

## IRONMAN TARGET

```
Feature / Engine: Block — Moderation Safety Feature
Application Scope: VCSM
Reason: Feature has no prior ownership file. Three dead-code candidates require ownership decisions.
        friend_ranks cleanup gap (RISK-8) requires ownership clarity on a HIGH-severity data
        integrity issue. Cerebro flagged ownership registry gap.
```

---

## CODE ROOTS

```
Primary path:     apps/VCSM/src/features/block/
Related paths:
  apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js  ← dead duplicate, zero callers
  apps/VCSM/src/dev/diagnostics/groups/block.group.js                       ← dev-only consumer
Entry files:      apps/VCSM/src/features/block/index.js (barrel)
```

---

## LAYER MAP

```
DAL:
  block/dal/block.check.dal.js
    → checkBlockStatus()         ACTIVE — bidirectional check, returns { isBlocked, blockedByMe, blockedMe }
    → isBlocked()                DEAD — zero callers, approved for deletion (IF-01)

  block/dal/block.read.dal.js
    → filterBlockedActors()      ACTIVE — bulk OR query, returns Set of blocked actorIds
    → fetchActorsIBlocked()      DEV-ONLY — single caller: dev/diagnostics/groups/block.group.js
    → fetchActorsWhoBlockedMe()  DEV-ONLY — single caller: dev/diagnostics/groups/block.group.js
    → fetchBlockGraph()          DEV-ONLY — single caller: dev/diagnostics/groups/block.group.js

  block/dal/block.write.dal.js
    → blockActor()               ACTIVE — calls moderation.block_actor RPC
    → unblockActor()             ACTIVE — calls moderation.unblock_actor RPC
    → toggleBlockActor()         DEAD — zero callers, approved for deletion (IF-02)

Model:
  None — DAL returns flat primitives. No domain transform required.

Controller:
  block/controllers/blockActor.controller.js
    → blockActorController()         ACTIVE — block with guard + feed cache bust (RISK-7 coupling)
    → unblockActorController()       ACTIVE — unblock with ownership check
    → toggleBlockActorController()   ACTIVE — called by dev/diagnostics only

  block/controllers/getBlockStatus.controller.js
    → ctrlGetBlockStatus()           ACTIVE — public wrapper around checkBlockStatus

  block/controllers/getBlockedActorSet.controller.js
    → ctrlGetBlockedActorSet()       ACTIVE — public wrapper around filterBlockedActors

Adapter:
  block/adapters/hooks/useBlockStatus.adapter.js
  block/adapters/hooks/useBlockActorAction.adapter.js
  block/adapters/ui/ActorActionsMenu.jsx
  block/adapters/ui/BlockConfirmModal.adapter.js

Hook:
  block/hooks/useBlockActions.js
  block/hooks/useBlockActorAction.js
  block/hooks/useBlockStatus.js

Guard:
  block/guards/BlockGate.jsx

Component / UI:
  block/ui/BlockButton.jsx
  block/ui/BlockConfirmModal.jsx
  block/ui/BlockedState.jsx

Helper (dead):
  block/helpers/applyBlockSideEffects.js
    → deleteFriendRankRowsBetweenActors()  DEAD — zero callers, HOLD pending batch4 migration (IF-03)

Barrel:
  block/index.js
    exports: blockActorController, unblockActorController, toggleBlockActorController,
             ctrlGetBlockStatus, ctrlGetBlockedActorSet,
             useBlockStatus, useBlockActions, BlockedState, BlockConfirmModal
```

---

## DEPENDENCY OWNERSHIP

```
Engines used:     NONE — fully self-contained within apps/VCSM
Shared modules:
  @/services/supabase/supabaseClient   — Supabase client (platform-wide shared)
  @/services/supabase/postgrestSafe    — isUuid / assertUuid validators (platform-wide shared)
External services:
  Supabase — moderation schema (blocks table, block_actor RPC, unblock_actor RPC)
Cross-feature deps:
  @/features/feed/adapters/feedCache.adapter — imported by blockActor.controller.js (RISK-7 / SENTRY SF-01)
```

---

## DATA OWNERSHIP

```
Tables read:
  moderation.blocks   — all three DAL files, always filtered status = 'active'

Tables written:
  moderation.blocks   — via RPC only (block_actor / unblock_actor)
  vc.actor_follows    — via RPC side-effect (follow deactivation on block)
  vc.friend_ranks     — via RPC side-effect (PENDING — batch4 migration not yet applied)

RPCs:
  moderation.block_actor    — SECURITY DEFINER, owns block insert + follow deactivation + block_events audit
  moderation.unblock_actor  — SECURITY DEFINER, owns block status = released + unblock_events audit

Identity surfaces:
  actorId (blocker_actor_id, blocked_actor_id) only — never profileId or vportId

Caches:
  Feed block cache — invalidated by blockActor.controller.js via @/features/feed/adapters/feedCache.adapter
  No Zustand or TTL cache wraps block status reads — every call hits Supabase
```

---

## GOVERNANCE OWNERSHIP

```
Contracts touched:
  Architecture Contract       — layer order, controller/DAL separation, cross-feature adapter rule
  Actor Ownership Contract    — assertingActorId guard in all write paths
  Boundary Isolation Contract — cross-feature imports must go through adapters/barrel

Logan docs:
  zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md  (this document — canonical)

Engine audits:    None — no shared engine involved

Architecture maps:
  zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/vcsm-feature-map.md
    → needs correction: block feature still flagged PARTIALLY LAYERED (stale — fully layered confirmed)

Migration proposals:
  zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/
    batch4_20260510100000_fix_block_actor_bidirectional_follows.sql  — PROPOSAL ONLY, not applied
```

---

## RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership | block feature | HIGH | Self-contained, no engine dependency |
| DAL ownership — moderation.blocks reads | block feature | HIGH | No other feature may own a DAL for this table |
| DAL ownership — moderation.blocks writes | block feature (via RPC only) | HIGH | Direct inserts are architecturally forbidden |
| Controller ownership | block feature | HIGH | All three controllers are block-feature-internal |
| UI ownership | block feature | HIGH | All UI files in features/block/ui/ |
| Hook / lifecycle ownership | block feature | HIGH | useBlockActions, useBlockStatus, useBlockActorAction |
| Adapter surface ownership | block feature | HIGH | adapters/hooks/ and adapters/ui/ are approved cross-feature surfaces |
| Data ownership — moderation.blocks | block feature | HIGH | Single canonical owner |
| Data ownership — vc.friend_ranks cleanup | block feature (pending migration) | MEDIUM | Currently unowned at runtime — cleanup not happening |
| Security ownership (write path) | VENOM | HIGH | Trust boundary review authority |
| Migration ownership (block_actor RPC evolution) | CARNAGE | HIGH | batch4 migration gated by CARNAGE |
| Native parity ownership | FALCON | HIGH | All four surfaces unconfirmed |
| Documentation ownership | Logan (this doc) | HIGH | Canonical doc is this file |
| Release gate ownership | THOR | HIGH | Cannot run until FALCON + RISK-7 + batch4 resolved |

---

## OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| vc.friend_ranks cleanup | HIGH | deleteFriendRankRowsBetweenActors zero callers; batch4 not applied; cleanup silently not happening | CARNAGE must gate batch4; IRONMAN gates deletion of applyBlockSideEffects.js |
| invalidateFeedBlockCache in controller | MEDIUM | block controller imports from feed adapter — cross-feature coupling at controller layer | Move to useBlockActions.js hook (SENTRY SF-01 locked) |
| blockedActorSet.read.dal.js in profiles | MEDIUM | profiles feature has DAL reading block feature's data domain; zero callers but structural re-import risk | Delete after Wolverine execution pass (SENTRY SF-03 + IRONMAN locked) |
| dev-only exports in production DAL | LOW | convention-only enforcement for fetchActorsIBlocked/fetchActorsWhoBlockedMe/fetchBlockGraph | Move to dev/diagnostics/dal/ (SENTRY SF-02 locked) |
| dead DAL exports (isBlocked, toggleBlockActor) | LOW | isBlocked misses blockedMe direction; toggleBlockActor is DAL-layer business logic | Delete (IF-01 + IF-02 locked, ready for Wolverine) |

---

## DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `moderation.blocks` | block feature | block (check/read DAL), notifications/inbox, settings/privacy, feed pipeline, profiles/friends (dead — delete) | block feature via RPC only | moderation schema RLS | CARNAGE | Logan — this doc |
| `moderation.block_actor` RPC | block feature | blockActor.controller.js | block feature | SECURITY DEFINER — self-guarded via `moderation.is_current_vc_actor` | CARNAGE | Logan — this doc |
| `moderation.unblock_actor` RPC | block feature | blockActor.controller.js | block feature | SECURITY DEFINER — self-guarded | CARNAGE | Logan — this doc |
| `vc.friend_ranks` (block cleanup) | social/friend feature (data) / block feature (cleanup responsibility) | friend suggestions, social scoring | block RPC (PENDING — batch4 not applied) | vc schema RLS | CARNAGE | Logan — this doc |
| `vc.actor_follows` (block deactivation) | social/follow feature (data) / block feature (deactivation) | follow feature, friend feature | block RPC (one direction live; reverse in batch4) | vc schema RLS | CARNAGE | Logan — this doc |

---

## RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Block status must be bidirectional | block feature | Controller — checkBlockStatus guard | This doc §9 Rule 2 | LOW |
| Block writes must use RPCs only | block feature | Architecture — no direct insert path exists | This doc §9 Rule 7 | LOW |
| All moderation.blocks reads must filter `status = 'active'` | block feature | DAL — all three files enforce this | This doc §9 Rule 1 | LOW |
| assertingActorId must match blockerActorId before any write | block feature | Controller — throws on mismatch | This doc §9 Rule 3 | LOW |
| Cross-feature block access through barrel or adapters only | Architecture Contract | SENTRY | This doc §9 Rule 9 | LOW |
| Dev-only DAL functions must not be imported in production | block feature | Convention only — NO structural enforcement | This doc §9 Rule 6 | MEDIUM |
| friend_ranks must be cleaned up atomically on block | block feature (pending) | UNOWNED at runtime — batch4 not deployed | This doc §10 RISK-8 | HIGH |
| useBlockStatus is null-safe | block feature | DAL + hook — early return pattern | This doc §9 Rule 8 | LOW |

---

## RUNTIME OWNERSHIP MAP

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Hotspots |
|---|---|---|---|---|---|
| Block status check (read) | useBlockStatus.js | block | ctrlGetBlockStatus | checkBlockStatus → moderation.blocks | Every profile/chat/feed load — uncached, hits Supabase each call |
| Block action (write) | useBlockActions.js / useBlockActorAction.js | block | blockActorController / unblockActorController | blockActor / unblockActor → moderation RPCs | User-triggered only |
| Bulk block filter (friend ranking) | getTopFriendActorIds.controller.js | profiles (caller) / block (owner) | ctrlGetBlockedActorSet | filterBlockedActors → moderation.blocks bulk OR | Bulk query — MEDIUM perf risk on large social graphs |
| Feed block filter (pipeline) | fetchFeedPage.pipeline.js | feed (caller) / block (data) | none — own DAL | feed.read.blockRows.dal → moderation.blocks | Every feed page load |
| Dev diagnostics block graph | DevDiagnosticsScreen.jsx | dev/diagnostics only | toggleBlockActorController | fetchActorsIBlocked / fetchActorsWhoBlockedMe / fetchBlockGraph | Dev-only — no production concern |

> Runtime ownership is inferred — no LOKI trace evidence exists for this feature yet.

---

## CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| block feature code | block feature | apps/VCSM/src/features/block/ | CLEAN | Fully self-contained |
| moderation.blocks DAL (profiles duplicate) | profiles feature | apps/VCSM/src/features/profiles/dal/friends/ | VIOLATION | Delete blockedActorSet.read.dal.js — locked |
| feedCache.adapter import in block controller | block controller | apps/VCSM/src/features/feed/adapters/ | MODERATE DRIFT | Move to hook layer — locked |
| dev-only exports in production DAL | block feature DAL | apps/VCSM/src/features/block/dal/ | MINOR DRIFT | Move to dev/diagnostics/dal/ — locked |

---

## NATIVE PARITY OWNERSHIP

| Area | PWA Owner | Native Owner | Parity Doc | Risk |
|---|---|---|---|---|
| Profile visibility gate | block feature — useBlockStatus → useProfileGate | UNCONFIRMED | MISSING | HIGH |
| Feed content suppression | feed feature — readFeedBlockRowsDAL in feed pipeline | UNCONFIRMED | MISSING | HIGH |
| Chat composition gate | chat feature — useBlockStatus adapter in ConversationView | UNCONFIRMED | MISSING | HIGH |
| Follow/friend block enforcement | social/friend feature — ctrlGetBlockStatus in follow controllers | UNCONFIRMED | MISSING | HIGH |

FALCON review is REQUIRED and BLOCKING before this feature is considered release-ready on any native surface.

---

## IRONMAN OWNERSHIP FINDINGS

---

**IRONMAN OWNERSHIP FINDING — IF-01**
- Finding ID: IF-01
- Feature / Engine: Block Feature — block.check.dal.js
- Application Scope: VCSM
- Responsibility Type: DAL ownership
- Ownership Clarity: CLEAR — dead export, no owner claim
- Boundary Risk: LOW
- Severity: LOW
- Primary code roots: `apps/VCSM/src/features/block/dal/block.check.dal.js:67-86`
- Tables / Objects touched: `moderation.blocks` (read — identical query to checkBlockStatus)
- Rule ownership: None — function is dead
- Contracts touched: None
- Runtime ownership: Zero callers confirmed by live grep
- Current ambiguity: `isBlocked(actorA, actorB)` exported alongside `checkBlockStatus`. Runs the same OR-query but returns plain boolean. Pattern risk: future developer may use it as a lightweight check and miss the `blockedMe` direction, creating an incomplete bidirectional gate.
- **DECISION: APPROVED FOR DELETION.**
- Recommended handoff: Wolverine — delete export from block.check.dal.js

---

**IRONMAN OWNERSHIP FINDING — IF-02**
- Finding ID: IF-02
- Feature / Engine: Block Feature — block.write.dal.js
- Application Scope: VCSM
- Responsibility Type: DAL ownership
- Ownership Clarity: CLEAR — dead export, wrong layer for its intent
- Boundary Risk: LOW
- Severity: LOW
- Primary code roots: `apps/VCSM/src/features/block/dal/block.write.dal.js:65-71`
- Tables / Objects touched: moderation.blocks via RPCs — indirect
- Rule ownership: Toggle pattern owned by toggleBlockActorController at controller layer
- Contracts touched: Architecture Contract — toggle decision is a business rule, not a DAL concern
- Runtime ownership: Zero import callers confirmed (function definition line only in grep)
- Current ambiguity: `toggleBlockActor` exported from write DAL. `toggleBlockActorController` does NOT use it — calls blockActorDAL/unblockActorDAL directly. DAL-level toggle pushes a business rule below the controller layer.
- **DECISION: APPROVED FOR DELETION.**
- Recommended handoff: Wolverine — delete export from block.write.dal.js

---

**IRONMAN OWNERSHIP FINDING — IF-03**
- Finding ID: IF-03
- Feature / Engine: Block Feature — applyBlockSideEffects.js
- Application Scope: VCSM
- Responsibility Type: DAL ownership + Migration ownership
- Ownership Clarity: AMBIGUOUS — function exists, intended to be called, never wired
- Boundary Risk: HIGH
- Severity: HIGH
- Primary code roots: `apps/VCSM/src/features/block/helpers/applyBlockSideEffects.js`
- Tables / Objects touched: `vc.friend_ranks` (DELETE — bidirectional)
- Rule ownership: friend_ranks cleanup after block — CURRENTLY UNOWNED AT RUNTIME
- Contracts touched: Actor Ownership Contract, Architecture Contract
- Current ambiguity: File comment states "Friend rank cleanup remains client-side." Controller comment incorrectly states "friend_ranks cleanup are handled server-side by the RPC." Live RPC does NOT delete friend_ranks. batch4 migration is PROPOSAL ONLY — not applied. Result: every block action leaves stale vc.friend_ranks rows. Social graph not cleaned up.
- Risk: HIGH — blocked actors may surface in friend suggestions, social ranking, and any vc.friend_ranks consumer.
- **DECISION: DO NOT DELETE. Migration must deploy first.**
- Delete path: DB (RLS verify) → CARNAGE (gate batch4) → batch4 deploys → validate → Wolverine deletes file + corrects controller comment line 5
- Recommended handoff: CARNAGE → DB → Wolverine

---

**IRONMAN OWNERSHIP FINDING — IF-04**
- Finding ID: IF-04
- Feature / Engine: Block Feature — profiles duplicate DAL
- Application Scope: VCSM
- Responsibility Type: DAL ownership — boundary violation
- Ownership Clarity: CONFLICTED — profiles has a DAL reading block feature's data domain
- Boundary Risk: MEDIUM
- Severity: MEDIUM
- Primary code roots: `apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js`
- Tables / Objects touched: `moderation.blocks` — same bulk OR-query as filterBlockedActors, different return shape (array vs Set)
- Rule ownership: moderation.blocks reads owned by block feature exclusively
- Contracts touched: Boundary Isolation Contract, Architecture Contract
- Runtime ownership: Zero callers — getFriendLists.controller.js was migrated. File restored per no-delete instruction. Currently dead.
- **DECISION: APPROVED FOR DELETION.** Confirmed by SENTRY SF-03.
- Recommended handoff: Wolverine — delete apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js

---

## OWNERSHIP BOUNDARY WARNINGS

**OBW-01** — `blockActor.controller.js:15`
Current ambiguity: Block controller imports `invalidateFeedBlockCache` from feed adapter. Controller-layer cross-feature coupling.
Why risky: Any feed cache refactor requires coordinated change to block controller. Cache bust is a side-effect concern, not a business rule.
Clarification: Move invalidateFeedBlockCache calls to useBlockActions.js. Block controller owns only the block write result.

**OBW-02** — `block.read.dal.js` dev-only exports
Current ambiguity: Three dev-only functions in a production DAL file with no structural import barrier.
Why risky: Convention-only enforcement. Physical file separation is the only reliable boundary.
Clarification: Move to apps/VCSM/src/dev/diagnostics/dal/block.diagnostics.dal.js.

---

## FINAL IRONMAN STATUS

**Ownership Clarity: PARTIAL**

| Finding | Ownership Clarity | Boundary Risk | Decision | Next Step |
|---|---|---|---|---|
| IF-01 — `isBlocked` dead export | CLEAR | LOW | APPROVED FOR DELETION | Wolverine |
| IF-02 — `toggleBlockActor` dead export | CLEAR | LOW | APPROVED FOR DELETION | Wolverine |
| IF-03 — `applyBlockSideEffects.js` | AMBIGUOUS | HIGH | HOLD — migration gates deletion | CARNAGE → DB → Wolverine |
| IF-04 — `blockedActorSet.read.dal.js` | CONFLICTED | MEDIUM | APPROVED FOR DELETION | Wolverine |

Block feature core layers are well-owned and correctly bounded. Four open items all have clear resolution paths. RISK-8 is the only HIGH boundary risk — it requires a migration, not just a deletion. Native parity ownership is UNCONFIRMED across all four enforcement surfaces — FALCON owns this verification.

**Governance Lifecycle State:** `REVIEW_PENDING`
Advances to `VERIFIED` after FALCON completes. Advances to `RELEASE_READY` after THOR evaluation.

---

## IRONMAN PERSISTENCE NOTE

Per IRONMAN contract §3, a standalone ownership file must also be created at:
`zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md`

This pass was appended to `vcsm.dal.block.md` per user instruction. The standalone file is MISSING and must be created in the next Wolverine execution pass.

> **CEREBRO NOTE (2026-05-14):** Standalone ownership file has been created at `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md`. This persistence gap is now CLOSED.

---

**IRONMAN COMPLETE — 2026-05-11**

---

---

# CEREBRO — Verification Audit · 2026-05-14

**Date:** 2026-05-14
**Reviewer:** CEREBRO
**Reviewed:** Full document — all prior command passes
**Scope:** VCSM · Block Feature DAL
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED
**Application Scope:** VCSM

---

## 1. Document State on Entry

The document entered this CEREBRO session with the following prior command history:

| Command | Date | Status at Entry |
|---|---|---|
| ARCHITECT (inline scan) | 2026-05-11 | PRESENT |
| SENTRY (Phase 1) | 2026-05-11 | PRESENT — 3 findings, fix status unverified |
| IRONMAN (Phase 2 + 2x standalone) | 2026-05-11 | PRESENT — 4 findings, decisions made |
| CARNAGE (Phase 3) | 2026-05-11 | PRESENT — CAUTION, batch4 pending |
| VENOM (Phase 4 focused) | 2026-05-11 | PRESENT — 1 HIGH open (VF-01) |
| AvengersAssemble | 2026-05-11 | PRESENT |
| Codex Fix Pass | 2026-05-11 | PARTIAL — one file restored per no-delete instruction |
| DB (RLS analysis) | 2026-05-11 | PRESENT — batch4 RLS blocker CLEARED |
| FALCON | 2026-05-12 | PRESENT — BLOCKED (3 P0 items) |
| WINTER SOLDIER | 2026-05-14 | PRESENT — N/A (Android not started) |
| THOR | 2026-05-14 | PRESENT — PWA CAUTION / Native BLOCKED |
| LOKI | Never | MISSING |
| KRAVEN | N/A | N/A |

**Notable document anomaly:** The second IRONMAN standalone pass (appended at line 3405) duplicates the first (line 1982). Both describe the pre-fix state with dead exports still present and `blockedActorSet.read.dal.js` as a "dead duplicate." These descriptions are STALE — the fixes have since been applied. The duplicate pass is a governance-append record only and must not be used to infer current code state.

---

## 2. CEREBRO Risk Classification

### 2.1 Architecture-Boundary Risks

| Risk ID | Description | Prior Status | CEREBRO Class |
|---|---|---|---|
| RISK-7 / SF-01 | `blockActor.controller.js` imports `invalidateFeedBlockCache` from feed adapter | OPEN → RESOLVED | ARCHITECTURE BOUNDARY — verified FIXED in code |
| RISK-6 / SF-03 / IF-04 | `profiles/dal/friends/blockedActorSet.read.dal.js` duplicates block feature DAL | OPEN → RESOLVED | BOUNDARY VIOLATION — verified DELETED |
| RISK-3 / SF-02 | Dev-only exports in production `block.read.dal.js` | OPEN → RESOLVED | DAL SCOPE BOUNDARY — verified MOVED to dev/diagnostics/dal/ |

### 2.2 Dead Code Risks

| Risk ID | Description | Prior Status | CEREBRO Class |
|---|---|---|---|
| RISK-1 / IF-01 | `isBlocked` dead DAL export in `block.check.dal.js` | OPEN → RESOLVED | DEAD CODE + SAFETY PATTERN RISK — verified DELETED |
| RISK-2 / IF-02 | `toggleBlockActor` dead DAL export in `block.write.dal.js` | OPEN → RESOLVED | DEAD CODE + WRONG LAYER — verified DELETED |
| RISK-8 / IF-03 | `applyBlockSideEffects.js` — zero callers, cleanup not happening | OPEN / HOLD | DEAD CODE + DATA INTEGRITY GAP — correctly on HOLD pending batch4 |

### 2.3 DB / RLS Concerns

| Risk ID | Description | CEREBRO Class | Severity |
|---|---|---|---|
| RISK-8 (DB) | batch4 not deployed — `vc.friend_ranks` cleanup silently not happening | DB INTEGRITY — social graph gap | HIGH |
| DB Review 5 | Reverse-direction follow orphan bug — blocked actors remain followers | DB INTEGRITY — privacy/harassment vector | HIGH |
| DB Review 1 | `vc.friend_ranks` SELECT `USING(true)` — global visibility to authenticated users | DB / SECURITY — social graph enumeration | HIGH |
| batch4 RLS gate | `vc.friend_ranks` RLS permits SECURITY DEFINER DELETE | CLEARED — no blocker | N/A |

### 2.4 Security Concerns

| Finding | CEREBRO Class | Severity |
|---|---|---|
| VF-01 — friend_ranks stale rows after block | SAFETY FEATURE COMPLETENESS — social graph not cleaned up | HIGH |
| VF-02 — cache invalidation fire-and-forget in controller | RESOLVED — moved to hook layer | N/A |
| VF-04 — dead exports in safety-critical DAL | RESOLVED — deleted | N/A |
| NTB-02 — native fail-closed not runtime-verified | SAFETY REGRESSION RISK — may fail open on network error | HIGH |
| NTB-03 — chat compose disable visual-only | SAFETY + APP STORE COMPLIANCE | HIGH |

### 2.5 Runtime Concerns

| Concern | CEREBRO Class | Severity |
|---|---|---|
| LOKI never run | RUNTIME UNKNOWN — block status uncached, hits Supabase on every profile/chat/feed load | MEDIUM |
| `checkBlockStatus` uncached — hits Supabase every call | RUNTIME KNOWN DESIGN DECISION — documented, no TTL cache | MEDIUM (accepted) |
| `filterBlockedActors` bulk OR-query — no KRAVEN analysis | PERFORMANCE UNKNOWN — bulk query on large social graphs unquantified | MEDIUM (accepted) |

### 2.6 Native Parity Concerns

| Finding | CEREBRO Class | Severity | Release Impact |
|---|---|---|---|
| NTB-03 — chat compose disable not confirmed | NATIVE SAFETY + APP STORE | HIGH | **BLOCKING** |
| NTB-02 — fail-closed not runtime-verified | NATIVE SAFETY REGRESSION | HIGH | **BLOCKING** |
| NDF-01 — follow gate no native owner | NATIVE ENFORCEMENT GAP | HIGH | **BLOCKING** |
| NDF-02 — feed cache invalidation missing in native | NATIVE UX GAP | MEDIUM | CAUTION |
| NDF-03 + NDF-04 — batch4 bugs inherited by native | INHERITED PWA BUGS | HIGH | Resolved server-side by batch4 |

### 2.7 Governance Artifacts (Entry State)

| Artifact | Status at Entry | Action This Session |
|---|---|---|
| `_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md` | MISSING | CREATED ✓ |
| `CURRENT/features/dashboard/evidence/…sentry_block-dal.md` | MISSING | CREATED ✓ |
| `CURRENT/features/dashboard/evidence/…venom_block-feature.md` | MISSING | CREATED ✓ |
| `_ACTIVE/audits/migrations/…carnage_block-friend-ranks.md` | MISSING | CREATED ✓ |
| `_CANONICAL/logan/vcsm/native/` block parity doc | MISSING | NOT CREATED — requires FALCON P0 resolution first |
| `vcsm-feature-map.md` — stale PARTIALLY LAYERED flag | STALE | NOT UPDATED — requires dedicated ARCHITECT pass |

---

## 3. Command Order Decision

### 3.1 Canonical Order Reference

```
ARCHITECT → Venom → Loki → Kraven → Carnage → Falcon →
WinterSoldier → Logan → review-contract → SHIELD → Sentry → AvengersAssemble → THOR
```

### 3.2 Commands Required for This CEREBRO Session

All major governance commands have already run against this document (prior sessions 2026-05-11 to 2026-05-14). THOR issued its final release gate decision on 2026-05-14. The CEREBRO mandate for this session is verification and governance artifact closure.

| Phase | Action | Reason | Status |
|---|---|---|---|
| Phase 1 | Code State Verification (ARCHITECT-class grep scan) | THOR claimed 8 code changes as RESOLVED — verify each claim against live code | COMPLETED — see §4 |
| Phase 2 | LOKI | Never run; THOR flagged as MISSING | SKIPPED — no live runtime; MEDIUM risk accepted per THOR |
| Phase 3 | Missing Artifact Creation | Cerebro Phase Review §3 flagged 4 governance artifacts as MISSING | COMPLETED — see §5 |
| Phase 4 | Stale Documentation Note | Second IRONMAN pass (lines 3405–3789) shows pre-fix state | NOTED in this report — append-only rule, not edited |

---

## 4. Code State Verification Results

Live grep scan and file reads executed against `apps/VCSM/src/` on 2026-05-14.

### IF-01 — `isBlocked` export from `block.check.dal.js`

```
grep → NO MATCH
```
**VERIFIED DELETED ✓** — File now exports only `checkBlockStatus`.

### IF-02 — `toggleBlockActor` export from `block.write.dal.js`

```
grep → NO MATCH
```
**VERIFIED DELETED ✓** — File now exports only `blockActor` and `unblockActor`.

### SF-02 — Dev-only exports removed from `block.read.dal.js`

```
grep → NO MATCH for fetchActorsIBlocked|fetchActorsWhoBlockedMe|fetchBlockGraph
```
**VERIFIED REMOVED ✓** — `block.read.dal.js` is now 53 lines, exports only `filterBlockedActors`.

### SF-02 — `block.diagnostics.dal.js` created

```
ls → -rw-r--r-- 1817 May 14 10:24 block.diagnostics.dal.js
```
**VERIFIED PRESENT ✓**

### SF-02 — `block.group.js` import path updated

```
lines 8–12: import { fetchActorsIBlocked, fetchActorsWhoBlockedMe, fetchBlockGraph }
            from "@/dev/diagnostics/dal/block.diagnostics.dal"
```
**VERIFIED — imports from diagnostics DAL, not production DAL ✓**

### SF-01 — `blockActor.controller.js` no longer imports feed cache

```
grep invalidateFeedBlockCache|feedCache → NO MATCH
```
**VERIFIED REMOVED ✓**

Controller header comment also corrected (line 5–6):
- Was: `"follow deactivation and friend_ranks cleanup are handled server-side by the RPC"`
- Now: `"Follow deactivation is handled server-side by the RPC. friend_ranks cleanup: pending batch4 migration deployment."`

### SF-01 — `useBlockActions.js` now owns feed cache invalidation

```
line 27: import { invalidateFeedBlockCache } from "@/features/feed/adapters/feedCache.adapter"
line 52: invalidateFeedBlockCache(myActorId)
line 73: invalidateFeedBlockCache(myActorId)
```
**VERIFIED — cache invalidation correctly moved to hook layer ✓**

### IF-04 / SF-03 — `blockedActorSet.read.dal.js` deleted

```
ls → FILE NOT FOUND
```
**VERIFIED DELETED ✓**

### IF-03 — `applyBlockSideEffects.js` still present (HOLD)

```
ls → -rw-r--r-- 1097 Apr 10 04:42 applyBlockSideEffects.js
```
**CORRECTLY ON HOLD ✓** — Deletion gated on batch4 migration deployment.

---

## 5. Missing Artifacts Created This Session

| Artifact | Path | Status |
|---|---|---|
| IRONMAN ownership file | `_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md` | CREATED ✓ |
| SENTRY audit stub | `CURRENT/features/dashboard/evidence/2026-05-11_sentry_block-dal.md` | CREATED ✓ |
| VENOM audit stub | `CURRENT/features/dashboard/evidence/2026-05-11_venom_block-feature.md` | CREATED ✓ |
| CARNAGE audit stub | `_ACTIVE/audits/migrations/2026-05-11_carnage_block-friend-ranks.md` | CREATED ✓ |

---

## 6. Final Command Status Table

| Command | Date | Status | Blocking |
|---|---|---|---|
| ARCHITECT | 2026-05-11 | COMPLETE (inline) | NO |
| SENTRY | 2026-05-11 | COMPLETE — all 3 findings RESOLVED (verified 2026-05-14) | NO |
| IRONMAN | 2026-05-11 | COMPLETE — IF-01, IF-02, IF-04 RESOLVED; IF-03 on HOLD | NO |
| CARNAGE | 2026-05-11 | COMPLETE — batch4 pending deployment | NO |
| VENOM | 2026-05-11 | COMPLETE — VF-01 open (batch4 gates it) | NO |
| DB | 2026-05-11 | COMPLETE — batch4 RLS blocker CLEARED | NO |
| FALCON | 2026-05-12 | COMPLETE — 3 P0 items blocking native release | YES (native) |
| WINTER SOLDIER | 2026-05-14 | COMPLETE — Android not started; pre-requirements registered | NO |
| LOGAN | 2026-05-11 | COMPLETE — ALIGNED | NO |
| review-contract | 2026-05-11 | COMPLETE — RISK-6 was active violation, now RESOLVED | NO |
| SHIELD | N/A | N/A — no external dependencies | NO |
| AvengersAssemble | 2026-05-11 | COMPLETE | NO |
| THOR | 2026-05-14 | COMPLETE — PWA CAUTION / Native BLOCKED | YES (native) |
| LOKI | MISSING | Never run — no live runtime available | NO (accepted risk) |
| KRAVEN | N/A | Block feature not perf-critical; accepted | NO |
| Code State Verification | 2026-05-14 | COMPLETE — all 9 THOR code claims verified in live files | — |
| Missing Artifacts | 2026-05-14 | COMPLETE — 4 governance files created | — |

---

## 7. Open Risks

| Risk | Severity | Owner | Status |
|---|---|---|---|
| RISK-8 / VF-01 — friend_ranks not cleaned up after block | HIGH | CARNAGE + block feature | OPEN — batch4 pending deployment |
| DB Review 5 — reverse follow orphan bug (blocked actors remain followers) | HIGH | CARNAGE + batch4 | OPEN — batch4 pending deployment |
| DB Review 1 — `vc.friend_ranks` SELECT `USING(true)` global visibility | HIGH | DB + VENOM | OPEN — step2 2D pending application |
| FALCON P0-1 — chat compose disable not confirmed (NTB-03) | HIGH | Safety module | **BLOCKING — native release** |
| FALCON P0-2 — fail-closed not runtime-verified (NTB-02) | HIGH | Safety module | **BLOCKING — native release** |
| FALCON P0-3 — follow gate no native owner (NDF-01) | HIGH | Safety / Social module | **BLOCKING — native release** |
| NDF-02 — feed cache invalidation missing in native | MEDIUM | Safety / Feed module | CAUTION |
| LOKI — no runtime telemetry for block feature | MEDIUM | LOKI | Accepted per THOR |
| KRAVEN — filterBlockedActors bulk query unquantified | MEDIUM | KRAVEN | Accepted |
| ARCHITECT map — block feature flagged PARTIALLY LAYERED (stale) | LOW | ARCHITECT | Requires dedicated pass |
| Second IRONMAN pass (doc lines 3405–3789) shows pre-fix stale state | LOW | Logan | Documentation only — append-only constraint |

---

## 8. Fixed Risks (Verified This Session)

| Risk | Fix Applied | Date | Verification Method |
|---|---|---|---|
| RISK-1 — `isBlocked` dead export | DELETED from block.check.dal.js | 2026-05-14 | grep → NO MATCH ✓ |
| RISK-2 — `toggleBlockActor` dead export | DELETED from block.write.dal.js | 2026-05-14 | grep → NO MATCH ✓ |
| RISK-3 — dev-only exports in production DAL | MOVED to dev/diagnostics/dal/block.diagnostics.dal.js | 2026-05-14 | grep prod → NO MATCH; diagnostics file present ✓ |
| RISK-4 — schema undocumented (`blocks` → `moderation.blocks`) | CORRECTED in documentation | 2026-05-11 | — |
| RISK-5 — `dalSearchActors` duplicate in settings/privacy | FIXED (prior actors adapter work) | pre-2026-05-11 | — |
| RISK-6 — `blockedActorSet.read.dal.js` duplicate | DELETED | 2026-05-14 | ls → FILE NOT FOUND ✓ |
| RISK-7 / SF-01 — block controller imports feed cache | MOVED to useBlockActions.js | 2026-05-14 | grep controller → NO MATCH; grep hook → present ✓ |
| Controller comment — misleading friend_ranks server-side claim | CORRECTED — now states "pending batch4 migration deployment" | 2026-05-14 | Read controller header ✓ |
| block.group.js import path | UPDATED to @/dev/diagnostics/dal/block.diagnostics.dal | 2026-05-14 | Read import lines ✓ |
| Governance gap — IRONMAN standalone file missing | CREATED vcsm.block.owner.md | 2026-05-14 | Write confirmed ✓ |
| Governance gap — SENTRY audit stub missing | CREATED 2026-05-11_sentry_block-dal.md | 2026-05-14 | Write confirmed ✓ |
| Governance gap — VENOM audit stub missing | CREATED 2026-05-11_venom_block-feature.md | 2026-05-14 | Write confirmed ✓ |
| Governance gap — CARNAGE audit stub missing | CREATED 2026-05-11_carnage_block-friend-ranks.md | 2026-05-14 | Write confirmed ✓ |

---

## 9. Required Next Commands

| Priority | Command | Reason |
|---|---|---|
| CRITICAL | **batch4 migration deployment** | Closes RISK-8, VF-01, DB Review 5 simultaneously — friend_ranks cleanup + reverse follow deactivation. Deploy staging → validate via `pg_get_functiondef` → backfill orphaned rows → production. |
| CRITICAL | **FALCON P0 resolution** | NTB-03 (chat compose disable), NTB-02 (fail-closed verification), NDF-01 (follow gate ownership) must all be resolved before native release can open. |
| HIGH | **step2 2D application** | `vc.friend_ranks` SELECT policy — replace `USING(true)` with `friend_ranks_self_select`. Independent of batch4. Closes social graph enumeration risk. |
| MEDIUM | **LOKI** | Runtime telemetry for block status read path (profile/chat/feed load). Required before scale release. Schedule after code stability confirmed. |
| LOW | **ARCHITECT map update** | Correct `vcsm-feature-map.md` — block feature is FULLY LAYERED, not PARTIALLY LAYERED. |
| LOW | **Native parity doc** | Create `_CANONICAL/logan/vcsm/native/vcsm.native.block.md` after FALCON P0 items resolved. |

---

## 10. Document Lifecycle State

**Status: REVIEW_PENDING**

**Rationale:**
- All code-level architecture violations from THOR session are VERIFIED RESOLVED in live code (verified 2026-05-14).
- All major governance commands have run (SENTRY, IRONMAN, CARNAGE, VENOM, DB, FALCON, WINTER SOLDIER, THOR, AvengersAssemble).
- THOR final decision (2026-05-14): PWA CAUTION / Native BLOCKED.
- Three FALCON P0 items remain unresolved — native block enforcement is not runtime-verified.
- batch4 migration is not deployed — social graph integrity gap persists on both PWA and native.
- LOKI has never run.

**Lifecycle transitions:**
- `REVIEW_PENDING` → `VERIFIED`: After FALCON P0 items resolved + fail-closed runtime-tested on all four native surfaces
- `VERIFIED` → `RELEASE_READY`: After THOR re-evaluates post-FALCON + batch4 deployed and backfill confirmed

---

**DOCUMENT STATUS: REVIEW_PENDING**

**CEREBRO COMPLETE — 2026-05-14**

---

# LOKI — Runtime Observability Audit · 2026-05-14

**Date:** 2026-05-14
**Command:** LOKI
**Application Scope:** VCSM
**Feature:** Block / Moderation — status read path + feed cache invalidation
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED
**TypeScript output:** NOT ALLOWED

**Standalone report:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_loki_block-dal-status-read.md`

---

## Observation Method

Static code analysis only — no live browser runtime available. Evidence type INFERRED from hook structure, dependency arrays, and import graphs. Two HIGH-severity patterns identified via caller chain inspection.

---

## LOKI Runtime Findings

### LF-01 — Duplicate `checkBlockStatus` reads on profile screens (HIGH)

**Evidence Type:** INFERRED · Confidence: HIGH

**Finding:** Both `VportProfileViewScreen.jsx` (line 58) and `ActorProfileViewScreen.jsx` (line 78) call `useBlockStatus(viewerActorId, profileActorId)` directly. Both screens also call `useProfileGate(viewerActorId, targetActorId)` (lines 54 and 70 respectively), which internally calls `useBlockStatus` with the same arguments at `useProfileGate.js:19`. `checkBlockStatus` has NO TTL cache — every call hits `moderation.blocks` via Supabase.

**Runtime impact:** Every profile screen load fires 2× uncached `moderation.blocks` queries for identical actor pairs.

**Read Amplification Score:** 2.0 (2 reads / 1 primary check)

**Caller chain:**
```
VportProfileViewScreen → useProfileGate → useBlockStatus → checkBlockStatus → moderation.blocks
VportProfileViewScreen → useBlockStatus (direct) → checkBlockStatus → moderation.blocks
ActorProfileViewScreen → useProfileGate → useBlockStatus → checkBlockStatus → moderation.blocks
ActorProfileViewScreen → useBlockStatus (direct) → checkBlockStatus → moderation.blocks
```

**Fix:** Remove the direct `useBlockStatus` call from both profile screens. Derive `canViewProfile`, `blockLoading`, `isBlocked`, and `blockedMe` from the `gate` object already returned by `useProfileGate`. No new DAL or controller work required.

**Recommended handoff:** KRAVEN (duplicate read pattern) + Wolverine (code fix)

---

### LF-02 — `useBlockActorAction.js` missing feed cache invalidation (HIGH)

**Evidence Type:** INFERRED · Confidence: HIGH

**Finding:** `apps/VCSM/src/features/block/hooks/useBlockActorAction.js` (19 lines) calls `blockActorController` but does NOT import or call `invalidateFeedBlockCache`. By contrast, `useBlockActions.js` (90 lines) correctly calls `invalidateFeedBlockCache(myActorId)` at lines 52 and 73 after controller resolution.

The `blockCache` in `feed.read.blockRows.dal.js` has a 60s TTL. Any block action triggered through `useBlockActorAction` leaves the blocked actor visible in the feed for up to 60 seconds.

**Runtime impact:** Feed-triggered block creates a 60s stale window — blocked actor content remains visible until TTL expires.

**Caller chain:**
```
[some UI surface] → useBlockActorAction → blockActorController → moderation.block_actor RPC
                                        ↳ [missing] invalidateFeedBlockCache
```

**Fix:** Add `import { invalidateFeedBlockCache } from "@/features/feed/adapters/feedCache.adapter"` to `useBlockActorAction.js` and call `invalidateFeedBlockCache(blockerActorId)` after `blockActorController` resolves successfully.

**Recommended handoff:** VENOM (safety-adjacent gap) + Wolverine (code fix)

---

### LF-03 — `filterBlockedActors` uncached (MEDIUM — accepted)

**Evidence Type:** INFERRED · Confidence: MEDIUM

**Finding:** `block.read.dal.js` exports `filterBlockedActors` with no TTL cache. Bulk OR-query against `moderation.blocks` per content list. Caller volume and query shape on large social graphs are unquantified.

**Recommended handoff:** KRAVEN (performance quantification)

---

### LF-04 — Feed pipeline correctly cached and parallelized (PASS)

**Evidence Type:** INFERRED · Confidence: HIGH

`fetchFeedPage.pipeline.js` uses `Promise.all` across 9 concurrent DAL calls. `feed.read.blockRows.dal.js` uses `createTTLCache(60_000)` correctly keyed by `viewerActorId`. No N+1 patterns detected in the feed path. Feed block cache invalidation wired correctly in `useBlockActions.js`. Pipeline includes a dev-only `wrapDAL` + `recordStep` profiler — no production-visible diagnostics. PASS.

---

## LOKI Findings Summary

| Finding | Severity | Status | Recommended Handoff |
|---|---|---|---|
| LF-01 — Duplicate `checkBlockStatus` reads on profile screens | HIGH | OPEN — fix is straightforward; no DAL changes needed | KRAVEN + Wolverine |
| LF-02 — `useBlockActorAction.js` missing feed cache invalidation | HIGH | OPEN — one import + one call needed | VENOM + Wolverine |
| LF-03 — `filterBlockedActors` uncached, bulk query unquantified | MEDIUM | ACCEPTED — KRAVEN pending | KRAVEN |
| LF-04 — Feed pipeline correctly cached + parallelized | PASS | — | — |

---

## Updated CEREBRO Command Status Table (post-LOKI)

| Command | Date | Status |
|---|---|---|
| LOKI | 2026-05-14 | COMPLETE (static analysis) — 2 HIGH findings OPEN |

---

## Updated Open Risks (post-LOKI)

| Risk | Severity | Owner | Status |
|---|---|---|---|
| LF-01 — 2× uncached `moderation.blocks` reads per profile load | HIGH | Wolverine | OPEN — new finding this session |
| LF-02 — `useBlockActorAction` missing feed cache invalidation | HIGH | Wolverine | OPEN — new finding this session |
| LF-03 — `filterBlockedActors` bulk query unquantified | MEDIUM | KRAVEN | Accepted pending KRAVEN pass |

---

## Document Lifecycle State (post-LOKI)

**Status: REVIEW_PENDING** (unchanged)

LF-01 and LF-02 are new open items. Neither blocks the existing gate condition (FALCON P0 items and batch4 are the current blockers), but both must be resolved before `VERIFIED` can be reached.

**Updated lifecycle transitions:**
- `REVIEW_PENDING` → `VERIFIED`: After FALCON P0 items resolved + LF-01 + LF-02 fixed + fail-closed runtime-tested on all four native surfaces
- `VERIFIED` → `RELEASE_READY`: After THOR re-evaluates post-FALCON + batch4 deployed and backfill confirmed

---

**FINAL LOKI STATUS: WATCH**

**LOKI COMPLETE — 2026-05-14**
