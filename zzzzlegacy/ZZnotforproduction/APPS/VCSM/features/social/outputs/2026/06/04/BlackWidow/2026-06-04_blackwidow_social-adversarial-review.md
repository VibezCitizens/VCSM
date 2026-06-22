# BW V2 Adversarial Review — social
## BLACKWIDOW V2 — BW2.5 V2 Full Protocol

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | social |
| App | VCSM |
| Review Date | 2026-06-04 |
| Analyst | BLACKWIDOW V2 |
| Protocol Version | BW2.5 V2 |
| Scanner Preflight | FRESH — 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Behavior Contract | PLACEHOLDER — §9 invariants UNANCHORED |
| Security Posture Input | ZZnotforproduction/APPS/VCSM/features/social/SECURITY.md |

---

## 2. Scanner Preflight

- Status: FRESH
- Generated: 2026-06-04T19:48:25.152Z
- Scanner Version: 1.1.0
- Security paths attributed to feature (scanner): 11
- Total platform security paths: 598
- Feature share: ~1.84%

---

## 3. Scanner Inputs

| Map | Status |
|---|---|
| security-path-map.json | LOADED — 11 social paths |
| callgraph.json | LOADED — 60 nodes, 81 edges |
| write-execution-map.json | LOADED — 0 resolved write paths (all LOW confidence) |
| rpc-execution-map.json | LOADED — 0 resolved RPC paths |

All 11 security paths returned `confidence: LOW` with `route: null`. This is the maximum LOW-confidence surface count for this feature — all are PRIMARY ATTACK TARGETS per Rule BW-002.

---

## 4. Attack Surface Inventory

### 4.1 DAL Write Surfaces (sourced)

| DAL Function | Table | Operation | File |
|---|---|---|---|
| `dalInsertFollow` | `vc.actor_follows` | upsert | `friend/request/dal/actorFollows.dal.js` |
| `dalDeactivateFollow` | `vc.actor_follows` | update | `friend/request/dal/actorFollows.dal.js` |
| `dalUpsertPendingRequest` | `vc.social_follow_requests` | upsert | `friend/request/dal/followRequests.dal.js` |
| `dalUpdateRequestStatus` | `vc.social_follow_requests` | update | `friend/request/dal/followRequests.dal.js` |
| `dalUpdateActorSocialSettings` | `vc.actor_social_settings` | update | `privacy/dal/actorSocialSettings.dal.js` |

### 4.2 RPC Read Surfaces (no mutation, included for completeness)

| Function | RPC | File |
|---|---|---|
| `dalGetActorSocialPublicPolicy` | `get_actor_social_public_policy` | `privacy/dal/actorSocialPublicPolicy.dal.js` |
| `dalCanViewActorSignal` | `can_view_actor_signal` | `privacy/dal/actorSignalVisibility.dal.js` |
| `dalCountSubscribers` | `get_follower_count` | `friend/subscribe/dal/subscriberCount.dal.js` |

### 4.3 Hook Entry Points (UI-accessible write paths)

| Hook | Calls Into | Ownership Source |
|---|---|---|
| `useSubscribeAction` | `ctrlSubscribe`, `ctrlUnsubscribe` | `viewerActorId` prop (from caller) |
| `useFollowActorToggle` | `ctrlSubscribe`, `ctrlUnsubscribe`, `ctrlCancelFollowRequest` | `followerActorId` param (from caller) |
| `useSendFollowRequest` | `ctrlSendFollowRequest` | `requesterActorId` param (from caller) |
| `useFollowRequestActions` | `ctrlAcceptFollowRequest`, `ctrlDeclineFollowRequest` | `useIdentity()` session |
| `useIncomingFollowRequests` | `ctrlListIncomingRequests` | `useIdentity()` session |

### 4.4 Confidence Classification

- HIGH confidence paths: 0
- LOW confidence paths: 11 (all — no route-confirmed paths)
- PRIMARY ATTACK TARGETS (BW-002): all 5 write DAL surfaces

---

## 5. Scanner Signals

All scanner signals are LOW confidence — no security path has a resolved `sourceRoute`. This means the scanner cannot trace UI route → hook → controller → DAL for any social write operation. This is a governance gap: attack surfaces confirmed by source read may still lack CI-level route verification.

Open VENOM findings carried into this review:

