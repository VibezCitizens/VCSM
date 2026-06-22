# VCSM Mutation Matrix

## 1. Overview

VCSM mutation architecture is hybrid.

- The dominant app-side pattern is `screen/component -> hook -> controller -> DAL`, but it is not universal.
- The cleanest write paths are the engine-backed identity bootstrap RPC (`platform.provision_vcsm_identity`) and the engine chat send RPC (`chat.send_message_atomic`).
- Many core VCSM flows still orchestrate multi-step writes from client code with no shared transaction boundary: post creation, onboarding, follow-request acceptance, legacy chat, block cleanup, profile image saves, booking service-duration saves, VPORT fuel review, and most Wanders flows.
- The app also mixes app-local authority and engine authority:
  - Identity is platform-first for bootstrap and active-actor state, but VCSM still owns `vc.*` actor creation and hydration.
  - Chat is hybrid: VCSM runtime uses shared `@chat` hooks/controllers in the main experience, but legacy `vc.*` chat DAL/controllers still exist and are still used in some paths.
  - Notifications are mostly read/write-on-read in app code, while creation appears largely DB-trigger-driven or inferred.
- This matrix groups **77 meaningful mutation actions** from a larger number of underlying DAL writes, RPCs, auth mutations, and remote-upload side effects. Grouping is used where one user action fans out into several closely-related writes.

Important interpretation notes:

- `Atomic?` means the full action is inside one DB transaction or one authoritative RPC when that is visible or explicitly stated by code comments.
- `Rollback?` means the code actively compensates when later steps fail. Most rows are `No` or `Partial`.
- `Idempotent?` is judged from the actual code path, not from the hoped-for product behavior.
- `Silent Failure Risk` includes swallowed errors, non-fatal side effects, fire-and-forget writes, and controllers that convert errors into `ok: false` or `false` without surfacing the lower-level failure reason.
- Rows that mention `Cloudflare R2` or `auth session` are included because they are runtime mutation authorities even when they are not SQL table writes.

## 2. Mutation Inventory Summary

- Grouped mutation actions documented: **77**
- Domains covered:
  - auth
  - identity
  - feed
  - posts
  - comments
  - social
  - chat
  - notifications
  - profiles
  - settings
  - vports
  - booking
  - upload/media
  - moderation
  - wanders
  - onboarding
- Most frequently written tables:
  - `vc.posts`
  - `vc.post_media`
  - `vc.post_mentions`
  - `vc.post_comments`
  - `vc.post_reactions`
  - `vc.notifications`
  - `vc.actor_follows`
  - `vc.social_follow_requests`
  - `moderation.blocks`
  - `vc.inbox_entries`
  - `vc.messages`
  - `moderation.actions`
  - `moderation.reports`
  - `moderation.report_events`
  - `vc.vports`
  - `vc.vport_services`
  - `vport.service_booking_profiles`
  - `platform.user_app_state`
  - `platform.user_app_preferences`
  - `wanders.cards`
  - `wanders.mailbox_items`
  - `wanders.replies`
- Highest-risk domains:
  - post/upload
  - social follow-request acceptance and block cleanup
  - legacy `vc.*` chat
  - profile/image save flows
  - VPORT create + services, VPORT fuel review, menu-item image save
  - booking slot-duration propagation
  - moderation resolution
  - Wanders reply/card flows

## 3. Mutation Matrix

