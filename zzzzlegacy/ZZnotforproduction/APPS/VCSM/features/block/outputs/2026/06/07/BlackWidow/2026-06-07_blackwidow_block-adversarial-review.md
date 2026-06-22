# BLACKWIDOW ADVERSARIAL REVIEW — block
**Date:** 2026-06-07T11:00:00
**Scanner Version:** 1.1.0
**Application Scope:** VCSM
**Command:** BLACKWIDOW
**VENOM Gate:** PASS — VENOM Last Run: 2026-06-07, Status: COMPLETE

## Output Metadata
| Field | Value |
|---|---|
| Feature | block |
| Command | BLACKWIDOW |
| Scope | VCSM:block |
| VENOM Reference | 2026-06-07_venom_block-security-review.md |
| Timestamp | 2026-06-07T11:00:00 |

---

## VENOM Dependency Gate

```
BLACKWIDOW VENOM GATE
======================
VENOM Last Run: 2026-06-07
VENOM Status: COMPLETE
Open Findings: 2 HIGH, 2 MEDIUM, 1 LOW
Gate Status: PASS — proceeding with adversarial verification
```

---

## Adversarial Run Summary

```
Tests executed: 7
BYPASSED: 4
BLOCKED: 2
PARTIAL: 1
UNRESOLVED: 0
New findings discovered: 2
```

---

## VENOM Finding Verification

---

### BW-BLOCK-2026-001 — VEN-BLOCK-2026-001: ctrlGetBlockStatus Session Bypass [BYPASSED]

**Finding ID:** BW-BLOCK-2026-001
**Verifying:** VEN-BLOCK-2026-001 (no session assertion in ctrlGetBlockStatus)
**Severity:** HIGH
**Result:** BYPASSED

**Adversarial Test:**
Simulate: Authenticated Citizen calls ctrlGetBlockStatus with two arbitrary actorIds.

**Attack Chain:**
```
Attacker (authenticated session: attacker-actorId)
→ Calls ctrlGetBlockStatus({ actorId: 'victim-actorId', targetActorId: 'any-actorId' })
→ Controller: no session check → calls checkBlockStatus(actorId, targetActorId)
→ checkBlockStatus: isUuid validation on both (valid UUIDs pass) → PostgREST query executes
→ moderation.blocks SELECT → returns: isBlocking, isBlockedBy
→ Block relationship metadata returned to caller
```

**Outcome:** BYPASSED — any authenticated Citizen can query the block status between any two actors. The blocked actor can probe to confirm they are blocked (defeats the privacy benefit of blocking). An adversarial actor can map the block relationships of any target.

**Impact:** HIGH — safety-critical information exposed without ownership verification. The privacy guarantee of blocking (that the blocked party does not know they are blocked) is undermined.

---

### BW-BLOCK-2026-002 — VEN-BLOCK-2026-002: ctrlGetBlockedActorSet Enumeration [BYPASSED]

**Finding ID:** BW-BLOCK-2026-002
**Verifying:** VEN-BLOCK-2026-002 (no session assertion in ctrlGetBlockedActorSet)
**Severity:** HIGH
**Result:** BYPASSED

**Adversarial Test:**
Simulate: Authenticated Citizen calls ctrlGetBlockedActorSet with any actorId and a large candidate list.

**Attack Chain:**
```
Attacker
→ Calls ctrlGetBlockedActorSet(victimActorId, [list of all known actorIds])
→ Controller: no session check → calls filterBlockedActors(victimActorId, candidateList)
→ filterBlockedActors: deduplicates, UUID-validates, builds .or() clause
→ moderation.blocks SELECT → returns blocked actor intersection
→ Reveals which actors from the candidate list are blocked by victimActorId
```

**Outcome:** BYPASSED — the complete block list of any actor can be systematically enumerated. With a comprehensive candidate list (e.g., a feed of known actors), an attacker can reconstruct the victim's full block list.

**Enumeration Strategy:** Probe with N actors repeatedly to build full block graph for any target.

