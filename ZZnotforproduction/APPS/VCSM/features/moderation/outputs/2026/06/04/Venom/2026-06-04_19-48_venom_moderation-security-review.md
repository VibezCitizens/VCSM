# VENOM V2 Security Review — moderation

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report ID | VENOM-MODERATION-2026-06-04 |
| Feature | moderation |
| Application | VCSM |
| VENOM Version | V2 |
| Reviewer | VENOM (automated sheriff) |
| Review Date | 2026-06-04 |
| Scanner Version | 1.1.0 |
| Source Root | apps/VCSM/src/features/moderation/ |
| Doc Root | ZZnotforproduction/APPS/VCSM/features/moderation/ |
| Output Path | ZZnotforproduction/APPS/VCSM/features/moderation/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_moderation-security-review.md |

---

## 2. Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At                  | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z      | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs

| Signal Type | Count |
|---|---|
| Write Surfaces | 12 |
| RPCs | 1 |
| Security Paths | 13 |
| Write Execution Paths | 12 |
| RPC Execution Paths | 1 |
| Edge Functions | 0 |

### Write Surfaces

| # | Operation | Schema | Table/RPC | Function | File |
|---|---|---|---|---|---|
| 1 | rpc | moderation | is_current_user_moderator | isModerationAuthorizedDAL | assertModerationAccess.dal.js |
| 2 | update | chat | inbox_entries | updateConversationInboxFolderDAL | conversationCover.write.dal.js |
| 3 | update | chat | inbox_entries | updateConversationInboxLastMessageDAL | conversationCover.write.dal.js |
| 4 | delete | moderation | actions | dalDeleteConversationHideAction | moderationActions.dal.js |
| 5 | insert | moderation | actions | insertModerationActionDAL | moderationActions.dal.js |
| 6 | insert | moderation | reports | insertReportRow | reports.dal.js |
| 7 | insert | moderation | report_events | insertReportEventRow | reports.dal.js |
| 8 | insert | moderation | actions | insertModerationActionRow | reports.dal.js |
| 9 | update | moderation | reports | updateReportRowStatus | reports.dal.js |
| 10 | update | vc | posts | hidePostRow | reports.dal.js |
| 11 | update | chat | messages | hideMessageRow | reports.dal.js |
| 12 | upsert | chat | inbox_entries | upsertInboxEntryFolder | reports.dal.js |

### RPCs

| RPC | Schema | Caller | File |
|---|---|---|---|
| is_current_user_moderator | moderation | isModerationAuthorizedDAL | assertModerationAccess.dal.js |

### Edge Functions

None.

---

## 4. Security Surface Inventory

### Surfaces by Trust Class

| Surface | Trust Class | Auth Required | Moderator-Only | Notes |
|---|---|---|---|---|
| createReportController | Authenticated User | Yes (reporterActorId guard) | No | Any authenticated actor can file a report |
| hideReportedObjectController | Moderator | Yes + assertModerationAccessController | Yes | Admin-tier action: hides post or message globally |
| dismissReportController | Moderator | Yes + assertModerationAccessController | Yes | Admin-tier action: closes report without action |
| hidePostForActor / commentVisibility | Authenticated User | actorId required | No | Personal "local hide" — actor hides from own view |
| unhidePostForActor / unhideCommentForActor | Authenticated User | actorId required | No | Personal undo — actor unhides from own view |
| undoConversationCover | Authenticated User | actorId required | No | Actor-scoped conversation cover undo |
| updateReportRowStatus (DAL) | Moderator (via controller) | Controller-gated | Yes | Called only from dismissReport / hideReportedObject |
| hidePostRow / hideMessageRow (DAL) | Moderator (via controller) | Controller-gated | Yes | Global content suppression |
| insertReportRow (DAL) | Any caller | None at DAL layer | No | No session check in DAL |
| insertModerationActionDAL | Any caller | None at DAL layer | No | No session check in DAL — user-facing |
| upsertInboxEntryFolder | Any caller | None at DAL layer | No | Scoped by actorId parameter |