| Action | Trigger | Entry Screen / Component | Hook | Controller | DAL / RPC | Tables Written | Atomic? | Rollback? | Idempotent? | Silent Failure Risk | Side Effects | Bug Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login + login-state record | Login form submit | `apps/VCSM/src/features/auth/screens/LoginScreen.jsx` | `apps/VCSM/src/features/auth/hooks/useLogin.js` | `signInWithPassword`, `hydrateAuthSession`, `ensureProfileDiscoverable`; engine `resolveAuthenticatedContext` later records login | `auth.signInWithPassword`, `apps/VCSM/src/features/auth/dal/profile.dal.js`, `engines/identity/src/dal/state.write.dal.js` | `auth` session, `public.profiles`, `platform.user_app_state` | No | No | Partial | Yes - `_recordLoginSilent().catch(() => {})` | Hydrates session, may force profile discoverable, reloads identity context | Medium |
| Send reset password email | Forgot-password submit | Auth reset screen | Auth reset hook | `apps/VCSM/src/features/auth/controllers/sendResetPassword.controller.js` | `apps/VCSM/src/features/auth/dal/resetPassword.dal.js` | `auth` password-reset side effect, no visible app table | Auth-owned | No | Yes-ish | Low | External email side effect | Low |
| Register / anonymous upgrade | Register form submit | Register screen | Register hook | `apps/VCSM/src/features/auth/controllers/register.controller.js` | `apps/VCSM/src/features/auth/dal/register.dal.js` | `auth.users`, `public.profiles`, primary auth session when mirroring Wanders session | No | No | Partial - profile upsert yes, signup no | Medium | May mirror Wanders session into primary app | High |
| Complete onboarding | Onboarding completion | Onboarding screens | `apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js` | `completeOnboardingController` | `apps/VCSM/src/features/auth/dal/onboarding.dal.js`, `createUserActorForProfile`, `platform.provision_vcsm_identity` | `public.profiles`, `vc.actors`, `vc.actor_owners`, `platform.user_app_access`, `platform.user_app_accounts`, `platform.user_app_preferences`, `platform.user_app_state` (NOTE: provision RPC does not create actor links — self-heal finalization handles this post-resolve) | No overall; RPC substep yes | No | Partial | Yes - platform bootstrap is explicitly non-fatal | Finishes profile, creates actor, provisions account shell; actor links created by self-heal finalization on first resolve | High |
| Create user actor for profile | Called from onboarding / bootstrap paths | Not direct UI | Internal controller call | `createUserActorForProfile` | `apps/VCSM/src/features/auth/dal/actorCreate.dal.js`, `actorOwnerCreate.dal.js` | `vc.actors`, `vc.actor_owners` | No | No | Mostly - duplicate owner ignored | Low | Establishes actor ownership bridge | Medium |
| Ensure VCSM platform bootstrap | Called after actor exists | Not direct UI | Internal controller call | `ensureVcsmPlatformBootstrap` | `apps/VCSM/src/features/identity/dal/provision.rpc.dal.js` -> `platform.provision_vcsm_identity` | `platform.user_app_access`, `platform.user_app_accounts`, `platform.user_app_preferences`, `platform.user_app_state` (NOTE: provision RPC creates account shell only; actor links are created by self-heal finalization post-resolve or by vc.create_vport for vport creation) | Yes - inferred RPC transaction | N/A | Yes | Medium - controller converts errors to `{ ok:false }` | Creates account shell; actor links handled separately | Medium |
| Switch active actor | Actor switcher click | Identity switch UI | `useIdentity()` caller chain | engine `switchActiveActor` | `engines/identity/src/dal/actorLinks.write.dal.js` | `platform.user_app_preferences` | Single write | No | Yes | Low | Emits actor-switched event; VCSM rehydrates actor | Medium |
| Upload post media batch | Upload submit before post insert | `apps/VCSM/src/features/upload/screens/UploadScreen.jsx` | `apps/VCSM/src/features/upload/hooks/useUploadSubmit.js` | `apps/VCSM/src/features/upload/api/uploadMedia.js` | Cloudflare upload helpers | Cloudflare R2 only | No | No | No | Medium | Creates remote objects before DB post exists | High |
| Create post (upload flow) | Upload submit | `apps/VCSM/src/features/upload/screens/UploadScreen.jsx` | `useUploadSubmit` | `createPostController` | `insertPost`, `insertPostMedia`, `insertPostMentions`, `deletePostByIdDAL` | `vc.posts`, `vc.post_media`, `vc.post_mentions` | No | Partial - post row deleted if media-row insert fails | No | Yes - mention insert failure only warns | Feed refresh, mentions side effects, orphaned media risk | High |
| Create post (legacy postcard path) | Legacy composer / internal path | Legacy post surfaces | Direct controller/hook callers | `createPostDAL` | `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js`, `postMentions.write.dal.js` | `vc.posts`, `vc.post_mentions` | No | No | No | Yes - mention persistence warning only | Alternate authority path duplicates upload flow | High |
| Edit post | Post edit submit | Post detail / post card UI | Edit post hook | `updatePostTextDAL` caller chain | `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js` | `vc.posts`, `vc.post_mentions` | No | No | Partial | Yes - mention rewrite warning only | Deletes old mentions, inserts new mentions | Medium |
| Delete post (soft delete) | Delete post click | Post detail / post menu | Post detail editing hook | `softDeletePostDAL` caller chain | `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js` | `vc.posts` | Single write | No | Yes | Low | Feed/profile visibility changes | Medium |
| Toggle post reaction | Reaction tap | `ReactionBar.jsx`, profile photo viewer | `apps/VCSM/src/features/post/postcard/hooks/usePostReactions.js`, `usePhotoReactions.js` | `togglePostReactionController` | `postReactions.read.dal.js`, `postReactions.write.dal.js` | `vc.post_reactions` | No | No | Partial toggle | Low | May create notification via DB trigger (inferred) | Medium |
| Send rose gift | Rose tap | `ReactionBar.jsx`, photo viewer | `usePostReactions.js`, `usePhotoReactions.js` | `sendRoseController` | `apps/VCSM/src/features/post/postcard/dal/roseGifts.actor.dal.js` | `vc.post_rose_gifts` | Single write | No | No | Low | May increment counters / trigger notification (inferred) | Medium |
| Create comment / reply | Comment submit | Post detail | Post comments hook | `createRootCommentController`, `createReplyController` | `apps/VCSM/src/features/post/commentcard/dal/comments.dal.js` | `vc.post_comments` | Single write | No | No | Low | Comment tree refresh, notification likely DB-owned/inferred | Medium |
| Edit comment | Comment edit submit | `CommentCard.view.jsx` | `useEditCommentAction.js` | `editCommentController` | `apps/VCSM/src/features/post/commentcard/dal/comments.dal.js` | `vc.post_comments` | Single write | No | Yes-ish | Low | Updates edited content only | Low |
| Delete comment (soft delete) | Delete comment click | Post detail / comment menu | `usePostDetailEditing.js` | `softDeleteCommentController` | `apps/VCSM/src/features/post/commentcard/dal/comments.dal.js` | `vc.post_comments` | Single write | No | Yes-ish | Low | Thread remains but comment hidden/soft-deleted | Low |
| Toggle comment like | Comment like tap | `CommentCard.view.jsx` | `useCommentCard.js` | `toggleCommentLike` | `apps/VCSM/src/features/post/commentcard/dal/commentLikes.dal.js` | `vc.comment_likes` | No | No | Partial toggle | Low | May affect notification/inferred counters | Low |
| Follow public actor | Follow button on public profile | Profile / subscribe surfaces | `useSubscribeAction.js`, `useFollowActorToggle.js` | `ctrlSubscribe` | `apps/VCSM/src/features/social/friend/request/dal/actorFollows.dal.js` | `vc.actor_follows` | Single write | No | Yes - upsert/reactivate | Low | Subscriber counts; notification inferred from DB | Low |
| Unfollow actor | Unfollow tap | Profile / subscribe surfaces | `useSubscribeAction.js`, `useFollowActorToggle.js` | `ctrlUnsubscribe` / follow toggle path | `actorFollows.dal.js` | `vc.actor_follows` | Single write | No | Yes-ish | Low | Follower graph changes immediately | Low |
| Send follow request | Follow tap on private profile | Profile / subscribe surfaces | `useSubscribeAction.js`, `useSendFollowRequest.js` | `ctrlSendFollowRequest` | `followRequests.dal.js` | `vc.social_follow_requests` | Single write | No | Yes - pending upsert | Low | Notification inferred from DB trigger | Medium |
| Accept follow request | Accept request tap | Settings privacy pending requests / notification item | `useFollowRequestActions.js`, `usePendingFollowRequestActions.js` | `ctrlAcceptFollowRequest` | `actorFollows.dal.js`, `followRequests.dal.js` | `vc.actor_follows`, `vc.social_follow_requests` | No | No | Partial | Medium | UI does optimistic hide and synthetic notification replacement | High |
| Decline / cancel follow request | Decline or cancel tap | Settings privacy / follow request UI | `useFollowRequestActions.js` | `ctrlDeclineFollowRequest`, `ctrlCancelFollowRequest` | `followRequests.dal.js` | `vc.social_follow_requests` | Single write | No | Yes-ish | Low | Request disappears from UI | Low |
| Set actor privacy | Privacy toggle | Settings -> Privacy | `apps/VCSM/src/features/settings/privacy/hooks/useActorPrivacy.js` | `ctrlSetActorPrivacy` | `apps/VCSM/src/features/settings/privacy/dal/visibility.dal.js` | `vc.actor_privacy_settings` | Single upsert | No | Yes | Low | Changes follow flow and profile access behavior | Low |
| Save friend ranks | Friend rank save | Friends UI | Friend-rank hook | `saveFriendRanks` | `apps/VCSM/src/features/profiles/dal/friends/friendRanks.write.dal.js` | `vc.friend_ranks` or RPC `vc.save_friend_ranks` | RPC path yes; fallback no | No | RPC path yes; fallback partial | Medium - RPC fallback warning only | Reconciles top-friend ordering | Medium |
| Block actor with cleanup | Block action | Profile/chat/block surfaces | `useBlockActorAction.js`, `useBlockActions.js` | `blockActorController` | `block.write.dal.js`, `applyBlockSideEffects.js` | `moderation.blocks`, `vc.actor_follows`, `vc.friend_ranks` | No | No | Yes for block row; cleanup not independently idempotent | Low | Social graph cleanup, profile/chat access changes | High |
| Unblock actor | Unblock action | Profile/chat/block surfaces | `useBlockActions.js` | `unblockActorController` | `block.write.dal.js` | `moderation.blocks` | Single delete | No | Yes | Low | Does not restore prior follows/ranks | Medium |
| Settings privacy block/unblock duplicate path | Manage blocks in settings | Settings -> Privacy block UI | `useMyBlocks.jsx` | `ctrlBlockActor`, `ctrlUnblockActor` | `apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js` | `moderation.blocks` | Single write | No | Yes | Low | Duplicate block authority without cleanup | High |
| Start direct conversation (engine + legacy fallback) | Message button / start chat | Profile, inbox start, chat entry | `apps/VCSM/src/features/chat/start/hooks/useStartConversation.js` | engine `startDirectConversation`; legacy `apps/VCSM/src/features/chat/start/controllers/startDirectConversation.controller.js` still exists | `chat.get_or_create...` RPC / `openConversation` RPC; legacy `vc_get_or_create_one_to_one`, `open_conversation`, fallback membership + inbox writes | `chat.conversations`, `chat.conversation_members`, `chat.inbox_entries` or legacy `vc.conversation_members`, `vc.inbox_entries` | Engine mostly yes via RPC chain; legacy no | No | Mostly yes | Medium | Navigates to chat, emits creation event, hybrid authority remains | Medium |
| Send message (engine + legacy) | Chat input send | Conversation screen | engine `useConversationMessages.js`; legacy conversation hook/controller callers | engine `engines/chat/src/controller/sendMessage.controller.js`; legacy `apps/VCSM/src/features/chat/conversation/controllers/sendMessage.controller.js` | engine `chat.send_message_atomic`; legacy `messages.write.dal.js` + `inbox_entries.write.dal.js` | Engine: `chat.messages`, `chat.conversations`, `chat.inbox_entries`, `chat.outbox_events`; Legacy: `vc.messages`, `vc.inbox_entries` | Engine yes; legacy no | Engine UI rollback only; legacy none | Engine yes via `client_id`; legacy no | Legacy yes - inbox bump non-fatal | Realtime updates, inbox projection, outbox/domain events | High |
| Edit message (engine + legacy) | Edit message save | Conversation screen | engine `useConversationMessages.js`; legacy message action UI | engine/legacy `editMessageController` | `editMessage.write.dal.js` or legacy `editMessageDAL.js` | `chat.messages` or `vc.messages` | Single write | No | Yes-ish | Low | Updates message content and edit timestamp | Medium |
| Unsend / delete-for-me message (engine + legacy) | Message action menu | Conversation screen | engine `useConversationMessages.js`; legacy message action UI | `unsendMessageController`, `deleteMessageForMeController` | `messageReceipts.write.dal.js`, message update DALs, legacy equivalents | `chat.messages`, `chat.message_receipts` or `vc.messages`, legacy receipt/delete tables | No | Optimistic UI only | Partial | Low-Medium | Affects visibility per viewer vs global unsend | Medium |
| Mark conversation read (engine + legacy) | Open conversation / read boundary update | Conversation screen | conversation/inbox hooks | engine `markConversationRead.controller.js`; legacy `markConversationRead.controller.js` | `conversationRead.write.dal.js`, `inbox.write.dal.js`; legacy equivalents | `chat.conversation_members`, `chat.inbox_entries` or `vc.conversation_members`, `vc.inbox_entries` | No | No | Yes-ish | Low | Resets unread counts | Medium |
| Inbox thread actions + spam cover (engine + legacy) | Delete thread, archive/spam, move folder | Inbox / spam inbox | inbox action hooks | engine `deleteThreadForMeController`, `markConversationSpam.controller.js`; legacy inbox controllers | `deleteThreadForMe.dal.js`, inbox write DALs, moderation/report DALs | `chat.inbox_entries` or `vc.inbox_entries`; moderation side effects can also write `moderation.reports`, `moderation.actions` | No | No | Partial | Yes - spam/report side effects are often non-fatal | Hides thread, may create report/mod action | High |
| Typing presence (engine only) | Typing in conversation | Conversation screen | engine typing hook | engine typing controller/service | `engines/chat/src/dal/typingStates.write.dal.js` | `chat.typing_states` | Single upsert/delete | No | Yes | Low | Realtime presence only | Low |
| Mark notification read | Tap notification | Notifications screen | notification item handlers | `markNotificationRead` call chain | `apps/VCSM/src/features/notifications/inbox/dal/notifications.write.dal.js` | `vc.notifications` | Single update | No | Yes | Yes - returned error ignored | Also marks seen | Medium |
| Mark notifications seen on load | Opening notifications list | Notifications screen | notifications load hook | `Notifications.controller.js` | `apps/VCSM/src/features/notifications/inbox/dal/notifications.dal.js` | `vc.notifications` | Single update | No | Yes-ish | Yes - returned error ignored | Clears unseen status for loaded rows | Medium |
| Mark all notifications seen | Mark-all tap | Notifications header | `useNotificationsHeader.js` | `markAllNotificationsSeen` | `notifications.write.dal.js` | `vc.notifications` | Single update | No | Yes | Low | Also flips `is_read` | Low |
| Direct notification insert helper (dormant / fallback) | Helper call if used | No confirmed live caller in app runtime | None confirmed | `dalInsertNotification` | `apps/VCSM/src/features/notifications/inbox/dal/notifications.create.dal.js` | RPC `vc.create_notification` or direct `vc.notifications` insert | RPC path unknown; direct insert single-write | No | Partial | Medium - follow RLS denial returns `false` | Fallback creation path if DB-trigger path is not used | Medium |
| Save user profile | Save profile click | `UserProfileTab.jsx` | local tab state + save call | `saveProfile`, `saveProfileCore` | `profile.write.dal.js` + upload helpers | `public.profiles` plus Cloudflare R2 if images changed | No | No | Partial | Low | May upload avatar/banner first, then persist DB row | High |
| Save VPORT profile | Save VPORT profile click | `VportProfileTab.jsx` | local tab state + save call | `saveProfile`, `saveProfileCore` | `profile.write.dal.js` + upload helpers | `vc.vports` plus Cloudflare R2 if images changed | No | No | Partial | Low | Same remote-upload-before-DB risk as user profile | High |
| Save VPORT public details | Dashboard/profile save | VPORT dashboard/settings surfaces | controller hook | `saveVportPublicDetailsByActorIdController`, `upsertVportPublicDetails` | `settings/profile/dal/vportPublicDetails.write.dal.js`, dashboard write DAL | `vc.vport_public_details` | Single upsert | No | Yes | Low | Public business details update immediately | Low |
| Save flyer public details | Flyer editor save | `apps/VCSM/src/features/dashboard/flyerBuilder/components/FlyerEditorPanel.jsx` | panel state | `saveFlyerPublicDetails` | `dashboard/flyerBuilder/dal/flyer.write.dal.js` | `vc.vport_public_details` | Single upsert | No | Yes | Low | Updates flyer-specific public fields | Low |
| Save onboarding vibe tags | Onboarding tag submit | `apps/VCSM/src/features/onboarding/screens/CitizenVibesScreen.jsx` | `useOnboardingVibeTags.js` | `saveVibeTagsOnboardingController` | `apps/VCSM/src/features/onboarding/dal/vibeTags.dal.js` | `vc.vibe_actor_tags` | No | No | Partial | Low | Marks all existing rows void, then upserts new rows | Medium |
| Delete account | Delete account confirm | Settings -> Account | `useAccountController.js` | `ctrlDeleteAccount` | `apps/VCSM/src/features/settings/account/dal/account.write.dal.js` -> `delete_my_account` RPC | RPC-owned cleanup, exact tables not visible from JS | Inferred RPC | Inferred RPC | Likely yes | Low | Destructive account-wide cleanup delegated to DB | Medium |
| Delete VPORT | Delete VPORT confirm | Settings -> Account | `useAccountController.js` | `ctrlDeleteVport` | `delete_my_vport` RPC with fallback `dalDeleteOwnedVportById` | `vc.vports` directly in fallback; RPC may touch more | RPC path inferred yes; fallback no | No | Partial | Medium | Fallback hard delete can diverge from RPC cleanup semantics | High |
| Create VPORT | Create VPORT form submit | `apps/VCSM/src/features/vport/CreateVportForm.jsx` | local form state | `createVport` model/dal path | `apps/VCSM/src/features/vport/dal/vport.core.dal.js` -> `vc.create_vport` RPC | `vc.vports`, likely related actor rows inside RPC (inferred) | Inferred RPC | N/A | Likely yes | Low | Returns actor/vport ids and handle | Medium |
| Persist selected services after VPORT create | Immediately after successful VPORT create | `CreateVportForm.jsx` | `useUpsertVportServices()` | post-create inline mutation | `upsertVportServicesByActor.dal.js` | `vc.vport_services` | Single batch upsert | No | Yes-ish | Yes - failure is only logged in form | Can leave new VPORT without its selected services | High |
| Update VPORT core record | Save business profile | VPORT profile/dashboard | model hook | `updateVport` | `apps/VCSM/src/features/vport/dal/vport.core.dal.js` | `vc.vports` | Single update | No | Yes-ish | Low | Core name/slug/avatar/banner/bio changes | Low |
| Upsert VPORT services | Save services | VPORT services admin surfaces | service mutation hook | `upsertVportServicesController` | `upsertVportServicesByActor.dal.js` | `vc.vport_services` | Single upsert batch | No | Yes-ish | Low | Booking/service catalog may depend on it | Medium |
| Submit / update review | Review submit/edit | VPORT review UI | review hook | `ctrlSubmitReview` | `vportReviews.write.dal.js` | `vc.vport_reviews`, `vc.vport_review_ratings` | No | No | One active review per author/target, but multi-step | Low | Trigger recomputes overall rating; read-back refreshes stats | Medium |
| Delete review | Delete review click | VPORT review UI | review hook | `ctrlDeleteMyReview` | `vportReviews.write.dal.js` | `vc.vport_reviews` | Single soft-delete | No | Yes-ish | Low | Review disappears; ratings handled by existing review row semantics | Low |
| Fuel price submission | Submit fuel price | Gas pricing UI | fuel-price hook | `submitFuelPriceSuggestionController` | `vportFuelPriceSubmissions.write.dal.js` or `vportFuelPrices.write.dal.js` | `vc.vport_fuel_price_submissions` or `vc.vport_fuel_prices` | Single write | No | Partial | Low | Owner path writes official price directly; citizen path creates pending submission | Medium |
| Fuel price review and officialization | Approve/reject submission | Gas pricing admin UI | review hook | `reviewFuelPriceSuggestionController` | submission status DAL, official price DAL, history DAL, review-log DAL | `vc.vport_fuel_price_submissions`, `vc.vport_fuel_prices`, `vc.vport_fuel_price_history`, `vc.vport_fuel_price_submission_reviews` | No | No | Partial | Low | Official price, history, and review log can diverge on failure | High |
| Upsert VPORT rate | Save exchange rate | `VportDashboardExchangeScreen.jsx` | adapter hook `useUpsertVportRate` | `upsertVportRateController` | `upsertVportRate.dal.js` / `vportRates.write.dal.js` | `vc.vport_rates` | Single upsert | UI rollback only | Yes-ish | Low | Screen applies optimistic local rate with explicit rollback | Medium |
| Menu category CRUD | Save/delete category | VPORT menu manage panel | menu hooks/panel | `saveVportActorMenuCategoryController`, `deleteVportActorMenuCategoryController` | category DAL files | `vc.vport_actor_menu_categories` | Single create/update/delete per action | No | Partial | Low | Reorders and menu grouping state depend on it | Low |
| Menu item CRUD | Save/delete item | `VportActorMenuItemFormModal.jsx` and menu panel | panel state | `saveVportActorMenuItemController`, `deleteVportActorMenuItemController` | item DAL files | `vc.vport_actor_menu_items` plus Cloudflare R2 if image uploaded | No | No | Partial | Low | Item image upload happens before DB save | High |
| Design studio bootstrap / page save / page delete | Open/save/manage design pages | Flyer design studio screens | design studio hooks/controllers | `ctrlLoadDesignStudio`, `ctrlSaveDesignPageScene`, `ctrlCreateDesignPage`, `ctrlDeleteDesignPage` | `designStudio.write.dal.js` | `vc.design_documents`, `vc.design_pages`, `vc.design_page_versions`, `vc.design_exports`, `vc.design_render_jobs` | No | No | Partial | Low | Multi-step document/page/version lifecycle with no transaction | High |
| Design asset upload + export queue | Upload design asset / queue export | Flyer design studio | asset/export hooks | `ctrlUploadDesignAsset`, `ctrlQueueDesignExport` | Cloudflare upload + `designStudio.write.dal.js` | Cloudflare R2, `vc.design_assets`, `vc.design_exports`, `vc.design_render_jobs` | No | No | Partial | Low | Remote upload can orphan asset if DB insert fails; export creates render jobs | High |
| Ensure owner booking resource | Booking-management open/save | Booking admin surfaces | booking hooks | `ensureOwnerBookingResourceController` | `insertBookingResource.dal.js` | `vport.resources` | Single insert if missing | No | N/A | Yes-ish - re-read on race | Creates default resource for owner actor | Low |
| Create booking | Booking submit | Booking screens / VPORT booking surfaces | booking hook | `createBookingController` | `insertBooking.dal.js` | `vport.bookings` | Single insert | No | No | Low | Schedule/calendar state changes; no notification write visible in JS | Medium |
| Confirm / cancel booking | Booking management action | Booking admin surfaces | booking hook | `confirmBookingController`, `cancelBookingController` | `updateBookingStatus.dal.js` | `vport.bookings` | Single update | No | Yes-ish | Low | Status transitions only | Low |
| Availability rule / exception upsert | Availability save | Booking settings | booking hooks | `setAvailabilityRuleController`, `setAvailabilityExceptionController` | `upsertAvailabilityRule.dal.js`, `upsertAvailabilityException.dal.js` | `vport.availability_rules`, `vport.availability_exceptions` | Single upsert per action | No | Yes | Low | Affects available slots calculation | Low |
| Set resource slot duration | Duration save | Booking settings | booking hook | `setResourceSlotDurationController` | `upsertBookingResourceServices.dal.js`, `saveBookingServiceProfileDurationsByServiceIds.dal.js` | `vport.resource_services`, `vport.service_booking_profiles` | No | No | Partial | Low | May auto-link services before writing durations | High |
| Upload profile avatar/banner to R2 | Save profile with files | User/VPORT profile tabs | upload helpers | `saveProfileCore` via `uploads.uploadAvatar/uploadBanner` | Cloudflare upload helpers | Cloudflare R2 only | No | No | No | Low | Remote object may exist even if DB save fails | High |
| Upload menu item image to R2 | Save menu item with image | `VportActorMenuItemFormModal.jsx` | modal-local upload callback | modal `uploadImageIfNeeded` | `uploadToCloudflare`, `buildR2Key` | Cloudflare R2 only | No | No | No | Low | No cleanup if item save later fails | High |
| Upload post media to R2 | Post submit with files | Upload screens | `useUploadSubmit` | `uploadMedia` | `uploadToCloudflare`, `buildR2Key` | Cloudflare R2 only | No | No | No | Medium | Remote media can outlive failed post creation | High |
| Create report | Report submit / spam action | Post/comment/chat report surfaces | moderation hook | `createReportController` | `reports.dal.js` | `moderation.reports`, best-effort `moderation.report_events`, sometimes `vc.inbox_entries` spam folder bridge | No | No | Dedupe optional only | Yes - report event can be skipped non-fatally | Can move convo to spam folder for reporter | High |
| Actor hide/unhide post/comment | Hide or unhide from viewer | Post/comment moderation UI | visibility hooks | `postVisibility.controller.js`, `commentVisibility.controller.js` | `moderationActions.dal.js` | `moderation.actions` | Single insert per action | No | Yes-ish | Low | Viewer-specific visibility only | Medium |
| Moderator resolution (hide object / dismiss report) | Moderator action | Moderation admin surfaces | moderation hook | `hideReportedObjectController`, `dismissReportController` | `reports.dal.js`, `moderationActions.dal.js`, object-hide DALs | `vc.posts` or `vc.messages`, `moderation.actions`, `moderation.reports`, `moderation.report_events` | No | No | Partial | Medium | Resolves report and may hide object globally | High |
| Undo conversation cover | Undo spam/cover action | Moderation/chat recovery UI | moderation hook | `undoConversationCover` | `conversationCover.write.dal.js`, moderation DALs | `moderation.actions`, `vc.inbox_entries` | No | No | Partial | Yes - catches all and returns `{ ok:false }` | Restores inbox folder and message pointers | High |
| Create Wanders card | Send Wanders card | Wanders create flow | Wanders hook | `createWandersCard` | `cards.write.dal.js`, `mailbox.write.dal.js` | `wanders.cards`, `wanders.mailbox_items` | No | No | No | Low | Seeds sender outbox after card create | High |
| Publish Wanders from builder | Publish from builder UI | Wanders builder | builder hook | `publishWandersFromBuilder` | cards/mailbox DALs + upload helpers | `wanders.cards`, `wanders.mailbox_items`, possibly Cloudflare R2 | No | No | No | Low | Same orphan risk as create card plus optional remote asset | High |
| Mark Wanders card opened | Open shared card | Wanders public card view | Wanders public-card hook | `markWandersCardOpened` | `cards.write.dal.js` | `wanders.cards` | No - read/modify/write counter | No | Partial | Low | Mutates open timestamps and counts | Medium |
| Create reply as anon | Reply submit | Wanders public card view | reply hook | `createReplyAsAnon` | `replies.write.dal.js`, `cards.write.dal.js`, `mailbox.write.dal.js`, `events.write.dal.js` | `wanders.replies`, best-effort `wanders.cards`, `wanders.mailbox_items`, `wanders.card_events` | No | No | No | Yes - several best-effort writes only warn | Claims recipient, seeds mailbox, emits events | High |
| Soft delete reply | Delete reply | Wanders reply UI | reply hook | `softDeleteReply` | `replies.write.dal.js` | `wanders.replies` | Single update | No | Yes-ish | Low | Reply remains but is marked deleted | Low |
| Wanders support records (inboxes / keys / drop links / fingerprints / mailbox seed) | Various setup/admin/background UI actions | Wanders inbox/settings/drop-link surfaces | Wanders hooks | `createAnonWandersInbox`, `updateMyWandersInbox`, `upsertWandersCardKey`, drop-link and fingerprint controllers | multiple Wanders write DALs | `wanders.inboxes`, `wanders.card_keys`, `wanders.inbox_drop_links`, `wanders.user_fingerprints`, `wanders.mailbox_items` | Mostly single-write | No | Mostly yes-ish | Low | Supports routing, ownership, mailbox presence, public access | Medium |

