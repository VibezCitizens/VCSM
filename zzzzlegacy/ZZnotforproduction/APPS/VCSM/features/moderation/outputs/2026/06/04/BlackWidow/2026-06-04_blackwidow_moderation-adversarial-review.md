# BLACKWIDOW V2 — Adversarial Runtime Verification Report
# Feature: moderation | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Type | BLACKWIDOW V2 Adversarial Review |
| Feature | moderation |
| App | VCSM |
| Run Date | 2026-06-04 |
| Analyst | BLACKWIDOW V2 (BW2.5 V2 Protocol) |
| Protocol Version | BW2.9 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/moderation/outputs/2026/06/04/BlackWidow/ |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Version | 1.1.0 |
| Maps Generated | 2026-06-04T19:48:25.152Z |
| Freshness | FRESH (~7h old) |
| Security Paths (feature) | 13 |
| Security Paths (platform total) | 598 |
| Callgraph Nodes (feature) | 65 |
| Callgraph Edges (feature) | 67 |
| Write Execution Paths | 0 (no resolved routes — all LOW confidence) |
| RPC Execution Paths | 0 (no resolved routes) |

---

## 3. Scanner Inputs

```
security-path-map.json     → 13 moderation paths, ALL confidence=LOW, ALL route=null
callgraph.json             → 65 nodes across 8 layers (adapter/barrel/component/controller/dal/hook/model/module)
write-execution-map.json   → 0 moderation write paths resolved
rpc-execution-map.json     → 0 moderation RPC paths resolved
```

---

## 4. Attack Surface Inventory

### 4.1 Security Paths

All 13 security paths for moderation have `confidence=LOW` and `route=null`. Per BW-002, all 13 are PRIMARY ATTACK TARGETS.

| Surface Function | Schema | Table/Op | Operation |
|---|---|---|---|
| insertReportRow | moderation | reports | INSERT |
| updateReportRowStatus | moderation | reports | UPDATE |
| insertReportEventRow | moderation | report_events | INSERT |
| insertModerationActionRow | moderation | actions | INSERT |
| insertModerationActionDAL | moderation | actions | INSERT |
| dalDeleteConversationHideAction | moderation | actions | DELETE |
| hidePostRow | vc | posts | UPDATE |
| hideMessageRow | chat | messages | UPDATE |
| upsertInboxEntryFolder | chat | inbox_entries | UPSERT |
| updateConversationInboxFolderDAL | chat | inbox_entries | UPDATE |
| updateConversationInboxLastMessageDAL | chat | inbox_entries | UPDATE |
| isModerationAuthorizedDAL | moderation | (RPC) | RPC |

### 4.2 Hook Entry Points (UI-accessible write paths)

| Hook | Write Path |
|---|---|
| useReportFlow → submit() | createReportController → insertReportRow + insertReportEventRow |
| useHidePostForActor | hidePostForActor → insertModerationActionDAL (moderation.actions) |
| usePostVisibility → hidePost | hidePostForActor → insertModerationActionDAL |
| usePostVisibility → unhidePost | unhidePostForActor → insertModerationActionDAL |
| useCommentVisibility → hideComment | hideCommentForActor → insertModerationActionDAL |
| useCommentVisibility → unhideComment | unhideCommentForActor → insertModerationActionDAL |
| useConversationCover → undoConversationCover | undoConversationCover → dalDeleteConversationHideAction + updateConversationInboxFolderDAL |

### 4.3 DAL Write Surfaces by Layer

| DAL Function | Auth Guard | Ownership Filter |
|---|---|---|
| insertReportRow | None (RLS only) | reporter_actor_id=caller-supplied |
| updateReportRowStatus | None (RLS only, no .eq ownership) | id=reportId only |
| insertReportEventRow | None (RLS only) | actorId=caller-supplied |
| insertModerationActionDAL | actionType allowlist only | actor_id=caller-supplied |
| insertModerationActionRow | None | actor_id=caller-supplied |
| dalDeleteConversationHideAction | actorId required guard | .eq("actor_id", actorId) via read |
| hidePostRow | None | .eq("id", postId) only |
| hideMessageRow | None | .eq("id", messageId) only |
| updateConversationInboxFolderDAL | None | .eq("actor_id", actorId) + .eq("conversation_id", ...) |
| updateConversationInboxLastMessageDAL | None | .eq("actor_id", actorId) + .eq("conversation_id", ...) |

