# BLACKWIDOW V2 — Adversarial Runtime Verification Report
# Feature: block | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Date | 2026-06-04 |
| Feature | block |
| App | VCSM |
| Reviewer | BLACKWIDOW V2 |
| Protocol Version | BW2.5 V2 / BW2.9 Report Format |
| Status | COMPLETE |
| Governance Status | DRAFT — all findings draft on first issuance |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Status | FRESH |
| Maps Generated | 2026-06-04T19:48:25.152Z (~7h old) |
| Scanner Version | 1.1.0 |
| Security Paths (block) | 4 |
| Total Platform Paths | 598 |
| Coverage | 0.67% |

---

## 3. Scanner Inputs

| Input | Result |
|---|---|
| security-path-map.json | 4 paths for block — ALL LOW confidence (route=null, unresolved) |
| callgraph.json | 30 nodes, 43 edges — 5 controller entries, 3 hook entries |
| write-execution-map.json | 0 resolved write paths for block |
| rpc-execution-map.json | 0 resolved RPC paths for block |

**Scanner Signal Quality:** LOW. All 4 security paths carry `"confidence": "LOW"` with evidence "write surface discovered without route-confirmed path." The scanner cannot resolve the client-side routing entry points for this feature. All paths are PRIMARY ATTACK TARGETS per Rule BW-002.

---

## 4. Attack Surface Inventory

### 4.1 Unresolved Scanner Paths (Primary Attack Targets)

| Path ID | RPC | DAL File | Confidence |
|---|---|---|---|
| block-write-1 | moderation.block_actor | block.write.dal.js | LOW |
| block-write-2 | moderation.unblock_actor | block.write.dal.js | LOW |
| block-rpc-1 | moderation.block_actor (RPC view) | block.write.dal.js | LOW |
| block-rpc-2 | moderation.unblock_actor (RPC view) | block.write.dal.js | LOW |

### 4.2 Hook Entry Points (UI-Accessible)

| Hook | File | Writes To |
|---|---|---|
| useBlockActions.block() | hooks/useBlockActions.js:44 | blockActorController |
| useBlockActions.unblock() | hooks/useBlockActions.js:65 | unblockActorController |
| useBlockActorAction() | hooks/useBlockActorAction.js:10 | blockActorController only |
| useBlockStatus() | hooks/useBlockStatus.js:27 | READ ONLY — ctrlGetBlockStatus |

### 4.3 Controller Surfaces

| Controller | Auth Guard | Session Source |
|---|---|---|
| blockActorController | YES — assertingActorId === blockerActorId (line 28) | Hook-injected from identity |
| unblockActorController | YES — assertingActorId === blockerActorId (line 50) | Hook-injected from identity |
| toggleBlockActorController | YES — assertingActorId === blockerActorId (line 72) | NOT fed from hooks — UNGUARDED ENTRY |
| ctrlGetBlockStatus | NO — read only, no session guard | N/A |
| ctrlGetBlockedActorSet | NO — read only, no session guard | N/A |
| ctrlBlockActor (settings) | YES — callerActorId === actorId (line 71) | Hook-injected |
| ctrlUnblockActor (settings) | YES — callerActorId === actorId (line 104) | Hook-injected |

### 4.4 DAL Write Surfaces

| DAL Function | RPC Called | Ownership Filter | RLS Only? |
|---|---|---|---|
| blockActor() | moderation.block_actor | No DAL-level filter | YES — relies on RPC server auth |
| unblockActor() | moderation.unblock_actor | No DAL-level filter | YES — relies on RPC server auth |
| dalInsertBlock() | moderation.block_actor | No DAL-level filter | YES — relies on RPC server auth |
| dalDeleteBlockByTarget() | moderation.unblock_actor | No DAL-level filter | YES — relies on RPC server auth |

### 4.5 Callgraph: DAL Write Backwards Trace