| Finding | Severity | Status |
|---|---|---|
| VEN-SOCIAL-001 | HIGH | OPEN — RLS on `social_follow_requests` unverified; regression tests marked WILL FAIL |
| VEN-SOCIAL-002 | HIGH | OPEN — `ctrlSendFollowRequest` has no assertingActorId ownership gate |
| VEN-SOCIAL-003 | HIGH | OPEN — `dalUpdateActorSocialSettings` accepts open patch with no DAL-layer column allowlist |
| VEN-SOCIAL-004 | MEDIUM | OPEN — notification linkPath UUID regression risk |
| VEN-SOCIAL-005 | LOW | OPEN — unguarded console.error logging actor IDs in production |
| MISSING_BEHAVIOR_CONTRACT | HIGH (governance) | OPEN — BEHAVIOR.md is a 9-line placeholder |

---

## 6. Adversarial Path Analysis

### 6.A — OWNERSHIP BYPASS (§5.1)

**Target: ctrlSendFollowRequest — missing assertingActorId gate**

Attack: An authenticated actor A calls `useSendFollowRequest()` with `requesterActorId = victimActorId` and `targetActorId = targetId`. The hook at `useSendFollowRequest.js` passes both IDs directly to `ctrlSendFollowRequest` without session injection.

Source trace:
- `useSendFollowRequest.js:4-6` — returns a function that calls `ctrlSendFollowRequest({ requesterActorId, targetActorId })`. No assertingActorId is ever passed. No ownership check.
- `followRequests.controller.js:23-68` — `ctrlSendFollowRequest` receives `requesterActorId` from the caller with no verification that the caller's session matches. Only validates `requesterActorId !== null` and `requesterActorId !== targetActorId`. No `assertingActorId` parameter defined, no ownership check.
- `useProfileGate.js:46-53` — calls `sendFollowRequest({ requesterActorId: viewerActorId, targetActorId })`. While `viewerActorId` comes from the component prop, it is not validated against the session inside the hook or controller.

**Finding: BW-SOCIAL-001**
- Severity: HIGH
- Result: BYPASSED
- Provenance: [SOURCE_VERIFIED] — `useSendFollowRequest.js:4-6`, `followRequests.controller.js:23-68`
- Exploit Chain: Single-step — pass arbitrary `requesterActorId` to `useSendFollowRequest`
- Note: This is BW verification of VEN-SOCIAL-002. The bypass is confirmed active as of source read.

---

**Target: useFollowActorToggle — assertingActorId self-assignment**

Attack: `useFollowActorToggle` at line 19 calls `ctrlUnsubscribe({ followerActorId, followedActorId, assertingActorId: followerActorId })` — it copies the caller-supplied `followerActorId` as the `assertingActorId`. If a caller can pass an arbitrary `followerActorId`, the ownership gate is self-signed by the attacker.

Source trace:
- `useFollowActorToggle.js:8-11` — accepts `{ followerActorId, followedActorId, isFollowing, state }` with no session injection.
- `useFollowActorToggle.js:19` — `assertingActorId: followerActorId` — the gate is self-satisfied by the input.
- `useFollowActorToggle.js:40` — same pattern for `ctrlSubscribe`.
- `useFollowActorToggle.js:29-35` — same pattern for `ctrlCancelFollowRequest`.

However, `ctrlUnsubscribe` (line 19: `assertingActorId !== followerActorId` check) and `ctrlSubscribe` (line 26: same check) would pass since assertingActorId === followerActorId by construction. The gate is structurally valid only if `followerActorId` comes from a trusted session source. Since `useFollowActorToggle` accepts it from the call site with no session binding, callers that do not inject the session actor ID correctly can still bypass.

**Finding: BW-SOCIAL-002**
- Severity: MEDIUM
- Result: PARTIAL
- Provenance: [SOURCE_VERIFIED] — `useFollowActorToggle.js:8,19,29,40`
- Exploit Chain: Single-step — call `useFollowActorToggle` with arbitrary `followerActorId`; gate self-satisfies
- Note: Risk depends entirely on caller discipline. No session binding is enforced within the hook.

---

### 6.B — SESSION MUTATION (§5.2)

**Target: useSubscribeAction — viewerActorId from prop**

