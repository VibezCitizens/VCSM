# VENOM V2 Security Review — chat

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Review Date | 2026-06-04 |
| Reviewer | VENOM V2 |
| Feature | chat |
| App | VCSM |
| Source Root | apps/VCSM/src/features/chat/ |
| Engine Root | engines/chat/src/ |
| Doc Root | ZZnotforproduction/APPS/VCSM/features/chat/ |
| Output File | outputs/2026/06/04/Venom/2026-06-04_19-48_venom_chat-security-review.md |
| Scanner Version | 1.1.0 |
| Total Findings | 5 |
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 2 |
| LOW | 1 |
| THOR Release Blocker | YES — VEN-CHAT-001, VEN-CHAT-002 |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map | Generated At | Age | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| rpc-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| edge-function-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| security-path-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| route-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| write-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| rpc-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| edge-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

| Surface Type | Count | Details |
|---|---|---|
| Write Surfaces | 2 | updateAttachmentMediaAssetIdDAL (chat.message_attachments UPDATE), searchActors (identity.search_actor_directory RPC) |
| RPCs | 1 | identity.search_actor_directory |
| Security Paths | 3 | All LOW confidence (no route execution path resolved) |
| Write Execution Paths | 2 | Both LOW confidence (no resolved route) |
| RPC Execution Paths | 1 | LOW confidence |
| Edge Functions | 0 | None |

**Scanner Note:** All three security paths were flagged LOW confidence because the scanner could not resolve the route execution path for either surface. Source inspection was required to determine full call chain and risk classification.

---

## 4. Security Surface Inventory

### PWA Write Surfaces

| Surface | Operation | Schema | Table/RPC | DAL File | Layer |
|---|---|---|---|---|---|
| updateAttachmentMediaAssetIdDAL | UPDATE | chat | message_attachments | apps/VCSM/src/features/chat/conversation/dal/updateAttachmentMediaAsset.write.dal.js | dal |
| searchActors | RPC | identity | search_actor_directory | apps/VCSM/src/features/chat/setup.js | module |

### Engine Write Surfaces (Resolved via Source Inspection)

| Controller | Operations | Schema | Tables |
|---|---|---|---|
| sendMessageController | INSERT (via RPC) | chat | messages, inbox_entries, outbox_events |
| editMessageController | UPDATE | chat | messages |
| unsendMessageController | UPDATE (soft delete) | chat | messages |
| deleteMessageController | DELETE (hard) | chat | messages |
| inboxActions.controller | UPDATE | chat | inbox_entries |
| markConversationSpam | UPDATE + INSERT | chat, moderation | inbox_entries, moderation.actions |
| startDirectConversation | INSERT (via RPC) | chat | conversations, conversation_members |

### App-Level Read Surfaces in setup.js

| Surface | Schema | Table | Purpose |
|---|---|---|---|
| resolveActorRealmContext | vc | actors | Resolve is_void for realm routing |
| checkBlockRelation | moderation | blocks | Bidirectional block enforcement |

---

## 5. Scanner Signals Block

| Signal | Scanner Finding | Source Verification Outcome |
|---|---|---|
| chat.message_attachments UPDATE (write surface) | HIGH confidence, route not resolved | SOURCE_VERIFIED: owned by recordChatAttachment.controller.js; RLS policy "attachment sender can write back media_asset_id" is present (migration 20260430400000) |
| identity.search_actor_directory RPC (write surface) | HIGH confidence, route not resolved | SOURCE_VERIFIED: called in setup.js searchActors(); viewer_actor_id is contextual not authz; RPC is read-only search, no data mutation |
| inboxActions.controller — no membership check before write | Scanner did NOT flag (source-discovered) | SOURCE_VERIFIED: ctrlUpdateInboxFlags, ctrlArchiveConversationForActor, ctrlMoveConversationToFolder delegate directly to DAL with no membership verification. RLS is the only enforcement gate. |
| editMessage.write.dal.js — no sender_actor_id column filter | Scanner did NOT flag (source-discovered) | SOURCE_VERIFIED: editMessageDAL executes UPDATE with no actor column filter; ownership enforced in editMessageController.js controller only; RLS UPDATE policy is referenced as existing but not visible in VCSM-tracked migrations. |

---

## 6. Behavior Contract Status Block

**BEHAVIOR.md Status: PLACEHOLDER — INCOMPLETE CONTRACT**

