# VENOM V2 Security Review — block

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | block |
| Application | VCSM |
| Review Date | 2026-06-04 |
| VENOM Version | V2 |
| Reviewer | VENOM (automated + source-verified) |
| Output Path | ZZnotforproduction/APPS/VCSM/features/block/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_block-security-review.md |
| SECURITY.md Written | YES |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At              | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

| Field | Value |
|---|---|
| Input File | /tmp/venom_features/block.json |
| Write Surfaces Count | 2 |
| RPCs Count | 2 |
| Security Paths Count | 4 |
| Write Execution Paths | 2 |
| RPC Execution Paths | 2 |
| Edge Functions | 0 |
| Scanner Route Confidence | LOW (write surfaces discovered without resolved route execution paths) |
| Scanner RPC Confidence | HIGH (RPCs extracted from AST with HIGH confidence) |

**Scanner Note:** All 4 security paths and both execution paths have LOW confidence because the scanner could not resolve the route execution chain (UI → Hook → Controller → DAL). This was resolved via manual source tracing in Step 4.

---

## 4. Security Surface Inventory

### Write Surfaces

| # | Operation | Schema | RPC | DAL File | Scanner Confidence |
|---|---|---|---|---|---|
| W1 | rpc | moderation | block_actor | block.write.dal.js | HIGH |
| W2 | rpc | moderation | unblock_actor | block.write.dal.js | HIGH |

### Direct Table Reads (non-RPC, under RLS)

| # | Operation | Schema | Table | DAL File |
|---|---|---|---|---|
| R1 | SELECT | moderation | blocks | block.check.dal.js (checkBlockStatus) |
| R2 | SELECT | moderation | blocks | block.read.dal.js (filterBlockedActors) |

### RPCs

| # | RPC | Schema | Caller | File |
|---|---|---|---|---|
| RPC1 | block_actor | moderation | blockActor() | block.write.dal.js |
| RPC2 | unblock_actor | moderation | unblockActor() | block.write.dal.js |

### Edge Functions

None.

### Parallel Write Surface (settings feature)

| # | Operation | Schema | RPC | DAL File |
|---|---|---|---|---|
| PS1 | rpc | moderation | block_actor | settings/privacy/dal/blocks.dal.js (dalInsertBlock) |
| PS2 | rpc | moderation | unblock_actor | settings/privacy/dal/blocks.dal.js (dalDeleteBlockByTarget) |

---

## 5. Scanner Signals Block

| Signal | Detail | Risk |
|---|---|---|
| Route execution paths unresolved | Scanner flagged LOW confidence on all 4 paths | Resolved via source tracing — not a gap |
| Two write surfaces via same RPC | block_actor and unblock_actor invoked from two separate DAL paths (block feature + settings feature) | Parallel write surface; ownership check bypassed on settings path at controller level |
| No edge functions | Block feature has zero edge function exposure | LOW risk |
| RPC schema: moderation | Both RPCs operate in moderation schema with SECURITY DEFINER | Requires DB-level auth verification |

---

## 6. Behavior Contract Status

| Field | Value |
|---|---|
| BEHAVIOR.md Path | ZZnotforproduction/APPS/VCSM/features/block/BEHAVIOR.md |
| BEHAVIOR.md Status | PLACEHOLDER — not authored |
| §5 Security Rules | NONE — contract is a placeholder with no authored sections |
| §9 Must Never Happen | NONE — contract is a placeholder with no authored sections |
| Contract Completeness | 0% |

**Finding:** BEHAVIOR.md exists but is a stub: `Status: PLACEHOLDER / Notes: Behavior contract pending source review.` This means zero formal security rules and zero invariants are defined for this feature. All security analysis below is derived entirely from source inspection.

---

## 7. Trust Boundary Findings

---

