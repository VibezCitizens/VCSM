# VCSM Silent Failure Map

## Scope

- Focus: writes that swallow errors, downgrade them to warnings, or continue after a failed side effect
- Source: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/runtime/vcsm.runtime.mutation-matrix.md`
- Re-verified against current code in VCSM and shared engines

## Silent / fail-open mutations

| Location | Mutation impacted | Failure behavior | What the failure causes | User-visible symptom | Recommended fix pattern |
| --- | --- | --- | --- | --- | --- |
| `apps/VCSM/src/features/auth/controllers/onboarding.controller.js` | Complete onboarding | `ensureVcsmPlatformBootstrap(...).catch(() => {})` | Platform provisioning failure is swallowed after profile + actor writes succeed | User completes onboarding but later has missing platform identity or switch/hydration issues | Return structured degraded state and schedule mandatory self-heal instead of swallowing |
| `apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` | Ensure VCSM platform bootstrap | Controller catches RPC error and returns `{ ok:false }` instead of throwing | Caller can treat provisioning as non-fatal | Runtime continues with partially migrated identity state | Bubble a typed error or force explicit degraded-state handling |
| `engines/identity/src/controller/resolveAuthenticatedContext.controller.js` | Login + login-state record | `_recordLoginSilent(...).catch(() => {})` | Login-state write to `platform.user_app_state` can fail quietly | Session works, but activity/login metadata drifts | Emit telemetry + surface retry intent instead of fully silent catch |
| `apps/VCSM/src/features/upload/controllers/createPostController.js` | Create post (upload flow) | Mention write failure only `console.warn(...)` | `vc.post_mentions` can be missing while post succeeds | Post publishes, but mentions never notify or link correctly | Treat mention write as required if UI supplied resolved mentions, or queue repair job |
| `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js` | Create/edit post (legacy path) | Mention persistence only warns on create and edit | Legacy post writes can succeed without `vc.post_mentions` parity | Mention chips appear in text but no mention edges exist | Remove legacy path or move mention write behind one controller boundary |
| `apps/VCSM/src/features/chat/conversation/controllers/sendMessage.controller.js` | Legacy send message | `bumpInboxAfterSend` failure is logged and ignored | Message exists without inbox projection update | Recipient inbox order/unread state can lag or break | Remove legacy path or hard-fail to atomic engine RPC |
| `apps/VCSM/src/features/chat/conversation/controllers/markConversationSpam.controller.js` | Legacy spam / cover | Report creation and moderation-action writes are non-fatal | Thread folder changes may succeed without audit/report trail | Spam move appears to work but moderation history is incomplete | Route spam through one mutation boundary with required moderation/report semantics |
| `engines/chat/src/controller/markConversationSpam.controller.js` | Engine spam / cover | Moderation action insert is wrapped in a non-fatal `try/catch` | `chat.inbox_entries` can move to spam without moderation action parity | Spam inbox behavior works, moderation review trail is incomplete | Decide whether moderation action is authoritative; if yes, make it required |
| `apps/VCSM/src/features/moderation/controllers/report.controller.js` | Create report | Report-event insert warns and continues | Report exists without event trail | Moderation timeline is incomplete even though the report exists | Move report + event creation behind one RPC or durable outbox |
| `apps/VCSM/src/features/moderation/dal/reports.dal.js` | Create report / report events | Session-level `skipReportEventsInsertForSession` after RLS denial | Future report events are skipped silently for the rest of the session | Later moderation actions lose audit events without obvious UI error | Remove session-global skip flag or downgrade only per-call with surfaced telemetry |
| `apps/VCSM/src/features/vport/CreateVportForm.jsx` | Persist selected services after VPORT create | Service persistence error only `console.error(...)` | VPORT creation succeeds while selected services are missing | User lands on a new VPORT with incomplete service catalog | Make initial services part of the create mutation or block navigation until repaired |
| `apps/VCSM/src/features/notifications/inbox/dal/notifications.write.dal.js` | Mark notification read | DAL does not inspect Supabase error result | Read-state update may fail without propagating an error | Notification remains unread/seen state drifts, but tap appears successful | Read and throw the returned error; let UI revert optimistic state if needed |
| `apps/VCSM/src/features/notifications/inbox/dal/notifications.dal.js` | Mark notifications seen on load | DAL ignores update result entirely | Batch seen-state can fail on list load | Badge/unseen state persists even after opening notifications | Return `{ error }` and let controller record retry or degraded badge state |
| `apps/VCSM/src/features/moderation/controllers/undoConversationCover.controller.js` | Undo conversation cover | Catches everything and returns `{ ok:false }` | Caller loses detail on which undo step failed | UI can only show generic failure while state may be half-restored | Return step-specific failure metadata for folder/message-pointer restore |
| `apps/VCSM/src/features/wanders/core/controllers/replies.controller.js` | Create reply as anon | Recipient claim, mailbox seed, and event writes all warn and continue | Reply succeeds without recipient ownership/mailbox/event parity | Reply appears, but inbox/event trail is incomplete | Move recipient claim + mailbox seed into one contract; leave events to a durable queue |

## Patterns to prioritize

| Pattern | Mutations | Engineering risk |
| --- | --- | --- |
| Best-effort side effects after authoritative write | post mentions, inbox fan-out, report events, Wanders mailbox/events | Users get partial success with hard-to-debug downstream drift |
| Silent degradation in identity/bootstrap | onboarding, login-state record | Identity bugs reappear later, far from the original failure |
| Ignored Supabase error objects | notification read/seen DALs | UI believes state changed when DB did not |

## Recommended hardening rules

1. No mutation DAL should discard Supabase `{ error }` on write paths.
2. No controller should use `.catch(() => {})` unless it returns structured degraded-state metadata.
3. Best-effort writes are acceptable only for analytics-style events, not for user-visible projections like inbox, mentions, mailbox items, or moderation state.
4. Where side effects must stay async, move them into durable server-owned events rather than client warnings.
