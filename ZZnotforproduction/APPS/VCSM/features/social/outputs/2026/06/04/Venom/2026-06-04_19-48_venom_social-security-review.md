# VENOM V2 Security Review — social

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Date | 2026-06-04 |
| Report Time | 19:48 UTC |
| Reviewer | VENOM V2 |
| Feature | social |
| App | VCSM |
| Source Root | apps/VCSM/src/features/social/ |
| Doc Root | ZZnotforproduction/APPS/VCSM/features/social/ |
| Scanner Data | /tmp/venom_features/social.json |
| VENOM Version | V2 |
| Total Findings | 5 |
| Severity Breakdown | 0 CRITICAL, 3 HIGH, 1 MEDIUM, 1 LOW |
| THOR Release Blocker | YES — VEN-SOCIAL-001 |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At                 | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

| Type | Count | Notes |
|---|---|---|
| Write Surfaces | 8 | 4 table writes, 4 classified as RPC by scanner but structurally writes |
| RPCs | 3 | get_follower_count, can_view_actor_signal, get_actor_social_public_policy |
| Security Paths | 11 | All LOW confidence — no route execution paths resolved by scanner |
| Write Execution Paths | 8 | All LOW confidence — no route context available |
| RPC Execution Paths | 3 | All LOW confidence — no route context available |
| Edge Functions | 0 | None |

Scanner note: ALL security paths and execution paths carry LOW confidence because the scanner could not resolve route execution contexts for the social feature. Source verification was required and performed for all surfaces.

### Write Surfaces Identified

| Function | Operation | Table/RPC | File |
|---|---|---|---|
| dalDeactivateFollow | UPDATE | vc.actor_follows | friend/request/dal/actorFollows.dal.js |
| dalInsertFollow | UPSERT | vc.actor_follows | friend/request/dal/actorFollows.dal.js |
| dalUpdateRequestStatus | UPDATE | vc.social_follow_requests | friend/request/dal/followRequests.dal.js |
| dalUpsertPendingRequest | UPSERT | vc.social_follow_requests | friend/request/dal/followRequests.dal.js |
| dalCountSubscribers | RPC | vc.get_follower_count | friend/subscribe/dal/subscriberCount.dal.js |
| dalCanViewActorSignal | RPC | vc.can_view_actor_signal | privacy/dal/actorSignalVisibility.dal.js |
| dalGetActorSocialPublicPolicy | RPC | vc.get_actor_social_public_policy | privacy/dal/actorSocialPublicPolicy.dal.js |
| dalUpdateActorSocialSettings | UPDATE | vc.actor_social_settings | privacy/dal/actorSocialSettings.dal.js |

---

## 4. Security Surface Inventory

### Trust Boundaries in Feature

| Boundary | Description |
|---|---|
| Session Actor | Authenticated Supabase user with a resolved actorId |
| Actor Ownership | Actor owns a follow edge (is the follower) |
| Inbox Ownership | Actor owns the follow request inbox (is the target) |
| Public Read | Any caller, no auth required |
| RLS Dependency | DB-level policy (ASSUMED unless DB-verified) |

### Surfaces by Boundary

| Surface | Boundary Required | Controller Gate | RLS Assumed |
|---|---|---|---|
| dalInsertFollow (actor_follows) | Session actor = follower | ctrlSubscribe: assertingActorId === followerActorId | YES |
| dalDeactivateFollow (actor_follows) | Session actor = follower | ctrlUnsubscribe: assertingActorId === followerActorId | YES |
| dalUpdateRequestStatus (follow_requests) | Session actor = target or requester | ctrlAccept/Decline/Cancel/Unsubscribe | YES |
| dalUpsertPendingRequest (follow_requests) | Session actor = requester (indirect via ctrlSendFollowRequest) | No assertingActorId check in ctrlSendFollowRequest | YES |
| dalListIncomingPendingRequests | Session actor = target | ctrlListIncomingRequests: assertingActorId === targetActorId (gate present) | YES |
| dalUpdateActorSocialSettings | Session actor = owner OR actor_owners | vportSocialSettings.controller: assertActorOwnsVportActorController | YES |
| dalCanViewActorSignal (RPC) | Public (viewer may be null) | None — direct RPC | YES |
| dalGetActorSocialPublicPolicy (RPC) | Public (any caller) | None — direct RPC | YES |
| dalCountSubscribers (RPC) | Public (any actorId) | None — direct RPC, actorId from caller | YES |