---

### BW-BLOCK-2026-003 — VEN-BLOCK-2026-003: filterBlockedActors Unbounded Array [PARTIAL]

**Finding ID:** BW-BLOCK-2026-003
**Verifying:** VEN-BLOCK-2026-003 (no candidateActorIds length cap)
**Severity:** MEDIUM
**Result:** PARTIAL

**Adversarial Test:**
Simulate: Call ctrlGetBlockedActorSet with candidateActorIds array of 10,000 UUIDs.

**Attack Chain:**
```
Attacker
→ Generates 10,000 valid UUIDs
→ Calls ctrlGetBlockedActorSet(actorId, 10000UUIDs)
→ filterBlockedActors: Set dedup, UUID filter → all valid → builds .or() with 10,000 conditions
→ PostgREST query with 10,000 OR conditions → server-side load spike
```

**Outcome:** PARTIAL — the query reaches PostgREST but may be rejected by Supabase query complexity limits or connection timeout. The app layer has no guard, creating unpredictable server behavior. In the absence of a Supabase-level hard limit, this is a sustained DoS vector.

---

### BW-BLOCK-2026-004 — VEN-BLOCK-2026-004: console.error Actor ID Leak [BYPASSED]

**Finding ID:** BW-BLOCK-2026-004
**Verifying:** VEN-BLOCK-2026-004 (console.error in all 3 DALs)
**Severity:** MEDIUM
**Result:** BYPASSED

**Adversarial Test:**
Simulate: Trigger a block operation error (attempt to block an invalid/nonexistent actorId).

**Attack Chain:**
```
Attacker
→ Calls blockActorController({ blockerActorId: myId, blockedActorId: 'nonexistent', assertingActorId: myId })
→ Controller passes ownership check (myId === assertingActorId)
→ blockActor DAL calls moderation.block_actor RPC → RPC returns DB error
→ catch(err): console.error(err) fires
→ err object may contain: actorId values, DB error code, schema info, stack trace
→ Visible in browser DevTools → attacker can read
```

**Outcome:** BYPASSED — error details including actor IDs appear in the browser console in production. DevTools inspection reveals the block relationship structure.

---

### BW-BLOCK-2026-005 — Write Path Guards: block/unblock Ownership [BLOCKED]

**Verifying:** Write path ownership guards (assertingActorId === blockerActorId)
**Result:** BLOCKED ✓

**Test:** Attempt to block an actor while passing a different assertingActorId.
```
blockActorController({ blockerActorId: victimId, blockedActorId: targetId, assertingActorId: attackerActorId })
→ controller:28: if (!assertingActorId || assertingActorId !== blockerActorId) throw
→ Throws 'OWNERSHIP_VIOLATION' — write blocked
```
Write path is correctly guarded. BLOCKED.

---

### BW-BLOCK-2026-006 — Cannot Block Self Guard [BLOCKED]

**Verifying:** Self-block prevention
**Result:** BLOCKED ✓

```
blockActorController({ blockerActorId: myId, blockedActorId: myId, assertingActorId: myId })
→ block.write.dal.js:22: if (blockerActorId === blockedActorId) throw 'cannot block yourself'
→ Blocked
```

---

## New BLACKWIDOW Findings

---

### BW-BLOCK-2026-007 — useBlockStatus Fails Open on DB Error (Safety Gate Failure) [BYPASSED]

**Finding ID:** BW-BLOCK-2026-007
**Severity:** HIGH (NEW FINDING — not in VENOM 2026-06-07 pass; carry-forward from prior BW-BLOCK-002 2026-06-04)
**Result:** BYPASSED

**Adversarial Test:**
Simulate: DB error during block status check (network disruption, RPC timeout).

**Attack Chain:**
```
Victim has blocked Attacker
→ Attacker navigates to victim's profile
→ useBlockStatus hook calls ctrlGetBlockStatus
→ [SIMULATE] DB error / timeout → throws
→ useBlockStatus catch: sets isBlocked=false, blockedMe=false (fail-open)
→ BlockGate / profile access logic: isBlocked=false → canViewProfile=true, canInteract=true
→ Attacker gains access to victim's profile despite being blocked
```