---

## 5. Scanner Signals

| Signal | Value |
|---|---|
| HIGH confidence write surfaces | 12 (all DAL-layer, confirmed by AST extraction) |
| LOW confidence paths (unresolved routes) | 13 / 13 (100%) |
| Hook-to-DAL chains confirmed in callgraph | 7 |
| Moderator-gated paths | 2 (hideReportedObjectController, dismissReportController) |
| Personal actor paths (no moderator gate) | 5 (post/comment/conversation hide/unhide, report creation) |
| Cross-schema write surfaces | 3 schemas: moderation, vc, chat |

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)

**Target: createReportController / insertReportRow**

The `reporterActorId` field is accepted as a controller parameter with only a null check (report.controller.js:43). It flows directly into `insertReportRow` as `reporter_actor_id` (reports.dal.js:81-82) with no session-binding verification. An authenticated user who obtains another actor's actorId can submit a report attributed to that actor.

Attack harness:
```
createReportController({
  reporterActorId: victim_actor_id,  // attacker-supplied, not session-bound
  objectType: 'post',
  objectId: any_valid_post_id,
  reasonCode: 'spam'
})
```

Result: BYPASSED at the controller+DAL layer. Blocked only if moderation.reports INSERT RLS enforces `reporter_actor_id = auth.uid()` — this RLS has been recorded as UNVERIFIED in VEN-MODERATION-001.

**Target: hidePostForActor / hideCommentForActor**

The `actorId` field in postVisibility.controller.js:54-62 and commentVisibility.controller.js:88-107 is caller-supplied. There is no session binding — the caller specifies `actorId` directly. An actor can supply any other actor's UUID. The DAL writes `actor_id=actorId` to moderation.actions (moderationActions.dal.js:61-62) with no ownership verification beyond the parameter guard (`!actorId` check). This means post/comment hide actions can be written to the moderation.actions table attributed to any actor.

Attack harness:
```
hidePostForActor({
  actorId: victim_actor_id,  // attacker writes hide-action for victim
  postId: any_post_id,
})
```

Result: BYPASSED at controller+DAL layer. Blocked only if moderation.actions INSERT RLS enforces `actor_id = auth.uid()` — UNVERIFIED (VEN-MODERATION-002).

**Finding: BW-MOD-001 — CRITICAL (Ownership Bypass: reporter_actor_id and actor_id are fully caller-supplied with no session binding)**

---

**Target: moderationActions.controller.js — hideReportedObjectController, dismissReportController**

Both controllers call `assertModerationAccessController(moderatorActorId)` first (moderationActions.controller.js:27, 114). This delegates to `isModerationAuthorizedDAL(actorId)` which calls `moderation.is_current_user_moderator()` on the server side using `auth.uid()` — the actorId parameter is ignored server-side; the RPC resolves the actual session user (assertModerationAccess.dal.js:20-24).

Attack harness: A non-moderator calls hideReportedObjectController with any moderatorActorId. The RPC `is_current_user_moderator()` uses `auth.uid()`, not the supplied actorId. Returns false → FORBIDDEN thrown. The mismatch between the actorId parameter and the RPC's server-side resolution means the supplied actorId acts as a label only, but authorization resolves from the real session.

Result: BLOCKED for privileged moderator actions. The server-side RPC correctly uses `auth.uid()`.

**Note — Semantic gap finding:** The `actorId` parameter accepted by `assertModerationAccessController` (assertModerationAccess.controller.js:8) is advertised as the actor to authorize, but `isModerationAuthorizedDAL` ignores it and resolves from `auth.uid()` (assertModerationAccess.dal.js comment line 21). This creates a documentation/semantic gap: a developer could add an actorId-specific bypass and believe it is authorized. Finding: BW-MOD-007.

---

### B. SESSION MUTATION (§5.2)

**Target: useReportFlow hook**

