# VCSM Runtime Authority Matrix

## Authority labels

- `App DAL`
- `App Controller`
- `Engine Controller`
- `Database RPC`
- `Database Trigger (inferred)`
- `Remote Storage (Cloudflare)`
- `Hybrid authority`

## Auth / Identity

| Action | Domain | Authority owner | Write entrypoint | Tables / systems | Notes |
| --- | --- | --- | --- | --- | --- |
| Login + login-state record | auth / identity | Hybrid authority | `useLogin.js` -> auth sign-in + engine context resolution | Supabase Auth, `public.profiles`, `platform.user_app_state` | Auth session and login-state write are not owned by one layer |
| Send reset password email | auth | Supabase Auth | `sendResetPassword.controller.js` | Supabase Auth | External side effect only |
| Register / anonymous upgrade | auth | Hybrid authority | `register.controller.js` | `auth.users`, `public.profiles` | Auth signup/update plus app-side profile upsert |
| Complete onboarding | auth / identity | Hybrid authority | `onboarding.controller.js` | `public.profiles`, `vc.actors`, `vc.actor_owners`, `platform.user_app_*` | App owns `vc.*`; RPC owns platform rows |
| Create user actor for profile | identity | App Controller | `createUserActor.controller` | `vc.actors`, `vc.actor_owners` | Pure VCSM domain mutation |
| Ensure VCSM platform bootstrap | identity | Database RPC | `ensureVcsmPlatformBootstrap.controller.js` | `platform.user_app_*`, `vc.actors.user_app_account_id` | RPC is authoritative |
| Switch active actor | identity | Engine Controller | `engines/identity/src/controller/switchActiveActor.controller.js` | `platform.user_app_preferences` | Shared identity engine owns the write |

## Feed / Post / Comments

| Action | Domain | Authority owner | Write entrypoint | Tables / systems | Notes |
| --- | --- | --- | --- | --- | --- |
| Upload post media batch | upload / posts | Remote Storage (Cloudflare) | `uploadMedia.js` | Cloudflare R2 | Storage authority only; DB comes later |
| Create post (upload flow) | posts | App Controller | `createPostController.js` | `vc.posts`, `vc.post_media`, `vc.post_mentions` | Current main post-create authority |
| Create post (legacy postcard path) | posts | App DAL | `post.write.dal.js` `createPostDAL` | `vc.posts`, `vc.post_mentions` | Duplicate post-create authority remains |
| Edit post | posts | App DAL | `updatePostTextDAL` | `vc.posts`, `vc.post_mentions` | Business logic is still thin here |
| Delete post (soft delete) | posts | App DAL | `softDeletePostDAL` | `vc.posts` | Direct DAL-owned delete path |
| Toggle post reaction | posts | App Controller | `togglePostReactionController` | `vc.post_reactions` | Notification creation is inferred DB-side |
| Send rose gift | posts | App Controller | `sendRoseController` | `vc.post_rose_gifts` | Counters/notifications likely DB-owned |
| Create comment / reply | comments | App Controller | `createRootCommentController`, `createReplyController` | `vc.post_comments` | Single VCSM authority |
| Edit comment | comments | App Controller | `editCommentController` | `vc.post_comments` | Single VCSM authority |
| Delete comment (soft delete) | comments | App Controller | `softDeleteCommentController` | `vc.post_comments` | Single VCSM authority |
| Toggle comment like | comments | App Controller | `toggleCommentLike` | `vc.comment_likes` | Notification side effects inferred |

## Social

| Action | Domain | Authority owner | Write entrypoint | Tables / systems | Notes |
| --- | --- | --- | --- | --- | --- |
| Follow public actor | social | App Controller | `ctrlSubscribe` | `vc.actor_follows` | Notification creation inferred DB-side |
| Unfollow actor | social | App Controller | `ctrlUnsubscribe` | `vc.actor_follows` | Single social write authority |
| Send follow request | social | App Controller | `ctrlSendFollowRequest` | `vc.social_follow_requests` | Notifications documented in comments as DB-trigger-owned |
| Accept follow request | social | App Controller | `ctrlAcceptFollowRequest` | `vc.actor_follows`, `vc.social_follow_requests` | No RPC boundary yet |
| Decline / cancel follow request | social | App Controller | `ctrlDeclineFollowRequest`, `ctrlCancelFollowRequest` | `vc.social_follow_requests` | Single write authority |
| Set actor privacy | social / settings | App Controller | `ctrlSetActorPrivacy` | `vc.actor_privacy_settings` | App-layer SSOT |
| Save friend ranks | social | Hybrid authority | `friendRanks.write.dal.js` | RPC `vc.save_friend_ranks` or direct `vc.friend_ranks` writes | RPC preferred, direct fallback still active |
| Block actor with cleanup | block / social | App Controller | `blockActor.controller.js` | `moderation.blocks`, `vc.actor_follows`, `vc.friend_ranks` | Main authority includes cleanup |
| Unblock actor | block / social | App Controller | `blockActor.controller.js` | `moderation.blocks` | Cleanup is not restored |
| Settings privacy block/unblock duplicate path | block / settings | Hybrid authority | `Blocks.controller.js` | `moderation.blocks` | Duplicate block authority without cleanup |