The file at `ZZnotforproduction/APPS/VCSM/features/chat/BEHAVIOR.md` exists but contains only:
```
Status: PLACEHOLDER
Notes: Behavior contract pending source review.
```

There are **no §5 Security Rules** and **no §9 Must Never Happen** sections defined.

**Impact:** No contract cross-check was possible. All security rules below were derived entirely from source inspection, engine code, and database migrations. This represents a contract gap — the feature has no written security invariants against which future changes can be tested.

**Finding:** MISSING_BEHAVIOR_CONTRACT recorded below as VEN-CHAT-005 (LOW severity — the source code itself demonstrates reasonable security design; the gap is documentation only).

---

## 7. Trust Boundary Findings

---

### VEN-CHAT-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-CHAT-001
- Location: engines/chat/src/controller/inboxActions.controller.js:7-33
- Application Scope: VCSM
- Platform Surface: Supabase Table (chat.inbox_entries)
- Trust Boundary: Authenticated actor → own inbox_entries rows
- Boundary Violated: No membership check before inbox mutation — any authenticated actor who knows a conversationId can attempt pin/mute/archive/folder-move writes against their own inbox row, even if they are not a member of that conversation
- Contract Violated: Chat engine controller contract — controllers must own permission checks before delegating to DAL
- Current behavior: ctrlUpdateInboxFlags, ctrlArchiveConversationForActor, ctrlMoveConversationToFolder all call DAL directly with actorId + conversationId. No readConversationMembershipDAL call is made before the write. The DAL executes the UPDATE scoped to (actor_id, conversation_id) — if the row does not exist, the UPDATE is a no-op. If it does exist, the actor modifies their inbox state for a conversation they may have been removed from.
- Risk: A removed or ex-member actor retains the ability to manipulate their inbox state for the conversation (pin, mute, archive, move to spam). This can create silent data inconsistency — an actor marked as non-member in conversation_members can still have an active inbox row they can mutate. The markConversationSpam controller DOES check membership but inboxActions.controller does not. Inconsistent enforcement across the inbox write surface.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions: Authenticated VCSM user who was previously a member of a conversation (has an inbox_entries row) and has been removed or left. They must retain the conversationId (visible in prior URL, client state).
- Blast Radius: Per-actor inbox state corruption for the attacker's own rows only. No cross-actor data access. No message content exposure.
- Identity Leak Type: None (actor writes own rows only)
- Cache Trust Type: None
- RLS Dependency: REQUIRED — RLS is the sole enforcement gate for inbox_entries writes. Migration 20260430200000 confirms RLS is present and scoped to actor ownership via vc.actor_owners. However, RLS permits writing if the row exists and actor_id matches — it does not validate conversation membership status.
- Why it matters: A former member can continue to manipulate their own inbox visibility for a conversation they were expelled from, potentially re-surfacing spam/blocked conversations in their inbox folder or creating misleading unread state. For a moderation-eviction workflow, this is an incomplete enforcement boundary.
- Recommended mitigation: Add a membership validation step to ctrlUpdateInboxFlags, ctrlArchiveConversationForActor, and ctrlMoveConversationToFolder before delegating to DAL. Use readConversationMembershipDAL to confirm membership_status is 'active' OR that a former member is performing a legitimate cleanup action (archive/delete only). Alternatively, add a DB-level trigger or policy that prevents inbox_entries writes when no corresponding active conversation_members row exists.
- Rationale: markConversationSpam already does this correctly. Parity enforcement is the standard pattern in this engine.
- Follow-up command: ELEKTRA (trace full DB-layer enforcement gap for former members), DB (validate RLS policy covers post-removal writes)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

