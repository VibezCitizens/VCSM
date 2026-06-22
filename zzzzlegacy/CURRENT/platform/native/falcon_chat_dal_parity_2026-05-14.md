# FALCON NATIVE PARITY REPORT

**Application Scope:** VCSM
**Module:** Chat — DAL Layer (`vcsm.dal.chat.md`)
**PWA Blueprint:** `apps/VCSM/src/features/chat/` + `engines/chat/src/dal/`
**Native Area:** `VCSMNativeApp/Features/Chat/` + `VCSMNativeApp/Services/Inbox/` + `VCSMNativeApp/Services/Conversation/`
**Audit Date:** 2026-05-14
**Triggered by:** Cerebro DAL verification pass — RISK-7 (FALCON REQUIRED) from AvengersAssemble 2026-05-11
**Transfer Classification:** PARTIAL PARITY
**Native Release Status:** CAUTION

---

## NATIVE MODULE COMPLETENESS

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Screens | PASS | `ChatConversationScreen.swift`, `ChatConversationViewScreen.swift`, `InboxView.swift`, `ChatSettingsScreen.swift`, `ChatBlockedUsersScreen.swift`, `ChatSafetySettingsView.swift` — all major screens present | Folder screens (Spam/Requests/Archived) not audited in this pass |
| View models / hooks | PASS | `InboxViewModel.swift`, `useConversationRoom.swift`, `useInboxRealtime.swift` present | — |
| Controllers / services | PASS | `LiveConversationService.swift`, `LiveInboxService.swift`, `LoadConversationAccess.controller.swift`, `MarkConversationSpam.controller.swift`, `ReportConversation.controller.swift`, `ReportMessage.controller.swift` | — |
| DTO / data mapping | PARTIAL | `SupabaseInboxModels.swift`, `SupabaseConversationModels.swift` — member model present but **missing `canPost` field decode** | `SupabaseConversationMemberRow` does not decode `can_post` from DB — see DRIFT-01 |
| Supabase / RPC integration | PASS | `fetchInboxEntries`, `fetchInboxUnreadCountRows`, `fetchInboxEntry` — all use explicit column selects against `chat.*` schema | — |
| Loading states | PASS | Shimmer / loading indicators confirmed in `InboxView.swift` | — |
| Empty states | PASS | Empty state handling confirmed in `InboxView.swift` | — |
| Error states | PARTIAL | Error catch in `LiveInboxService.fetchUnreadBadgeCount` silently returns prior count — matches PWA fail-soft pattern | — |
| Moderation states | PASS | `ConversationCoverCard.swift`, `ConversationBlockedCard.swift`, `MarkConversationSpam.controller.swift` present | Runtime test for spam/request/archived flows pending |
| Owner states | N/A | Chat has no owner-mode variant | — |
| Booking states | N/A | Chat has no booking integration | — |
| Cache / runtime handling | PASS | Badge: realtime + 20s fallback polling. Inbox: realtime via `InboxRealtimeStore`. Conversation messages: realtime via `ConversationRealtime.dal.swift` | — |
| Feature gates | N/A | No chat feature gate in `NativeFeatureGate.swift` | — |
| Deep links | PARTIAL | `/chat/:conversationId` routes confirmed via `NativeAppRoute`. `/vport/chat/:conversationId` alias not verified this pass | — |
| Documentation | PARTIAL | `chat-inbox.md` + `chat-inbox-deep-audit.md` present; not updated since 2026-05-04; canPost drift not documented | Updated by this report |
| Runtime testing notes | FAIL | No runtime test has been run for report/block/spam/request/archived actions, realtime background/foreground transition, or badge polling accuracy | Remains unrun |

---

## NATIVE DRIFT FINDINGS

### DRIFT-01 — `canPost` field not decoded in native ConversationMember model