## Chat

> **Migration COMPLETE as of 2026-04-05.** All 9 VCSM chat hooks delegate to the `@chat` engine. Legacy `vc.*` chat paths are dead code with zero active runtime imports. Rows below reflect post-migration state. (Source: `vcsm.chat.migration-status.md`)

| Action | Domain | Authority owner | Write entrypoint | Tables / systems | Notes |
| --- | --- | --- | --- | --- | --- |
| Start direct conversation | chat | Engine Controller | engine `useStartConversation` → `chat.get_or_create_direct_conversation` RPC | `chat.conversations`, `chat.conversation_members`, `chat.inbox_entries` | Legacy VCSM start controller is dead code |
| Send message | chat | Engine Controller | engine `sendMessage.controller.js` → `chat.send_message_atomic` RPC | `chat.messages`, `chat.inbox_entries`, `chat.outbox_events` | Legacy VCSM send path is dead code |
| Edit message | chat | Engine Controller | engine `editMessage.controller.js` | `chat.messages` | Legacy edit path is dead code |
| Unsend / delete-for-me message | chat | Engine Controller | engine lifecycle controllers | `chat.messages`, `chat.message_receipts` | Legacy message lifecycle is dead code |
| Mark conversation read | chat | Engine Controller | engine `markConversationRead.controller.js` | `chat.conversation_members`, `chat.inbox_entries` | V3 fix: always calls `dalResetInboxUnreadCount` |
| Inbox thread actions + spam cover | chat / moderation | Engine Controller (inbox) + App Controller (moderation bridge) | engine inbox controllers + `markConversationSpam.controller.js` | `chat.inbox_entries` + moderation/report rows | Spam/cover flows still touch moderation tables outside engine boundary |
| Typing presence | chat | Engine Controller | engine typing hooks/controllers | `chat.typing_states` | Engine-owned |

## Notifications

| Action | Domain | Authority owner | Write entrypoint | Tables / systems | Notes |
| --- | --- | --- | --- | --- | --- |
| Mark notification read | notifications | App DAL | `notifications.write.dal.js` | `vc.notifications` | Direct DAL update |
| Mark notifications seen on load | notifications | App Controller | `Notifications.controller.js` -> `dalMarkNotificationsSeen` | `vc.notifications` | Read-state owned in app |
| Mark all notifications seen | notifications | App DAL | `markAllNotificationsSeenDAL` | `vc.notifications` | Direct DAL update |
| Direct notification insert helper (dormant / fallback) | notifications | Hybrid authority | `notifications.create.dal.js` | RPC `vc.create_notification` or direct `vc.notifications` insert | Main creation path is still mostly DB-trigger/inferred, not app-owned |

## Profile / Settings

| Action | Domain | Authority owner | Write entrypoint | Tables / systems | Notes |
| --- | --- | --- | --- | --- | --- |
| Save user profile | settings / profile | Hybrid authority | `saveProfileCore` + upload helpers | Cloudflare R2 + `public.profiles` | Upload and DB persistence are split |
| Save VPORT profile | settings / profile | Hybrid authority | `saveProfileCore` + upload helpers | Cloudflare R2 + `vc.vports` | Same split authority as user profile |
| Save VPORT public details | settings / vport | App Controller | VPORT public details controllers | `vc.vport_public_details` | Clean single upsert |
| Save flyer public details | settings / flyer | App Controller | flyer builder save controller | `vc.vport_public_details` | Same table, separate feature controller |
| Save onboarding vibe tags | onboarding | App Controller | onboarding vibe-tag controller | `vc.vibe_actor_tags` | App-local write contract |
| Delete account | settings / account | Database RPC | `account.write.dal.js` `delete_my_account` | RPC-owned cleanup | JS cannot see all affected tables |
| Delete VPORT | settings / account | Hybrid authority | `ctrlDeleteVport` -> RPC or direct fallback | RPC-owned cleanup or direct `vc.vports` delete | Fallback breaks single-authority story |

## VPORT