`useReportFlow` accepts `reporterActorId` as a hook parameter (useReportFlow.js:27). This value is passed directly to `createReportController` (useReportFlow.js:62). The hook does not read from an identity session internally — `reporterActorId` is supplied by the parent component.

Attack surface: A component that passes a tampered `reporterActorId` to `useReportFlow`. In the adapter `useReportFlow.adapter.js`, the hook is re-exported directly with no wrapper enforcement. If the calling component supplies a stale or incorrect `reporterActorId`, the report will be attributed to the wrong actor.

Result: PARTIAL. The actor identity is propagated from the component, not the session. Blocked only at the RLS layer (UNVERIFIED). Finding: BW-MOD-002.

**Target: useHidePostForActor hook**

The hook `useHidePostForActor` (useHidePostForActor.js:5) accepts `actorId` as a callback parameter with no session guard. The hook has no reference to a session or identity context — it is a thin wrapper that trusts the actorId provided at call time.

Null/undefined test: If `actorId = null`, guard at line 7 fires. If `actorId = ""`, falsy check fires. If `actorId = undefined`, falsy check fires. All null/empty cases are caught.

Stale/wrong actor test: If `actorId = different_valid_uuid`, the guard passes and the write proceeds. No session cross-check.

Result: PARTIAL. Null-safety is present. Wrong-actor-id is not guarded. Depends on RLS (UNVERIFIED).

---

### C. RUNTIME ABUSE (§5.3)

**Target: hideReportedObjectController and dismissReportController (admin/moderator paths)**

Both controllers are protected by `assertModerationAccessController` which resolves from the DB session via SECURITY DEFINER RPC. These paths are correctly gated.

**Target: Personal hide/unhide controllers (hidePostForActor, unhidePostForActor, hideCommentForActor, unhideCommentForActor)**

These are personal-actor paths — any actor can hide content for themselves. There is no actor kind check (no `kind === 'user'` validation). A vport actor could call hidePostForActor and write a hide action attributed to that vport. This is not blocked at any layer above RLS. Whether moderation.actions RLS permits vport actors to write is unverified.

Actor kind check audit: postVisibility.controller.js has no actor kind guard (lines 53-75). commentVisibility.controller.js has no actor kind guard (lines 87-108).

Result: PARTIAL — no actor kind enforcement for personal hide paths. Finding: BW-MOD-005.

**Target: undoConversationCover**

`undoConversationCover` (undoConversationCover.controller.js:8) accepts `actorId` with only a falsy guard (line 9). No moderator check, no actor kind check. Any actor can undo a conversation cover by supplying a conversationId. The DAL calls include `.eq("actor_id", actorId)` filters, which constrain the update to rows owned by the supplied actorId — this is correct. However the actorId is still caller-supplied.

Result: PARTIAL — scoped to actorId rows via DAL filter but actorId is not session-verified.

---

### D. RLS VERIFICATION (§5.4)

Based on source review and VENOM findings (VEN-MODERATION-001, VEN-MODERATION-002, VEN-MODERATION-004):

| Table | RLS Verified | VENOM Status |
|---|---|---|
| moderation.reports INSERT | UNVERIFIED | VEN-MODERATION-001 OPEN |
| moderation.reports UPDATE | UNVERIFIED | VEN-MODERATION-004 OPEN |
| moderation.actions INSERT | UNVERIFIED | VEN-MODERATION-002 OPEN |
| moderation.actions DELETE | UNVERIFIED | (TOCTOU noted VEN-MODERATION-008) |
| moderation.report_events INSERT | UNVERIFIED | no explicit VENOM finding |
| vc.posts UPDATE (hide) | UNVERIFIED | VEN-MODERATION-003 context |
| chat.messages UPDATE (hide) | UNVERIFIED | VEN-MODERATION-003 context |
| chat.inbox_entries UPDATE | UNVERIFIED | no explicit VENOM finding |

`updateReportRowStatus` DAL (reports.dal.js:147-156): The update query applies `.eq('id', reportId)` only. There is no ownership filter such as `.eq('assigned_actor_id', moderatorActorId)`. Moderator authorization is enforced only at the controller layer (assertModerationAccessController). A non-moderator with direct DAL access (or if controller gate is bypassed) can update any report to any status.

