# ELEKTRA PRECISION SECURITY SCAN — block
**Date:** 2026-06-07T11:30:00
**Scanner Version:** 1.1.0
**Application Scope:** VCSM
**Command:** ELEKTRA
**VENOM Gate:** PASS — 2026-06-07
**BLACKWIDOW Gate:** PASS — 2026-06-07

## Output Metadata
| Field | Value |
|---|---|
| Feature | block |
| Command | ELEKTRA |
| Scope | VCSM:block |
| VENOM Reference | 2026-06-07_venom_block-security-review.md |
| BLACKWIDOW Reference | 2026-06-07_blackwidow_block-adversarial-review.md |
| Timestamp | 2026-06-07T11:30:00 |

---

## Gate Status

```
ELEKTRA GATE CHECK
===================
ARCHITECT Gate: PASS (0 days old)
VENOM Gate: PASS (2026-06-07, COMPLETE)
BLACKWIDOW Gate: PASS (2026-06-07, COMPLETE — FAIL recommendation for 3 HIGH BYPASSED)
Note: BLACKWIDOW recommends FAIL; ELEKTRA proceeds to provide patch chain for resolution
```

---

## Scan Areas Activated

- Area 1: Actor Ownership / IDOR (primary)
- Area 2: Controller Input Trust
- Area 5: Secrets and Config (console.error leakage)

---

## ELEK-BLOCK-2026-001 — ctrlGetBlockStatus: Session Guard Missing [HIGH]

**Finding ID:** ELEK-BLOCK-2026-001
**Verifying:** VEN-BLOCK-2026-001 / BW-BLOCK-2026-001 (BYPASSED)
**Severity:** HIGH
**Patch Type:** SESSION_GUARD (controller layer)

**Source-to-Sink Chain:**
```
SOURCE: { actorId, targetActorId } (caller-supplied parameters)
  ↓ ctrlGetBlockStatus({ actorId, targetActorId })
     → controllers/getBlockStatus.controller.js:1-12
     → NO session check — accepts any actorId pair
  ↓ checkBlockStatus(actorId, targetActorId)
     → dal/block.check.dal.js
     → isUuid() validation on both (valid UUIDs pass)
     → PostgREST: moderation.blocks SELECT ... WHERE (blocker=A AND blocked=B) OR (blocker=B AND blocked=A)
SINK: block relationship metadata returned (isBlocking, isBlockedBy)

MISSING DEFENSE: session assertion that caller owns at least one of actorId or targetActorId
RLS DEPENDENCY: moderation.blocks SELECT RLS (UNVERIFIED — DB AUDIT NOTE)
```

**Patch Advisory:**

In `apps/VCSM/src/features/block/controllers/getBlockStatus.controller.js`:
```js
import { dalGetAuthSession } from '@/features/auth/adapters/auth.adapter';

export async function ctrlGetBlockStatus({ actorId, targetActorId, assertingActorId }) {
  // ADD: session guard — caller must own one of the actors in the relationship
  if (!assertingActorId) throw new Error('SESSION_REQUIRED: assertingActorId required');
  // The hook layer (useBlockStatus.adapter) should pass sessionActorId as assertingActorId
  if (assertingActorId !== actorId && assertingActorId !== targetActorId) {
    throw new Error('OWNERSHIP_VIOLATION: caller must be a participant in the queried block relationship');
  }
  return checkBlockStatus(actorId, targetActorId);
}
```

**Hook-layer update required:** `useBlockStatus.adapter.js` must pass `sessionActorId` from `useIdentity()` as `assertingActorId`:
```js
const { identity } = useIdentity();
ctrlGetBlockStatus({ actorId, targetActorId, assertingActorId: identity?.actorId });
```

**Why this works:** The assertingActorId comes from useIdentity() which derives from the server-verified session. A foreign actorId in `actorId` or `targetActorId` cannot match the session actor — the OWNERSHIP_VIOLATION guard fires.

**CLOSES:** VEN-BLOCK-2026-001, BW-BLOCK-2026-001

---

## ELEK-BLOCK-2026-002 — ctrlGetBlockedActorSet: Session Guard Missing [HIGH]

**Finding ID:** ELEK-BLOCK-2026-002
**Verifying:** VEN-BLOCK-2026-002 / BW-BLOCK-2026-002 (BYPASSED)
**Severity:** HIGH
**Patch Type:** SESSION_GUARD (controller layer)

**Source-to-Sink Chain:**
```
SOURCE: actorId (caller-supplied), candidateActorIds (caller-supplied array)
  ↓ ctrlGetBlockedActorSet(actorId, candidateActorIds)
     → controllers/getBlockedActorSet.controller.js:1-5
     → NO session check — accepts any actorId
  ↓ filterBlockedActors(actorId, candidateActorIds)
     → dal/block.read.dal.js:22-27
     → UUID-validates candidates → builds .or() → PostgREST SELECT
SINK: blocked actor intersection returned for caller-supplied actorId

MISSING DEFENSE: session assertion that caller owns actorId
```