Source trace:
- `useSubscribeAction.js:17-23` — `viewerActorId` is received as a prop from the calling component; `actionActorId = viewerActorId ?? null` (line 23).
- `useSubscribeAction.js:89-93` — calls `unsubscribe({ followerActorId: actionActorId, ..., assertingActorId: actionActorId })` — self-signed like `useFollowActorToggle`.
- `useSubscribeAction.js:117-121` — calls `ctrlSubscribe({ ..., assertingActorId: actionActorId })`.

The hook correctly uses `actionActorId === actionActorId` (self-assertion) which satisfies the ownership gate only when `viewerActorId` comes from a session-bound source. The hook does NOT independently read `useIdentity()` — it relies on the prop supplier.

If a caller passes a null or arbitrary `viewerActorId`, the `disabled` check at line 51 prevents action when `!actionActorId`. This is a UI-layer guard, not a security invariant.

**Finding: BW-SOCIAL-003**
- Severity: LOW
- Result: PARTIAL
- Provenance: [SOURCE_VERIFIED] — `useSubscribeAction.js:17-23,51,89-93,117-121`
- Exploit Chain: Multi-step — requires a caller to supply arbitrary viewerActorId prop; UI guard (disabled) is not a security gate
- Note: Risk is caller-trust dependent; not independently hardened

---

**Target: useFollowRequestActions — session from useIdentity()**

Source trace:
- `useFollowRequestActions.js:11-12` — `sessionActorId = identity?.actorId ?? null` from `useIdentity()`.
- Lines 15-19, 27-32 — `assertingActorId: sessionActorId` passed to `ctrlAcceptFollowRequest` and `ctrlDeclineFollowRequest`.

This is correctly session-bound. `useIdentity()` reads from the platform session context, not from client-supplied props.

Result: BLOCKED — session mutation cannot affect this path.

---

**Target: useIncomingFollowRequests — session from useIdentity()**

Source trace:
- `useIncomingFollowRequests.js:11-12` — `sessionActorId` from `useIdentity()`.
- Line 27 — `assertingActorId: sessionActorId`.
- `ctrlListIncomingRequests` (line 192-194) — asserts `assertingActorId === targetActorId`.

Result: BLOCKED — read-path ownership gate is session-bound.

---

### 6.C — RUNTIME ABUSE (§5.3)

**Target: ctrlSendFollowRequest — no actor kind check**

`ctrlSendFollowRequest` does not check the `kind` of the requester actor. A `vport` actor can send follow requests to a `user` actor without any guard. This is by design (VPORTs can follow profiles), but it means there is no firewall on the actor kind dimension.

**Finding: BW-SOCIAL-004**
- Severity: INFO
- Result: BLOCKED (by design — no actor kind restriction intended)
- Provenance: [SOURCE_VERIFIED] — `followRequests.controller.js:23-68`

---

**Target: ctrlUpdateVportSocialSettings — actor_owners gate**

Source trace:
- `vportSocialSettings.controller.js:35-37` — `ALLOWED_PATCH_KEYS` allowlist applied at controller layer.
- Lines 39-40 — `assertActorOwnsVportActorController` called before DAL write.
- Lines 42 — `dalUpdateActorSocialSettings` called only after ownership confirmed.

VEN-SOCIAL-003 flagged that `dalUpdateActorSocialSettings` accepts open patch with no column allowlist at the DAL layer. This is verified: the DAL (line 45-50 of `actorSocialSettings.dal.js`) calls `.update(patch)` with no key filtering. However, the VPORT settings path (`ctrlUpdateVportSocialSettings`) applies the allowlist at the controller level (lines 35-37 of `vportSocialSettings.controller.js`). The DAL-layer gap is a defense-in-depth failure: if any caller calls `dalUpdateActorSocialSettings` directly, they bypass the allowlist.

**Finding: BW-SOCIAL-005**
- Severity: HIGH
- Result: BYPASSED (defense-in-depth gap — DAL layer has no column allowlist)
- Provenance: [SOURCE_VERIFIED] — `actorSocialSettings.dal.js:39-50`, `vportSocialSettings.controller.js:35-37`
- Exploit Chain: Single-step — call `dalUpdateActorSocialSettings` directly with arbitrary patch keys
- Note: This is BW verification and escalation of VEN-SOCIAL-003. The allowlist exists only at the VPORT controller layer; the DAL itself has no protection.