Result: HIGH. The reports UPDATE surface has no DB-level ownership constraint — any row matched by `id` will be updated if RLS passes. Finding: BW-MOD-003.

---

### E. VIEWER CONTEXT FUZZING (§5.5)

**createReportController — null actorId:**
- Line 43: `if (!reporterActorId)` → returns `{ok: false, error}`. BLOCKED.

**createReportController — null objectType or objectId:**
- Line 46: `if (!objectType || !objectId)` → returns `{ok: false, error}`. BLOCKED.

**hidePostForActor — null actorId:**
- Line 59: `if (!actorId) throw new Error(...)`. BLOCKED.

**hideCommentForActor — null actorId:**
- Line 94: `if (!actorId) throw new Error(...)`. BLOCKED.

**assertModerationAccessController — null actorId:**
- Line 9: `if (!actorId)` → throws FORBIDDEN error. BLOCKED.

**undoConversationCover — null actorId:**
- Line 9: `if (!actorId || !conversationId) return {ok: false}`. BLOCKED (silent fail).

**insertModerationActionDAL — null actionType:**
- Line 51: checks ALLOWED_ACTION_TYPES set before any DB call. BLOCKED.

**Partial gap — insertReportRow with null status:**
- The DAL defaults `status = 'open'` (reports.dal.js:74) but does not validate `reasonCode` against an allowlist. A caller could submit an arbitrary reasonCode string not in REPORT_REASONS. This would write to the DB unchecked.

Result: PARTIAL — no reasonCode allowlist validation in controller or DAL. Finding: BW-MOD-004.

---

### F. MUTATION REPLAY (§5.6)

**Target: hideReportedObjectController (moderator action on already-actioned report)**

State machine check at moderationActions.controller.js:35:
```javascript
if (reportRow.status === 'actioned') {
  return { ok: true, report: toDomainReport(reportRow), didChange: false }
}
```
If status is `'actioned'`, returns a no-op domain result. BLOCKED for the `actioned` status.

However: status `'dismissed'` is not covered in this idempotency check for `hideReportedObjectController`. A dismissed report can have `hideReportedObjectController` called on it — the status guard only checks for `'actioned'` (line 35), not `'dismissed'`. The flow would proceed to apply a hide action on content that was previously dismissed.

Attack harness:
```
// Report was dismissed (no_action) previously
hideReportedObjectController({
  moderatorActorId: valid_mod_id,
  reportId: already_dismissed_report_id
})
// Proceeds to hidePostRow + updateReportRowStatus('actioned')
// A dismissed report gets re-actioned
```

Result: BYPASSED. A dismissed report can be re-escalated to actioned by any moderator, bypassing the dismissed terminal state. Finding: BW-MOD-006.

**Target: dismissReportController (replay on actioned)**

At moderationActions.controller.js:120:
```javascript
if (reportRow.status === 'dismissed' || reportRow.status === 'actioned') {
  return { ok: true, report: toDomainReport(reportRow), didChange: false }
}
```
Both terminal states are checked. BLOCKED.

**Target: createReportController (duplicate report)**

Deduplication only applies when `dedupeKey` is provided (report.controller.js:54). If `dedupeKey` is null (caller does not supply it), the controller will attempt to create a new report regardless of existing reports for the same target. No duplicate detection otherwise.

Result: PARTIAL — dedupe is opt-in, not enforced. A user can file unlimited reports against the same object by omitting or varying `dedupeKey`. Finding: BW-MOD-008 (LOW).

---

### G. HYDRATION POISONING (§5.7)

Review of all 5 hooks and 6 controllers: none interact with a global hydration store, React context cache, or in-memory shared store for actor summaries. The visibility hooks return computed Sets from DB queries; useConversationCover uses local `useState`. No hydration store is involved in any moderation write path.

Result: NOT APPLICABLE. No hydration poisoning surface identified.

---

### H. URL SURFACE (§5.9)

Review of all controller files, model files, and DAL files: no notification linkPath construction, no share link building, and no deep link generation is present in the moderation feature. The feature does not produce public-facing URLs.

`toDomainReport` in report.model.js returns domain objects with `id` fields (raw UUIDs) but these are internal domain objects used by the React layer, not URL construction. No public URL exposure.