**Patch Advisory:**

In `apps/VCSM/src/features/block/controllers/getBlockedActorSet.controller.js`:
```js
export function ctrlGetBlockedActorSet(actorId, candidateActorIds, assertingActorId) {
  // ADD: session guard
  if (!assertingActorId) throw new Error('SESSION_REQUIRED');
  if (assertingActorId !== actorId) throw new Error('OWNERSHIP_VIOLATION: caller must own the queried actorId');
  return filterBlockedActors(actorId, candidateActorIds);
}
```

**Caller update:** Every consumer of ctrlGetBlockedActorSet must pass `sessionActorId` as the third parameter.

**CLOSES:** VEN-BLOCK-2026-002, BW-BLOCK-2026-002

---

## ELEK-BLOCK-2026-003 — useBlockStatus Fail-Open: Must Fail Closed [HIGH]

**Finding ID:** ELEK-BLOCK-2026-003
**Verifying:** BW-BLOCK-2026-007 (BYPASSED — NEW finding from BLACKWIDOW)
**Severity:** HIGH
**Patch Type:** FAIL_CLOSED (hook layer)

**Source-to-Sink Chain:**
```
SOURCE: DB error / network timeout during block status check
  ↓ ctrlGetBlockStatus or checkBlockStatus throws
  ↓ useBlockStatus hook catch block:
     setIsBlocked(false); setBlockedMe(false); [FAIL-OPEN]
  ↓ BlockGate: isBlocked=false → canViewProfile=true, canInteract=true
SINK: Blocked actor gains temporary access to victim's profile during transient DB error

CRITICAL SAFETY FLAW: safety gate fails open — protection disappears under stress
```

**Patch Advisory:**

In `apps/VCSM/src/features/block/hooks/useBlockStatus.js` (or wherever the hook catches block errors):
```js
// Current (fail-open):
catch (err) {
  setIsBlocked(false);
  setBlockedMe(false);
  captureVcsmError({ context: 'useBlockStatus', error: err });
}

// Patched (fail-closed):
catch (err) {
  // FAIL CLOSED: assume blocked when we cannot confirm otherwise
  setIsBlocked(true);
  setBlockedMe(false); // conservative — we don't know if victim blocked us
  captureVcsmError({ context: 'useBlockStatus', error: err });
}
```

**Why this works:** When the block status cannot be determined (DB error, timeout), the safest assumption for a safety feature is that the block is active. This protects the victim at the cost of a transient false-positive for the potential attacker. An error state showing "something went wrong" to the user is acceptable; allowing a blocked actor access is not.

**CLOSES:** BW-BLOCK-2026-007

---

## ELEK-BLOCK-2026-004 — filterBlockedActors: Array Length Cap [MEDIUM]

**Finding ID:** ELEK-BLOCK-2026-004
**Verifying:** VEN-BLOCK-2026-003 / BW-BLOCK-2026-003 (PARTIAL)
**Severity:** MEDIUM
**Patch Type:** INPUT_VALIDATION (DAL layer)

**Source-to-Sink Chain:**
```
SOURCE: candidateActorIds (caller-supplied array — any length)
  ↓ filterBlockedActors(actorId, candidateActorIds)
     → Set dedup → UUID filter → builds .or() clause with ALL valid candidates
SINK: PostgREST query with N OR conditions — no upper bound on N

MISSING DEFENSE: candidateActorIds.length cap
```

**Patch Advisory:**

In `apps/VCSM/src/features/block/dal/block.read.dal.js`:
```js
const MAX_CANDIDATES = 500;

export async function filterBlockedActors(actorId, candidateActorIds) {
  // ADD: length cap
  if (!Array.isArray(candidateActorIds)) return [];
  if (candidateActorIds.length > MAX_CANDIDATES) {
    throw new Error(`CANDIDATE_LIST_TOO_LARGE: max ${MAX_CANDIDATES}, received ${candidateActorIds.length}`);
  }
  
  const unique = [...new Set(candidateActorIds)].filter(isUuid);
  // ... existing PostgREST .or() logic
}
```

**Why 500:** A generous limit that covers typical feed pagination (50-100 actors per page × several pages). Adjust based on actual maximum feed size. For larger lists, callers should batch in 500-item chunks.

**CLOSES:** VEN-BLOCK-2026-003, BW-BLOCK-2026-003 (PARTIAL → BLOCKED)

---

## ELEK-BLOCK-2026-005 — console.error → captureVcsmError in All 3 DALs [MEDIUM]

**Finding ID:** ELEK-BLOCK-2026-005
**Verifying:** VEN-BLOCK-2026-004 / BW-BLOCK-2026-004 (BYPASSED)
**Severity:** MEDIUM
**Patch Type:** REMOVE + captureVcsmError (DAL layer)