---

## 5. Scanner Signals

All 13 security paths have `access: unknown` and `confidence: LOW` — the scanner could not resolve route execution paths for any surface in this feature. This is consistent with a feature that is invoked from other feature screens (feed, chat, vport) rather than via its own route. All surfaces were traced manually from source.

No edge functions detected.
One privileged RPC: `moderation.is_current_user_moderator` — SECURITY DEFINER function verified in DAL comment.

---

## 6. Behavior Contract Status

**BEHAVIOR.md Status: PLACEHOLDER — NO SECURITY RULES DEFINED**

The BEHAVIOR.md at `ZZnotforproduction/APPS/VCSM/features/moderation/BEHAVIOR.md` contains only:

```
Status: PLACEHOLDER
Notes:
- Behavior contract pending source review.
```

- §5 Security Rules: 0 rules defined (MISSING)
- §9 Must Never Happen: 0 invariants defined (MISSING)

This is a contract gap. Security rules cannot be cross-checked against source because none have been written. The BEHAVIOR.md placeholder state itself constitutes a MEDIUM finding — this feature handles privileged moderation operations and cross-user content suppression with no written invariants.

---

## 7. Trust Boundary Findings

---

### VEN-MODERATION-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-MODERATION-001
- Location: apps/VCSM/src/features/moderation/dal/reports.dal.js:61-123
- Application Scope: VCSM
- Platform Surface: Supabase Table (moderation.reports)
- Trust Boundary: Any authenticated actor (or unauthenticated if RLS permits)
- Boundary Violated: Reporter identity is caller-supplied — no server-side session binding at DAL layer
- Contract Violated: No written BEHAVIOR.md contract; violates expected principle that reporter_actor_id must equal auth.uid()
- Current behavior: insertReportRow receives reporterActorId as a plain parameter and passes it directly to the DB insert. No DAL-layer check that the parameter matches auth.uid(). Authorization depends entirely on RLS in the moderation schema.
- Risk: If moderation.reports RLS does not enforce reporter_actor_id = auth.uid() on INSERT, any authenticated user can file a report attributed to any other actor's ID, creating false attribution of reports.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions: Authenticated session + ability to call insertReportRow (or createReportController) with a spoofed reporterActorId value; RLS must not enforce session binding on INSERT.
- Blast Radius: All moderation.reports rows — false attribution of reports to other users, potential harassment via manufactured report history.
- Identity Leak Type: Identity Spoofing — reporter_actor_id injection
- Cache Trust Type: None
- RLS Dependency: REQUIRED — correctness depends on moderation.reports INSERT RLS enforcing reporter_actor_id = auth.uid(). RLS status is UNVERIFIED from source.
- Why it matters: Report attribution is the foundation of the moderation trust chain. If a bad actor can plant reports under another user's actor ID, they can manufacture a false moderation history against a target.
- Recommended mitigation: Add a server-side assertion in insertReportRow (or via a SECURITY DEFINER RPC) that validates reporter_actor_id matches the calling session's auth.uid(). Alternatively confirm and document moderation.reports INSERT RLS enforces this invariant.
- Rationale: Client-supplied identity fields used as DB row ownership values must be verified server-side. The controller enforces reporterActorId is non-null but does not verify it matches the session.
- Follow-up command: DB (verify moderation.reports INSERT RLS policy), ELEKTRA (trace source→sink for reporterActorId injection)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security
```

---

### VEN-MODERATION-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-MODERATION-002
- Location: apps/VCSM/src/features/moderation/dal/moderationActions.dal.js:36-76
- Application Scope: VCSM
- Platform Surface: Supabase Table (moderation.actions)
- Trust Boundary: Any authenticated actor (user-facing visibility actions)
- Boundary Violated: actorId is caller-supplied with no session binding verification at DAL layer
- Contract Violated: No written BEHAVIOR.md contract; violates expected principle that actor_id in personal moderation actions must equal auth.uid()
- Current behavior: insertModerationActionDAL accepts actorId as a parameter and inserts it as actor_id in moderation.actions. No check that actorId matches auth.uid(). Controllers supply it from hook/context.
- Risk: An actor can record hide/unhide actions attributed to a different actor's ID, polluting their personal visibility state or creating misleading audit trails.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions: Authenticated session + ability to supply a different actorId to hidePostForActor / hideCommentForActor / insertModerationActionDAL. Requires either direct DAL access or a compromised controller caller.
- Blast Radius: moderation.actions table — false attribution of personal hide/unhide actions; could be used to interfere with another actor's content visibility filters.
- Identity Leak Type: Identity Spoofing — actor_id injection
- Cache Trust Type: None
- RLS Dependency: REQUIRED — depends on moderation.actions INSERT RLS enforcing actor_id = auth.uid(). Status is UNVERIFIED from source.
- Why it matters: Personal visibility actions (hide post, hide comment) are user-scoped. If another actor can inject these records under a victim's actor_id, they can silently hide content from the victim's view.
- Recommended mitigation: Verify moderation.actions INSERT RLS enforces actor_id = auth.uid(). Add DB ticket to confirm. Optionally add session-binding assertion in insertModerationActionDAL.
- Rationale: Same class as VEN-MODERATION-001. All actor_id writes that represent "who did this" must be session-bound server-side.
- Follow-up command: DB (verify moderation.actions INSERT RLS), ELEKTRA (trace actorId injection path from hooks through controllers to DAL)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security
```