**NATIVE DRIFT FINDING**
Drift Type: data-contract drift
PWA Behavior: `canSendMessage` enforces `membership.canPost !== false` (fixed 2026-05-11, RISK-1). App permission file now reads the `canPost` flag from the member row after active membership validation.
Native Behavior: `SupabaseConversationMemberRow` (`SupabaseInboxModels.swift:78`) does not decode `canPost` / `can_post` from the DB. The send gate in `ChatConversationViewScreen.swift:383` is purely UI-driven: `!(draft.isEmpty && pendingImageData == nil)`. No membership `canPost` check exists.
Risk: If `canPost: false` is set on a `chat.conversation_members` row, native will silently ignore it and allow the send attempt. The engine's `send_message_atomic` RPC may then reject the write server-side, causing a failed send with no meaningful UI error. Native produces a false positive — the button is enabled when it should be disabled.
Severity: MEDIUM
Recommended correction: Add `canPost: Bool?` to `SupabaseConversationMemberRow`. Pass it into the domain `InboxThread.member` model. In `ChatConversationViewScreen`, gate send on `canPost != false` for the current actor's member row, matching the PWA permission behavior.

---

### DRIFT-02 — `platform.media_assets` recording missing for chat attachments

**NATIVE DRIFT FINDING**
Drift Type: data-contract drift
PWA Behavior: `recordChatAttachmentController` (fire-and-forget) writes to `platform.media_assets` and links `media_asset_id` back to `chat.message_attachments` after attachment upload. Failure is non-fatal — message remains visible.
Native Behavior: No equivalent of `recordChatAttachmentController` found in `VCSMNativeApp/Features/Chat/` or `VCSMNativeApp/Services/Conversation/`. Chat attachments are uploaded and sent but `platform.media_assets` is never written for chat.
Risk: Chat attachments have no `platform.media_assets` record. Media asset metadata (dimensions, checksum, app_id linkage) is not tracked for chat images. This differs from post composer, which already records to `platform.media_assets` in native.
Severity: LOW — messages and images display correctly via the stored CDN URL. Only asset metadata tracking is missing.
Recommended correction: After successful image send in native `LiveConversationService`, add a fire-and-forget call to `platform.media_assets` insert + `updateAttachmentMediaAssetId` UPDATE on `chat.message_attachments`, matching the PWA `recordChatAttachmentController` pattern. Failure must be non-fatal and must not block the send flow.

---

## NATIVE TRUST BOUNDARY WARNINGS

### TRUST-01 — Send gate does not enforce `canPost` membership contract

**NATIVE TRUST BOUNDARY WARNING**
Location: `ChatConversationViewScreen.swift:383` — `canSend` computed var
PWA enforcement: `canSendMessage({ actorId, conversation, members })` — checks active membership AND `member.canPost !== false`
Native enforcement: `canSend = !(draft.isEmpty && pendingImageData == nil)` — purely content-based, no membership validation
Risk: A user with `canPost: false` on their membership row can reach the send path in native. The RPC will fail server-side but native has no graceful error state for a membership-blocked send.
Severity: MEDIUM
Recommended correction: Native `canSend` must also check active membership and `canPost != false`. This mirrors the fix applied to the PWA on 2026-05-11.

---

## NATIVE RUNTIME PARITY REVIEW