## 4. Identity Mutations

Primary write paths inspected:

- `apps/VCSM/src/features/auth/hooks/useLogin.js`
- `apps/VCSM/src/features/auth/controllers/login.controller.js`
- `apps/VCSM/src/features/auth/controllers/register.controller.js`
- `apps/VCSM/src/features/auth/controllers/onboarding.controller.js`
- `apps/VCSM/src/features/auth/controllers/createUserActor.controller.js`
- `apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js`
- `engines/identity/src/controller/resolveAuthenticatedContext.controller.js`
- `engines/identity/src/controller/switchActiveActor.controller.js`

Key findings:

- Login is not just `auth.signInWithPassword`. The full runtime mutation chain is:
  - auth session mutation
  - session hydration
  - possible `public.profiles.discoverable=true` update
  - later identity-engine `platform.user_app_state` login timestamp write
- Registration is split:
  - anonymous-upgrade path uses `auth.updateUser(...)` and `profiles.upsert(...)`
  - fresh-registration path uses `auth.signUp(...)` and `profiles.upsert(...)`
  - Wanders-aware registration can also mirror the resulting session back into the primary app via `supabase.auth.setSession(...)`
- Onboarding is one of the riskiest identity flows:
  - `upsertCompletedOnboardingProfileDAL(...)`
  - `createUserActorForProfile(...)`
  - `ensureVcsmPlatformBootstrap(...).catch(() => {})`
  - There is no transaction boundary across those steps.