Result: NOT APPLICABLE for deep link exposure. No URL surface found.

---

### I. §9 INVARIANT ATTACK (HIGHEST PRIORITY)

BEHAVIOR.md is PLACEHOLDER (status confirmed at read time). No §4 Failure Paths and no §9 Must Never Happen sections exist. Per protocol: all §9 invariants are UNANCHORED.

Because no formal invariants are defined, the attack targets were sourced from implicit behavioral expectations inferred from the code structure:

**Inferred Invariant 1: A non-moderator must never be able to hide or unhide a post globally (vc.posts)**
- Attack: Direct call to `hideReportedObjectController` with a non-moderator actorId.
- Verification: `assertModerationAccessController` calls `isModerationAuthorizedDAL` → `is_current_user_moderator()` RPC using `auth.uid()`. Returns false for non-moderator → throws FORBIDDEN. BLOCKED.

**Inferred Invariant 2: An actor must never be able to file a report attributed to another actor**
- Attack: `createReportController({reporterActorId: victim_id, ...})` with valid session for attacker.
- Verification: Controller only checks `!reporterActorId` (null guard). No session binding. Success depends on RLS. RLS is UNVERIFIED. BYPASSED at application layer.

**Inferred Invariant 3: A moderation action must never be recorded without a valid actor identity**
- Attack: `insertModerationActionDAL({actorId: null, ...})`.
- Verification: DAL guard at line 47: `if (!actorId) throw new Error(...)`. BLOCKED at DAL.

**Inferred Invariant 4: Content should never be hidden from all users without a moderator action**
- Attack: Call `hidePostRow` directly without going through `hideReportedObjectController`.
- Verification: `hidePostRow` is an exported DAL function (reports.dal.js:237). It has no auth guard. A caller with direct access could call it and update `vc.posts.is_hidden=true` for any post, attributed to any `moderatorActorId`. Blocked only by RLS on `vc.posts` UPDATE — UNVERIFIED. BYPASSED at application layer.
- Note: VEN-MODERATION-003 already records this as HIGH finding.

**Inferred Invariant 5: Conversation cover undo must only affect the requesting actor's own inbox**
- Attack: `undoConversationCover({actorId: victim_id, conversationId: victim_convo_id})`.
- Verification: `updateConversationInboxFolderDAL` applies `.eq("actor_id", actorId)` (conversationCover.write.dal.js:12). The update is scoped. However `actorId` is caller-supplied. If RLS on `chat.inbox_entries` does not enforce ownership, an attacker could modify another user's inbox folder. PARTIAL.

---

## 7. Exploitability Assessment

| Finding ID | Severity | Description | Result | Chain Type | Confidence |
|---|---|---|---|---|---|
| BW-MOD-001 | CRITICAL | reporter_actor_id and actor_id are caller-supplied with no session binding — reporter identity and hide-action actor attribution can be forged | BYPASSED (application layer) | Single-step | [SOURCE_VERIFIED] |
| BW-MOD-002 | HIGH | useReportFlow accepts reporterActorId from component prop with no session enforcement — stale or wrong actorId propagates silently to write | BYPASSED (application layer) | Single-step | [SOURCE_VERIFIED] |
| BW-MOD-003 | HIGH | updateReportRowStatus has no ownership filter — any report row matched by reportId will be updated if RLS passes; moderator gating is controller-only | PARTIAL | Single-step | [SOURCE_VERIFIED] |
| BW-MOD-004 | MEDIUM | reasonCode is not validated against REPORT_REASONS allowlist in controller or DAL — arbitrary string values can be written to moderation.reports | BYPASSED | Single-step | [SOURCE_VERIFIED] |
| BW-MOD-005 | MEDIUM | Personal hide/unhide paths have no actor kind check — vport actors can write hide actions to moderation.actions | BYPASSED (no kind guard) | Single-step | [SOURCE_VERIFIED] |
| BW-MOD-006 | MEDIUM | hideReportedObjectController does not guard against re-actioning a previously dismissed report — dismissed terminal state can be overridden | BYPASSED | Single-step | [SOURCE_VERIFIED] |
| BW-MOD-007 | LOW | assertModerationAccessController accepts actorId but isModerationAuthorizedDAL ignores it — semantic gap creates misleading authorization API | INFO | N/A | [SOURCE_VERIFIED] |
| BW-MOD-008 | LOW | Report deduplication is opt-in (dedupeKey must be supplied by caller) — no server-side rate limit or duplicate enforcement | PARTIAL | Replay | [SOURCE_VERIFIED] |
| BW-MOD-009 | HIGH | BEHAVIOR.md is PLACEHOLDER — no §9 Must Never Happen invariants; all security properties are unanchored and unverifiable against a contract | UNRESOLVED | N/A | [SCANNER_LOW_CONF] |
| BW-MOD-010 | HIGH | hidePostRow and hideMessageRow exported DAL functions have no auth guard — direct callers can globally hide any post/message bypassing moderator gate (VEN-MODERATION-003 cross-ref) | BYPASSED (application layer) | Single-step | [SOURCE_VERIFIED] |

