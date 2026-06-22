# IRONMAN OWNERSHIP AUDIT

**Date:** 2026-05-14
**Application Scope:** VCSM + ENGINE
**Triggered by:** Cerebro governance pass — RISK-5 (12 undocumented app-level files) + RISK-2 (engine DAL coverage) + SF-01/SF-02 correction owner assignment from SENTRY 2026-05-14
**Ownership file:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.chat.owner.md`

---

## IRONMAN TARGET

```
Feature / Engine: Chat (VCSM app feature + engines/chat engine)
Application Scope: VCSM + ENGINE
Reason for ownership review: RISK-5 — 12 previously undocumented app-layer files
  now require ownership assignment; SENTRY SF-01/SF-02 correction owners needed;
  engine DAL coverage (36 files) needs formal ownership record.
```

---

## RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership (app layer) | `features/chat/` | HIGH | Clear — all files inside `apps/VCSM/src/features/chat/` |
| Engine ownership | `engines/chat/` | HIGH | Clear — 36 DAL files, hooks, controllers, models, adapter |
| DAL ownership (app-level) | `features/chat` | HIGH | 2 files: badge read + attachment write-back |
| DAL ownership (engine) | `engines/chat` | HIGH | 36 files confirmed on disk |
| Controller ownership | `features/chat` | HIGH | 2 controllers: chatUnread, recordChatAttachment |
| UI ownership | `features/chat` | HIGH | All screens, components, hooks in features/chat/ |
| Runtime ownership (badge pipeline) | Bootstrap + chat | MEDIUM | Bootstrap owns the scheduler; chat adapter owns the data |
| Data ownership (`chat.inbox_entries`) | `engines/chat` (primary), `features/chat` (badge read) | HIGH | Engine owns full table; app owns badge-only select |
| Data ownership (`chat.message_attachments`) | `engines/chat` (create), `features/chat` (media_asset write-back) | HIGH | Clear surgical split |
| Data ownership (`platform.media_assets`) | `features/chat` (via controller) | MEDIUM | Cross-schema write; recordChatAttachment.controller.js |
| Rule ownership (canSendMessage) | `engines/chat` | HIGH | Engine enforces via useConversationGuards — app copy is dead |
| Rule ownership (canReadConversation) | `features/chat` | MEDIUM | App-only, called from wrong layer (SF-01 pending) |
| Documentation ownership | Logan/chat DAL doc | HIGH | `vcsm.dal.chat.md` is the canonical doc |
| Native parity ownership | Falcon (iOS) | HIGH | Falcon DRIFT-01, DRIFT-02 assigned; Winter Soldier handoff generated |
| LOKI runtime ownership | MISSING | LOW | No runtime trace exists |
| KRAVEN performance ownership | MISSING | LOW | No performance audit exists |
| CARNAGE migration ownership | MISSING | LOW | No migration history for `inbox_entries` or `message_attachments` |
| Security ownership | VENOM (completed 2026-05-11) | HIGH | Trust boundary reviewed inline in `vcsm.dal.chat.md` |

---

## OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| `canSendMessage` app copy | LOW | Dead code — no importers. Creates false impression of app-layer guard. | Delete or wire. Assign to chat feature for cleanup. |
| `buildInboxPreview` in 4 Final Screens | MEDIUM | Domain transform in Final Screen — SF-02. Multiple screens would need updating if logic changes. | Assign to chat feature inbox as P2 correction. |
| `canReadConversation` in View Screen | MEDIUM | Permission in View Screen — SF-01. Should be in hook. | Assign to chat feature conversation as P2 correction. |
| `bootstrap.selectors.js` badge path | LOW | Bootstrap owns the scheduler but depends on `chat.adapter.js`. Ownership split is documented and intentional. | No action — boundary is correct. |
| `(R)` convention undocumented | LOW | Caused RISK-1 originally. Convention must be documented to prevent future divergence. | Chat feature must add sync-contract comments (SF-06). |
| LOKI/KRAVEN/CARNAGE coverage missing | LOW | Non-blocking but leaves badge poll performance and migration history unvalidated. | Run LOKI, KRAVEN, CARNAGE as next three commands. |

---

## DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `chat.inbox_entries` | `engines/chat` | `engines/chat` (full inbox), `features/chat` (badge read only) | `engines/chat` (full), send_message_atomic RPC (fan-out) | DB/Supabase | Carnage | Logan (`vcsm.dal.chat.md`) |
| `chat.message_attachments` | `engines/chat` | `engines/chat` | `engines/chat` (create), `features/chat` (media_asset_id update) | DB/Supabase | Carnage | Logan (`vcsm.dal.chat.md`) |
| `chat.messages` | `engines/chat` | `engines/chat` | `engines/chat` via `send_message_atomic` RPC | DB/Supabase | Carnage | Logan |
| `chat.conversations` | `engines/chat` | `engines/chat` | `engines/chat` | DB/Supabase | Carnage | Logan |
| `chat.conversation_members` | `engines/chat` | `engines/chat`, `features/chat` (inbox member hydration) | `engines/chat` | DB/Supabase | Carnage | Logan |
| `platform.media_assets` | `features/media` (primary) | Multiple features | `features/chat` (via `recordChatAttachment.controller.js`), `features/composer` | DB/Supabase | Carnage | Logan |
| `chat.typing_states` | `engines/chat` | `engines/chat` (presence, not postgres) | `engines/chat` | DB/Supabase | Carnage | Logan |

---

## RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| canPost gate (send blocked) | `engines/chat` | Engine `useConversationGuards.js` → `PermissionSnapshot.model.js` | `vcsm.dal.chat.md` RISK-1 | LOW — engine enforces correctly |
| canRead gate (open conversation) | `features/chat` | App `canReadConversation` called from `ConversationView` (wrong layer) | SENTRY SF-01 | MEDIUM — layer mismatch, not a security gap |
| isActorBlocked (chat) | `features/chat` | App `isActorBlocked.js` — called from diagnostics; live block check via `useBlockStatus` | `vcsm.dal.chat.md`, deep audit §14 | LOW |
| Badge excludes archived | `features/chat` (DAL filter) | `inboxUnread.read.dal.js` WHERE clause | `vcsm.dal.chat.md` | NONE — both platforms verified |
| Moderation cover | `features/chat` | `useConversationCover` adapter | `vcsm.dal.chat.md`, deep audit §15 | LOW |
| Fire-and-forget attachment | `features/chat` | `recordChatAttachment.controller.js` — non-fatal | DRIFT-02 (native missing) | LOW |

---

## RUNTIME OWNERSHIP MAP

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Hotspots |
|---|---|---|---|---|---|
| Badge poll | `bootstrap.selectors.js:useChatUnread()` | Chat (badge) + Bootstrap | `chatUnread.controller.js` | `inboxUnread.read.dal.js` | Every 30s for all sessions — KRAVEN priority |
| Inbox load | `InboxScreen → useInboxFolder → useChatInbox` | Chat inbox | Engine `getInboxEntries` | Engine `inbox.read.dal.js` | 30s React Query poll |
| Conversation open | `ConversationScreen → ConversationView → useConversation` | Chat conversation | Engine `openConversation` RPC | Engine `conversationRead.read.dal.js` | Every conversation open |
| Message send | `ChatInput → useSendMessageActions → engine` | Chat send | Engine `sendMessageController` | Engine `send_message_atomic` RPC | Critical path |
| Attachment write-back | Fire-and-forget after send | Chat attachment | `recordChatAttachment.controller.js` | `updateAttachmentMediaAsset.write.dal.js` + `platform.media_assets` | Non-fatal — runs async |
| Mark read | `ConversationView mount → useMarkChatRead` | Chat inbox | Engine `markConversationRead` | Engine `inbox_entries` UPDATE | Fires on every conversation open |

> All runtime ownership is **inferred** — no LOKI trace has been run for this feature.

---

## CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| Chat app layer | `features/chat` | `apps/VCSM/src/features/chat/` | CLEAN | All files inside protected root |
| Chat engine | `engines/chat` | `engines/chat/src/` | CLEAN | No app imports detected inside engine |
| Badge terminal | `shared/components/BottomNavBar.jsx` | `apps/VCSM/src/shared/` | CLEAN | Shared component, not cross-root |
| Notifications re-export | `features/notifications` uses chat via adapter | `apps/VCSM/src/features/notifications/` | CLEAN | Goes through approved `chat.adapter.js` |

---

## ENGINE OWNERSHIP REVIEW

| Engine | Owner | Consumers | Public Interfaces | Boundary Risk |
|---|---|---|---|---|
| `engines/chat` | Engine — app-agnostic | `apps/VCSM/src/features/chat/` via `@chat` alias | `getInboxEntries`, `InboxEntryModel`, `markConversationRead`, `useTypingChannel`, `useInboxActions`, `MessageModel`, `sendMessageController`, `openConversation`, `canSendMessage`, `useConversationGuards` | LOW — no app imports detected inside engine; app-specific logic stays in app feature layer |

---

## NATIVE PARITY OWNERSHIP

| Area | PWA Owner | Native Owner | Parity Doc | Risk |
|---|---|---|---|---|
| Badge DAL | `features/chat/inbox/dal/inboxUnread.read.dal.js` | `LiveInboxService.fetchUnreadBadgeCount` | `falcon_chat_dal_parity_2026-05-14.md` | NONE — full parity |
| Badge pipeline | `bootstrap.selectors.js` | `AppNavigationView.configureInboxBadge()` | Falcon report | NONE — native improvement |
| canSendMessage / canPost gate | `engines/chat` | MISSING native `canPost` decode | Falcon DRIFT-01 | MEDIUM — P1 |
| media_assets recording (chat) | `recordChatAttachment.controller.js` | MISSING in native | Falcon DRIFT-02 | LOW — P1, non-fatal |
| Android parity | Same as PWA | NOT STARTED | Winter Soldier handoff in Falcon report | MEDIUM — pending |

---

## IRONMAN OWNERSHIP FINDING — RISK-5 RESOLUTION

- **Finding ID:** IM-01
- **Feature / Engine:** Chat — `features/chat/`
- **Application Scope:** VCSM
- **Responsibility Type:** Feature ownership
- **Ownership Clarity:** CLEAR (post-audit)
- **Boundary Risk:** LOW
- **Severity:** LOW
- **Primary code roots:** `apps/VCSM/src/features/chat/`
- **Core layers:** All formally documented above — including the previously undocumented `lib/`, `permissions/`, `layout/`, `store/`, `debug/`, `constants/` sub-folders
- **Engines used:** `engines/chat` (`@chat`), `engines/hydration`, `engines/media`
- **Tables / Objects touched:** `chat.inbox_entries`, `chat.message_attachments`, `chat.messages`, `chat.conversations`, `chat.conversation_members`, `platform.media_assets`
- **Rule ownership:** canSendMessage → engine; canRead → app feature (layer fix pending); badge filter → app DAL
- **Contracts touched:** Architecture Contract, Boundary Isolation Contract, Actor Ownership Contract, Engine Isolation Contract
- **Docs touched:** `vcsm.dal.chat.md`, `chat-inbox.md`, `vcsm.chat.owner.md` (new), Falcon/SENTRY reports
- **Runtime ownership:** Bootstrap badge pipeline (inferred); full inbox/conversation/send flows (inferred — LOKI pending)
- **Current ambiguity:** All 12 previously undocumented files now assigned to `features/chat` ownership. No ownership gaps remain for the app feature layer.
- **Risk:** RISK-5 is resolved. Ownership is complete.
- **Recommended ownership clarification:** None — this audit closes RISK-5.
- **Recommended handoff:** LOKI (runtime trace), KRAVEN (badge poll performance), CARNAGE (migration history)
- **Rationale:** All 12 undocumented files (`lib/` ×4, `permissions/` ×3, `layout/` ×1, `store/` ×1, `debug/` ×1, `constants/` ×1, `StartConversationModal` screen) are within `apps/VCSM/src/features/chat/`. Their ownership belongs unambiguously to the chat feature. The RISK-5 gap was documentation-only — no files were missing from disk.

---

## OWNERSHIP BOUNDARY WARNINGS

### OBW-01 — `canSendMessage.js` app-level copy is dead code

```
OWNERSHIP BOUNDARY WARNING
Location: apps/VCSM/src/features/chat/conversation/permissions/canSendMessage.js
Current ambiguity: File exists, is synced with engine (post RISK-1 fix), but has zero
  importers in the app layer. Creates appearance of app-layer protection that doesn't exist.