- `createUserActorForProfile` is reasonably robust:
  - it reuses an existing actor when present
  - only creates `vc.actor_owners` if needed
  - duplicate owner writes are ignored only for `23505`
- `ensureVcsmPlatformBootstrap` provisions platform account state (access, account, preferences, state) via a single security-definer RPC. It does NOT create actor links — but the live `vc.create_vport` RPC now handles full platform provisioning including actor links for vport creation. The remaining gap is only for self-heal of citizen-only accounts provisioned by `provision_vcsm_identity`.
- Actor switching is platform-owned and narrow:
  - it validates the requested actor link belongs to the current `user_app_account`
  - then updates `platform.user_app_preferences`
  - VCSM actor hydration happens after the switch, outside that write boundary

Identity write chain:

```text
Login / Register / Onboarding
  -> auth mutation
  -> public.profiles mutation
  -> vc actor creation/ownership
  -> platform bootstrap RPC
  -> active actor preference / login-state writes
```

Biggest identity mutation risks:

- onboarding can partially succeed and leave platform bootstrap missing
- login-state recording is explicitly swallowed
- register/anonymous-upgrade can succeed in auth while profile persistence fails
- actor switch only updates platform preference; any later hydration failure is outside the transaction

## 5. Feed / Post Mutations

Primary files inspected:

- `apps/VCSM/src/features/upload/hooks/useUploadSubmit.js`
- `apps/VCSM/src/features/upload/controllers/createPostController.js`
- `apps/VCSM/src/features/upload/api/uploadMedia.js`
- `apps/VCSM/src/features/upload/dal/insertPost.js`
- `apps/VCSM/src/features/upload/dal/insertPostMedia.js`
- `apps/VCSM/src/features/upload/dal/insertPostMentions.js`
- `apps/VCSM/src/features/upload/dal/postAuthRollback.dal.js`
- `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js`
- `apps/VCSM/src/features/post/postcard/controller/togglePostReaction.controller.js`
- `apps/VCSM/src/features/post/postcard/controller/sendRose.controller.js`

Create-post runtime shape:

```text
UploadScreen submit
  -> useUploadSubmit()
  -> uploadMedia() to R2
  -> createPostController()
     -> insert vc.posts
     -> insert vc.post_media
     -> if media-row insert fails: delete vc.posts row
     -> best-effort insert vc.post_mentions
```

Key findings:

- VCSM currently has **two post-creation authorities**:
  - upload flow: `features/upload/controllers/createPostController.js`
  - legacy postcard flow: `features/post/postcard/dal/post.write.dal.js`
- The upload flow partially compensates:
  - if `vc.post_media` insert fails, it deletes the newly-created `vc.posts` row
  - it does **not** delete already-uploaded R2 media
  - it does **not** fail the post if mention persistence fails