```
moderation.block_actor RPC
  ← blockActor() [block.write.dal.js]
    ← blockActorController() [blockActor.controller.js]
      ← useBlockActions.block() [useBlockActions.js] — GUARDED (sessionActorId injected)
      ← useBlockActorAction()  [useBlockActorAction.js] — GUARDED (sessionActorId injected)
      ← ensureBlocked() [blockGroup.helpers.js:63] — DEV ONLY — NO assertingActorId PASSED
      ← runBlockGroup() [block.group.js:64] — DEV ONLY

moderation.unblock_actor RPC
  ← unblockActor() [block.write.dal.js]
    ← unblockActorController() [blockActor.controller.js]
      ← useBlockActions.unblock() [useBlockActions.js] — GUARDED (sessionActorId injected)
      ← ensureUnblocked() [blockGroup.helpers.js:56] — DEV ONLY — NO assertingActorId PASSED
    ← toggleBlockActorController() [blockActor.controller.js:79]
      ← runBlockGroup() [block.group.js:132] — DEV ONLY — NO assertingActorId PASSED
```

---

## 5. Scanner Signals

| Signal | Value |
|---|---|
| Route-resolved paths | 0 of 4 |
| Unresolved LOW-confidence paths | 4 of 4 |
| Controller nodes | 5 |
| Hook nodes | 3 |
| Adapter nodes | 2 |
| DAL write nodes | 2 (blockActor, unblockActor) |
| Barrel re-exports of controllers | 5 (index.js exports controllers directly — VEN-BLOCK-002) |
| Missing RPC SQL verification | unblock_actor (VEN-BLOCK-003) |

---

## 6. Adversarial Path Analysis

---

### A. OWNERSHIP BYPASS (§5.1)

**Attack:** Actor B submits blockActorController(actorA_id, actorC_id, actorB_id) — supplying a different actor as the blocker while asserting session ownership as themselves.

**Source Trace:**
- blockActorController.js:28: `if (!assertingActorId || assertingActorId !== blockerActorId)` — throws if mismatch.
- The check compares the third parameter (assertingActorId) to the first parameter (blockerActorId).
- In useBlockActions.js:51, `sessionActorId` is sourced from `identity?.actorId` (trusted identity store), passed as assertingActorId.
- In useBlockActorAction.js:18, same pattern — sessionActorId injected from identity.

**Attack Vector:** If a client manually calls `blockActorController(victimActorId, targetActorId, victimActorId)` — they would need to set both blockerActorId AND assertingActorId to victimActorId. The controller gate only checks that they match each other, not that either equals the session user. The session binding only exists at the hook layer.

**Critical Observation:** The controller's assertingActorId check is a HOOK-LAYER-ENFORCED gate, not a session-layer gate. Any caller that can supply matching (blockerActorId == assertingActorId) of an arbitrary actor bypasses this. The RPC server auth (`is_current_vc_actor`) is the last line of defense — and VEN-BLOCK-003 documents that this guard has NOT been verified to exist.

**Result:** PARTIAL — Hook layer enforces session binding; controller layer has no independent session verification. Trust depends entirely on unverified RPC-level auth guard.

---

### B. SESSION MUTATION (§5.2)

**Attack:** Pass null or undefined as assertingActorId (stale/logged-out session).

**Source Trace:**
- blockActorController.js:28: `if (!assertingActorId || assertingActorId !== blockerActorId)` — null assertingActorId triggers the `!assertingActorId` branch and throws.
- unblockActorController.js:50: Same guard.
- toggleBlockActorController.js:72: Same guard.

**Attack: stale identity where identity?.actorId is null but operation is attempted.**
- useBlockActions.js:39: `const sessionActorId = identity?.actorId ?? null` — if session is stale, sessionActorId = null.
- useBlockActions.js:44-47: `if (!myActorId || !targetActorId) return;` — but does NOT check sessionActorId before calling controller.
- Controller will throw at line 28 due to null assertingActorId check.

**Result:** BLOCKED — null assertingActorId is caught by controller guard. However, the hook silently exits for null myActorId/targetActorId without error, which could produce unexpected UX states.

---

### C. RUNTIME ABUSE (§5.3)

**Attack:** Non-owner actor kind (e.g., a vport actor) attempts to block as if it were a user actor, or vice versa.