**Source-to-Sink Chain:**
```
SOURCE: DB error in block/unblock/check operation
  ↓ catch(err): console.error(err) — unconditional in all 3 DALs
     - block.write.dal.js:34 (block error)
     - block.write.dal.js:51 (unblock error)
     - block.check.dal.js:34 (check error)
     - block.read.dal.js:36 (filter error)
SINK: Browser DevTools console — actor IDs + DB error codes visible in production

MISSING DEFENSE: replace console.error with captureVcsmError; remove production console leakage
```

**Patch Advisory:**

In each of the 3 DAL files, replace:
```js
} catch (err) {
  console.error(err);
  return null; // or throw
}
```
With:
```js
import { captureVcsmError } from '@/shared/monitoring/captureVcsmError';

} catch (err) {
  captureVcsmError({ context: 'block/[operation]', error: err });
  return null; // or throw, as appropriate
}
```

**Files to patch (4 locations):**
- `dal/block.write.dal.js:34` (blockActor catch)
- `dal/block.write.dal.js:51` (unblockActor catch)
- `dal/block.check.dal.js:34` (checkBlockStatus catch)
- `dal/block.read.dal.js:36` (filterBlockedActors catch)

**Why this works:** captureVcsmError routes errors to the monitoring system (non-public). No actor IDs or DB schema details reach the browser console.

**CLOSES:** VEN-BLOCK-2026-004, BW-BLOCK-2026-004

---

## Enhanced Mitigation Plan

| Finding | Patch Type | Complexity | THOR Impact | Files |
|---|---|---|---|---|
| ELEK-BLOCK-2026-001 | SESSION_GUARD | SIMPLE | THOR BLOCKER RESOLVED | controllers/getBlockStatus.controller.js + useBlockStatus.adapter.js |
| ELEK-BLOCK-2026-002 | SESSION_GUARD | SIMPLE | THOR BLOCKER RESOLVED | controllers/getBlockedActorSet.controller.js + callers |
| ELEK-BLOCK-2026-003 | FAIL_CLOSED | SIMPLE (one-line) | THOR BLOCKER RESOLVED | hooks/useBlockStatus.js |
| ELEK-BLOCK-2026-004 | INPUT_VALIDATION | SIMPLE | Risk reduction | dal/block.read.dal.js |
| ELEK-BLOCK-2026-005 | REMOVE + captureVcsmError | SIMPLE (4 locations) | Monitoring improvement | dal/block.write.dal.js + block.check.dal.js + block.read.dal.js |

All patches are SIMPLE (no architectural change required). Total: ~15 lines of code changes.

---

## False Positives Rejected

**FP-BLOCK-001:** blockActor/unblockActor write path as IDOR — REJECTED. The assertingActorId === blockerActorId guard is CONFIRMED PRESENT and SOURCE_VERIFIED. Write path ownership is correctly enforced.

**FP-BLOCK-002:** isUuid() validation as insufficient — REJECTED. UUID validation prevents SQL injection and malformed input at the DAL level. It is not a substitute for ownership verification (which is the actual gap), but it is a valid and necessary input sanitation layer.

---

## DB AUDIT NOTES (deferred)

| DB Object | Risk | Suggested SQL Review |
|---|---|---|
| moderation.blocks SELECT RLS | If absent or misconfigured, the session guard patch (ELEK-BLOCK-2026-001/002) is the only defense | `SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'blocks' AND schemaname = 'moderation';` |
| moderation.block_actor RPC ownership | RPC must verify that blocker_actor_id is owned by auth.uid() | Verify: `blocker_actor_id IN (SELECT actor_id FROM vc.actor_owners WHERE user_id = auth.uid())` |
| moderation.unblock_actor RPC ownership | Same verification needed for unblock | Same pattern as block_actor RPC |

---

## THOR Release Gate Assessment

```
THOR Release Blockers: YES (3 blockers)
  1. ELEK-BLOCK-2026-001 HIGH — ctrlGetBlockStatus session guard (SIMPLE patch)
  2. ELEK-BLOCK-2026-002 HIGH — ctrlGetBlockedActorSet session guard (SIMPLE patch)
  3. ELEK-BLOCK-2026-003 HIGH — useBlockStatus fail-closed (one-line patch)

All 3 blockers require SIMPLE patches (< 20 lines total).
After patches: DB audit required to confirm RLS coverage before claiming full closure.

Recommendation: FAIL — three HIGH THOR blockers; all patchable in a single sprint
Highest Open Severity: HIGH
```

---

## Output Summary

```
CRITICAL: 0
HIGH: 3 (ELEK-BLOCK-2026-001, 002, 003 — all THOR BLOCKERS)
MEDIUM: 2 (ELEK-BLOCK-2026-004, 005)
LOW: 0
False Positives Rejected: 2
DB Audit Notes: 3
```