---

## 5. Scanner Signals Block

All 11 security paths carry LOW confidence due to missing route execution context. The scanner correctly flagged all write surfaces with HIGH confidence at the AST level. No routes were resolved. VENOM performed full source-level verification manually.

RPC surfaces dalCanViewActorSignal, dalGetActorSocialPublicPolicy, and dalCountSubscribers are classified as "writes" by the scanner due to side-effect classification rules — they are read-only RPCs in practice but appear in write surface and RPC maps.

No edge functions detected.

---

## 6. Behavior Contract Status

| Field | Value |
|---|---|
| BEHAVIOR.md Present | YES — but PLACEHOLDER |
| BEHAVIOR.md Status | `Status: PLACEHOLDER` |
| §5 Security Rules | NONE DEFINED (placeholder only) |
| §9 Must Never Happen | NONE DEFINED (placeholder only) |
| BEH IDs extracted | 0 |

**Finding: MISSING_BEHAVIOR_CONTRACT**
BEHAVIOR.md exists but is a 9-line placeholder with no security rules, no invariants, and no BEH IDs. The behavior contract is functionally absent. This is a HIGH finding — the social feature controls access to follow relationships and actor privacy, which are security-sensitive operations. The absence of a formal contract means no BEH-level cross-check can be performed and no regression surface is formally defined.

Cross-check result: UNABLE TO PERFORM (no BEH rules to verify against). All findings in §7 are sourced entirely from source inspection.

---