**Source Trace:**
- No actor kind check exists in blockActorController, unblockActorController, or toggleBlockActorController.
- No kind check in block.write.dal.js.
- No kind check in ctrlBlockActor or ctrlUnblockActor in settings/privacy.
- The moderation.block_actor RPC receives p_blocker_actor_id without kind validation client-side.

**Finding:** Both user-kind and vport-kind actors can be passed as blockerActorId. There is no runtime check that prevents a vport actor from blocking as if it were a user. Whether the RPC enforces kind-level restrictions is unknown (VEN-BLOCK-003 is relevant here — the RPC auth is unverified).

**Result:** UNRESOLVED — No client-side actor kind gate exists. Entirely dependent on unverified RPC-level behavior.

---

### D. RLS VERIFICATION (§5.4)

**Attack:** Direct DAL call to blockActor() / unblockActor() with arbitrary IDs, bypassing controllers.

**Source Trace:**
- block.write.dal.js:17: blockActor(blockerActorId, blockedActorId) — calls supabase RPC with no ownership filter.
- block.write.dal.js:43: unblockActor(blockerActorId, blockedActorId) — same.
- VEN-BLOCK-003: `unblock_actor` RPC auth guard (is_current_vc_actor) NOT verified — no SQL definition found in migrations.
- settings/privacy/dal/blocks.dal.js:35: dalInsertBlock — also goes through block_actor RPC, same trust gap.

**The `moderation.block_actor` RPC presumably uses `is_current_vc_actor` to verify the caller owns the blocker actor. However:**
1. VEN-BLOCK-003 documents unblock_actor's guard is unverified.
2. It is unclear whether block_actor has the same guard verified.
3. No migration SQL was found to confirm either guard exists.

**Result:** UNRESOLVED — Both RPCs pass blockerActorId as an argument that could be arbitrary. Without confirmed server-side ownership enforcement, this is a potential privilege escalation path. Cannot be confirmed BLOCKED without RPC SQL definition.

---

### E. VIEWER CONTEXT FUZZING (§5.5)

**Attack E1:** Pass null viewerActorId / actorId to ctrlGetBlockStatus.

**Source Trace:**
- getBlockStatus.controller.js:4: `if (!actorId || !targetActorId || actorId === targetActorId)` — returns safe default `{isBlocked: false, blockedMe: false}`.
- Result: BLOCKED — null actorId returns safe default, no DB call.

**Attack E2:** Pass null actorId to ctrlGetBlockedActorSet.

**Source Trace:**
- getBlockedActorSet.controller.js:3: passes actorId directly to filterBlockedActors.
- block.read.dal.js:18: `if (!actorId || !isUuid(actorId) || ...) return new Set()` — null actorId returns empty Set.
- Result: BLOCKED — null returns empty Set (safe, not fail-open to inclusion).

**Attack E3:** Pass null assertingActorId to blockActorController.

**Source Trace:**
- blockActorController.js:28: `if (!assertingActorId || ...)` throws.
- Result: BLOCKED.

**Attack E4 — useBlockStatus fail-open (VEN-BLOCK-006):**
- useBlockStatus.js:56-60: On error, sets `isBlocked=false, blockedMe=false` — fails OPEN.
- canViewProfile and canInteract are derived as true when isBlocked=false AND blockedMe=false.
- An attacker who can force a checkBlockStatus DB error (e.g., rate-limit or network injection) against a viewer who IS blocked could cause the block gate to open.
- Result: BYPASSED (soft) — in adversarial network conditions, the block status check failing returns false = unblocked, which could expose content to a blocked user or allow interaction with an actor who blocked them.

---

### F. MUTATION REPLAY (§5.6)

**Attack:** Re-trigger blockActorController after actor is already blocked.

**Source Trace:**
- blockActorController.js:32-36: `const { blockedByMe } = await checkBlockStatus(...)` — if already blocked, skips the DAL call and returns `{ blocked: true }`.
- The RPC itself is documented as idempotent (block.write.dal.js:18: "re-blocking an already-blocked actor reactivates the row").
- unblockActorController.js:55-57: `if (!blockedByMe) return { blocked: false }` — idempotent on non-existent block.