---

### 6.D — RLS VERIFICATION (§5.4)

**Target: vc.actor_follows (dalInsertFollow, dalDeactivateFollow)**

Neither `dalInsertFollow` nor `dalDeactivateFollow` includes an ownership filter in the WHERE/upsert clause tied to the authenticated session. Both operate solely on `follower_actor_id = ?` supplied by the caller. RLS must be the only DB-layer barrier if an attacker can reach the DAL with arbitrary actor IDs.

VEN-SOCIAL-001 flagged that RLS on `social_follow_requests` is unverified. The same uncertainty applies to `actor_follows`.

**Finding: BW-SOCIAL-006**
- Severity: HIGH
- Result: UNRESOLVED
- Provenance: [SCANNER_LOW_CONF] — no route-confirmed path; DAL confirmed by [SOURCE_VERIFIED] `actorFollows.dal.js:24-69`, `actorFollows.dal.js:75-97`
- Exploit Chain: Multi-step — if RLS on `vc.actor_follows` is absent or misconfigured, a DAL-layer bypass of controller ownership gates results in direct row manipulation
- Note: RLS status on `vc.actor_follows` NOT confirmed from source. DB audit required.

---

**Target: vc.actor_social_settings (dalUpdateActorSocialSettings)**

The update at `actorSocialSettings.dal.js:45-50` filters by `.eq('actor_id', actorId)` but relies on RLS for session enforcement. The DAL comment at line 37-38 states "Owner write — RLS allows actor_id = auth.uid() only" — but this is documentation, not verified DB state.

**Finding: BW-SOCIAL-007**
- Severity: MEDIUM
- Result: UNRESOLVED
- Provenance: [SOURCE_VERIFIED] comment at `actorSocialSettings.dal.js:37-38` is unverified claim; [SCANNER_LOW_CONF] on RLS status
- Exploit Chain: Single-step — if RLS on `actor_social_settings` is misconfigured, `dalUpdateActorSocialSettings` with arbitrary `actorId` mutates another actor's settings

---

### 6.E — VIEWER CONTEXT FUZZING (§5.5)

**Target: ctrlSendFollowRequest with null requesterActorId**

Source trace:
- `followRequests.controller.js:27-29` — throws `'Missing actor ids'` when `requesterActorId` is null/undefined.

Result: BLOCKED.

**Target: ctrlSubscribe with null assertingActorId**

Source trace:
- `follow.controller.js:26-28` — throws `'session actor does not match follower'` when `assertingActorId` is null.

Result: BLOCKED.

**Target: ctrlUnsubscribe with null assertingActorId**

Source trace:
- `unsubscribe.controller.js:19-21` — throws `'session actor does not match follower'` when `assertingActorId` is null.

Result: BLOCKED.

**Target: ctrlListIncomingRequests with null assertingActorId**

Source trace:
- `followRequests.controller.js:193-195` — throws `'session actor does not own this inbox'` when `assertingActorId` is null.

Result: BLOCKED.

**Target: ctrlAcceptFollowRequest / ctrlDeclineFollowRequest / ctrlCancelFollowRequest with null assertingActorId**

Source trace:
- `followRequests.controller.js:78-79` — `ctrlAcceptFollowRequest` throws when assertingActorId is null.
- Lines 128-129 — `ctrlDeclineFollowRequest` same.
- Lines 157-159 — `ctrlCancelFollowRequest` same.

Result: BLOCKED on all three.

---

### 6.F — MUTATION REPLAY (§5.6)

**Target: ctrlSendFollowRequest — replay pending request**

Source trace:
- `followRequests.controller.js:43-49` — checks existing status via `dalGetRequestStatus`. Returns early if `existing === 'pending'` or `existing === 'accepted'`.
- `followRequests.dal.js:26` — `dalGetRequestStatus` filters `.in('status', ['pending', 'accepted'])` — only active states.

Result: BLOCKED — idempotent; replay returns early without re-inserting.

**Target: ctrlAcceptFollowRequest — replay on non-pending request**

Source trace:
- `followRequests.controller.js:82-89` — reads current status; returns `false` if `status !== 'pending'`. If a request is already `accepted`, replay returns false without re-inserting the follow edge.

Result: BLOCKED.