---

### VEN-MODERATION-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-MODERATION-003
- Location: apps/VCSM/src/features/moderation/dal/reports.dal.js:234-273
- Application Scope: VCSM
- Platform Surface: Supabase Tables (vc.posts, chat.messages)
- Trust Boundary: Should be Moderator-only (called via hideReportedObjectController)
- Boundary Violated: hidePostRow and hideMessageRow are exported raw DAL functions with no auth guard of their own — any caller can invoke them directly
- Contract Violated: No written BEHAVIOR.md contract; cross-schema write (vc.posts, chat.messages) from moderation feature without own auth assertion
- Current behavior: hidePostRow and hideMessageRow are plain exported async functions that accept moderatorActorId and perform a direct UPDATE to vc.posts or chat.messages setting is_hidden=true. The only auth guard is in the calling controller (hideReportedObjectController), which calls assertModerationAccessController first.
- Risk: If hidePostRow or hideMessageRow are imported and called from any other path (new feature, test utility, future controller) that does not go through assertModerationAccessController, global post/message suppression can be triggered without moderator authorization. The auth guard is caller-contract only, not enforced in the write function itself.
- Severity: HIGH
- Exploitability: LOW (requires internal code path — not directly callable from the client)
- Attack Preconditions: A developer imports hidePostRow/hideMessageRow in a new context without including the auth guard, or a client-side injection exploits a bug in the controller call chain.
- Blast Radius: Any vc.posts or chat.messages row — global content suppression bypass affecting all users reading that content.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: REQUIRED — vc.posts UPDATE and chat.messages UPDATE RLS must verify the caller has moderation authority. Status UNVERIFIED from source.
- Why it matters: Content suppression is an irreversible, platform-wide action. Suppressing a post hides it from all viewers. A misuse of hidePostRow without the auth gate would constitute an unauthorized content moderation action.
- Recommended mitigation: Move assertModerationAccessController call into hidePostRow and hideMessageRow themselves, OR convert them to non-exported internal functions only callable from within the moderation actions controller. At minimum, add a JSDoc @private guard and confirm RLS on vc.posts/chat.messages restricts UPDATE to moderators.
- Rationale: Defense in depth: write functions that can cause platform-wide harm should not depend solely on their callers enforcing auth.
- Follow-up command: DB (verify vc.posts UPDATE RLS, chat.messages UPDATE RLS), ELEKTRA (verify all callers of hidePostRow/hideMessageRow)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