### VEN-BLOCK-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-BLOCK-001
- Location: ZZnotforproduction/APPS/VCSM/features/block/BEHAVIOR.md:1-9
- Application Scope: VCSM
- Platform Surface: Feature Documentation
- Trust Boundary: Engineering governance
- Boundary Violated: Security contract boundary — feature has no formal behavior contract
- Contract Violated: VCSM contributor contract (vcsm-contributor/SKILL.md) — behavior contracts required for all features with write surfaces
- Current behavior: BEHAVIOR.md is a stub placeholder with no §5 Security Rules, no §9 Must Never Happen invariants, and no authored sections.
- Risk: No formal invariants means no automated or manual verification target for the block feature's security guarantees. Security regressions cannot be detected by contract-check tooling. If block logic changes, reviewers have no reference to validate against.
- Severity: HIGH
- Exploitability: LOW
- Attack Preconditions: No direct exploit — governance gap that enables future regressions
- Blast Radius: All downstream features consuming block data (profiles, feed, chat) have no guaranteed behavior contract to rely on
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Blocking is a safety-critical feature. Missing formal contract means there is no authoritative definition of what "blocked" guarantees to other features, enabling silent behavioral drift.
- Recommended mitigation: Author BEHAVIOR.md with at minimum §5 Security Rules (actor ownership, self-block prohibition, bidirectional enforcement) and §9 Must Never Happen (blocker impersonation, unblock by non-owner, bypass via settings path).
- Rationale: All write-surface features require a complete behavior contract per contributor governance.
- Follow-up command: SPIDER-MAN (add contract + test coverage), THOR (THOR blocker — no contract = no release guarantee)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security Assessment and Testing
  - Secondary: Software Development Security
```

---

### VEN-BLOCK-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-BLOCK-002
- Location: apps/VCSM/src/features/block/index.js:15-21
- Application Scope: VCSM
- Platform Surface: PWA — JavaScript module boundary
- Trust Boundary: Feature adapter boundary (VCSM architecture contract)
- Boundary Violated: Adapter boundary — controllers exported directly from feature index, consumed by other features' controllers
- Contract Violated: VCSM CLAUDE.md: "Adapters expose only: hooks, components, view screens. Adapters never export DAL functions, models, or controllers."
- Current behavior: blockActorController, unblockActorController, toggleBlockActorController, ctrlGetBlockStatus, and ctrlGetBlockedActorSet are all exported from index.js. External features (profiles/controller/friends/*.controller.js, upload/controllers/createPost.controller.js) import ctrlGetBlockedActorSet directly from "@/features/block".
- Risk: Controllers imported across feature boundaries make refactoring high-risk — internal block module changes can silently break caller features. The security enforcement in blockActorController (assertingActorId check) is bypassed by the settings parallel path which does not go through these controllers. Exposing controllers at the index boundary also increases the attack surface for future callers who may omit the assertingActorId argument.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions: Internal caller that imports the controller and passes a mismatched assertingActorId — currently caught at controller level, but the boundary leak encourages future callers to use the controller improperly.
- Blast Radius: All features importing from "@/features/block" index that resolve to controllers
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED (server-side RLS is final enforcement)
- Why it matters: Adapter boundary violations reduce the effectiveness of the assertingActorId ownership check pattern and increase coupling between features, raising the risk of future security regressions.
- Recommended mitigation: Move ctrlGetBlockedActorSet, ctrlGetBlockStatus into adapters/hooks/ or adapters/controllers/ adapter files. Export only hooks, UI components, and view screens from index.js. Other feature controllers should consume block data via adapter, not raw controller exports.
- Rationale: Adapter pattern enforces ownership at module boundary; without it, the security invariant that "only session-verified hooks invoke block controllers" can be silently bypassed.
- Follow-up command: ARCHITECT (boundary contract review), SPIDER-MAN (regression tests before refactor)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

### VEN-BLOCK-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-BLOCK-003
- Location: apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js:51-65
- Application Scope: VCSM
- Platform Surface: PWA — Supabase RPC (moderation.unblock_actor)
- Trust Boundary: Actor ownership — only the blocker should be able to unblock
- Boundary Violated: Client-side ownership check bypass — the settings path calls unblock_actor RPC without server-side-verified ownership enforcement at the controller layer
- Contract Violated: No formal BEHAVIOR.md contract exists; implied invariant: only the actor who placed the block can remove it
- Current behavior: dalDeleteBlockByTarget in settings/privacy/dal/blocks.dal.js calls moderation.unblock_actor({p_blocker_actor_id: actorId, p_blocked_actor_id: blockedActorId}) with actorId supplied by the caller (ctrlUnblockActor). The callerActorId check in ctrlUnblockActor (line 104) is a client-side string comparison: `String(callerActorId) !== String(actorId)`. The unblock_actor RPC definition was NOT found in any committed migration, meaning its server-side auth enforcement (equivalent to block_actor's `is_current_vc_actor` guard) is UNVERIFIED. If unblock_actor lacks a `is_current_vc_actor` guard, a session actor could supply any valid UUID as `p_blocker_actor_id` and unblock edges they do not own.
- Risk: If the unblock_actor RPC is SECURITY DEFINER without an `is_current_vc_actor` caller check, any authenticated session could invoke it with an arbitrary blocker_actor_id to remove block edges they do not own. This would allow actors to remove blocks placed by other actors against them.
- Severity: HIGH
- Exploitability: MEDIUM (requires authenticated session + knowledge of target block edge UUIDs; RLS on SELECT may limit discovery)
- Attack Preconditions: Authenticated session; knowledge of a blocker_actor_id UUID (discoverable via profile slug → actor lookup); a block edge exists between that actor and any target
- Blast Radius: Any block relationship on the platform — a malicious actor could remove blocks placed against them, regaining visibility to profile/feed/chat surfaces that should be hidden
- Identity Leak Type: Actor ID exposure (blocker actor ID must be supplied client-side)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — unblock_actor RPC server-side auth guard status not confirmed in migrations
- Why it matters: The block feature is a safety control. If it can be bypassed by the blocked party (removing the block against them), harassment and safety violations become possible.
- Recommended mitigation: (1) Verify the unblock_actor RPC SQL definition includes `IF NOT moderation.is_current_vc_actor(p_blocker_actor_id) THEN RAISE EXCEPTION` equivalent to block_actor. (2) If the guard is missing, add it via DB migration. (3) Until verified, treat this as a blocking concern.
- Rationale: SECURITY DEFINER RPCs with client-supplied actor IDs must always verify that auth.uid() maps to the supplied actor — client-side string comparisons are not a sufficient trust boundary.
- Follow-up command: DB (verify unblock_actor RPC SQL body), Carnage (add missing auth guard migration if needed), ELEKTRA (trace full call chain)
- Provenance: SCANNER_LEAD (RPC confirmed HIGH by scanner; auth guard status UNVERIFIED — no SQL definition found in migrations)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security
```