- Mention writes are best-effort in both create and edit paths.
- `visibility` is passed through upload UI input, but this inspected code path does not show a dedicated visibility write into `vc.posts` beyond the stored row fields already used by the post table.
- Reactions and roses are straightforward writes, but neither path is transactionally tied to notification generation from app code.

Risk rating for feed/post writes:

- Highest risk: `createPostController`
- Medium risk: legacy post create/edit, reaction toggle, rose gifts
- Low-medium risk: post soft delete

## 6. Comment Mutations

Primary files inspected:

- `apps/VCSM/src/features/post/commentcard/controller/postComments.controller.js`
- `apps/VCSM/src/features/post/commentcard/controller/editComment.controller.js`
- `apps/VCSM/src/features/post/commentcard/controller/deleteComment.controller.js`
- `apps/VCSM/src/features/post/commentcard/controller/commentReactions.controller.js`
- `apps/VCSM/src/features/post/commentcard/dal/comments.dal.js`
- `apps/VCSM/src/features/post/commentcard/dal/commentLikes.dal.js`

Comment write behavior:

- Root comments and replies both write to `vc.post_comments`.
- Replies are represented by `parent_id`; they are not stored in a separate reply table.
- Comment edit is a single `UPDATE`.
- Comment delete is a soft delete, not a hard delete.
- Comment likes toggle `vc.comment_likes`.

Observations:

- Comment mutations are cleaner than post creation because they are mostly single-table writes.
- Notification side effects for comments are not visible in JS and appear to be DB-owned or inferred.
- There is no rollback complexity because each action is usually a single SQL write.

## 7. Social Mutations

Primary files inspected:

- `apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js`
- `apps/VCSM/src/features/social/friend/request/controllers/followRequests.controller.js`
- `apps/VCSM/src/features/social/friend/request/dal/actorFollows.dal.js`
- `apps/VCSM/src/features/social/friend/request/dal/followRequests.dal.js`
- `apps/VCSM/src/features/settings/privacy/controller/actorPrivacy.controller.js`
- `apps/VCSM/src/features/profiles/dal/friends/friendRanks.write.dal.js`
- `apps/VCSM/src/features/block/controllers/blockActor.controller.js`
- `apps/VCSM/src/features/block/helpers/applyBlockSideEffects.js`
- `apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js`

Key findings:

- Public follow is relatively safe because it is an upsert-like relationship write.
- Private follow requests are more fragile:
  - request creation is a clean pending upsert
  - accept path is two-step and non-atomic:
    - insert/reactivate follow
    - update request status to `accepted`
- The privacy toggle is one of the cleanest social mutations: `vc.actor_privacy_settings.upsert(...)`.
- Friend ranks prefer an RPC contract and only fall back to delete-all + insert-many if the RPC fails. The fallback is much riskier.
- Blocking has **two authorities**:
  - main block system in `features/block/`
  - settings privacy block system in `features/settings/privacy/`
- The main block system is more complete because it deletes follow/friend-rank edges.
- The settings privacy block system writes `moderation.blocks` only and does not run cleanup, so runtime semantics differ by entrypoint.

Most fragile social mutation:

```text
Accept follow request
  -> insert/reactivate vc.actor_follows
  -> update vc.social_follow_requests.status='accepted'
  -> optimistic UI hides notification/request row
```

If the second write fails, the social graph and request state can diverge.

## 8. Chat Mutations

Primary files inspected:

- `apps/VCSM/src/features/chat/start/hooks/useStartConversation.js`
- `apps/VCSM/src/features/chat/conversation/controllers/sendMessage.controller.js`
- `apps/VCSM/src/features/chat/conversation/controllers/markConversationRead.controller.js`
- `apps/VCSM/src/features/chat/conversation/controllers/markConversationSpam.controller.js`
- `apps/VCSM/src/features/chat/inbox/controllers/deleteThreadForMe.controller.js`
- `engines/chat/src/controller/startDirectConversation.controller.js`
- `engines/chat/src/controller/sendMessage.controller.js`
- `engines/chat/src/controller/editMessage.controller.js`
- `engines/chat/src/controller/unsendMessage.controller.js`
- `engines/chat/src/controller/deleteMessageForMe.controller.js`
- `engines/chat/src/controller/markConversationRead.controller.js`
- `engines/chat/src/controller/markConversationSpam.controller.js`

Architecture status:

> **Migration COMPLETE as of 2026-04-05.** All 9 VCSM chat hooks now delegate to the `@chat` engine. Legacy `vc.*` chat controller/DAL files remain on disk as dead code with zero active runtime imports. The "Hybrid authority" rows in the mutation matrix above reflect historical state and have been superseded. (Source: `vcsm.chat.migration-status.md`, `vcsm.runtime.duplicate-write-authorities.md`.)

- VCSM chat runtime is **engine-backed** (previously hybrid during migration).
- The main user-facing start/send/read flows are wired through `@chat`.
- Legacy `vc.*` conversation/message/inbox mutation code still exists on disk but is dead code — zero runtime imports.

Best chat mutation:

```text
useConversationMessages.send()
  -> engines/chat sendMessageController()
  -> chat.send_message_atomic RPC
     -> insert chat.messages
     -> update chat.conversations.last_message
     -> fan out chat.inbox_entries
     -> insert chat.outbox_events
```

Why it is best:

- one authoritative RPC
- client idempotency via `client_id`
- optimistic UI exists, but the DB write itself is atomic

Weak legacy chat path:

```text
legacy sendMessageController()
  -> insert vc.messages
  -> try bump vc.inbox_entries
     -> if inbox bump fails, only log error
```

Key mutation observations:

- Engine send is strong; engine read/delete thread/mark spam are better than legacy, but still not perfectly unified.
- Legacy chat still has non-fatal fan-out behavior.
- Mark-read remains multi-step even in engine chat:
  - update member read pointer
  - update inbox unread state
- Spam/cover flows are especially fragmented because they overlap moderation.

## 9. Notification Mutations

Primary files inspected:

- `apps/VCSM/src/features/notifications/inbox/dal/notifications.write.dal.js`
- `apps/VCSM/src/features/notifications/inbox/dal/notifications.dal.js`
- `apps/VCSM/src/features/notifications/inbox/dal/notifications.create.dal.js`
- `apps/VCSM/src/features/notifications/inbox/controller/Notifications.controller.js`
- `apps/VCSM/src/features/notifications/inbox/controller/NotificationsHeader.controller.js`

What app code actually writes:

- `markNotificationRead(id, recipientActorId)` -> updates `is_read` and `is_seen`
- `dalMarkNotificationsSeen({ actorId, notificationIds })` -> updates `is_seen`
- `markAllNotificationsSeenDAL(actorId)` -> updates both `is_seen` and `is_read`

Important audit note:

- App code **does not clearly own** most notification creation.
- For follows, posts, comments, reactions, and mentions, notification creation is mostly inferred as DB-trigger or RPC-driven.
- `dalInsertNotification(...)` exists as a helper that first tries `vc.create_notification`, then falls back to direct `vc.notifications.insert`, but I did not find a clear live runtime caller in the main app flow.

Risk:

- mark-read and mark-seen-on-load both ignore returned DB errors
- the explicit insert helper has dual semantics and follow-specific `false` returns on RLS denial

## 10. Profile / Settings Mutations

Primary files inspected:

- `apps/VCSM/src/features/settings/profile/controller/saveProfile.controller.js`
- `apps/VCSM/src/features/settings/profile/controller/Profile.controller.core.js`
- `apps/VCSM/src/features/settings/profile/dal/profile.write.dal.js`
- `apps/VCSM/src/features/settings/profile/dal/vportPublicDetails.write.dal.js`
- `apps/VCSM/src/features/settings/account/controller/account.controller.js`
- `apps/VCSM/src/features/settings/account/dal/account.write.dal.js`
- `apps/VCSM/src/features/onboarding/controller/vibeTagsOnboarding.controller.js`

Key findings:

- `saveProfileCore(...)` uploads avatar/banner first, then writes DB.
- That means profile save is not just a single update. It is:
  - remote upload
  - local URL substitution
  - `public.profiles` or `vc.vports` update
- There is no compensating deletion of uploaded files if the DB update fails.
- Account deletion is DB-owned through RPC, which is good for cleanup authority, but the exact cleanup set is not visible in JS.
- VPORT deletion is weaker because the app tries the RPC first and falls back to direct `vc.vports.delete()` if the RPC fails.

## 11. Vport Mutations

Primary files inspected:

- `apps/VCSM/src/features/vport/dal/vport.core.dal.js`
- `apps/VCSM/src/features/vport/CreateVportForm.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/submitFuelPriceSuggestion.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/reviewFuelPriceSuggestion.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/*.controller.js`
- `apps/VCSM/src/features/dashboard/flyerBuilder/**/*.js`

Key findings:

- `createVport` itself is clean because it goes through `vc.create_vport`.
- The real risk is the **post-create services write** in `CreateVportForm.jsx`:
  - VPORT creation can succeed
  - selected-service persistence can fail
  - the failure is only logged
- Reviews are non-atomic because review row and review-rating rows are written separately.
- Fuel-price review is one of the highest-risk business mutations:
  - update submission status
  - optionally update official price
  - insert history
  - insert review log
- Menu item save with image has the same remote-upload-before-DB-save risk as profile and post media.
- Design studio is a mini-subsystem with its own write graph and several multi-step client orchestrations.

## 12. Booking Mutations

Primary files inspected:

- `apps/VCSM/src/features/booking/controller/createBooking.controller.js`
- `apps/VCSM/src/features/booking/controller/confirmBooking.controller.js`
- `apps/VCSM/src/features/booking/controller/cancelBooking.controller.js`
- `apps/VCSM/src/features/booking/controller/ensureOwnerBookingResource.controller.js`
- `apps/VCSM/src/features/booking/controller/setAvailabilityRule.controller.js`
- `apps/VCSM/src/features/booking/controller/setAvailabilityException.controller.js`
- `apps/VCSM/src/features/booking/controller/setResourceSlotDuration.controller.js`

Booking write profile:

- `createBooking` is a relatively clean single insert.
- confirm/cancel are single updates.
- availability rule and exception writes are clean upserts.
- `setResourceSlotDuration` is the risky one:
  - read resource
  - maybe infer services from VPORT services
  - upsert `vport.resource_services`
  - update existing `vport.service_booking_profiles`
  - insert missing `vport.service_booking_profiles`

That flow has no transaction or rollback.

## 13. Upload / Media Mutations

Primary files inspected:

- `apps/VCSM/src/features/upload/api/uploadMedia.js`
- `apps/VCSM/src/features/settings/profile/controller/Profile.controller.core.js`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormModal.jsx`
- `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js`

Shared pattern across media mutations:

- remote object upload happens before the authoritative DB row exists or is updated
- DB persistence failure does not clean up the remote object

This affects:

- post media
- profile avatar/banner
- menu item images
- design studio assets

Upload/media mutation risk is therefore mostly **orphaned object risk**, not malformed SQL state.

## 14. Moderation Mutations

Primary files inspected:

- `apps/VCSM/src/features/moderation/controllers/report.controller.js`
- `apps/VCSM/src/features/moderation/controllers/postVisibility.controller.js`
- `apps/VCSM/src/features/moderation/controllers/commentVisibility.controller.js`
- `apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js`
- `apps/VCSM/src/features/moderation/controllers/undoConversationCover.controller.js`
- `apps/VCSM/src/features/moderation/dal/reports.dal.js`

Moderation write observations:

- `createReportController` is intentionally fail-open for audit-trail persistence:
  - report row is authoritative
  - `report_events` insert is non-fatal
- Spam reports on conversations have a hidden cross-feature side effect:
  - the reporter’s `vc.inbox_entries.folder` is moved to `spam`
- Viewer hide/unhide uses `moderation.actions` as an append-only action log rather than mutating post/comment rows.
- Moderator resolution is a multi-step write bundle with no transaction boundary.
- `undoConversationCover` hides lower-level errors from callers by returning `{ ok:false }`.

## 15. Wanders Mutations

Primary files inspected:

- `apps/VCSM/src/features/wanders/core/controllers/createWandersCard.controller.js`
- `apps/VCSM/src/features/wanders/core/controllers/cards.controller.js`
- `apps/VCSM/src/features/wanders/core/controllers/replies.controller.js`
- `apps/VCSM/src/features/wanders/core/controllers/wandersInboxescontroller.js`
- `apps/VCSM/src/features/wanders/core/controllers/cardKeys.controller.js`

Wanders is mutation-heavy and intentionally tolerant of partial failure.

Examples:

- `createWandersCard`
  - insert `wanders.cards`
  - seed sender mailbox
- `createReplyAsAnon`
  - maybe claim recipient on card
  - maybe seed recipient mailbox
  - maybe insert `recipient_claimed` event
  - insert reply
  - maybe insert `replied` event

Wanders prioritizes message creation and progression over strict consistency. That is good for UX, but it means the system can drift unless reconciled later.

## 16. High-Risk Mutations

Highest-risk actions, ordered by practical bug exposure:

1. `completeOnboardingController`
   - profile, actor, and platform bootstrap are split
   - bootstrap failure is explicitly swallowed
2. `createPostController`
   - remote upload first
   - DB insert second
   - only partial DB rollback
   - mention failures are non-fatal
3. legacy `sendMessageController` in `features/chat/conversation`
   - message write can succeed while inbox fan-out fails
4. `ctrlAcceptFollowRequest`
   - follow edge and request status update are separate writes
5. `blockActorController`
   - block row plus social cleanup are separate writes
6. `saveProfileCore`
   - remote avatar/banner upload before DB update
7. `CreateVportForm.jsx` post-create service persistence
   - VPORT exists but selected services may be missing
8. `reviewFuelPriceSuggestionController`
   - four-step officialization flow with no transaction
9. `setResourceSlotDurationController`
   - multi-table booking propagation without rollback
10. `hideReportedObjectController`
    - hides object, writes moderation action, resolves report, logs event
11. `createWandersCard` / `publishWandersFromBuilder`
    - card and mailbox seed are split
12. `createReplyAsAnon`
    - reply is authoritative, but recipient claim/mailbox/event writes are all best-effort

## 17. Silent Failure Inventory

Concrete silent or fail-open mutation patterns found:

- `apps/VCSM/src/features/auth/controllers/onboarding.controller.js`
  - `ensureVcsmPlatformBootstrap(...).catch(() => {})`
- `engines/identity/src/controller/resolveAuthenticatedContext.controller.js`
  - `_recordLoginSilent(...).catch(() => {})`
- `apps/VCSM/src/features/upload/controllers/createPostController.js`
  - mention insert failure only `console.warn(...)`
- `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js`
  - mention persistence warnings on create/edit
- `apps/VCSM/src/features/chat/conversation/controllers/sendMessage.controller.js`
  - inbox fan-out failure is non-fatal after message write
- `apps/VCSM/src/features/chat/conversation/controllers/markConversationSpam.controller.js`
  - report creation and moderation-action writes are non-fatal
- `engines/chat/src/controller/markConversationSpam.controller.js`
  - moderation side effect is best-effort
- `apps/VCSM/src/features/moderation/controllers/report.controller.js`
  - report-event insert is non-fatal
- `apps/VCSM/src/features/moderation/dal/reports.dal.js`
  - report-event writes may be skipped for the rest of the session after RLS denial
- `apps/VCSM/src/features/vport/CreateVportForm.jsx`
  - selected services persistence failure is only logged
- `apps/VCSM/src/features/notifications/inbox/dal/notifications.write.dal.js`
  - `markNotificationRead(...)` ignores DB error
- `apps/VCSM/src/features/notifications/inbox/dal/notifications.dal.js`
  - `dalMarkNotificationsSeen(...)` ignores DB error
- `apps/VCSM/src/features/moderation/controllers/undoConversationCover.controller.js`
  - catches everything and returns `{ ok:false }`
- `apps/VCSM/src/features/wanders/core/controllers/replies.controller.js`
  - recipient claim, mailbox seeding, and event writes all continue on failure

## 18. Architecture Observations

1. VCSM mutation authority is only partially layered.
   - The intended `hook -> controller -> DAL` pattern exists in many places.
   - But some important flows still have mutation logic partly in components or split across multiple controller roots.

2. Client-side orchestration still owns too many multi-step writes.
   - This is the main source of partial-write risk.
   - The problem is strongest in onboarding, upload/post, legacy chat, VPORT business flows, booking duration propagation, and Wanders.

3. Remote storage and SQL persistence are not treated as one unit.
   - Profile images
   - post media
   - menu item images
   - design assets
   - all can orphan files on failure

4. Hybrid engine/app authority remains a major architectural theme.
   - identity: platform engine + app-local vc actor work
   - chat: shared engine + legacy `vc.*`
   - notifications: app-local read-state + inferred DB-owned creation

5. Duplicated authorities still exist.
   - post creation has two mutation paths
   - block/unblock has two mutation systems
   - chat runtime is engine-backed; legacy vc.* chat code exists on disk but has zero active runtime imports
   - VPORT create + services is split across separate mutations

6. RPC-backed writes are usually the safest paths.
   - `platform.provision_vcsm_identity`
   - `chat.send_message_atomic`
   - `vc.create_vport`
   - `vc.save_friend_ranks` when available

7. Notification creation is hard to audit from app code alone.
   - read-state mutation is clear
   - creation is mostly trigger-owned, RPC-owned, or inferred

Final architecture judgment:

- VCSM mutation architecture is **hybrid**
- partially layered, but not cleanly transaction-bound
- still carrying duplicate write authorities
- not yet migration-ready for a clean runtime-authority story

## 19. Recommendations

Best bug-reduction improvements, in order:

1. Move the worst multi-step client orchestrations behind server-side RPCs or DB functions.
   - create post
   - accept follow request
   - set resource slot duration
   - fuel-price review/officalization
   - moderator hide/resolve

2. Add compensating cleanup for remote uploads.
   - post media
   - profile avatar/banner
   - menu item images
   - design assets

3. Finish chat convergence.
   - Keep engine chat as the write authority
   - retire or isolate remaining legacy `vc.*` write paths

4. Collapse duplicate block authority.
   - Settings privacy block/unblock should call the same controller that applies social cleanup

5. Make notification creation ownership explicit.
   - Either document DB triggers/RPCs as the source of truth
   - or route all app-created notifications through one audited controller

6. Promote partial best-effort writes to explicit outcomes in UI and logs.
   - platform bootstrap failure after onboarding should be surfaced somewhere durable
   - VPORT selected-services failure should not be only a console error
   - report-event skip state should be observable in diagnostics

7. Prefer idempotency keys for more client-originated mutations.
   - post create
   - follow request accept
   - legacy chat send if it stays alive
   - Wanders reply/card creation

8. Create a mutation-authority policy per domain.
   - one authoritative controller per action
   - one DAL family per table
   - one documented transaction boundary per multi-table mutation