### VEN-MODERATION-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-MODERATION-004
- Location: apps/VCSM/src/features/moderation/dal/reports.dal.js:129-157
- Application Scope: VCSM
- Platform Surface: Supabase Table (moderation.reports)
- Trust Boundary: Should be Moderator-only (called via updateReportRowStatus which is called from dismissReportController / hideReportedObjectController)
- Boundary Violated: updateReportRowStatus is an exported DAL function with no auth guard — any caller can update any report row by supplying a reportId
- Contract Violated: No written BEHAVIOR.md contract
- Current behavior: updateReportRowStatus accepts a reportId and a status value and performs a direct .update().eq('id', reportId) with no ownership check, no moderator check, and no validation of the status value itself.
- Risk: Any caller with a valid reportId can change report status to any value including 'dismissed' or 'actioned', closing moderation tickets without moderator authority. There is also no status allowlist at the DAL layer — arbitrary string status values can be written.
- Severity: HIGH
- Exploitability: MEDIUM (requires knowledge of a reportId, which is a UUID)
- Attack Preconditions: Authenticated session, knowledge of a valid reportId UUID, and ability to call updateReportRowStatus directly (or via a path that bypasses the moderator controller).
- Blast Radius: Any moderation.reports row — an attacker could dismiss their own report, reopen dismissed reports, or manipulate the moderation queue state for any report.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: REQUIRED — moderation.reports UPDATE RLS must restrict status updates to moderators. Status UNVERIFIED from source.
- Why it matters: The integrity of the moderation queue is critical. If any authenticated user can dismiss or action reports, the entire moderation system is corrupted — reported content stays up, harassers can clear their own cases.
- Recommended mitigation: (1) Add status value validation (allowlist: 'open','triaged','in_review','needs_more_info','actioned','dismissed') at the DAL layer. (2) Verify moderation.reports UPDATE RLS restricts to moderators. (3) Consider converting to a SECURITY DEFINER RPC rather than a plain table UPDATE.
- Rationale: State machine transitions on sensitive records should be guarded at every layer. The controller gate alone is insufficient for a write function of this severity.
- Follow-up command: DB (verify moderation.reports UPDATE RLS), ELEKTRA (trace all callers of updateReportRowStatus), Carnage (consider RPC-based state machine for report status transitions)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

### VEN-MODERATION-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-MODERATION-005
- Location: apps/VCSM/src/features/moderation/controllers/report.controller.js:28-122
  apps/VCSM/src/features/moderation/hooks/useReportFlow.js:27-102
- Application Scope: VCSM
- Platform Surface: PWA (React Hook → Controller → DAL)
- Trust Boundary: Authenticated actor
- Boundary Violated: No server-side enforcement that reporterActorId is the current session user — the hook receives reporterActorId as a prop and passes it unchanged to the controller
- Contract Violated: No written BEHAVIOR.md contract
- Current behavior: useReportFlow is initialized with reporterActorId from the calling component's context (presumably from useIdentity). The hook passes it directly to createReportController without any verification that it matches the actual session JWT. createReportController checks it is non-null but performs no session binding check.
- Risk: If useReportFlow is initialized with a wrong or spoofed actorId (e.g., from a compromised context provider, prop injection, or developer mistake), reports will be filed under the wrong identity. Combined with VEN-MODERATION-001, this creates an end-to-end attribution bypass path.
- Severity: MEDIUM
- Exploitability: LOW (requires either a compromised context or attacker control over the React prop — not directly exploitable from the browser)
- Attack Preconditions: Attacker must control the value of reporterActorId passed to useReportFlow, or exploit a bug in the identity provider chain.
- Blast Radius: False attribution of reports — victim actor receives a report history they did not create.
- Identity Leak Type: Identity Spoofing — client-side actor identity propagated to write path
- Cache Trust Type: None
- RLS Dependency: REQUIRED (same as VEN-MODERATION-001)
- Why it matters: Defense-in-depth gap. The hook architecture provides no layer of session verification between the UI and the write path. RLS is the only guard.
- Recommended mitigation: Server-side: address via VEN-MODERATION-001 (RLS or SECURITY DEFINER RPC). Client-side: ensure reporterActorId always originates from the canonical useIdentity() hook, never from component props directly.
- Rationale: Client-supplied identities are not a trust boundary. This is complementary to VEN-MODERATION-001 — even if RLS blocks injection, the architectural risk should be documented.
- Follow-up command: ELEKTRA (trace reporterActorId from useIdentity through hook to DAL)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security
```

---

### VEN-MODERATION-006

```
VENOM SECURITY FINDING
- Finding ID: VEN-MODERATION-006
- Location: apps/VCSM/src/features/moderation/dal/reports.dal.js:12-14
  apps/VCSM/src/features/moderation/dal/reports.read.dal.js:4-6