Why it is risky: Future engineers may assume the send gate is app-enforced when it is
  engine-enforced only. The false redundancy caused the original RISK-1 divergence.
Suggested ownership clarification: Chat feature team: delete the app copy OR add a
  documented import from a hook that actively uses it.
```

### OBW-02 — `buildInboxPreview` ownership in Final Screens creates maintenance risk

```
OWNERSHIP BOUNDARY WARNING
Location: 4 Final Screens importing buildInboxPreview
Current ambiguity: Domain transform is owned by Final Screens, not hooks. Logic change
  requires 4-screen edit instead of 1-hook edit.
Why it is risky: As inbox display logic grows, Final Screens accumulate business logic
  in violation of their contract.
Suggested ownership clarification: Chat inbox hooks own buildInboxPreview. Final Screens
  receive ready-built preview entries.
```

---

## SUMMARY

**RISK-5 RESOLVED** — All 12 previously undocumented app-level chat files now formally assigned to `features/chat` ownership. Ownership record created at `vcsm.chat.owner.md`.

**RISK-2 RESOLVED** — Engine DAL coverage (36 files) formally attributed to `engines/chat` ownership in the ownership record.

**SF-01/SF-02 OWNERS ASSIGNED:**
- SF-01 (`canReadConversation` in View Screen): **Chat feature, conversation sub-area** — P2 correction
- SF-02 (`buildInboxPreview` in Final Screens): **Chat feature, inbox sub-area** — P2 correction
- SF-04 (`canSendMessage` dead copy): **Chat feature** — P2 cleanup

**Governance status after this pass:**
- ARCHITECT: PRESENT
- VENOM: PRESENT
- LOGAN: PRESENT
- review-contract: PRESENT
- FALCON: PRESENT
- SENTRY: PRESENT
- IRONMAN: PRESENT ← this audit
- LOKI: MISSING
- KRAVEN: MISSING
- CARNAGE: MISSING