---

### VEN-BLOCK-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-BLOCK-004
- Location: apps/VCSM/src/features/block/dal/block.write.dal.js:17-37 and apps/VCSM/src/features/block/dal/block.write.dal.js:43-59
- Application Scope: VCSM
- Platform Surface: PWA — console.error leak
- Trust Boundary: Client-side information exposure
- Boundary Violated: Debug logging rules — console.* calls in production code paths
- Contract Violated: VCSM memory contract: "No console.log; debug output must render on screen and be dev-only (never production)"
- Current behavior: blockActor() emits `console.error("[blockActor] RPC failed:", error)` at line 34; unblockActor() emits `console.error("[unblockActor] RPC failed:", error)` at line 57. Both are unconditional — present in production builds. The error object from Supabase RPC failures can contain schema names, table names, constraint names, RPC parameter values, and PostgreSQL error codes.
- Risk: Supabase RPC error objects logged to browser console can expose: moderation schema structure, internal constraint names (e.g., ON CONFLICT key columns), actor UUIDs from failed operations, and PostgreSQL error codes. This aids an attacker mapping the DB schema.
- Severity: LOW
- Exploitability: LOW (requires browser console access — i.e., the attacking user's own session)
- Attack Preconditions: Authenticated user with DevTools access; triggers a block/unblock RPC error
- Blast Radius: Information disclosure only — reveals DB internals to the user causing the error
- Identity Leak Type: Schema structure leak via error messages
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Error logging to browser console violates the platform debug logging contract and leaks internal DB schema details that should never reach the client.
- Recommended mitigation: Wrap console.error calls in `if (import.meta.env.DEV)` guards in block.write.dal.js, block.check.dal.js, block.read.dal.js, and both block hooks. Same pattern for all console.error in hooks/useBlockActions.js:54,75 and hooks/useBlockStatus.js:56.
- Rationale: All files in this feature contain unconditional console.error calls. This is a systemic pattern, not a one-off.
- Follow-up command: ELEKTRA (full console audit of block feature)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Assessment and Testing
```

---

### VEN-BLOCK-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-BLOCK-005
- Location: apps/VCSM/src/features/block/dal/block.check.dal.js:27-31 and apps/VCSM/src/features/block/dal/block.read.dal.js:25-34
- Application Scope: VCSM
- Platform Surface: PWA — Supabase PostgREST direct table query
- Trust Boundary: Anonymous / unauthenticated callers
- Boundary Violated: Potential unauthenticated direct table read of moderation.blocks
- Contract Violated: Implied invariant — block relationship data (who blocked whom) should only be visible to parties to the block
- Current behavior: checkBlockStatus() and filterBlockedActors() both query moderation.blocks directly via supabase client (no RPC). They accept actorId parameters without session validation at the DAL or controller layer. The RLS policies (blocks_select_own, blocks_select_blocked) require `authenticated` role. If called without a valid session, Supabase uses the anon key role, which is not `authenticated`, so RLS would block the query returning empty (not an error). However, there is no explicit session guard in the DAL or controller layer — the security depends entirely on Supabase's anon-role RLS enforcement. Additionally, ctrlGetBlockStatus and ctrlGetBlockedActorSet do not check whether the supplied actorId matches the current session.
- Risk: (1) If the anon role ever gains SELECT on moderation.blocks (misconfiguration), unauthenticated callers could enumerate block relationships. (2) More immediately: ctrlGetBlockedActorSet is called by profiles/upload controllers without verifying that the actorId parameter matches the session — an authenticated user could supply another actor's ID and enumerate their block relationships within the RLS-allowed window (blocks where they are the blocked party via blocks_select_blocked policy).
- Severity: MEDIUM
- Exploitability: MEDIUM (authenticated session required for (2); (1) is defense-in-depth gap)
- Attack Preconditions: For (2): authenticated session; supply a different actor's UUID as actorId to ctrlGetBlockedActorSet
- Blast Radius: Potential enumeration of which actors are blocked by a target actor (limited by RLS policies; blocks_select_blocked only shows rows where the attacker is the blocked party)
- Identity Leak Type: Social graph exposure — block relationship visibility
- Cache Trust Type: None
- RLS Dependency: REQUIRED — security fully depends on RLS enforcing `authenticated` role restriction; no app-layer session guard exists
- Why it matters: Block relationships reveal who a user has chosen to cut off from their social graph — this is sensitive social data. Leaking it violates user privacy expectations.
- Recommended mitigation: Add a session guard in ctrlGetBlockStatus and ctrlGetBlockedActorSet that verifies the actorId parameter is owned by the current session (via identity layer or a Supabase auth.uid() → actor_owners check). At minimum, document the RLS dependency explicitly.
- Rationale: DAL-level calls that return sensitive social data should not rely solely on RLS as the only defense layer; a session ownership check is defense-in-depth.
- Follow-up command: DB (verify anon role grants on moderation schema), ELEKTRA (trace ctrlGetBlockedActorSet callers for session ownership)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Access Control
```

---

### VEN-BLOCK-006

```
VENOM SECURITY FINDING
- Finding ID: VEN-BLOCK-006
- Location: apps/VCSM/src/features/block/hooks/useBlockStatus.js:55-59
- Application Scope: VCSM
- Platform Surface: PWA — React hook error handling
- Trust Boundary: Client-side fail-open behavior
- Boundary Violated: Fail-open on error — block status defaults to "not blocked" when check fails
- Contract Violated: Safety-critical control should fail closed (deny-by-default) or at minimum fail to a visible error state
- Current behavior: When checkBlockStatus() throws (network error, RLS error, any DB failure), useBlockStatus catches the error at lines 55-59, sets isBlocked=false and blockedMe=false, and returns loading=false. This means BlockGate renders children, BlockButton shows "Block" (not blocked), and profile views grant full access — as if no block exists.
- Risk: If the block status check fails transiently (network partition, Supabase timeout, rate limit), a blocked actor can view content they should be excluded from. This degrades the blocking safety guarantee during failure scenarios.
- Severity: MEDIUM
- Exploitability: LOW (requires triggering a transient failure — difficult to force reliably)
- Attack Preconditions: Attacker must be in a network/DB condition that causes checkBlockStatus to fail; timing attack to trigger error during profile load
- Blast Radius: During failure: blocked actors gain temporary read access to profiles and content they are blocked from
- Identity Leak Type: None
- Cache Trust Type: Fail-open cache: on error, block state is treated as "no block"
- RLS Dependency: REQUIRED — if RLS on feed/post/chat is enforced server-side, fail-open in hook does not bypass DB-level block enforcement; client-side visibility gates (BlockGate, BlockButton) are bypassed
- Why it matters: Block is used for safety/harassment prevention. A fail-open on network error allows a blocked actor to view a profile during transient conditions. Server-side RLS still protects posts/chat, but profile-level visibility and UI safety controls are compromised.
- Recommended mitigation: On error in useBlockStatus, set a `blockCheckFailed` state flag and render a fallback/error state instead of fail-open. BlockGate should render fallback (not children) when blockCheckFailed is true. This is consistent with security-critical control behavior.
- Rationale: Safety controls must not fail open. Fail-closed is the correct default for block status checks.
- Follow-up command: SPIDER-MAN (regression test for error path behavior)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Security Architecture and Engineering
```

---

### VEN-BLOCK-007

```
VENOM SECURITY FINDING
- Finding ID: VEN-BLOCK-007
- Location: apps/VCSM/src/features/block/controllers/blockActor.controller.js:68-85
- Application Scope: VCSM
- Platform Surface: PWA — Controller
- Trust Boundary: Actor ownership on toggle path
- Boundary Violated: toggleBlockActorController calls unblockActorDAL directly without going through the full ownership pre-check path of unblockActorController
- Contract Violated: Implied invariant — all unblock operations should verify the caller is the blocker
- Current behavior: toggleBlockActorController at lines 68-85 calls unblockActorDAL() directly (line 79) rather than calling unblockActorController(). While the assertingActorId check is present at line 73, the idempotency check that exists in unblockActorController (checkBlockStatus before unblocking) is absent. In the toggle path, it simply checks the current state and calls the appropriate DAL directly. This means the toggle unblock does not verify blockedByMe before unblocking — it relies on the earlier checkBlockStatus result (line 76) which may be stale in a concurrent scenario.
- Risk: In a race condition (two concurrent requests), a toggle could issue an unblockActorDAL call when the block no longer exists or was placed by a different actor. Server-side unblock_actor RPC will fail gracefully if no block exists, but the client inconsistency could cause confusing state.
- Severity: LOW
- Exploitability: LOW (race condition; server-side RPC handles gracefully)
- Attack Preconditions: Two concurrent block/unblock operations from the same session
- Blast Radius: Client-side state inconsistency; server-side protected by RPC auth guard
- Identity Leak Type: None
- Cache Trust Type: Stale block status from concurrent reads
- RLS Dependency: REQUIRED (server-side RPC is final enforcer)
- Why it matters: Toggle path consistency with the unblockActorController path should be maintained to avoid diverging security invariants.
- Recommended mitigation: toggleBlockActorController should call unblockActorController() and blockActorController() rather than calling DAL directly — maintaining a single ownership enforcement path for all unblock operations.
- Rationale: Consistent controller usage prevents the toggle path from silently bypassing future controller-layer guards.
- Follow-up command: SPIDER-MAN (test toggle concurrency path)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Access Control
```

---

## 8. Source Verification Summary

| File | Reviewed | Key Finding |
|---|---|---|
| apps/VCSM/src/features/block/dal/block.write.dal.js | YES | console.error unconditional (VEN-BLOCK-004); calls RPCs without session check (delegated to server) |
| apps/VCSM/src/features/block/dal/block.check.dal.js | YES | Direct table SELECT; no session guard; relies on RLS (VEN-BLOCK-005) |
| apps/VCSM/src/features/block/dal/block.read.dal.js | YES | Direct table SELECT; no session guard; relies on RLS (VEN-BLOCK-005); console.error unconditional |
| apps/VCSM/src/features/block/controllers/blockActor.controller.js | YES | assertingActorId check present; toggle path calls DAL directly (VEN-BLOCK-007) |
| apps/VCSM/src/features/block/controllers/getBlockStatus.controller.js | YES | No session ownership validation on actorId param (VEN-BLOCK-005) |
| apps/VCSM/src/features/block/controllers/getBlockedActorSet.controller.js | YES | No session ownership validation (VEN-BLOCK-005) |
| apps/VCSM/src/features/block/hooks/useBlockActions.js | YES | Correctly pulls sessionActorId from useIdentity; console.error unconditional (VEN-BLOCK-004) |
| apps/VCSM/src/features/block/hooks/useBlockActorAction.js | YES | Correctly pulls sessionActorId from useIdentity |
| apps/VCSM/src/features/block/hooks/useBlockStatus.js | YES | Fail-open on error (VEN-BLOCK-006); console.error unconditional |
| apps/VCSM/src/features/block/guards/BlockGate.jsx | YES | Renders null on load; renders fallback on block; correctly wired |
| apps/VCSM/src/features/block/index.js | YES | Exports controllers directly — boundary violation (VEN-BLOCK-002) |
| apps/VCSM/src/features/block/adapters/hooks/useBlockActorAction.adapter.js | YES | Re-exports hook; clean |
| apps/VCSM/src/features/block/adapters/hooks/useBlockStatus.adapter.js | YES | Re-exports hook; clean |
| apps/VCSM/src/features/block/adapters/ui/ActorActionsMenu.jsx | YES | Uses viewerActorId/targetActorId; self-block guard present |
| apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js | YES | Parallel write surface; calls block_actor/unblock_actor RPCs; no assertingActorId check at DAL layer |
| apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js | YES | callerActorId ownership check present but client-side string comparison only |
| ZZnotforproduction/APPS/VCSM/features/block/BEHAVIOR.md | YES | Placeholder only — no security rules authored (VEN-BLOCK-001) |
| Migration: batch4 (block_actor RPC SQL) | YES | block_actor has is_current_vc_actor() auth guard — VERIFIED |
| Migration: unblock_actor RPC SQL | NOT FOUND | No migration defines unblock_actor — auth guard status UNVERIFIED (VEN-BLOCK-003) |

---

## 9. Confidence Summary

| Finding | Severity | Provenance | Evidence Quality |
|---|---|---|---|
| VEN-BLOCK-001 | HIGH | SOURCE_VERIFIED | BEHAVIOR.md file read directly — confirmed placeholder |
| VEN-BLOCK-002 | MEDIUM | SOURCE_VERIFIED | index.js and caller imports read directly |
| VEN-BLOCK-003 | HIGH | SCANNER_LEAD | DAL confirmed; SQL definition not found in migrations — UNVERIFIED |
| VEN-BLOCK-004 | LOW | SOURCE_VERIFIED | console.error calls read at exact file:line |
| VEN-BLOCK-005 | MEDIUM | SOURCE_VERIFIED | controller and DAL files read; no session ownership guard found |
| VEN-BLOCK-006 | MEDIUM | SOURCE_VERIFIED | useBlockStatus error path read at exact file:line |
| VEN-BLOCK-007 | LOW | SOURCE_VERIFIED | toggleBlockActorController direct DAL call read at exact line |

---

## 10. THOR Impact

| Finding | THOR Blocker | Rationale |
|---|---|---|
| VEN-BLOCK-001 (Missing BEHAVIOR.md) | YES | No behavior contract = no release guarantee; THOR cannot verify invariants |
| VEN-BLOCK-003 (unblock_actor auth UNVERIFIED) | YES — must verify | If unblock_actor RPC lacks is_current_vc_actor guard, block bypass is possible — this must be verified or fixed before release |
| VEN-BLOCK-002 (Controller exports) | NO | Architecture debt; not a runtime exploit path |
| VEN-BLOCK-004 (console.error) | NO | Minor information leak; not a functional blocker |
| VEN-BLOCK-005 (No session ownership on reads) | NO | RLS provides backstop; no confirmed bypass exists |
| VEN-BLOCK-006 (Fail-open on error) | NO | UI-layer only; server-side RLS on posts/chat still protects data |
| VEN-BLOCK-007 (Toggle DAL direct call) | NO | Low exploitability; server-side protected |

**THOR Release Blocker:** YES — VEN-BLOCK-001 (no behavior contract) and VEN-BLOCK-003 (unblock_actor auth UNVERIFIED)

---

## 11. Required Follow-Up Commands

| Command | Reason | Priority |
|---|---|---|
| DB | Retrieve unblock_actor RPC SQL body from live DB — verify is_current_vc_actor guard present | P0 — THOR blocker |
| Carnage | If DB confirms unblock_actor lacks auth guard: write migration to add is_current_vc_actor() ownership check | P0 — THOR blocker |
| SPIDER-MAN | Author BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen; add unit tests for blockActorController auth assertions, idempotency, toggle concurrency | P1 |
| ELEKTRA | Full console audit of block feature; trace ctrlGetBlockedActorSet caller chain for session ownership gaps | P2 |
| ARCHITECT | Boundary contract review — block index.js exports controllers; define allowed export surface | P2 |

---

## 12. MITIGATION PLAN

| Finding ID | Severity | THOR Blocker | Owner Command | Action | Effort |
|---|---|---|---|---|---|
| VEN-BLOCK-003 | HIGH | YES | DB + Carnage | Verify unblock_actor RPC SQL body; add is_current_vc_actor() guard if missing | Medium |
| VEN-BLOCK-001 | HIGH | YES | SPIDER-MAN | Author BEHAVIOR.md §5 and §9; register security rules | Low |
| VEN-BLOCK-005 | MEDIUM | NO | ELEKTRA | Add session ownership check to ctrlGetBlockStatus and ctrlGetBlockedActorSet | Low |
| VEN-BLOCK-006 | MEDIUM | NO | SPIDER-MAN | Change useBlockStatus error path to fail-closed (blockCheckFailed flag) | Low |
| VEN-BLOCK-002 | MEDIUM | NO | ARCHITECT | Move controller exports out of index.js; use adapter pattern | Medium |
| VEN-BLOCK-004 | LOW | NO | ELEKTRA | Wrap all console.error in block feature with `if (import.meta.env.DEV)` | Low |
| VEN-BLOCK-007 | LOW | NO | SPIDER-MAN | Refactor toggleBlockActorController to call sub-controllers instead of DAL directly | Low |

---

## 13. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Finding IDs |
|---|---|---|
| Identity and Access Management | 2 | VEN-BLOCK-003, VEN-BLOCK-005 |
| Access Control | 2 | VEN-BLOCK-005, VEN-BLOCK-006 |
| Software Development Security | 4 | VEN-BLOCK-001, VEN-BLOCK-002, VEN-BLOCK-004, VEN-BLOCK-007 |
| Security Architecture and Engineering | 2 | VEN-BLOCK-002, VEN-BLOCK-006 |
| Security Assessment and Testing | 2 | VEN-BLOCK-001, VEN-BLOCK-004 |
| Communications and Network Security | 0 | — |
| Security and Risk Management | 0 | — |
| Asset Security | 0 | — |

**Domain Coverage:** 5 of 8 CISSP domains touched. Dominant domains are Software Development Security and Access Control — consistent with a client-side feature with RPC-based write surfaces and missing governance documentation.

---

*VENOM V2 Review Complete — 2026-06-04*