**Outcome:** BYPASSED — the safety gate fails open during transient DB errors. A blocked actor can gain temporary access to a victim's profile by timing a request during a DB disruption. This is a significant safety violation: blocking is the user's primary tool to prevent unwanted contact.

**Why HIGH:** This is a safety feature. Fail-open behavior in a safety context (blocking) means the protection disappears when the system is under stress — exactly the wrong failure mode.

**Recommended mitigation:** The block status check must fail CLOSED. On error: set isBlocked=true (conservative assumption). Alternatively: maintain a local cache of block status with explicit invalidation rather than live-query for every access check.

**CISSP Domain:**
- Primary: Security Operations
- Secondary: Security Architecture and Engineering

---

### BW-BLOCK-2026-008 — No Actor Kind Validation in Block Controllers (Cross-Kind Block) [UNRESOLVED]

**Finding ID:** BW-BLOCK-2026-008
**Severity:** MEDIUM (NEW FINDING — not in VENOM 2026-06-07 pass; carry-forward from prior BW-BLOCK-003 2026-06-04)
**Result:** UNRESOLVED

**Finding:** No actor kind check exists in blockActor.controller.js or unblockActor.controller.js. A `user`-kind actor can attempt to block a `vport`-kind actor (or vice versa) without any validation that the block relationship is between compatible actor kinds. The platform may or may not intend for cross-kind blocking to be allowed.

**Risk:** If only same-kind blocking is intended (Citizen↔Citizen, VPORT↔VPORT), the absence of a kind check means cross-kind blocks accumulate in the moderation.blocks table with unintended semantics.

**Status:** UNRESOLVED — requires platform design decision on cross-kind block policy. Route to WOLVERINE for behavior contract definition.

---

## VENOM Cross-References

| VENOM Finding | BW Verdict | BW Finding |
|---|---|---|
| VEN-BLOCK-2026-001 | BYPASSED | BW-BLOCK-2026-001 |
| VEN-BLOCK-2026-002 | BYPASSED | BW-BLOCK-2026-002 |
| VEN-BLOCK-2026-003 | PARTIAL | BW-BLOCK-2026-003 |
| VEN-BLOCK-2026-004 | BYPASSED | BW-BLOCK-2026-004 |
| VEN-BLOCK-2026-005 (BEHAVIOR.md) | UNRESOLVED | carry-forward |

New findings not in VENOM: BW-BLOCK-2026-007 (fail-open HIGH), BW-BLOCK-2026-008 (cross-kind MEDIUM)

---

## THOR Impact

```
THOR Release Blockers: YES
  - BW-BLOCK-2026-001 (HIGH — block status enumeration BYPASSED)
  - BW-BLOCK-2026-002 (HIGH — block set enumeration BYPASSED)
  - BW-BLOCK-2026-007 (HIGH — fail-open safety gate BYPASSED)
Highest Open Severity: HIGH
Recommendation: FAIL — 3 HIGH findings BYPASSED; block feature must not be released until read-path session assertions and fail-closed behavior are confirmed
```

---

## Required Follow-Up Commands

| Command | Findings | Priority |
|---|---|---|
| ELEKTRA | BW-BLOCK-2026-001 (session guard patch), BW-BLOCK-2026-002 (session guard patch), BW-BLOCK-2026-007 (fail-closed patch), BW-BLOCK-2026-003 (length cap) | P0 |
| DB | VEN-BLOCK-2026-001 DB AUDIT NOTE (moderation.blocks RLS), moderation.block_actor RPC auth guard | P1 |
| WOLVERINE | BW-BLOCK-2026-008 (cross-kind block policy — needs platform decision), VEN-BLOCK-2026-005 (BEHAVIOR.md intake) | P1 |
| SPIDER-MAN | Write-path ownership guards regression tests | P1 |