## 7. Trust Boundary Findings

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-SOCIAL-001
- **Location:** apps/VCSM/src/features/social/friend/request/controllers/followRequests.controller.js:187–199 and apps/VCSM/src/features/social/friend/request/hooks/useIncomingFollowRequests.js:27
- **Application Scope:** VCSM
- **Platform Surface:** PWA — React Hook / Controller
- **Trust Boundary:** Authenticated session actor (any logged-in actor)
- **Boundary Violated:** Inbox ownership — any authenticated actor should only be able to read their own incoming follow request inbox
- **Contract Violated:** Controller ownership gate at ctrlListIncomingRequests — the assertingActorId check at line 193 of followRequests.controller.js is PRESENT but only triggered when the caller supplies assertingActorId. The hook useIncomingFollowRequests supplies sessionActorId (line 27) which can be null before identity resolves, causing the guard to fail silently (early return at line 191 `if (!targetActorId) return []`) rather than reject — but the deeper concern is the early return at line 191 only guards `!targetActorId`, not the case where `assertingActorId` is null while `targetActorId` is supplied.
- **Current behavior:** When `assertingActorId` is null (session not yet resolved) and `targetActorId` is non-null, the controller reaches line 193. The guard `if (!assertingActorId || assertingActorId !== targetActorId)` correctly throws. HOWEVER: the regression test suite (followRequests.controller.test.js lines 307–366) explicitly marks this block as "[V-SUB-003 REGRESSION] WILL FAIL until assertingActorId is added" — indicating that at the time the tests were written the gate was NOT yet present. Source inspection confirms the gate IS now present at line 192–195 of the controller. The tests in the regression block should now PASS.
- **Risk:** If the regression tests are actually failing (gate not yet merged into this branch), any actor can enumerate another actor's private follow request inbox by passing an arbitrary targetActorId.
- **Severity:** HIGH
- **Exploitability:** MEDIUM (requires authentication, but no other barrier)
- **Attack Preconditions:** Authenticated session with any valid actorId; knowledge of a target actor's actorId
- **Blast Radius:** Exposure of pending follow request sender identities for any actor on the platform
- **Identity Leak Type:** Follow request inbox enumeration — exposes requester_actor_id of all pending requests for any target
- **Cache Trust Type:** None — DAL does not cache incoming requests list
- **RLS Dependency:** ASSUMED — RLS on vc.social_follow_requests not independently verified. If RLS is correctly set to `target_actor_id = auth.uid()`, this is mitigated at DB level. If not, this is a direct data exposure.
- **Why it matters:** An attacker can determine who is trying to follow any user — social graph intelligence leak and potential for targeted harassment or social engineering
- **Recommended mitigation:** (1) Confirm the regression tests in followRequests.controller.test.js V-SUB-003 block now pass against the current source. (2) Independently verify DB RLS on vc.social_follow_requests enforces `target_actor_id = auth.uid()` for SELECT operations.
- **Rationale:** Defense-in-depth: controller gate + RLS must both be present. Controller gate is now in source but test suite claims it was a regression — confirmation needed.
- **Follow-up command:** SPIDER-MAN (run regression tests), DB (verify RLS on social_follow_requests)
- **Provenance:** SOURCE_VERIFIED
- **CISSP Domain:**
  - Primary: Access Control
  - Secondary: Software Development Security, Information Security and Risk Management

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-SOCIAL-002
- **Location:** apps/VCSM/src/features/social/friend/request/controllers/followRequests.controller.js:23–68 and apps/VCSM/src/features/social/friend/request/hooks/useSendFollowRequest.js:1–7
- **Application Scope:** VCSM
- **Platform Surface:** PWA — React Hook / Controller
- **Trust Boundary:** Authenticated session actor
- **Boundary Violated:** Follow request sender ownership — ctrlSendFollowRequest accepts requesterActorId as a parameter with no assertingActorId ownership gate
- **Contract Violated:** Actor identity ownership — any authenticated actor can supply an arbitrary requesterActorId to send a follow request impersonating another actor
- **Current behavior:** ctrlSendFollowRequest (lines 23–68) validates that requesterActorId and targetActorId are present, checks for self-follow, and checks block status — but never verifies that the caller's session actor matches requesterActorId. The hook useSendFollowRequest (line 4) passes viewerActorId directly as requesterActorId with no assertingActorId. The adapter exports this hook publicly.
- **Risk:** Authenticated actor A can send a follow request to any target as if they were actor B by supplying B's actorId as requesterActorId. This creates a ghost follow request in B's name.
- **Severity:** HIGH
- **Exploitability:** MEDIUM (requires authentication; requires knowing another actor's actorId)
- **Attack Preconditions:** Authenticated session; knowledge of a victim actor's actorId; ability to call ctrlSendFollowRequest directly (any JS console or devtools access)
- **Blast Radius:** Follow requests created under another actor's identity; potential for social graph manipulation; could be used to harass targets by flooding their inboxes with fake requests attributed to innocent actors
- **Identity Leak Type:** Identity spoofing on write — follow request written with a different actor's identity
- **Cache Trust Type:** None directly; policyCache invalidation not triggered since no follow is created
- **RLS Dependency:** ASSUMED — if vc.social_follow_requests RLS enforces `requester_actor_id = auth.uid()` on INSERT, this is fully blocked at DB level. If not, the spoofed insert succeeds.
- **Why it matters:** Social graph integrity — false follow requests attributed to innocent actors; potential abuse vector for harassment; erodes trust in the social graph
- **Recommended mitigation:** Add assertingActorId parameter to ctrlSendFollowRequest and enforce `assertingActorId === requesterActorId` before any DAL call. Mirror the pattern already used in ctrlSubscribe (follow.controller.js line 26).
- **Rationale:** ctrlSubscribe already implements this gate (V-SUB-001). ctrlSendFollowRequest is the underlying send path that ctrlSubscribe calls on private accounts — but it is also callable directly. The private-account path already gates at ctrlSubscribe, but the direct path has no gate.
- **Follow-up command:** ELEKTRA (propose patch), SPIDER-MAN (add regression test)
- **Provenance:** SOURCE_VERIFIED
- **CISSP Domain:**
  - Primary: Access Control
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-SOCIAL-003
- **Location:** apps/VCSM/src/features/social/privacy/dal/actorSocialSettings.dal.js:39–57 (dalUpdateActorSocialSettings)
- **Application Scope:** VCSM
- **Platform Surface:** PWA — DAL direct
- **Trust Boundary:** Session actor = owner (RLS-enforced)
- **Boundary Violated:** Patch content validation — dalUpdateActorSocialSettings accepts an open `patch` object and writes it directly to vc.actor_social_settings with no column allowlist at the DAL layer
- **Contract Violated:** Defense-in-depth — the DAL comment at line 37 states "patch must contain only valid actor_social_settings columns" but this is not enforced in the DAL itself
- **Current behavior:** dalUpdateActorSocialSettings validates that `actorId` and `patch` are present and that `patch` is a non-empty object (lines 41–44). It does NOT validate which keys are in the patch. The function passes the patch object directly to `.update(patch)`. The outer Vport path (vportSocialSettings.controller.js) has an ALLOWED_PATCH_KEYS allowlist, but the direct user-actor path through settings/privacy bypasses this and calls dalUpdateActorSocialSettings directly.
- **Risk:** A caller constructing a patch with unexpected column names could write arbitrary values to any column in actor_social_settings that Postgres allows for the authenticated user. Combined with insufficient RLS column-level restrictions, this could modify fields beyond the intended social settings scope.
- **Severity:** HIGH
- **Exploitability:** LOW (requires calling the DAL directly or through a controller that doesn't enforce the allowlist; RLS likely limits damage)
- **Attack Preconditions:** Authenticated session; ability to call dalUpdateActorSocialSettings with a crafted patch (e.g., through a settings controller that passes caller-controlled input)
- **Blast Radius:** Potentially unintended column writes on actor_social_settings for the authenticated actor's own row; no cross-actor impact due to RLS
- **Identity Leak Type:** None
- **Cache Trust Type:** In-memory TTL cache updated with the returned row after write — no trust boundary issue with the cache itself
- **RLS Dependency:** REQUIRED — RLS on actor_social_settings must be verified to restrict UPDATE to `actor_id = auth.uid()` rows only, and ideally column-level security should restrict writable columns
- **Why it matters:** The DAL comment documents a constraint that is not enforced in code. This is a documentation-reality gap that will be exploited if any caller is ever added that passes caller-controlled patch data without its own allowlist.
- **Recommended mitigation:** Add a column allowlist to dalUpdateActorSocialSettings mirroring the ALLOWED_PATCH_KEYS set already defined in vportSocialSettings.controller.js. Throw on any key not in the set before executing the DB write.
- **Rationale:** The allowlist already exists in one caller — centralizing it in the DAL provides defense-in-depth regardless of which code path reaches the write
- **Follow-up command:** ELEKTRA (propose patch), DB (verify column-level RLS on actor_social_settings)
- **Provenance:** SOURCE_VERIFIED
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Access Control

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-SOCIAL-004
- **Location:** apps/VCSM/src/features/social/friend/request/controllers/followRequests.controller.js:57–67 and apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js:97–105
- **Application Scope:** VCSM
- **Platform Surface:** PWA — Notification system / linkPath
- **Trust Boundary:** Notification recipient (any actor)
- **Boundary Violated:** Raw UUID exposure in notification linkPath — the linkPath `/feed` (current state) is safe, but the regression test file (follow.controller.test.js lines 461–477) documents a V-SUB-005 finding that linkPath was previously `/profile/${followerActorId}` (raw UUID). The test asserts the fixed behavior (`not.toBe(/profile/<uuid>`). The test itself is a PASS guard — it verifies that the linkPath does NOT equal the raw UUID path. The current source sets `linkPath: '/feed'` (line 64 in followRequests.controller.js and line 103 in follow.controller.js) which is correct.
- **Risk:** If linkPath is ever reverted to use a raw actorId UUID (e.g., `/profile/${followerActorId}`), it would expose internal UUIDs in notification payloads — violating the platform rule against raw IDs in public URLs.
- **Severity:** MEDIUM
- **Exploitability:** LOW (requires a code regression; not exploitable in current state)
- **Attack Preconditions:** Code regression reverting linkPath to a UUID-based path
- **Blast Radius:** Internal UUID exposure through notification links; allows ID enumeration if notification data is accessible
- **Identity Leak Type:** UUID in notification linkPath (regression risk only — currently safe)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Platform policy prohibits raw UUIDs in public-facing URLs. Notification links are user-visible. The test guards against regression but the guard may not be run in CI for this module.
- **Recommended mitigation:** (1) Ensure the V-SUB-005 regression test runs in CI. (2) Confirm the notification linkPath is `/feed` or a handle-based route in all notification calls. (3) Document the approved linkPath value in BEHAVIOR.md when it is written.
- **Rationale:** The current state is safe, but the regression test and prior finding history indicate this has been a live issue. Locking it with CI enforcement prevents future regression.
- **Follow-up command:** SPIDER-MAN (verify V-SUB-005 test is in CI), BEHAVIOR.md author
- **Provenance:** SOURCE_VERIFIED
- **CISSP Domain:**
  - Primary: Information Security and Risk Management
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-SOCIAL-005
- **Location:** apps/VCSM/src/features/social/friend/request/dal/actorFollows.dal.js:56–64 and apps/VCSM/src/features/social/friend/subscribe/hooks/useSubscribeAction.js:172–181
- **Application Scope:** VCSM
- **Platform Surface:** PWA — Console / error logging
- **Trust Boundary:** Production users (browser console visibility)
- **Boundary Violated:** PII-adjacent data logged to console in production paths
- **Contract Violated:** Platform memory rule — no console.log in production; debug output must be dev-only
- **Current behavior:** dalInsertFollow (line 56) calls `console.error('[dalInsertFollow] error', {...})` with a structured object containing followerActorId, followedActorId, message, code, details, hint, and the raw error object — outside any `import.meta.env.DEV` guard. This runs in production. Similarly, useSubscribeAction (lines 172–181) calls `console.error('[useSubscribeAction] follow action failed', {...})` with actionActorId, viewerActorId, targetActorId and error details — also without a DEV guard.
- **Risk:** Internal actor IDs, error details, and social graph relationship data appear in the browser console in production. This data is accessible to anyone with devtools open. Actor IDs, while not directly PII, combined with error context can assist enumeration or fingerprinting attacks.
- **Severity:** LOW
- **Exploitability:** LOW (requires devtools access on own session; no remote exposure)
- **Attack Preconditions:** User opens browser devtools during a follow action that produces an error
- **Blast Radius:** Actor IDs and error internals visible in browser console to the authenticated user; no cross-user exposure; no remote data leak
- **Identity Leak Type:** actorId values in console output (low severity)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Platform logging rules prohibit unguarded console output. This is a hardening issue — not a critical vulnerability — but violates the documented engineering contract.
- **Recommended mitigation:** Wrap both console.error calls in `if (import.meta.env.DEV)` guards. The pattern is already used correctly in dalDeactivateFollow (line 91) and dalCanViewActorSignal (line 17).
- **Rationale:** Consistency with existing DEV guard pattern in the same codebase. Low effort, eliminates the violation.
- **Follow-up command:** ELEKTRA (propose patch)
- **Provenance:** SOURCE_VERIFIED
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Operations Security

---

## 8. Source Verification Summary

| File | Inspected | Verdict |
|---|---|---|
| friend/request/dal/actorFollows.dal.js | YES | FINDING: VEN-SOCIAL-005 (unguarded console.error at lines 56–64) |
| friend/request/dal/followRequests.dal.js | YES | VERIFIED_SAFE (status allowlist enforced; DEV-guarded logging) |
| friend/subscribe/dal/subscriberCount.dal.js | YES | VERIFIED_SAFE (public RPC, no auth required by design) |
| privacy/dal/actorSignalVisibility.dal.js | YES | VERIFIED_SAFE (public RPC, no auth required by design; DEV guard on error) |
| privacy/dal/actorSocialPublicPolicy.dal.js | YES | VERIFIED_SAFE (public RPC; fail-closed default; DEV guard on error) |
| privacy/dal/actorSocialSettings.dal.js | YES | FINDING: VEN-SOCIAL-003 (no column allowlist in DAL) |
| friend/request/controllers/followRequests.controller.js | YES | FINDING: VEN-SOCIAL-001 (V-SUB-003 status) + VEN-SOCIAL-002 (no assertingActorId gate on ctrlSendFollowRequest) |
| friend/subscribe/controllers/follow.controller.js | YES | VERIFIED_SAFE (assertingActorId gate present line 26) |
| friend/subscribe/controllers/unsubscribe.controller.js | YES | VERIFIED_SAFE (assertingActorId gate present line 19) |
| friend/subscribe/controllers/getFollowRelationshipState.controller.js | YES | VERIFIED_SAFE (read-only, no mutation) |
| friend/subscribe/controllers/getFollowerCount.controller.js | YES | VERIFIED_SAFE (public read, no auth required) |
| friend/subscribe/controllers/getFollowStatus.controller.js | YES | VERIFIED_SAFE (read-only, no mutation) |
| privacy/controllers/getActorPrivacy.controller.js | YES | VERIFIED_SAFE (thin wrapper, read-only) |
| friend/subscribe/hooks/useFollowActorToggle.js | YES | VERIFIED_SAFE (passes assertingActorId = followerActorId to all controllers) |
| friend/request/hooks/useFollowRequestActions.js | YES | VERIFIED_SAFE (derives sessionActorId from useIdentity, passes as assertingActorId) |
| friend/request/hooks/useIncomingFollowRequests.js | YES | VERIFIED_SAFE (sessionActorId passed as assertingActorId) |
| friend/request/hooks/useSendFollowRequest.js | YES | FLAGGED (no assertingActorId — tied to VEN-SOCIAL-002) |
| friend/subscribe/hooks/useSubscribeAction.js | YES | FINDING: VEN-SOCIAL-005 (unguarded console.error line 172) |
| adapters/social.adapter.js | YES | VERIFIED_SAFE (exports only hook) |
| friend/subscribe/components/SubscribeDebugPanel.jsx | YES | VERIFIED_SAFE (IS_DEV guard on render; DEV-only component) |
| settings/vports/controller/vportSocialSettings.controller.js | YES | VERIFIED_SAFE (assertActorOwnsVportActorController gate; column allowlist) |
| Test files (3) | YES | Key regression tests document V-SUB-001, V-SUB-002, V-SUB-003, V-SUB-005 findings |

---

## 9. Confidence Summary

| Finding | Confidence | Evidence Basis |
|---|---|---|
| VEN-SOCIAL-001 | HIGH | Source read: controller line 192 has gate but regression tests marked as expected-to-fail; DB RLS unverified |
| VEN-SOCIAL-002 | HIGH | Source read: ctrlSendFollowRequest has no assertingActorId parameter; useSendFollowRequest does not supply one |
| VEN-SOCIAL-003 | HIGH | Source read: dalUpdateActorSocialSettings accepts open patch object; no allowlist in DAL |
| VEN-SOCIAL-004 | MEDIUM | Source read: current state safe; risk is regression; test exists |
| VEN-SOCIAL-005 | HIGH | Source read: unguarded console.error at specific lines confirmed |
| MISSING_BEHAVIOR_CONTRACT | HIGH | File read: BEHAVIOR.md is 9-line placeholder |

---

## 10. THOR Impact

| Finding | Severity | THOR Blocker | Reason |
|---|---|---|---|
| VEN-SOCIAL-001 | HIGH | YES | Inbox ownership boundary — if regression tests are failing, this is an active HIGH severity data exposure. Must be confirmed before release. |
| VEN-SOCIAL-002 | HIGH | YES | Identity spoofing on follow request send — no assertingActorId gate on ctrlSendFollowRequest |
| VEN-SOCIAL-003 | HIGH | NO | Hardening issue; RLS is the primary mitigation; no known exploit path |
| VEN-SOCIAL-004 | MEDIUM | NO | Current state is safe; regression risk only |
| VEN-SOCIAL-005 | LOW | NO | Logging hygiene; no exploit |
| MISSING_BEHAVIOR_CONTRACT | HIGH | NO | Governance finding; does not block release directly |

**THOR RELEASE BLOCKER: YES — VEN-SOCIAL-001 (confirm regression test status + RLS), VEN-SOCIAL-002 (add assertingActorId gate to ctrlSendFollowRequest)**

---

## 11. Required Follow-Up Commands

| Priority | Command | Finding | Action |
|---|---|---|---|
| P0 | SPIDER-MAN | VEN-SOCIAL-001 | Run followRequests.controller.test.js V-SUB-003 block; confirm tests now pass |
| P0 | DB | VEN-SOCIAL-001 | Verify RLS on vc.social_follow_requests enforces target_actor_id = auth.uid() for SELECT |
| P0 | ELEKTRA | VEN-SOCIAL-002 | Propose patch: add assertingActorId parameter to ctrlSendFollowRequest; enforce ownership gate before dalUpsertPendingRequest |
| P1 | SPIDER-MAN | VEN-SOCIAL-002 | Add regression test for ctrlSendFollowRequest assertingActorId gate |
| P1 | ELEKTRA | VEN-SOCIAL-003 | Propose patch: add ALLOWED_PATCH_KEYS allowlist to dalUpdateActorSocialSettings |
| P1 | DB | VEN-SOCIAL-003 | Verify RLS column-level restrictions on vc.actor_social_settings UPDATE |
| P2 | SPIDER-MAN | VEN-SOCIAL-004 | Confirm V-SUB-005 regression test (follow.controller.test.js line 461) is in CI |
| P2 | ELEKTRA | VEN-SOCIAL-005 | Propose patch: wrap console.error calls at actorFollows.dal.js:56 and useSubscribeAction.js:172 in import.meta.env.DEV guards |

---

## 12. MITIGATION PLAN

| Finding ID | Severity | THOR Block | Owner | Mitigation | Effort |
|---|---|---|---|---|---|
| VEN-SOCIAL-001 | HIGH | YES | SPIDER-MAN + DB | Run V-SUB-003 regression tests; verify RLS on social_follow_requests | LOW — test run + DB query |
| VEN-SOCIAL-002 | HIGH | YES | ELEKTRA + SPIDER-MAN | Add assertingActorId gate to ctrlSendFollowRequest; add regression test | LOW — single parameter + guard |
| VEN-SOCIAL-003 | HIGH | NO | ELEKTRA + DB | Add ALLOWED_PATCH_KEYS to dalUpdateActorSocialSettings; verify RLS | LOW — copy existing allowlist pattern |
| VEN-SOCIAL-004 | MEDIUM | NO | SPIDER-MAN | Confirm V-SUB-005 test in CI; document linkPath contract in BEHAVIOR.md | LOW — CI config check |
| VEN-SOCIAL-005 | LOW | NO | ELEKTRA | Wrap 2 console.error calls in DEV guard | TRIVIAL — 2 line changes |
| MISSING_BEHAVIOR_CONTRACT | HIGH (governance) | NO | Feature owner | Author BEHAVIOR.md §5 Security Rules and §9 Must Never Happen | MEDIUM — requires feature knowledge |

---

## 13. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings |
|---|---|
| Access Control | VEN-SOCIAL-001, VEN-SOCIAL-002, VEN-SOCIAL-003 |
| Software Development Security | VEN-SOCIAL-001, VEN-SOCIAL-002, VEN-SOCIAL-003, VEN-SOCIAL-004, VEN-SOCIAL-005 |
| Information Security and Risk Management | VEN-SOCIAL-001, VEN-SOCIAL-004 |
| Operations Security | VEN-SOCIAL-005 |
| Identity and Access Management | VEN-SOCIAL-002 |
| Security Assessment and Testing | VEN-SOCIAL-001 (regression test status) |

---

*VENOM V2 Review Complete — social — 2026-06-04*