---

## 8. Source Verification Summary

All BYPASSED findings include file:line citations below:

| Finding | File | Line(s) | Evidence |
|---|---|---|---|
| BW-MOD-001 | report.controller.js | 43, 75-93 | createReportController null guard only; reporterActorId flows to insert |
| BW-MOD-001 | postVisibility.controller.js | 54-62 | hidePostForActor: actorId=caller-supplied, flows to insertModerationActionDAL |
| BW-MOD-001 | commentVisibility.controller.js | 88-107 | hideCommentForActor: actorId=caller-supplied |
| BW-MOD-002 | useReportFlow.js | 27, 60-72 | reporterActorId from hook param to createReportController |
| BW-MOD-003 | reports.dal.js | 147-156 | updateReportRowStatus: .eq('id', reportId) only, no ownership column |
| BW-MOD-004 | report.controller.js | 49, 75-93 | reasonCode null check only; no REPORT_REASONS allowlist check |
| BW-MOD-005 | postVisibility.controller.js | 53-75 | no actor kind check in hidePostForActor |
| BW-MOD-005 | commentVisibility.controller.js | 87-108 | no actor kind check in hideCommentForActor |
| BW-MOD-006 | moderationActions.controller.js | 35 | only checks status==='actioned'; does not block dismissed |
| BW-MOD-007 | assertModerationAccess.dal.js | 19-24, comment at 21 | actorId retained for contract; RPC resolves from auth.uid() |
| BW-MOD-008 | report.controller.js | 53-70 | dedupeKey guard only; deduplication skipped when dedupeKey=null |
| BW-MOD-010 | reports.dal.js | 237-252, 258-273 | hidePostRow/hideMessageRow exported with no auth guard |

---

## 9. Confidence Summary

| Category | Count | Notes |
|---|---|---|
| BYPASSED with [SOURCE_VERIFIED] | 6 | BW-MOD-001, 002, 004, 005, 006, 010 |
| PARTIAL with [SOURCE_VERIFIED] | 2 | BW-MOD-003, 008 |
| BLOCKED with [SOURCE_VERIFIED] | 3 | Moderator gate (assertModerationAccessController), null guards across all controllers |
| UNRESOLVED [SCANNER_LOW_CONF] | 1 | BW-MOD-009 (missing contract) |
| INFO [SOURCE_VERIFIED] | 1 | BW-MOD-007 |
| All BYPASSED claims | Source-verified with line citations | Per BW protocol |

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md is PLACEHOLDER. No formal §9 invariants exist. Status: ALL §9 INVARIANTS UNANCHORED.

| Inferred Invariant | Attack Designed | Result |
|---|---|---|
| Non-moderator cannot globally hide content | hideReportedObjectController with non-mod actor | BLOCKED (RPC uses auth.uid()) |
| Actor cannot file report attributed to another actor | createReportController with victim's actorId | BYPASSED at app layer (BW-MOD-001) |
| Moderation action requires valid actor identity | insertModerationActionDAL null actorId | BLOCKED (DAL guard line 47) |
| vc.posts global hide requires moderator | Direct hidePostRow call | BYPASSED (BW-MOD-010) |
| Conversation inbox undo scoped to requesting actor | undoConversationCover with victim actorId | PARTIAL (DAL .eq filter, RLS unverified) |