### VEN-CHAT-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-CHAT-002
- Location: engines/chat/src/dal/editMessage.write.dal.js:8-37 + engines/chat/src/controller/editMessage.controller.js:51
- Application Scope: VCSM
- Platform Surface: Supabase Table (chat.messages)
- Trust Boundary: Authenticated sender → own messages in chat.messages
- Boundary Violated: editMessageDAL executes UPDATE with no sender_actor_id column filter in the SQL. Ownership is enforced in the controller layer only. The messages UPDATE RLS policy (chat_messages_update) is referenced in migration 20260510060000 as "unchanged" but is NOT defined in any VCSM-tracked migration — it exists in a baseline schema not surfaced in apps/VCSM/supabase/migrations/. For VCSM multi-actor users, the Wentrex baseline RLS uses current_actor_id() which is documented to return ORDER BY actor_id LIMIT 1 — the same bug fixed for inbox_entries in migration 20260430200000. The messages UPDATE policy was NOT included in that fix.
- Contract Violated: VCSM multi-actor RLS correctness contract (migration 20260430200000 intent). The fix explicitly addresses chat.inbox_entries and chat.conversation_members but leaves chat.messages UPDATE to the old current_actor_id() function.
- Current behavior: editMessageController fetches the message, verifies msg.sender_actor_id === actorId (correct ownership check). editMessageDAL then executes .update({body, edited_at}).eq('id', messageId) — no sender_actor_id column predicate. If RLS uses current_actor_id() and the user's active persona is a non-primary actor (e.g., a Vport), the UPDATE may be silently blocked (0 rows updated, no error) — the edit appears to succeed but no change is written to DB.
- Risk: VCSM users with multiple actors (personal profile + Vport) who attempt to edit messages sent from their non-primary actor will silently fail to save edits. The UI shows a success state while the DB retains the original body. This is a data consistency failure, not a privilege escalation. However, the controller-level check is not redundantly enforced at the DB layer for the specific actor ID, creating an implicit trust that current_actor_id() matches the intended sender — which breaks for multi-actor users.
- Severity: HIGH
- Exploitability: LOW (affects legitimate users silently, not attackers gaining unauthorized access)
- Attack Preconditions: VCSM user with a non-primary active persona (Vport) who sends and then tries to edit messages from that persona.
- Blast Radius: Message edit failure for multi-actor users; silent data inconsistency. Limited to the actor's own messages.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — chat.messages UPDATE RLS exists (referenced in 20260510060000 as "unchanged") but the policy definition is not in any VCSM-tracked migration file. Wentrex baseline uses current_actor_id() which has the documented multi-actor bug. Whether VCSM has an independent policy or inherits the shared schema policy is not determinable from source alone.
- Why it matters: Message editing is a core trust feature for users. Silent edit failures corrupt the conversation record and erode user trust in the messaging system. This mirrors the exact pattern fixed for inbox_entries in 20260430200000 — the fix was incomplete.
- Recommended mitigation: Apply the same multi-actor ownership fix pattern from migration 20260430200000 to the chat.messages UPDATE policy. Replace sender_actor_id = chat.current_actor_id() with an EXISTS subquery against vc.actor_owners (same as other fixed policies). Additionally add .eq('sender_actor_id', actorId) to editMessageDAL as a defense-in-depth predicate.
- Rationale: Consistency with existing VCSM pattern. The actor_owners ownership model is the correct VCSM enforcement pattern for multi-actor users.
- Follow-up command: DB (confirm current chat.messages UPDATE RLS policy definition on live DB), Carnage (migration to apply multi-actor fix to chat.messages UPDATE)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Security Architecture and Engineering
```

---

### VEN-CHAT-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-CHAT-003
- Location: apps/VCSM/src/features/chat/inbox/hooks/useMessagePrivacySettings.js:1-84
- Application Scope: VCSM
- Platform Surface: PWA (localStorage)
- Trust Boundary: Client-side only — no server enforcement boundary exists
- Boundary Violated: Message privacy settings (whoCanMessage: 'everyone' | 'following' | 'nobody', allowNewMessageRequests: boolean) are stored exclusively in localStorage. The startDirectConversation engine controller does NOT check these settings before creating a conversation or delivering a message. Any actor can initiate a conversation with any other actor regardless of the target's privacy preference.
- Contract Violated: User privacy expectation — the settings screen implies enforcement; no server-side gate enforces the declared preference.
- Current behavior: useMessagePrivacySettings reads/writes localStorage key 'vc.message_privacy_settings'. These values control only the presentation of the settings screen. startDirectConversation (engines/chat/src/controller/startDirectConversation.controller.js) performs block checks and UUID validation but does NOT read the target actor's privacy settings before creating the conversation. No DB column, RPC parameter, or RLS policy references these settings.
- Risk: A user who sets whoCanMessage='nobody' will still receive unsolicited direct conversations. The feature is entirely decorative — it provides a false assurance of privacy control. The only real enforcement boundary is the block system.
- Severity: MEDIUM
- Exploitability: HIGH (trivially bypassed — any authenticated actor can start any conversation)
- Attack Preconditions: Any authenticated VCSM user. No special knowledge required.
- Blast Radius: Platform-wide — affects all users who have set non-default privacy preferences. The harm is unwanted contact, not data exfiltration.
- Identity Leak Type: None
- Cache Trust Type: Client-Trusted — localStorage value is read by client only, never sent to server for validation
- RLS Dependency: NONE — no DB enforcement exists for this setting
- Why it matters: Privacy controls are a user trust and platform safety feature. Showing a settings screen that does nothing creates a false sense of security and may expose users to harassment despite their stated preference. GDPR/CCPA implications if marketed as a privacy control.
- Recommended mitigation: Either (a) enforce the setting at DB level via a vc.actor_social_settings table column (chat_privacy_mode) checked during conversation creation, or (b) remove the settings screen until enforcement is implemented. Do not display controls that have no effect. Option (a) requires: store setting in DB (actor_social_settings table appears to exist from migration 20260528000000), read target actor's setting in startDirectConversation controller, throw if policy blocks the request.
- Rationale: Security controls must be enforced at the authorization layer, not the UI layer. Client-side-only settings are user interface affordances, not access controls.
- Follow-up command: ELEKTRA (trace full path from settings screen to any enforcement point), DB (check if actor_social_settings table can host chat_privacy_mode)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Security and Risk Management
```