| Action | Domain | Authority owner | Write entrypoint | Tables / systems | Notes |
| --- | --- | --- | --- | --- | --- |
| Create VPORT | vport | Database RPC | `vport.core.dal.js` `createVport()` | `vc.create_vport` -> inferred `vc.vports` and related rows | Core create is DB-owned |
| Persist selected services after VPORT create | vport | App Controller | inline in `CreateVportForm.jsx` | `vc.vport_services` | Business object creation is split across app + RPC |
| Update VPORT core record | vport | App DAL | `updateVport()` | `vc.vports` | Direct table update |
| Upsert VPORT services | vport | App Controller | `upsertVportServicesController` | `vc.vport_services` | Clean app-owned batch upsert |
| Submit / update review | vport | App Controller | `ctrlSubmitReview` | `vc.vport_reviews`, `vc.vport_review_ratings` | Aggregate recompute is partly DB-owned/inferred |
| Delete review | vport | App Controller | `ctrlDeleteMyReview` | `vc.vport_reviews` | Single feature authority |
| Fuel price submission | vport / gas | App Controller | submit fuel price controller | submissions or official price table | Owner and citizen routes differ |
| Fuel price review and officialization | vport / gas | App Controller | `reviewFuelPriceSuggestionController` | submissions, prices, history, review log | One controller owns several writes |
| Upsert VPORT rate | vport | App Controller | `upsertVportRateController` | `vc.vport_rates` | Optimistic UI on top of single write |
| Menu category CRUD | vport / menu | App Controller | menu category controllers | `vc.vport_actor_menu_categories` | Single feature authority |
| Menu item CRUD | vport / menu | Hybrid authority | modal upload helper + menu item controller | Cloudflare R2 + `vc.vport_actor_menu_items` | Upload and DB persistence split across layers |
| Design studio bootstrap / page save / page delete | vport / design | App Controller | design studio controllers | design document/page/version/export/job tables | App-local orchestration is authoritative |
| Design asset upload + export queue | vport / design | Hybrid authority | asset/export controller + Cloudflare upload | Cloudflare R2 + design asset/export/job tables | Remote storage + SQL queue writes |

## Booking

| Action | Domain | Authority owner | Write entrypoint | Tables / systems | Notes |
| --- | --- | --- | --- | --- | --- |
| Ensure owner booking resource | booking | App Controller | booking resource controller | `vport.resources` | Single app-owned insert |
| Create booking | booking | App Controller | `createBookingController` | `vport.bookings` | No DB-owned event path visible in JS |
| Confirm / cancel booking | booking | App Controller | booking status controllers | `vport.bookings` | Single update authority |
| Availability rule / exception upsert | booking | App Controller | availability controllers | `vport.availability_rules`, `vport.availability_exceptions` | Clean app-owned writes |
| Set resource slot duration | booking | App Controller | `setResourceSlotDurationController` | `vport.resource_services`, `vport.service_booking_profiles` | One controller owns two related writes |

## Upload / Media

| Action | Domain | Authority owner | Write entrypoint | Tables / systems | Notes |
| --- | --- | --- | --- | --- | --- |
| Upload profile avatar/banner to R2 | media | Remote Storage (Cloudflare) | `useProfileUploads.js` | Cloudflare R2 | Pure storage authority |
| Upload menu item image to R2 | media | Remote Storage (Cloudflare) | `VportActorMenuItemFormModal.jsx` | Cloudflare R2 | Pure storage authority |
| Upload post media to R2 | media | Remote Storage (Cloudflare) | `uploadMedia.js` | Cloudflare R2 | Pure storage authority |

## Moderation

| Action | Domain | Authority owner | Write entrypoint | Tables / systems | Notes |
| --- | --- | --- | --- | --- | --- |
| Create report | moderation | App Controller | `createReportController` | `moderation.reports`, `moderation.report_events`, sometimes `vc.inbox_entries` | Report row is app-owned; event trail can degrade |
| Actor hide/unhide post/comment | moderation | App Controller | post/comment visibility controllers | `moderation.actions` | Viewer-specific hide action |
| Moderator resolution (hide object / dismiss report) | moderation | App Controller | `moderationActions.controller.js` | `vc.posts` or `vc.messages`, `moderation.actions`, `moderation.reports`, `moderation.report_events` | No DB transaction boundary |
| Undo conversation cover | moderation | App Controller | `undoConversationCover.controller.js` | `moderation.actions`, `vc.inbox_entries` | Recovery path remains app-owned |

## Wanders

| Action | Domain | Authority owner | Write entrypoint | Tables / systems | Notes |
| --- | --- | --- | --- | --- | --- |
| Create Wanders card | wanders | App Controller | `createWandersCard.controller.js` | `wanders.cards`, `wanders.mailbox_items` | Card and mailbox seed are separate app writes |
| Publish Wanders from builder | wanders | Hybrid authority | `publishWandersFromBuilder.controller.js` | Cloudflare R2 + `wanders.cards`, `wanders.mailbox_items` | Upload + DB persistence split |
| Mark Wanders card opened | wanders | App Controller | `markWandersCardOpened` | `wanders.cards` | Read/modify/write counter update |
| Create reply as anon | wanders | App Controller | `replies.controller.js` | `wanders.replies`, `wanders.cards`, `wanders.mailbox_items`, `wanders.card_events` | One required write plus several best-effort tails |
| Soft delete reply | wanders | App Controller | `softDeleteReply` | `wanders.replies` | Single update |
| Wanders support records (inboxes / keys / drop links / fingerprints / mailbox seed) | wanders | App Controller | multiple Wanders controllers | `wanders.inboxes`, `wanders.card_keys`, `wanders.inbox_drop_links`, `wanders.user_fingerprints`, `wanders.mailbox_items` | Mostly clean app-owned writes |

## Authority takeaways

1. The healthiest authorities are DB RPCs and the shared identity/chat engines.
2. The riskiest areas are hybrid ones: chat, onboarding, block/unblock, notification creation, and upload-backed profile/VPORT mutations.
3. Any future migration work should eliminate duplicate authorities before changing schemas.