**Result:** BLOCKED — Both block and unblock are idempotent at the controller layer with pre-flight status checks.

**Attack: Re-trigger unblockActorController against an already-released block (replay).**
- unblockActorController checks blockedByMe first. If status is already 'released', the SELECT for active blocks returns nothing, so blockedByMe=false, and the controller returns early without calling unblockActorDAL.
- However: checkBlockStatus.js queries `.eq("status", "active")` — so released blocks are filtered. An attacker cannot replay an unblock to re-trigger the RPC.
- Result: BLOCKED.

---

### G. HYDRATION POISONING (§5.7)

**Attack:** Poison hydration store with stale actor summary that bypasses block visibility.

**Source Trace:**
- BlockConfirmModal.jsx calls useActorSummary (engines/hydration) for display.
- BlockedState.jsx also calls useActorSummary for display.
- Neither uses hydration data for the BLOCK DECISION itself — the block decision is controlled by useBlockStatus → ctrlGetBlockStatus → checkBlockStatus (moderation.blocks table).
- Hydration is used only for display (avatar, name) in modal/state components, not for access control.

**Result:** BLOCKED — Hydration data is display-only; block enforcement uses a separate fresh DB read.

---

### H. URL SURFACE (§5.9)

**Attack:** Block-related notification links or share links expose raw UUIDs.

**Source Trace:**
- No notification construction was found in any block controller or DAL file.
- The block feature does not emit notifications directly — notifications are a side effect of the RPC server-side.
- blockFilter.js (notifications/inbox) is a read-side filter only, no URL construction.
- No linkPath or shareUrl construction found in any block source file.

**Result:** INFO — No URL construction in block feature source. Server-side RPC notifications are out of scope for client audit. No raw UUID URL surface identified in client code.

---

### I. §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**BEHAVIOR.md Status: PLACEHOLDER — all §9 invariants are UNANCHORED.**

Since no §9 Must Never Happen invariants are defined, adversarial invariant attacks are derived from inferred domain invariants:

**Inferred Invariant I-1: An actor must never be able to block themselves.**
- Attack: Call blockActorController(actorA, actorA, actorA).
- blockActorController.js:25: `if (blockerActorId === blockedActorId) throw new Error(...)` — throws.
- blockActor() DAL line 22: same self-block guard.
- useBlockActorAction.js:13: `if (blockerActorId === blockedActorId) throw new Error(...)`.
- Result: BLOCKED at hook, controller, and DAL layers.

**Inferred Invariant I-2: An actor must never be able to block on behalf of another actor (ownership guarantee).**
- Attack: useBlockActions called with myActorId=actorA but sessionActorId=actorB (mismatched).
- useBlockActions.js:51: passes sessionActorId (from identity, trusted) as assertingActorId.
- Controller checks assertingActorId === blockerActorId — if session is actorB and blockerActorId is actorA, throws.
- Result: BLOCKED at controller layer IF session is properly managed. Depends on identity store integrity.

**Inferred Invariant I-3: A released block must not re-apply its side effects on replay.**
- Attack: Call blockActorController on already-released actor.
- The RPC documentation says it "reactivates the row" for re-blocking — this is intentional (block → unblock → re-block is valid).
- Result: INFO — By design: re-blocking is allowed and reactivates the block row. Side effects (follow deactivation) will re-apply on re-block. This is expected behavior per controller comment.

**Inferred Invariant I-4: Block status must fail CLOSED (blocked user must not gain access on error).**
- Attack: Force an error in checkBlockStatus to make blocked users appear unblocked.
- useBlockStatus.js:57-60: On error, sets isBlocked=false, blockedMe=false — FAILS OPEN.
- canViewProfile=true and canInteract=true on error.
- Result: BYPASSED — See BW-BLOCK-002.