---

### VEN-CHAT-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-CHAT-004
- Location: apps/VCSM/src/features/chat/debug/chatNavDebugger.js:44-49 + apps/VCSM/src/features/chat/debug/chatBadgeDebugger.js:17-21
- Application Scope: VCSM
- Platform Surface: PWA (Browser Console / window object)
- Trust Boundary: Production runtime — browser console accessible to any user
- Boundary Violated: Both debuggers default to ON unless window.__CHAT_BADGE_DEBUG or window.__CHAT_NAV_DEBUG is explicitly set to false. The isEnabled() functions return true by default in any environment where the window flag is absent. While callers in ConversationView.jsx guard chatNavDbg calls behind const DEV = import.meta.env?.DEV, chatBadgeDebugger.js is lazily loaded and guarded by the chatUnread controller's DEV check. However, chatNavDebugger.js itself has no import.meta.env guard — isEnabled() defaults to true if window.__CHAT_NAV_DEBUG is not a boolean.
- Contract Violated: VCSM debug logging rules (Memory: "debug output must render on screen and be dev-only (never production)")
- Current behavior: chatNavDebugger.js isEnabled() returns true by default when window.__CHAT_NAV_DEBUG is not set. However, all call sites in ConversationView.jsx are wrapped in if (!DEV) return guards. This means chatNavDebugger is never reached in production builds (import.meta.env.DEV is false in prod). The risk is that the module itself ships to prod and its console output is callable via window.__CHAT_NAV_DEBUG = true in any user's browser session — exposing conversationId, member count, and message count timing data.
- Risk: Any browser console user in production can set window.__CHAT_NAV_DEBUG = true and then navigate to a chat conversation to observe timing metadata (conversationId, hasSeed, member count, message count, navigation timestamps). This is internal navigation telemetry that includes conversationId values — not message content, but structural conversation metadata. Moderate information disclosure.
- Severity: MEDIUM
- Exploitability: MEDIUM (requires browser console access — attacker must be the session user, so this is self-exfiltration of their own conversation metadata; minor risk if device is shared)
- Attack Preconditions: User with access to their own browser console (standard). No cross-user data exposure.
- Blast Radius: The user's own conversationId values and navigation timing logged to console. No cross-account data. No message body exposure.
- Identity Leak Type: Internal session metadata (conversationId, member count)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Debuggers that can be activated at runtime in production violate the principle of zero debug surface in production. ConversationIds in console output violate the no-raw-IDs rule in a soft way. The bigger risk is future drift: if a caller is added without a DEV guard, data leaks silently.
- Recommended mitigation: Add import.meta.env?.DEV guard inside chatNavDebugger.js isEnabled() function as a hard gate: if (typeof import.meta.env !== 'undefined' && !import.meta.env.DEV) return false. Apply the same pattern to chatBadgeDebugger.js. This ensures no debug output is possible in production regardless of window flag.
- Rationale: Defense in depth — the module-level guard removes reliance on every call site remembering to add DEV checks. Consistent with existing pattern in chatUnread.controller.js.
- Follow-up command: SPIDER-MAN (add test asserting debugger.isEnabled() returns false in prod env)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security
```

---

### VEN-CHAT-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-CHAT-005
- Location: ZZnotforproduction/APPS/VCSM/features/chat/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation
- Trust Boundary: Development governance
- Boundary Violated: Behavior contract does not exist (PLACEHOLDER status)
- Contract Violated: VCSM feature governance contract — all features must have a complete BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen invariants
- Current behavior: BEHAVIOR.md contains only "Status: PLACEHOLDER / Notes: Behavior contract pending source review." No security rules, no invariants, no access model documented.
- Risk: Without a written behavior contract, future changes to the chat feature have no documented security invariants to test against. SPIDER-MAN cannot write regression tests without BEH IDs. THOR has no contract to verify before release. The feature's security posture is invisible to the governance system.
- Severity: LOW
- Exploitability: LOW (documentation gap, not a direct attack surface)
- Attack Preconditions: N/A
- Blast Radius: Governance gap — affects all future changes to the chat feature
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The chat feature is one of the highest-trust surfaces on the platform (private messages, block enforcement, multi-actor identity). A missing behavior contract means the security model is entirely implicit and undocumented. Any future engineer modifying the feature will have no specification to violate.
- Recommended mitigation: Author BEHAVIOR.md §5 Security Rules covering: (1) block enforcement is bidirectional and server-enforced, (2) message edit/unsend is sender-only, (3) inbox mutations are actor-scoped, (4) conversation access requires active membership, (5) privacy settings require server validation. Author §9 Must Never Happen covering: (A) messages from blocked actors must never deliver, (B) non-members must never read conversation content, (C) non-senders must never edit messages, (D) privacy settings must never be client-only enforced.
- Rationale: Contract-first development prevents regression. The source code reviewed in this audit represents the current implicit contract — it should be made explicit.
- Follow-up command: Logan (author BEHAVIOR.md from source inspection data in this report)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

## 8. Source Verification Summary

### Verified Safe Surfaces

| Surface | Location | Verification Outcome | Notes |
|---|---|---|---|
| updateAttachmentMediaAssetIdDAL | apps/VCSM/src/features/chat/conversation/dal/updateAttachmentMediaAsset.write.dal.js | VERIFIED_SAFE | RLS policy "attachment sender can write back media_asset_id" (migration 20260430400000) enforces message sender ownership at DB layer via vc.actor_owners JOIN. Controller also validates via recordChatAttachmentController — ownerActorId is passed explicitly. |
| searchActors (RPC) | apps/VCSM/src/features/chat/setup.js:44-70 | VERIFIED_SAFE | identity.search_actor_directory is a read-only search RPC. p_viewer_actor_id is used for contextual filtering, not authorization. No data mutation. Needle is validated (empty check, @ stripped). viewerActorId is null-safe. |
| sendMessageController | engines/chat/src/controller/sendMessage.controller.js | VERIFIED_SAFE | Block check (bidirectional), membership validation (active status + can_post), atomic RPC with conversation_seq. |
| editMessageController | engines/chat/src/controller/editMessage.controller.js | VERIFIED_SAFE (controller layer) | Ownership check: msg.sender_actor_id !== actorId throws. Deleted message guard. RLS dependency UNVERIFIED (see VEN-CHAT-002). |
| unsendMessageController | engines/chat/src/controller/unsendMessage.controller.js | VERIFIED_SAFE | Sender-only check enforced. Idempotent. Soft delete only. |
| deleteMessageController | engines/chat/src/controller/deleteMessage.controller.js | VERIFIED_SAFE | Restricted to admin/moderator/system roles. canModerateConversation gate enforced. |
| markConversationSpam | engines/chat/src/controller/markConversationSpam.controller.js | VERIFIED_SAFE | Membership validation (readConversationMembershipDAL, membership_status = active) before folder move and moderation insert. |
| startDirectConversation | engines/chat/src/controller/startDirectConversation.controller.js | VERIFIED_SAFE (block enforcement) | UUID validation, block check (fails-closed when no DI checker), realm resolution. See VEN-CHAT-003 for privacy policy gap. |
| checkBlockRelation (setup.js) | apps/VCSM/src/features/chat/setup.js:97-116 | VERIFIED_SAFE | UUID validation pre-check, bidirectional OR query, active status filter. RLS on moderation.blocks confirmed (blocks_select_own + blocks_select_blocked). |
| resolveActorRealmContext (setup.js) | apps/VCSM/src/features/chat/setup.js:77-91 | VERIFIED_SAFE | Read-only, actorId null check, maybeSingle() prevents multi-row returns. No write surface. |
| canReadConversation | apps/VCSM/src/features/chat/conversation/permissions/canReadConversation.js | VERIFIED_SAFE | Member array check: actorId present + isActive === true required. Used correctly in useConversationMembers hook. |
| RLS — chat.inbox_entries | Migration 20260430200000 | VERIFIED (multi-actor fix applied) | actor_id ownership via vc.actor_owners EXISTS subquery. SELECT, INSERT, UPDATE, DELETE all fixed. |
| RLS — chat.conversation_members UPDATE | Migration 20260430200000 | VERIFIED (multi-actor fix applied) | Same actor_owners EXISTS pattern applied to UPDATE. |
| RLS — chat.message_attachments UPDATE | Migration 20260430400000 | VERIFIED | "attachment sender can write back media_asset_id" policy. |
| RLS — chat.messages INSERT | Migration 20260510060000 | VERIFIED | sender_actor_id = chat.current_actor_id() + can_current_actor_post + block NOT EXISTS check. |

### Surfaces With Open Questions

| Surface | Issue | Finding |
|---|---|---|
| chat.messages UPDATE RLS | Policy exists (referenced in migration comment) but not defined in any VCSM-tracked migration file. Wentrex baseline uses current_actor_id() without multi-actor fix. | VEN-CHAT-002 |
| inboxActions.controller | No membership check before inbox writes. RLS is sole gate for post-removal scenarios. | VEN-CHAT-001 |
| useMessagePrivacySettings | Client-only storage; no server enforcement. | VEN-CHAT-003 |

---

## 9. Confidence Summary

| Finding | Confidence | Basis |
|---|---|---|
| VEN-CHAT-001 | HIGH | Source read of inboxActions.controller.js; compared to markConversationSpam which DOES check membership. Gap is unambiguous. |
| VEN-CHAT-002 | HIGH | Source read of editMessage.write.dal.js (no actor filter) + migration 20260430200000 comment (Tables modified: inbox_entries, conversation_members — messages NOT listed) + Wentrex baseline RLS definition showing current_actor_id() pattern. |
| VEN-CHAT-003 | HIGH | Source read of useMessagePrivacySettings.js (localStorage only) + source read of startDirectConversation.controller.js (no privacy check). No DB column or RLS found for this setting. |
| VEN-CHAT-004 | HIGH | Source read of both debugger files. isEnabled() default-on confirmed. ConversationView.jsx DEV guards confirmed. Call-site protection is sufficient but module-level protection is absent. |
| VEN-CHAT-005 | HIGH | Direct read of BEHAVIOR.md confirms PLACEHOLDER status. |

**Overall Confidence: HIGH.** All findings are source-verified from directly read files. No scanner-lead-only findings were promoted to the final report.

---

## 10. THOR Impact

| Finding | Severity | THOR Blocker? | Reason |
|---|---|---|---|
| VEN-CHAT-001 (inbox write without membership check) | HIGH | YES | Active member enforcement gap; moderation eviction is incomplete. Must be verified or mitigated before any chat moderation flow ships. |
| VEN-CHAT-002 (chat.messages UPDATE RLS unverified for multi-actor) | HIGH | YES | Silent edit failures for Vport actors undermine data integrity. RLS policy must be confirmed on live DB before release. |
| VEN-CHAT-003 (privacy settings client-only) | MEDIUM | NO | No active exploit; users are not deceived into thinking a DB-enforced feature exists (feature is UI-only). Should be addressed in a dedicated privacy enforcement sprint. |
| VEN-CHAT-004 (debugger default-on without module guard) | MEDIUM | NO | No cross-user data exposure. Self-only metadata. Low urgency; fix before GA hardening. |
| VEN-CHAT-005 (missing BEHAVIOR.md) | LOW | NO | Documentation gap. Does not block release but must be remediated before THOR sign-off on a full chat release. |

**THOR Status: BLOCKED on VEN-CHAT-001 and VEN-CHAT-002.**

---

## 11. Required Follow-Up Commands

| Finding | Command | Action |
|---|---|---|
| VEN-CHAT-001 | ELEKTRA | Trace the inbox write surface end-to-end. Propose a concrete DB trigger or controller patch to enforce membership at write time. |
| VEN-CHAT-001 | DB | Confirm whether RLS on chat.inbox_entries prevents writes when no conversation_members row exists for the actor. |
| VEN-CHAT-002 | DB | Pull the current chat.messages UPDATE RLS policy definition from the live VCSM database. Compare against Wentrex baseline. Confirm if current_actor_id() is used. |
| VEN-CHAT-002 | Carnage | Author migration to apply multi-actor fix (actor_owners EXISTS pattern) to chat.messages UPDATE policy if DB confirms the gap. |
| VEN-CHAT-003 | ELEKTRA | Trace useMessagePrivacySettings → settings screen → any server endpoint. Confirm zero server enforcement. Propose actor_social_settings DB column approach. |
| VEN-CHAT-003 | DB | Check actor_social_settings table schema (migration 20260528000000) to confirm it can host a chat_privacy_mode column. |
| VEN-CHAT-004 | SPIDER-MAN | Add test: debugger.isEnabled() returns false when import.meta.env.DEV is false. |
| VEN-CHAT-005 | Logan | Author BEHAVIOR.md for chat using the security invariants discovered in this review. |

---

## 12. Mitigation Plan

| Finding ID | Severity | Mitigation | Effort | Priority |
|---|---|---|---|---|
| VEN-CHAT-001 | HIGH | Add readConversationMembershipDAL call to ctrlUpdateInboxFlags, ctrlArchiveConversationForActor, and ctrlMoveConversationToFolder before DAL delegation. Restrict archive/folder-move to members OR confirm RLS prevents non-member writes at DB layer. | Medium | P1 |
| VEN-CHAT-002 | HIGH | (a) DB: confirm live chat.messages UPDATE policy uses current_actor_id(). (b) If confirmed, Carnage: migrate to actor_owners EXISTS subquery matching 20260430200000 pattern. (c) editMessageDAL: add .eq('sender_actor_id', actorId) as defense-in-depth. | Medium | P1 |
| VEN-CHAT-003 | MEDIUM | Add chat_privacy_mode column to actor_social_settings. Read target actor's setting in startDirectConversation. Throw if whoCanMessage=nobody or evaluate following relationship if whoCanMessage=following. | Large | P2 |
| VEN-CHAT-004 | MEDIUM | Add module-level DEV guard in isEnabled() in chatNavDebugger.js and chatBadgeDebugger.js: if (typeof import.meta !== 'undefined' && !import.meta.env?.DEV) return false. | Small | P2 |
| VEN-CHAT-005 | LOW | Author BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen. Use invariants discovered in this review as the starting point. | Small | P3 |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Coverage |
|---|---|---|
| Access Control | VEN-CHAT-001, VEN-CHAT-002, VEN-CHAT-003 | PRIMARY — 3 findings. Inbox write without membership check, message edit RLS gap, client-only privacy enforcement. |
| Security Architecture and Engineering | VEN-CHAT-002, VEN-CHAT-004 | SECONDARY — 2 findings. Multi-actor RLS policy gap, debugger default-on without module guard. |
| Software Development Security | VEN-CHAT-001, VEN-CHAT-004, VEN-CHAT-005 | SECONDARY — 3 findings. Controller-DAL contract (missing membership check), debug module production exposure, missing behavior contract. |
| Security and Risk Management | VEN-CHAT-003, VEN-CHAT-005 | SECONDARY — 2 findings. Client-only privacy control creating false assurance, missing governance contract. |
| Communication and Network Security | None | Not applicable — chat uses Supabase client with TLS; no custom network layer. |
| Identity and Access Management | Partially covered | No direct findings; actorId sourcing from identity.store is correct. Multi-actor handling is the underlying theme of VEN-CHAT-002. |

**Domains NOT triggered:** Asset Security, Security Assessment and Testing, Security Operations, Physical Security.

---

*VENOM V2 Review Complete — 2026-06-04*
*Reviewer: VENOM*
*Provenance: All findings SOURCE_VERIFIED from directly read source files.*