---

## 11. Behavior Contract Attack Summary

| Contract Status | Assessment |
|---|---|
| BEHAVIOR.md | PLACEHOLDER — no §4, no §9 |
| Invariant anchoring | NONE — all security properties are inferred from source only |
| Impact on THOR | THOR BLOCKER remains open (VEN-MODERATION-007) |
| §9 attacks designed | 5 inferred invariants tested |
| §9 attacks BYPASSED | 2 (reporter attribution, global post hide) |

The PLACEHOLDER status means there are no formal invariants to anchor the security review against. All findings in this report are based on source-inferred expected behavior. Until BEHAVIOR.md is promoted to ACTIVE with §5 Security Rules and §9 Must Never Happen invariants, any future source change may silently violate undocumented expectations.

---

## 12. THOR Impact

| Finding | Severity | THOR Blocker | Reason |
|---|---|---|---|
| BW-MOD-001 | CRITICAL | YES | Actor identity forgery in reporter attribution and personal hide actions — confirmed BYPASSED at application layer |
| BW-MOD-002 | HIGH | YES | Stale actorId propagation from React props — hook-level identity gap |
| BW-MOD-003 | HIGH | YES | updateReportRowStatus has no ownership filter — report hijacking if RLS is misconfigured |
| BW-MOD-009 | HIGH | YES (existing VEN-MODERATION-007) | BEHAVIOR.md PLACEHOLDER — governance blocker |
| BW-MOD-010 | HIGH | YES | Exported DAL functions without auth guard — existing VEN-MODERATION-003 cross-ref |
| BW-MOD-004 | MEDIUM | NO | reasonCode allowlist — data quality issue, not authentication bypass |
| BW-MOD-005 | MEDIUM | NO | Actor kind check gap — enforcement gap, blocked by RLS if configured |
| BW-MOD-006 | MEDIUM | NO | Dismissed-to-actioned replay — moderator-only path, scope-limited |
| BW-MOD-007 | LOW | NO | Semantic/documentation gap only |
| BW-MOD-008 | LOW | NO | Opt-in dedupe — abuse-rate concern, not security bypass |

**Active THOR blockers: BW-MOD-001, BW-MOD-002, BW-MOD-003, BW-MOD-009 (carry-forward), BW-MOD-010 (cross-ref VEN-MODERATION-003)**

---

## 13. SPIDER-MAN Test Requirements

The following test cases are required before THOR release clearance. These are test specifications only — implementation is deferred to the SPIDER-MAN command.

| Test ID | Target | Scenario | Expected |
|---|---|---|---|
| SM-MOD-001 | createReportController | Supply reporterActorId != session actor | Should fail OR RLS should block insert |
| SM-MOD-002 | insertReportRow (RLS) | Insert with reporter_actor_id != auth.uid() | DB rejects with RLS violation |
| SM-MOD-003 | hidePostForActor | Supply actorId != session actor | Should fail OR RLS should block insert |
| SM-MOD-004 | insertModerationActionDAL (RLS) | Insert with actor_id != auth.uid() | DB rejects with RLS violation |
| SM-MOD-005 | updateReportRowStatus | Update report row without moderator session | Should be blocked by RLS |
| SM-MOD-006 | createReportController | Submit reasonCode not in REPORT_REASONS | Should return error or be normalized |
| SM-MOD-007 | hideReportedObjectController | Call on a dismissed report | Should return no-op (currently BYPASSED) |
| SM-MOD-008 | assertModerationAccessController | Call with any actorId in non-moderator session | Should throw FORBIDDEN |
| SM-MOD-009 | hidePostRow direct call | Call without going through moderationActions controller | Should be blocked by vc.posts RLS |
| SM-MOD-010 | createReportController deduplication | Submit identical report twice without dedupeKey | Both inserts should succeed (gap documented) |
| SM-MOD-011 | hideCommentForActor | vport actor calls hideComment | Should be blocked by actor kind check (currently BYPASSED) |
| SM-MOD-012 | undoConversationCover | Call with a different actor's conversationId | DAL .eq filter should prevent cross-actor modification |
