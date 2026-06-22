# Module: Chat / inbox

## Deep Audit Reference

Full route inventory, Supabase column contracts, engine architecture, send/attach flow, realtime channels, typing presence, mark-read, permissions, moderation, VexSettings, all UI component contracts, iOS UX behaviors, 9 issues found, and Swift implementation guide:
```
native-transfer/modules/chat-inbox-deep-audit.md
```

---

## PWA Source of Truth

**Routes:** `/chat`, `/chat/:id`, `/chat/new`, `/chat/spam`, `/chat/requests`, `/chat/archived`

**Screens/components:**
- `apps/VCSM/src/features/chat/*`

**Services/DAL:**
- `apps/VCSM/src/features/chat/conversation/*`
- `apps/VCSM/src/features/chat/inbox/*`
- `apps/VCSM/src/features/chat/start/*`

**Supabase schema/tables/RPCs:**
- vc conversations/messages/inbox entries
- realtime channels
- moderation/report tables or RPCs
- `platform.media_assets` for attachments
- `identity.search_actor_directory` / `identity.actor_directory` for actor search/hydration

**RLS expectations:** Conversations and inbox folders must be active-actor scoped; blocked/spam/requests states must prevent unauthorized access and writes.

**Current PWA status:** Source of truth for inbox folders, realtime messages, typing presence, start conversation, moderation covers, and media attachments.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Chat/*`
- `VCSMNativeApp/Features/Inbox/*`
- `VCSMNativeApp/Services/Conversation/*`
- `VCSMNativeApp/Services/Inbox/*`

---

## Native Behavior Currently Present

- Native chat and inbox are substantial: conversations, inbox folders, realtime socket/payloads, typing presence, moderation cards, settings screens, and start conversation view exist.
- Start-conversation actor search now uses `identity` directory paths instead of retired `vc.actor_presentation`.

---

## Native Gaps

- `canPost` field not decoded in `SupabaseConversationMemberRow` — send gate does not enforce `canPost !== false` (DRIFT-01 / TRUST-01, P1 — matches the RISK-1 fix applied to PWA on 2026-05-11).
- `platform.media_assets` recording not implemented for chat attachments (DRIFT-02, P1 — non-fatal, images display correctly; post composer already records to media_assets).
- Runtime report/block/spam/request/archived actions not yet tested (App Store moderation implications — must pass before launch).
- Realtime + polling/reload fallback after background/foreground transition not verified.

---

## Risk Notes

- Chat has App Store moderation implications; report/block/cover flow must work before launch.
- Realtime reliability on iOS background/sleep requires polling to remain active on foreground return.
- `vc.actor_presentation` is not present in the current DB snapshot and must remain unused by chat search.
- **DRIFT-01 (P1):** `SupabaseConversationMemberRow` does not decode `can_post`. Native send gate is content-only. If `canPost: false` is set on a membership, native will silently allow the send attempt and fail server-side. Fix: add `canPost: Bool?` to the model and gate send on `canPost != false`.
- **DRIFT-02 (P1):** `platform.media_assets` not written for chat attachments. Fire-and-forget insert should be added after a successful attachment send, matching PWA `recordChatAttachmentController` pattern.

---

## Pending Transfer Checklist

- [x] Compare PWA inbox folder filters to native `InboxFolder` handling — verified 2026-05-04: both have inbox/requests/spam/archived. Native enum matches PWA strings.
- [ ] Verify realtime + polling/reload fallback after background/foreground transition.
- [ ] Test conversation report/block/spam/request/archived actions.
- [x] Validate media attachment upload — verified 2026-05-04: native sends/receives image messages via Cloudflare. Native also supports video (PWA does not).
- [ ] Add `canPost` decode to `SupabaseConversationMemberRow` and enforce `canPost !== false` in send gate (DRIFT-01 / TRUST-01 — P1).
- [ ] Add `platform.media_assets` recording for chat attachments (DRIFT-02 — P1 — fire-and-forget, non-fatal).
- [x] Remove chat actor search dependency on retired `vc.actor_presentation`.

---

## PWA → Native Transfer Log

### 2026-05-14 — Falcon native parity review: chat DAL layer

- Date: 2026-05-14
- Change type: Governance audit — Falcon native parity pass
- PWA files changed: none
- Routes affected: none
- Screens/components changed: none
- Services/DAL changed: none
- Behavior change: none
- Supabase schema/RPC change: none
- RLS expectations changed: no
- Affected native modules: Chat / Inbox
- Priority: P1
- Native status: Partial — badge DAL verified at full parity; two P1 drift items identified; release status CAUTION
- Testing notes: No code changed. Governance audit only. See `falcon_chat_dal_parity_2026-05-14.md`.
- Falcon findings:
  - Badge DAL (`fetchInboxUnreadCountRows`) — FULL PARITY with PWA `readChatInboxUnreadRowsDAL`. Identical schema, table, filters, and column.
  - Badge pipeline — NATIVE IMPROVEMENT. Native uses realtime (`InboxRealtimeStore`) + 20s fallback polling. PWA is polling-only at 30s.
  - Typing indicator — NATIVE IMPROVEMENT. `ConversationTypingIndicator.swift` exists and renders. PWA wires data but never renders (ISSUE #2).
  - DRIFT-01: `canPost` field not decoded in `SupabaseConversationMemberRow`. Send gate is content-only. Must add `canPost` decode and membership gate before launch.
  - DRIFT-02: `platform.media_assets` not written for chat attachments. Non-fatal but creates metadata gap vs. post composer.
  - Runtime tests (report/block/spam/archived/bg-fg) remain unrun — carry-over from prior audit.
- Winter Soldier handoff: GENERATED — `falcon_chat_dal_parity_2026-05-14.md` § FALCON → WINTER SOLDIER HANDOFF

### 2026-05-04 — Deep audit: full chat/inbox read, transfer document generated

- Date: 2026-05-04
- Change type: Audit / Transfer Document
- PWA files changed: none
- Routes affected: all 12 chat routes (10 real, 2 redirects)
- Screens/components changed: none — read-only audit
- Services/DAL changed: none
- Behavior change: none
- Supabase schema/RPC change: none
- RLS expectations changed: no
- Affected native modules: Chat / Inbox
- Priority: P1
- Native status: Partial — deep audit complete; full transfer spec written to `chat-inbox-deep-audit.md`
- Testing notes: No code changed. Document is AI-readable transfer reference.
- Notes: Confirmed chat schema is `chat.*` (not `vc.*`). 9 issues found — most notable: inbox uses polling not realtime (native should use realtime), typing indicator is wired but not displayed in PWA. All Supabase column contracts, engine architecture, send/attach flows, and Swift implementation guide documented.

---

## Transfer History

- Last synced date: 2026-05-14
- Native files updated: (none — audit pass only)
- Delta status: Partial — deep audit complete; realtime inbox, typing UI, and runtime moderation/attach test remain
- Notes: Deep audit of all PWA chat code. Schema fully confirmed: `chat.inbox_entries`, `chat.conversations`, `chat.conversation_members`, `chat.messages`, `chat.message_attachments`. Realtime architecture documented. 9 issues filed in deep audit document.

### 2026-05-03 — Runtime schema alignment

- Date: 2026-05-03
- Change type: Fix / Schema
- PWA files changed: none — alignment to `_HISTORY/db/snapshots/schema_20260502b.sql`
- Routes affected: `/chat/new`, inbox sender fallback hydration
- Screens/components changed: none
- Services/DAL changed: `SupabaseClient.swift`
- Behavior change: chat actor search no longer reads retired `vc.actor_presentation`
- Supabase schema/RPC change: `identity.actor_directory`, `identity.search_actor_directory`
- RLS expectations changed: no — identity directory visibility remains source of truth
- Affected native modules: Chat, Inbox, Notifications sender fallback
- Priority: P0
- Native status: Risky — build verified
- Testing notes: iOS simulator `xcodebuild` passed; static scan found no native `actor_presentation` references. Runtime chat search/inbox regression not yet run.
- Notes: Addresses screenshot error `relation "vc.actor_presentation" does not exist`.

---

## Archived Notes

No archived notes yet.