**Inferred Invariant I-5: The diagnostics helper ensureBlocked must not call blockActorController without an assertingActorId.**
- blockGroup.helpers.js:63: `await blockActorController(actorId, targetActorId)` — no third argument.
- assertingActorId will be `undefined` — controller line 28: `if (!assertingActorId || ...)` throws.
- This means the diagnostics block test (block_write, read_graph, side effects) will always FAIL at the controller gate.
- Result: BYPASSED (dev-path) — diagnostics helper ensureBlocked/ensureUnblocked are broken due to missing assertingActorId. This is a DEV-ONLY path but represents a contract violation and would mask real test failures.

---

## 7. Exploitability Assessment

| Finding ID | Severity | Attack Category | Exploitability |
|---|---|---|---|
| BW-BLOCK-001 | HIGH | §5.1 Ownership Bypass | Controller assertingActorId is not session-bound at controller layer — relies on unverified RPC guard |
| BW-BLOCK-002 | HIGH | §5.5 / §9 Invariant I-4 | useBlockStatus fails open on error — blocked user can access content during transient DB errors |
| BW-BLOCK-003 | HIGH | §5.3 Runtime Abuse | No actor kind check client-side — vport/user kind mixing unvalidated |
| BW-BLOCK-004 | MEDIUM | Dev Path Integrity | diagnostics ensureBlocked/ensureUnblocked pass no assertingActorId — always throws, masking test coverage |
| BW-BLOCK-005 | MEDIUM | §5.4 RLS Verification | moderation.block_actor and unblock_actor RPC server-side ownership guard unverified |
| BW-BLOCK-006 | LOW | §5.2 Session Mutation | Hook does not validate sessionActorId before invoking controller — relies on controller throw |
| BW-BLOCK-007 | INFO | §5.9 URL Surface | No client-side URL construction in block feature — clean |

---

## 8. Source Verification Summary

| Finding ID | Source Cited | File | Line(s) |
|---|---|---|---|
| BW-BLOCK-001 | SOURCE_VERIFIED | blockActor.controller.js | 28, 50, 72 |
| BW-BLOCK-002 | SOURCE_VERIFIED | hooks/useBlockStatus.js | 56-60, 77-78 |
| BW-BLOCK-003 | SOURCE_VERIFIED | blockActor.controller.js | 21-85 (absence) |
| BW-BLOCK-004 | SOURCE_VERIFIED | blockGroup.helpers.js | 56-64 |
| BW-BLOCK-005 | SCANNER_LEAD | block.write.dal.js + VEN-BLOCK-003 | 25-37, 43-59 |
| BW-BLOCK-006 | SOURCE_VERIFIED | hooks/useBlockActions.js | 39, 44-47 |
| BW-BLOCK-007 | SOURCE_VERIFIED | (absence in all block source files) | N/A |

---

## 9. Confidence Summary

| Confidence Level | Count | Notes |
|---|---|---|
| SOURCE_VERIFIED | 5 | BW-BLOCK-001 through 004, 006, 007 — source read + lines cited |
| SCANNER_LEAD | 1 | BW-BLOCK-005 — scanner path + prior VENOM finding cross-reference |
| SCANNER_LOW_CONF | 0 | N/A |

**BYPASSED findings with SOURCE_VERIFIED:**
- BW-BLOCK-002: useBlockStatus.js:56-60 — fail-open confirmed in source.
- BW-BLOCK-004: blockGroup.helpers.js:56-64 — missing assertingActorId argument confirmed.

---

## 10. §9 Invariant Attack Map

| Invariant | Source | Attack Designed | Result |
|---|---|---|---|
| I-1: No self-block | Inferred (no BEHAVIOR.md) | blockActorController(A, A, A) | BLOCKED — line 25 |
| I-2: No block-on-behalf | Inferred | Mismatched session/blocker IDs | BLOCKED (hook layer only) — PARTIAL |
| I-3: Released block replay | Inferred | Re-call controller after release | BLOCKED — idempotent |
| I-4: Fail closed on error | Inferred | Force DB error during status check | BYPASSED — useBlockStatus.js:57-60 |
| I-5: Diagnostics test integrity | Inferred | ensureBlocked missing assertingActorId | BYPASSED — blockGroup.helpers.js:63 |