**Target: ctrlUnsubscribe — replay unfollow on already-inactive edge**

Source trace:
- `actorFollows.dal.js:84-96` — `dalDeactivateFollow` issues `.update({ is_active: false })` with no precondition check on current `is_active` state.

This means replaying `ctrlUnsubscribe` on an already-unfollowed edge issues an unnecessary DB write. While not a security bypass, it does trigger `invalidateFeedFollowCache` unnecessarily.

**Finding: BW-SOCIAL-008**
- Severity: LOW
- Result: PARTIAL
- Provenance: [SOURCE_VERIFIED] — `actorFollows.dal.js:84-96`
- Exploit Chain: Replay — repeated `ctrlUnsubscribe` calls on deactivated edge cause unnecessary cache invalidations; not a data integrity risk but a stability concern

---

### 6.G — HYDRATION POISONING (§5.7)

The social feature uses `hydrateActorsFromRows` inside `useIncomingFollowRequests.js:30-34` to hydrate requester actors from follow request rows. The hydration inputs are actor IDs sourced from `vc.social_follow_requests.requester_actor_id` — DB-sourced, not user-supplied directly.

No direct hydration store injection vector identified from social write surfaces.

**Finding: BW-SOCIAL-009**
- Severity: INFO
- Result: BLOCKED
- Provenance: [SOURCE_VERIFIED] — `useIncomingFollowRequests.js:30-34`
- Note: DB-sourced actor IDs for hydration; no client-injectable hydration poisoning vector

---

### 6.H — URL SURFACE (§5.9)

**Target: follow notification linkPath**

Source trace:
- `follow.controller.js:97-105` — `publishVcsmNotification({ ..., linkPath: '/feed', ... })` — uses `/feed`, not a raw UUID.
- `followRequests.controller.js:57-65` — `follow_request` notification `linkPath: '/feed'` — no UUID.
- `followRequests.controller.js:107-115` — `follow_request_accepted` notification `linkPath: '/feed'` — no UUID.

All three notification paths use `/feed` as the linkPath. This is safe from raw UUID exposure.

However, the V-SUB-005 regression test at `follow.controller.test.js:467-477` asserts that `linkPath` does NOT equal `/profile/${followerActorId}` — suggesting a prior version exposed raw UUID in the linkPath. The current production code uses `/feed` which is safe. The regression test passes with current code (it tests for the absence of the bad pattern, and the bad pattern is absent).

**Finding: BW-SOCIAL-010**
- Severity: INFO
- Result: BLOCKED
- Provenance: [SOURCE_VERIFIED] — `follow.controller.js:97-105`, `followRequests.controller.js:57-65`, `followRequests.controller.js:107-115`
- Note: VEN-SOCIAL-004 regression risk is mitigated in current code; test guards the fix

---

### 6.I — §9 INVARIANT ATTACK (HIGHEST PRIORITY)

BEHAVIOR.md status is PLACEHOLDER. No §4 Failure Paths and no §9 Must Never Happen entries are defined. All §9 invariants are UNANCHORED.

BW has inferred likely security invariants from source semantics and attacked them:

**Inferred Invariant I-1: An actor must never be able to follow on behalf of another actor**
Attack: Call `useSendFollowRequest` with a spoofed `requesterActorId`.
Result: BYPASSED — `ctrlSendFollowRequest` has no `assertingActorId` gate. (See BW-SOCIAL-001.)

**Inferred Invariant I-2: An actor must never be able to force-unfollow another actor**
Attack: Call `ctrlUnsubscribe` with a spoofed `followerActorId` and matching `assertingActorId`.
Result: BLOCKED — `ctrlUnsubscribe` ownership gate rejects `assertingActorId !== followerActorId`. Call site requires self-assertion. However, `useFollowActorToggle` self-signs the assertingActorId from the input `followerActorId` (see BW-SOCIAL-002), so the invariant is caller-trust-dependent, not structurally enforced.

**Inferred Invariant I-3: An actor must never be able to accept/decline another actor's follow request inbox**
Attack: Call `ctrlAcceptFollowRequest` with `assertingActorId` set to an actor that is not `targetActorId`.
Result: BLOCKED — `followRequests.controller.js:78-79` enforces `assertingActorId === targetActorId`.