- Application Scope: VCSM
- Platform Surface: PWA (client-side error logging)
- Trust Boundary: N/A (logging)
- Boundary Violated: console.error used in DAL error handler — violates project debug logging rules (no console.log/error)
- Contract Violated: MEMORY — "No console.log; debug output must render on screen and be dev-only (never production)"
- Current behavior: logModerationDalError is a wrapper that calls console.error when import.meta.env?.DEV is truthy. This is DEV-gated. The same wrapper pattern appears in both reports.dal.js and reports.read.dal.js. Additionally, report.controller.js:113 uses console.warn unconditionally (no DEV gate): `console.warn('[createReportController] report event not persisted (non-fatal)')`.
- Risk: (1) The ungated console.warn in createReportController leaks internal implementation details ("report event not persisted") to production browser consoles. (2) The logModerationDalError DEV gate is correct but the pattern is inconsistent with the no-console rule.
- Severity: LOW
- Exploitability: LOW (information disclosure only — no data exposed, no auth bypass)
- Attack Preconditions: Attacker opens browser console in a production session. No auth required.
- Blast Radius: Information disclosure — internal moderation system state visible to any user who opens DevTools.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Production console output reveals internal system behavior, helping attackers understand error conditions and internal architecture.
- Recommended mitigation: Remove the bare console.warn from report.controller.js:113 (or gate it with import.meta.env?.DEV). Align all moderation DAL logging to use the project's screen-rendered dev debug pattern per the MEMORY rule.
- Rationale: Project-level memory rule is explicit: no console.log/error/warn in production code paths.
- Follow-up command: SPIDER-MAN (regression test that no console output fires in production builds)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Operations
```

---

### VEN-MODERATION-007

```
VENOM SECURITY FINDING
- Finding ID: VEN-MODERATION-007
- Location: ZZnotforproduction/APPS/VCSM/features/moderation/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation (Governance)
- Trust Boundary: N/A
- Boundary Violated: Missing behavior contract for a feature with privileged moderation operations
- Contract Violated: MEMORY — "Every task must use a persistent ticket"; implied — BEHAVIOR.md must define §5 Security Rules and §9 Must Never Happen for privileged features
- Current behavior: BEHAVIOR.md is a PLACEHOLDER with zero security rules, zero invariants, and no coverage of: moderator role requirements, reporter identity binding, content suppression scope, or rate limiting.
- Risk: Future developers implementing or modifying moderation surfaces have no written contract to enforce. Security rules that exist implicitly in code cannot be tested, reviewed, or audited without the contract.
- Severity: MEDIUM
- Exploitability: N/A (governance gap, not direct exploitability)
- Attack Preconditions: N/A
- Blast Radius: Entire moderation feature — any future change lacking a contract reference could introduce regressions silently.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: This feature manages content suppression (posts/messages hidden globally), report filing (attribution), and moderator access gating. Without a written contract, invariants like "only moderators can hide content globally" exist only as code comments.
- Recommended mitigation: Draft BEHAVIOR.md with: §5 Security Rules covering moderator role requirement, reporter identity binding, action type allowlist, report status transition permissions; §9 Must Never Happen covering non-moderator global content suppression, cross-actor report attribution, and unauthenticated writes.
- Rationale: Written contracts are the foundation of security review and regression testing. PLACEHOLDER behavior contracts are a governance blocker for THOR eligibility.
- Follow-up command: SPIDER-MAN (write tests against invariants once BEHAVIOR.md is drafted), THOR (flag as release blocker until contract is written)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