| Runtime Area | PWA | Native | Drift | Severity |
|---|---|---|---|---|
| Badge fetch query | `chat.inbox_entries SELECT unread_count WHERE actor_id AND archived=false AND archived_until_new=false` | `fetchInboxUnreadCountRows` — identical query, schema, and filters | NONE | — |
| Badge pipeline | Bootstrap `useChatUnread()` → React Query 30s polling | `AppNavigationView.configureInboxBadge()` → realtime + 20s polling fallback | NATIVE IMPROVEMENT | — |
| Badge terminal | `BottomNavBar.jsx` renders chat tab badge | `BottomNavigationBar.swift` receives `inboxBadgeCount` parameter — same pattern | NONE | — |
| Badge actor scoping | `actorId` from `useIdentity()` | `resolveCurrentIdentity(userID, accessToken)` via `InboxService` | NONE | — |
| Inbox realtime | Disabled in PWA (polling only, per ISSUE #1 in deep audit) | `InboxRealtimeStore` subscribed to `chat.inbox_entries` INSERT/UPDATE/DELETE | NATIVE IMPROVEMENT | — |
| Conversation realtime | `subscribeToConversation` — INSERT only on `chat.messages` | `ConversationRealtime.dal.swift` — subscription present | PARTIAL — message UPDATE (edits/unsends) not verified | LOW |
| Typing indicator | Wired but NOT displayed in PWA UI (ISSUE #2) | `ConversationTypingIndicator.swift` exists — typing UI IS rendered | NATIVE IMPROVEMENT | — |
| `canSendMessage` / `canPost` | Enforced (post RISK-1 fix 2026-05-11) | NOT enforced — send gate is content-only | RUNTIME DRIFT | MEDIUM |
| `platform.media_assets` write-back (chat) | `recordChatAttachmentController` fires after send | Not implemented | PARTIAL | LOW |
| Inbox folder routing | inbox / spam / requests / archived | Enum-matched in native; requests defensive check simplified correctly | NONE | — |
| `archived` filter in badge | Excludes `archived=true` AND `archived_until_new=true` | Identical exclusion in native query | NONE | — |
| Spam/requests in badge | Included (not filtered by folder) | Included (not filtered by folder) — identical | NONE | — |

---

## NATIVE OWNERSHIP MAP

| Area | PWA Owner | Native Owner | Shared Engine | Risk |
|---|---|---|---|---|
| Badge DAL | `features/chat/inbox/dal/inboxUnread.read.dal.js` | `LiveInboxService.fetchUnreadBadgeCount` | No — app-level in both | NONE |
| Badge pipeline | `bootstrap.selectors.js` → `BottomNavBar.jsx` | `AppNavigationView.configureInboxBadge()` → `BottomNavigationBar.swift` | No | NONE |
| Attachment media_assets | `recordChatAttachment.controller.js` | MISSING | No | LOW — gap creates metadata drift |
| canSendMessage permission | `features/chat/conversation/permissions/canSendMessage.js` | MISSING — no equivalent permission function | No | MEDIUM — send gate bypasses canPost |
| Inbox DAL | `engines/chat/src/dal/inbox.read.dal.js` | `SupabaseClient.fetchInboxEntries` | No — parallel impl | NONE |
| Conversation realtime | `engines/chat/src/dal/subscribeToConversation.js` | `ConversationRealtime.dal.swift` | No — parallel impl | NONE |
| Inbox realtime | `engines/chat/src/dal/subscribeToInbox.js` | `InboxRealtimeStore` | No — parallel impl | NATIVE IMPROVEMENT |

---

## NATIVE PRIORITY MATRIX

| Priority | Module | Gap | Reason | Owner |
|---|---|---|---|---|
| P1 | Chat send gate | DRIFT-01 / TRUST-01 — `canPost` not decoded or enforced | `canPost: false` silently ignored; sends that should be blocked are allowed | Native chat |
| P1 | Chat media_assets | DRIFT-02 — `platform.media_assets` not recorded for chat attachments | Metadata parity gap with post composer (already fixed) and PWA | Native chat |
| P1 | Runtime tests | report/block/spam/request/archived flows not tested | App Store moderation implications — must pass before launch | QA |
| P1 | Realtime background/foreground | Not tested on iOS | Realtime reliability on sleep/wake is critical for inbox freshness | Native chat |
| P2 | Message UPDATE realtime | Edits/unsends may not arrive via realtime (PWA ISSUE #8) | Minor — same gap as PWA | Native chat |

---

## NATIVE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc (DAL) | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.chat.md` | PRESENT |
| Native transfer module | `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/chat-inbox.md` | PRESENT — updated this pass |
| Native deep audit | `zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/chat-inbox-deep-audit.md` | PRESENT |
| AvengersAssemble report | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.chat.md` (inline, 2026-05-11) | PRESENT |
| SENTRY review | — | MISSING — RISK-6 (`lib/`/`permissions/` classification) pending |
| VENOM review | Inline in `vcsm.dal.chat.md` (2026-05-11) | PRESENT |
| THOR release gate | — | MISSING |
| Runtime audit (LOKI) | — | MISSING |
| Performance audit (KRAVEN) | — | MISSING |
| Ownership record (IRONMAN) | — | MISSING |
| Engine audit | `vcsm.dal.chat.md` § Engine DAL Coverage | PRESENT |

---

## NATIVE RELEASE GATE

| Module | Status | Blocking Risk | Required Follow-Up |
|---|---|---|---|
| Badge DAL parity | READY | None — query and pipeline verified at full parity | — |
| Badge pipeline (bootstrap equiv) | READY | None — native is realtime-first; PWA-equivalent polling is fallback | — |
| `canSendMessage` / canPost gate | CAUTION | DRIFT-01 / TRUST-01 — `canPost` not enforced in native send gate | Add `canPost` decode + send gate check before launch |
| `platform.media_assets` (chat) | CAUTION | DRIFT-02 — metadata not tracked for chat attachments | Implement fire-and-forget post-send write-back |
| Runtime: report/block/spam/archive | CAUTION | No runtime verification — App Store moderation compliance unverified | Run runtime moderation flow tests |
| Runtime: realtime bg/fg | CAUTION | Polling fallback not tested on device sleep/wake | Run device regression |

**FINAL FALCON STATUS: CAUTION**

No P0 blockers identified. Two P1 drift items require correction before release: `canPost` send gate enforcement and `platform.media_assets` write-back. Runtime testing for moderation flows and realtime reliability is the primary remaining gap.

---

## FALCON → WINTER SOLDIER HANDOFF

Module: Chat / Inbox — DAL Layer
PWA Blueprint: `apps/VCSM/src/features/chat/` + `engines/chat/src/dal/`
Transfer Classification: PARTIAL PARITY
Known Drift Areas:
- `canPost` field not decoded or enforced in native send gate (DRIFT-01 / TRUST-01)
- `platform.media_assets` not recorded for chat attachments (DRIFT-02)
- Message UPDATE realtime not verified (edits/unsends may not arrive)
Trust-Boundary Risks: DRIFT-01 — send gate bypasses `canPost` restriction. Medium severity. Must match PWA before launch.
Runtime Risks: Realtime background/foreground reliability not tested on Android. Inbox is realtime-first in native — validate on Android, as background lifetime management differs significantly from iOS.
Booking Risks: None — chat has no booking integration.
Lifecycle Risks: Realtime channel cleanup on app lifecycle events (background/kill/resume) not verified. Android lifecycle is more aggressive — verify `removeChannel` cleanup path.
Ownership Risks: `canSendMessage` equivalent not defined as a standalone pure function in native — logic is inline in `ChatConversationViewScreen`. Android should extract this as a reusable permission function before implementing.
Required Android Follow-Up:
1. Verify badge query uses identical `archived=false AND archived_until_new=false` filter on `chat.inbox_entries`
2. Verify inbox realtime subscription is wired (not polling-only)
3. Add `canPost` decode in Android conversation member model
4. Implement `platform.media_assets` fire-and-forget for chat attachments
5. Test report/block/spam/request/archived runtime flows
6. Test realtime channel cleanup on Activity destroy/recreate
Recommended Priority: P1
Related Governance Reports: `vcsm.dal.chat.md` (AvengersAssemble 2026-05-11), `falcon_chat_dal_parity_2026-05-14.md` (this doc)

---

WINTER SOLDIER HANDOFF STATUS: GENERATED

---

NEXT STEP — WINTER SOLDIER REQUIRED

Falcon has completed iOS parity review for the Chat DAL module.
Android parity review must now begin.

Run: `/WinterSoldier`
Input: Use the FALCON → WINTER SOLDIER HANDOFF section above as context.

Winter Soldier will consume Falcon findings as canonical parity evidence for Android transfer.