**Inferred Invariant I-4: An actor must never be able to read another actor's incoming follow request inbox**
Attack: Call `ctrlListIncomingRequests` with an arbitrary `targetActorId` and mismatched `assertingActorId`.
Result: BLOCKED — `followRequests.controller.js:193-195`.

**Inferred Invariant I-5: Social settings must only be updated with valid schema columns**
Attack: Call `dalUpdateActorSocialSettings` directly with arbitrary patch keys (e.g., `{ actor_id: victimId, created_at: '...' }`).
Result: BYPASSED — DAL applies no column allowlist. (See BW-SOCIAL-005.)

---

## 7. Exploitability Assessment

| Finding | Exploitability | Precondition |
|---|---|---|
| BW-SOCIAL-001 | HIGH — single call with spoofed requesterActorId | Authenticated session |
| BW-SOCIAL-002 | MEDIUM — requires hook call site to pass arbitrary followerActorId | Authenticated session + call site access |
| BW-SOCIAL-003 | LOW — UI disabled guard partially mitigates; caller trust required | Authenticated session + component prop control |
| BW-SOCIAL-005 | HIGH — direct DAL call bypasses controller allowlist | Authenticated session; no route-level barrier known |
| BW-SOCIAL-006 | UNRESOLVED — depends on RLS state (unverified) | Requires DB audit to resolve |
| BW-SOCIAL-007 | UNRESOLVED — depends on RLS state (unverified) | Requires DB audit to resolve |
| BW-SOCIAL-008 | LOW — replay/stability only, not a data integrity risk | Authenticated session |

---

## 8. Source Verification Summary

| Finding | Verification | Citation |
|---|---|---|
| BW-SOCIAL-001 | SOURCE_VERIFIED | `useSendFollowRequest.js:4-6`, `followRequests.controller.js:23-68` |
| BW-SOCIAL-002 | SOURCE_VERIFIED | `useFollowActorToggle.js:8,19,29,40` |
| BW-SOCIAL-003 | SOURCE_VERIFIED | `useSubscribeAction.js:17-23,51,89-93,117-121` |
| BW-SOCIAL-004 | SOURCE_VERIFIED | `followRequests.controller.js:23-68` |
| BW-SOCIAL-005 | SOURCE_VERIFIED | `actorSocialSettings.dal.js:39-50`, `vportSocialSettings.controller.js:35-37` |
| BW-SOCIAL-006 | SCANNER_LOW_CONF + SOURCE_VERIFIED (DAL) | `actorFollows.dal.js:24-69,75-97` |
| BW-SOCIAL-007 | SOURCE_VERIFIED (comment claim) | `actorSocialSettings.dal.js:37-38` |
| BW-SOCIAL-008 | SOURCE_VERIFIED | `actorFollows.dal.js:84-96` |
| BW-SOCIAL-009 | SOURCE_VERIFIED | `useIncomingFollowRequests.js:30-34` |
| BW-SOCIAL-010 | SOURCE_VERIFIED | `follow.controller.js:97-105`, `followRequests.controller.js:57-65,107-115` |

All BYPASSED findings carry SOURCE_VERIFIED citations.

---

## 9. Confidence Summary

- CRITICAL findings: 0
- HIGH findings: 3 (BW-SOCIAL-001, BW-SOCIAL-005, BW-SOCIAL-006)
- MEDIUM findings: 2 (BW-SOCIAL-002, BW-SOCIAL-007)
- LOW findings: 2 (BW-SOCIAL-003, BW-SOCIAL-008)
- INFO findings: 3 (BW-SOCIAL-004, BW-SOCIAL-009, BW-SOCIAL-010)

BYPASSED exploit chains confirmed: 2 (BW-SOCIAL-001, BW-SOCIAL-005)
UNRESOLVED chains (RLS-dependent): 2 (BW-SOCIAL-006, BW-SOCIAL-007)
BLOCKED chains: 5+

---

## 10. §9 Invariant Attack Map

| Invariant | Status | Finding |
|---|---|---|
| I-1: No spoofed follow | BYPASSED | BW-SOCIAL-001 |
| I-2: No force-unfollow | PARTIAL (caller-trust) | BW-SOCIAL-002 |
| I-3: No unauthorized accept/decline | BLOCKED | — |
| I-4: No inbox read cross-actor | BLOCKED | — |
| I-5: No arbitrary settings patch keys | BYPASSED | BW-SOCIAL-005 |