**UNANCHORED:** All invariants are inferred. BEHAVIOR.md is a PLACEHOLDER. §9 Must Never Happen section has never been authored. This means:
- No canonical invariant list exists for governance tracking.
- BW findings I-1 through I-5 are based on domain reasoning, not contracted specification.

---

## 11. Behavior Contract Attack Summary

| Contract Element | Status | BW Impact |
|---|---|---|
| BEHAVIOR.md | PLACEHOLDER | ALL §9 invariants UNANCHORED — no contractual invariant base |
| §4 Failure Paths | NOT AUTHORED | Attack surface derived from source inspection only |
| §5 Security Rules | NOT AUTHORED | No rule baseline — all findings are inferred |
| §9 Must Never Happen | NOT AUTHORED | Invariant attacks are adversarial inference, not contract verification |

**Cross-reference with VEN-BLOCK-001:** VEN-BLOCK-001 (HIGH) flags the missing BEHAVIOR.md as a THOR blocker. BW confirms this — without a BEHAVIOR.md, adversarial invariant testing has no canonical anchor and every finding is DRAFT-only.

---

## 12. THOR Impact

### THOR Release Blockers (OPEN findings that block release)

| Finding ID | Severity | Reason |
|---|---|---|
| BW-BLOCK-001 | HIGH | Controller ownership check has no independent session binding — relies on unverified RPC auth; potential privilege escalation if RPC guard is absent |
| BW-BLOCK-002 | HIGH | Block status fails open on error — blocked actors can access protected content during DB errors; critical safety control must fail closed |
| BW-BLOCK-003 | HIGH | No actor kind validation client-side — cross-kind block operations unvalidated |
| VEN-BLOCK-001 (pre-existing) | HIGH | BEHAVIOR.md missing — blocks all §9 invariant anchoring |
| VEN-BLOCK-003 (pre-existing) | HIGH | unblock_actor RPC auth guard unverified |

### Non-blocking findings

| Finding ID | Severity | Notes |
|---|---|---|
| BW-BLOCK-004 | MEDIUM | Dev-only diagnostics path — does not affect production |
| BW-BLOCK-005 | MEDIUM | Tracks unverified RPC guard — overlaps with VEN-BLOCK-003 |
| BW-BLOCK-006 | LOW | Silent exit in hook — produces bad UX but not a security bypass |
| BW-BLOCK-007 | INFO | Clean — no URL surface |

---

## 13. SPIDER-MAN Test Requirements

The following tests are required to gain THOR eligibility for this feature:

| Test ID | Test Description | Target Finding |
|---|---|---|
| SM-BLOCK-001 | blockActorController: verify that passing assertingActorId != blockerActorId throws even when both are valid UUIDs | BW-BLOCK-001 |
| SM-BLOCK-002 | blockActorController: verify null assertingActorId throws | BW-BLOCK-001 |
| SM-BLOCK-003 | useBlockStatus: simulate ctrlGetBlockStatus rejection — assert isBlocked remains false but ALSO assert canViewProfile/canInteract return FALSE (fail-closed behavior) | BW-BLOCK-002 |
| SM-BLOCK-004 | useBlockStatus: confirm canViewProfile=false when error occurs and prior block state is unknown | BW-BLOCK-002 |
| SM-BLOCK-005 | blockActorController: pass vport actorId as blockerActorId — document whether RPC accepts or rejects | BW-BLOCK-003 |
| SM-BLOCK-006 | ensureBlocked helper: fix missing assertingActorId and verify test now passes through controller correctly | BW-BLOCK-004 |
| SM-BLOCK-007 | Integration: full block → read status → unblock → read status cycle via controller layer (not diagnostics helper) with valid assertingActorId | BW-BLOCK-001, BW-BLOCK-004 |
| SM-BLOCK-008 | BEHAVIOR.md: author §9 Must Never Happen — minimum invariants I-1 through I-5 from this report | VEN-BLOCK-001 |

---

*Report written by BLACKWIDOW V2 — 2026-06-04*
*All findings are DRAFT governance status on first issuance.*
*No production source code was modified during this review.*