### VEN-MODERATION-008

```
VENOM SECURITY FINDING
- Finding ID: VEN-MODERATION-008
- Location: apps/VCSM/src/features/moderation/dal/moderationActions.dal.js:160-178
- Application Scope: VCSM
- Platform Surface: Supabase Table (moderation.actions) DELETE
- Trust Boundary: Authenticated actor (user-facing: undo conversation cover)
- Boundary Violated: dalDeleteConversationHideAction deletes by record ID without verifying the record being deleted belongs to the calling actor
- Contract Violated: No written BEHAVIOR.md contract
- Current behavior: dalDeleteConversationHideAction first reads the latest hide action via dalGetConversationHideAction (which filters by actorId and conversationId), then deletes by row ID (.eq('id', latest.id)). The read uses actorId as a filter. However, between the read and the delete there is no re-validation that the row ID still belongs to actorId — this is a TOCTOU window. The final delete is a raw .eq('id', id) with no ownership re-check.
- Risk: Race condition: if a concurrent process inserts a row with the same ID between the read and delete (unlikely due to UUID generation but theoretically possible), or if the actorId filter is bypassed, the delete operates on a potentially wrong row. More practically: if the ID is somehow extracted and replayed, the delete has no ownership check.
- Severity: LOW
- Exploitability: LOW (UUID-based IDs make replay attacks impractical; TOCTOU window is narrow)
- Attack Preconditions: Attacker must extract a valid action row UUID and either race the read/delete window or find a way to call dalDeleteConversationHideAction with a non-matching actorId.
- Blast Radius: moderation.actions — deletion of wrong or another actor's hide record.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: REQUIRED — moderation.actions DELETE RLS should enforce actor_id = auth.uid(). Status UNVERIFIED.
- Why it matters: Delete operations on records should always include an ownership re-check in the WHERE clause to prevent TOCTOU and mis-targeted deletions.
- Recommended mitigation: Change the delete query to: .delete().eq('id', latest.id).eq('actor_id', actorId) — add the actor_id ownership filter to the DELETE statement itself, not just to the preceding SELECT.
- Rationale: Defense in depth for DELETE operations. The fix is one line — adding .eq('actor_id', actorId) to the final delete query.
- Follow-up command: DB (verify moderation.actions DELETE RLS)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

## 8. Source Verification Summary

| Surface | Auth Guard | Verified Safe | Finding |
|---|---|---|---|
| assertModerationAccessController | auth.uid() via is_current_user_moderator RPC (SECURITY DEFINER) | YES — strong gate | None |
| hideReportedObjectController | assertModerationAccessController (first call) | YES — controller-gated | VEN-MODERATION-003 (DAL export risk) |
| dismissReportController | assertModerationAccessController (first call) | YES — controller-gated | VEN-MODERATION-004 (DAL export risk) |
| createReportController | reporterActorId non-null check only | PARTIAL — no session binding | VEN-MODERATION-001, VEN-MODERATION-005 |
| insertReportRow (DAL) | None at DAL layer | NO — depends on RLS | VEN-MODERATION-001 |
| insertModerationActionDAL | None at DAL layer | PARTIAL — actionType allowlist present | VEN-MODERATION-002 |
| insertModerationActionRow (DAL, reports.dal.js) | None at DAL layer | NO — depends on RLS | VEN-MODERATION-002 |
| updateReportRowStatus (DAL) | None at DAL layer | NO — depends on RLS | VEN-MODERATION-004 |
| hidePostRow / hideMessageRow (DAL) | None at DAL layer | NO — controller-only guard | VEN-MODERATION-003 |
| upsertInboxEntryFolder (DAL) | None — actorId param only | PARTIAL — spam report bridge is auto-scoped | VEN-MODERATION-001 (indirect) |
| updateConversationInboxFolderDAL | None — actorId+conversationId param only | PARTIAL — depends on RLS | None (low severity — personal inbox record) |
| updateConversationInboxLastMessageDAL | None — actorId+conversationId param only | PARTIAL — depends on RLS | None (low severity — personal inbox record) |
| dalDeleteConversationHideAction | actorId filter on SELECT only | PARTIAL — no ownership check on DELETE | VEN-MODERATION-008 |
| is_current_user_moderator (RPC) | SECURITY DEFINER — resolves from auth.uid() | VERIFIED SAFE | None |
| logModerationDalError | DEV-gated console.error | PARTIAL — ungated console.warn in controller | VEN-MODERATION-006 |
| BEHAVIOR.md | N/A | MISSING | VEN-MODERATION-007 |

---

## 9. Confidence Summary

| Finding | Severity | Confidence | Provenance |
|---|---|---|---|
| VEN-MODERATION-001 | HIGH | HIGH | SOURCE_VERIFIED — insertReportRow:61-123 |
| VEN-MODERATION-002 | HIGH | HIGH | SOURCE_VERIFIED — moderationActions.dal.js:36-76 |
| VEN-MODERATION-003 | HIGH | HIGH | SOURCE_VERIFIED — reports.dal.js:234-273 + moderationActions.controller.js:22-28 |
| VEN-MODERATION-004 | HIGH | HIGH | SOURCE_VERIFIED — reports.dal.js:129-157 + types/moderation.js |
| VEN-MODERATION-005 | MEDIUM | MEDIUM | SOURCE_VERIFIED — hook/controller chain, exploitability contingent on identity context |
| VEN-MODERATION-006 | LOW | HIGH | SOURCE_VERIFIED — report.controller.js:113 (ungated console.warn) |
| VEN-MODERATION-007 | MEDIUM | HIGH | SOURCE_VERIFIED — BEHAVIOR.md content is PLACEHOLDER |
| VEN-MODERATION-008 | LOW | HIGH | SOURCE_VERIFIED — moderationActions.dal.js:160-178 |

**Overall confidence: HIGH** — All findings are grounded in directly-read source files with cited line numbers. No scanner-inferred findings included.

---

## 10. THOR Impact

| Criterion | Status |
|---|---|
| CRITICAL findings blocking THOR | None |
| HIGH findings blocking THOR | 3 (VEN-MODERATION-001, -002, -003, -004 — RLS dependency unverified) |
| BEHAVIOR.md PLACEHOLDER | THOR BLOCKER — no written invariants |
| Edge Functions audited | N/A (none exist) |
| Moderator auth gate verified | PASS (is_current_user_moderator SECURITY DEFINER verified) |

**THOR Release Eligibility: BLOCKED**

THOR blockers:
1. BEHAVIOR.md is PLACEHOLDER — no security rules or invariants written (VEN-MODERATION-007)
2. RLS policies for moderation.reports INSERT, moderation.actions INSERT/DELETE, vc.posts UPDATE, chat.messages UPDATE are UNVERIFIED — must be confirmed before release (VEN-MODERATION-001, -002, -003, -004)

THOR can clear when:
- BEHAVIOR.md §5 and §9 are populated
- DB confirms RLS on moderation.reports, moderation.actions, vc.posts, chat.messages as expected
- VEN-MODERATION-006 console.warn removed or DEV-gated

---

## 11. Required Follow-Up Commands

| Command | Task | Finding |
|---|---|---|
| DB | Verify moderation.reports INSERT RLS enforces reporter_actor_id = auth.uid() | VEN-MODERATION-001 |
| DB | Verify moderation.actions INSERT RLS enforces actor_id = auth.uid() | VEN-MODERATION-002 |
| DB | Verify moderation.actions DELETE RLS enforces actor_id = auth.uid() | VEN-MODERATION-008 |
| DB | Verify vc.posts UPDATE RLS restricts to moderators | VEN-MODERATION-003 |
| DB | Verify chat.messages UPDATE RLS restricts to moderators | VEN-MODERATION-003 |
| DB | Verify moderation.reports UPDATE RLS restricts to moderators | VEN-MODERATION-004 |
| ELEKTRA | Trace reporter_actor_id source→sink from useReportFlow prop to moderation.reports INSERT | VEN-MODERATION-001, -005 |
| ELEKTRA | Trace actorId injection path from hooks through postVisibility/commentVisibility controllers to moderation.actions INSERT | VEN-MODERATION-002 |
| ELEKTRA | Trace all callers of hidePostRow, hideMessageRow, updateReportRowStatus for paths that bypass assertModerationAccessController | VEN-MODERATION-003, -004 |
| SPIDER-MAN | Write regression tests for: moderator gate, reporter identity, action type allowlist, report status transitions | VEN-MODERATION-007 |
| Carnage | Consider converting report status transitions to a SECURITY DEFINER RPC state machine | VEN-MODERATION-004 |
| THOR | Flag BEHAVIOR.md PLACEHOLDER as release blocker | VEN-MODERATION-007 |

---

## 12. MITIGATION PLAN

| Finding ID | Severity | Action | Owner Layer | Effort | Priority |
|---|---|---|---|---|---|
| VEN-MODERATION-001 | HIGH | Confirm/enforce moderation.reports INSERT RLS binds reporter_actor_id = auth.uid() | DB | Low | P0 (THOR blocker) |
| VEN-MODERATION-002 | HIGH | Confirm/enforce moderation.actions INSERT RLS binds actor_id = auth.uid() | DB | Low | P0 (THOR blocker) |
| VEN-MODERATION-003 | HIGH | Restrict hidePostRow/hideMessageRow exports; confirm vc.posts UPDATE and chat.messages UPDATE RLS | DAL + DB | Medium | P1 |
| VEN-MODERATION-004 | HIGH | Add status allowlist to updateReportRowStatus; confirm moderation.reports UPDATE RLS restricts to moderators | DAL + DB | Medium | P1 |
| VEN-MODERATION-005 | MEDIUM | Ensure reporterActorId always originates from canonical useIdentity(); address at server via VEN-001 RLS | Hook + DB | Low | P2 |
| VEN-MODERATION-006 | LOW | Remove bare console.warn from report.controller.js:113 (or DEV-gate it) | Controller | Trivial | P3 |
| VEN-MODERATION-007 | MEDIUM | Draft BEHAVIOR.md §5 Security Rules + §9 Must Never Happen for moderation feature | Docs | Medium | P0 (THOR blocker) |
| VEN-MODERATION-008 | LOW | Add .eq('actor_id', actorId) to dalDeleteConversationHideAction final delete query | DAL | Trivial | P3 |

---

## 13. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---|---|
| Identity and Access Management | VEN-001, VEN-002, VEN-005 | Reporter/actor identity not session-bound at DAL layer |
| Access Control | VEN-003, VEN-004, VEN-008 | Missing auth guards on exported DAL write functions; TOCTOU on delete |
| Software Development Security | VEN-001 through VEN-008 (secondary) | Systematic pattern: auth guards at controller only, not defense-in-depth |
| Security and Risk Management | VEN-007 | Missing behavior contract — governance gap |
| Security Operations | VEN-006 (secondary) | Production console output leaks internal state |
| Cryptography | N/A | No cryptographic surfaces in this feature |
| Security Architecture | VEN-003, VEN-004 | DAL exports that should be internal-only |
| Communication and Network Security | N/A | No direct network/transport surfaces |
| Asset Security | VEN-001, VEN-002 | User-owned moderation action records lack server-side ownership binding |
| Security Assessment and Testing | VEN-007 | No BEHAVIOR.md = no testable invariants |