Note: All invariants are UNANCHORED — sourced from BW inference, not from BEHAVIOR.md §9. BEHAVIOR.md must be authored before these can be formally governed.

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md is a 9-line PLACEHOLDER. No §4 Failure Paths or §9 Must Never Happen sections exist.

Consequence: All BW attack scenarios were designed from source inference, not from a formal contract. This means:
1. The attack surface is potentially incomplete — there may be security-relevant behaviors not covered here.
2. The governance gap itself is a HIGH-severity finding (carried as MISSING_BEHAVIOR_CONTRACT from VENOM run).
3. Until BEHAVIOR.md §9 is authored and reviewed, no §9 invariant can be considered formally asserted or THOR-gated.

---

## 12. THOR Impact

### THOR Release Blockers (carried from VENOM + new BW findings)

| Finding | Severity | Type | THOR Block Reason |
|---|---|---|---|
| VEN-SOCIAL-001 | HIGH | VENOM | RLS on social_follow_requests unverified; regression tests WILL FAIL |
| VEN-SOCIAL-002 | HIGH | VENOM | ctrlSendFollowRequest missing ownership gate (confirmed BYPASSED by BW-SOCIAL-001) |
| VEN-SOCIAL-003 | HIGH | VENOM | dalUpdateActorSocialSettings no DAL-layer allowlist (confirmed BYPASSED by BW-SOCIAL-005) |
| BW-SOCIAL-001 | HIGH | BW | BYPASSED: spoofed follow confirmed — no assertingActorId in ctrlSendFollowRequest |
| BW-SOCIAL-005 | HIGH | BW | BYPASSED: DAL-layer column allowlist absent — arbitrary patch keys reach actor_social_settings |
| BW-SOCIAL-006 | HIGH | BW | UNRESOLVED: RLS on vc.actor_follows not verified — DB audit required before release |
| MISSING_BEHAVIOR_CONTRACT | HIGH | GOVERNANCE | BEHAVIOR.md is a placeholder — no §9 invariants defined or auditable |

THOR Release Blocker: YES — 7 open HIGH findings across VENOM + BW

### Non-blocking (must track)

| Finding | Severity | Type |
|---|---|---|
| VEN-SOCIAL-004 | MEDIUM | VENOM |
| BW-SOCIAL-002 | MEDIUM | BW |
| BW-SOCIAL-007 | MEDIUM | BW |
| VEN-SOCIAL-005 | LOW | VENOM |
| BW-SOCIAL-003 | LOW | BW |
| BW-SOCIAL-008 | LOW | BW |

---

## 13. SPIDER-MAN Test Requirements

The following tests are required before THOR clearance:

| Test ID | Coverage Target | Finding |
|---|---|---|
| SP-SOCIAL-001 | `ctrlSendFollowRequest` must throw when `assertingActorId` does not match `requesterActorId` | BW-SOCIAL-001 |
| SP-SOCIAL-002 | `ctrlSendFollowRequest` must throw when `assertingActorId` is null | BW-SOCIAL-001 |
| SP-SOCIAL-003 | `dalUpdateActorSocialSettings` must reject patch with unknown keys (or: controller must enforce allowlist and DAL tests must not allow bypass) | BW-SOCIAL-005 |
| SP-SOCIAL-004 | `useFollowActorToggle` must bind assertingActorId from session, not from input parameter | BW-SOCIAL-002 |
| SP-SOCIAL-005 | RLS on `vc.actor_follows` verified: an actor cannot insert a follow edge for another actor's follower_actor_id | BW-SOCIAL-006 |
| SP-SOCIAL-006 | RLS on `vc.actor_social_settings` verified: update blocked for non-owning actor | BW-SOCIAL-007 |
| SP-SOCIAL-007 | `ctrlUnsubscribe` regression test suite from unsubscribe.controller.test.js must pass (V-SUB-002) | VEN-SOCIAL-001 |
| SP-SOCIAL-008 | `ctrlSubscribe` V-SUB-001 regression block must pass (currently marked WILL FAIL in test comments) | VEN-SOCIAL-001 |

Note: SP-SOCIAL-007 and SP-SOCIAL-008 correspond to existing regression test blocks marked "WILL FAIL" in the test files. These must pass before THOR.
