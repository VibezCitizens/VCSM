# Debugger Audit By Feature

Generated: 2026-02-24 17:45:07

Total hits: 490
Total files: 133

## Summary

| Feature | Hits | Files |
|---|---:|---:|
| auth | 2 | 1 |
| block | 10 | 5 |
| chat | 92 | 30 |
| core:app | 4 | 2 |
| core:services | 23 | 3 |
| core:shared | 5 | 3 |
| core:state | 3 | 3 |
| feed | 39 | 7 |
| moderation | 29 | 3 |
| notifications | 11 | 5 |
| post | 27 | 9 |
| profiles | 154 | 31 |
| settings | 15 | 11 |
| social | 34 | 7 |
| upload | 3 | 3 |
| vport | 3 | 3 |
| wanders | 36 | 7 |

## Details

### auth

- src/features/auth/screens/Onboarding.jsx: 2

### block

- src/features/block/dal/block.check.dal.js: 2
- src/features/block/dal/block.read.dal.js: 3
- src/features/block/dal/block.write.dal.js: 2
- src/features/block/hooks/useBlockActions.js: 2
- src/features/block/hooks/useBlockStatus.js: 1

### chat

- src/features/chat/conversation/controllers/leaveConversation.controller.js: 3
- src/features/chat/conversation/controllers/markConversationSpam.controller.js: 3
- src/features/chat/conversation/controllers/sendMessage.controller.js: 1
- src/features/chat/conversation/dal/conversations.write.dal.js: 5
- src/features/chat/conversation/dal/members.read.dal.js: 2
- src/features/chat/conversation/dal/messages.read.dal.js: 2
- src/features/chat/conversation/dal/messages.write.dal.js: 6
- src/features/chat/conversation/dal/read/conversation_members.partner.read.dal.js: 2
- src/features/chat/conversation/dal/read/messages.last.read.dal.js: 1
- src/features/chat/conversation/dal/read/messages.read.dal.js: 3
- src/features/chat/conversation/dal/read/messageVisibility.read.dal.js: 1
- src/features/chat/conversation/dal/write/messageReceipts.write.dal.js: 3
- src/features/chat/conversation/dal/write/messages.write.dal.js: 5
- src/features/chat/conversation/hooks/conversation/useConversation.js: 2
- src/features/chat/conversation/hooks/conversation/useConversationActionsMenu.js: 3
- src/features/chat/conversation/hooks/conversation/useConversationMembers.js: 1
- src/features/chat/conversation/hooks/conversation/useConversationMessages.js: 2
- src/features/chat/conversation/hooks/conversation/useSendMessageActions.js: 1
- src/features/chat/conversation/screen/handlers/conversationView.handlers.js: 3
- src/features/chat/debug/chatNavDebugger.js: 14
- src/features/chat/inbox/controllers/deleteThreadForMe.controller.js: 10
- src/features/chat/inbox/dal/inbox.entry.read.dal.js: 1
- src/features/chat/inbox/dal/inbox.read.dal.js: 3
- src/features/chat/inbox/dal/inbox.write.dal.js: 8
- src/features/chat/inbox/hooks/useInbox.js: 1
- src/features/chat/inbox/hooks/useInboxEntryForConversation.js: 1
- src/features/chat/inbox/model/InboxEntry.model.js: 1
- src/features/chat/start/dal/rpc/openConversation.rpc.js: 2
- src/features/chat/start/hooks/useStartConversation.js: 1
- src/features/chat/z/chat.md: 1

### core:app

- src/app/providers/AuthProvider.jsx: 3
- src/app/routes/index.jsx: 1

### core:services

- src/services/cloudflare/uploadToCloudflare.js: 1
- src/services/supabase/supabaseClient.debug.js: 21
- src/services/supabase/supabaseClient.js: 1

### core:shared

- src/shared/components/BottomNavBar.jsx: 2
- src/shared/hooks/useUserLocation.js: 2
- src/shared/lib/formatTimestamp.js: 1

### core:state

- src/state/actors/assertActorId.js: 1
- src/state/identity/actorResolver.js: 1
- src/state/identity/identityContext.jsx: 1

### feed

- src/features/feed/dal/feed.mentions.dal.js: 1
- src/features/feed/dal/feed.posts.dal.js: 17
- src/features/feed/hooks/useFeed.js: 3
- src/features/feed/model/buildMentionMaps.js: 3
- src/features/feed/pipeline/fetchFeedPage.pipeline.js: 1
- src/features/feed/screens/CentralFeed.jsx: 11
- src/features/feed/screens/DebugPrivacyPanel.jsx: 3

### moderation

- src/features/moderation/dal/reports.dal.js: 19
- src/features/moderation/hooks/useConversationCover.js: 3
- src/features/moderation/hooks/useReportFlow.js: 7

### notifications

- src/features/notifications/inbox/controller/Notifications.controller.js: 1
- src/features/notifications/inbox/hooks/useNotiCount.js: 4
- src/features/notifications/inbox/hooks/useUnreadBadge.js: 1
- src/features/notifications/inbox/lib/resolveInboxActor.js: 2
- src/features/notifications/types/follow/FollowRequestItem.view.jsx: 3

### post

- src/features/post/bridge/profilePosts.bridge.js: 8
- src/features/post/commentcard/hooks/useCommentCard.js: 1
- src/features/post/commentcard/hooks/useCommentThread.js: 3
- src/features/post/commentcard/hooks/usePostCommentCount.js: 1
- src/features/post/postcard/dal/post.write.dal.js: 2
- src/features/post/postcard/hooks/usePostDetailEditing.js: 1
- src/features/post/postcard/hooks/usePostDetailPost.js: 5
- src/features/post/postcard/hooks/usePostDetailReporting.js: 3
- src/features/post/postcard/hooks/usePostReactions.js: 3

### profiles

- src/features/profiles/config/profileTabs.config.js: 1
- src/features/profiles/controller/getProfileView.controller.js: 1
- src/features/profiles/dal/readActorProfile.dal.js: 1
- src/features/profiles/dal/readVportType.dal.js: 1
- src/features/profiles/dal/vportPublicDetails.read.dal.js: 1
- src/features/profiles/hooks/header/useProfileHeaderMessaging.js: 1
- src/features/profiles/hooks/useProfileGate.js: 2
- src/features/profiles/hooks/useProfileView.js: 5
- src/features/profiles/kinds/vport/controller/getVportPublicDetails.controller.js: 7
- src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js: 1
- src/features/profiles/kinds/vport/hooks/services/useVportServices.js: 6
- src/features/profiles/kinds/vport/hooks/useVportPublicDetails.js: 11
- src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuConfirmDeleteModal.jsx: 3
- src/features/profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerCategorySection.jsx: 2
- src/features/profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerToolbar.jsx: 1
- src/features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx: 7
- src/features/profiles/kinds/vport/screens/views/tabs/VportAboutView.jsx: 2
- src/features/profiles/kinds/vport/screens/VportToActorRedirect.jsx: 1
- src/features/profiles/screens/ActorProfileScreen.jsx: 4
- src/features/profiles/screens/views/ActorProfileFriendsView.jsx: 1
- src/features/profiles/screens/views/ActorProfileHeader.jsx: 7
- src/features/profiles/screens/views/ActorProfilePhotosView.jsx: 13
- src/features/profiles/screens/views/ActorProfilePostsView.jsx: 27
- src/features/profiles/screens/views/tabs/friends/components/RankPickerModal.jsx: 1
- src/features/profiles/screens/views/tabs/friends/components/TopFriendsRankEditor.jsx: 2
- src/features/profiles/screens/views/tabs/friends/helpers/hydrateActorsIntoStore.js: 1
- src/features/profiles/screens/views/tabs/friends/hooks/useFriendLists.js: 1
- src/features/profiles/screens/views/tabs/photos/hooks/usePhotoReactions.js: 3
- src/features/profiles/screens/views/tabs/post/controllers/getActorPosts.controller.js: 13
- src/features/profiles/screens/views/tabs/post/dal/fetchPostsForActor.dal.js: 19
- src/features/profiles/screens/views/tabs/post/hooks/useActorPosts.js: 8

### settings

- src/features/settings/account/controller/Account.controller.jsx: 1
- src/features/settings/privacy/controller/Blocks.controller.js: 1
- src/features/settings/privacy/controller/Privacy.controller.jsx: 1
- src/features/settings/privacy/ui/PendingFollowRequests.jsx: 2
- src/features/settings/profile/controller/Profile.controller.jsx: 1
- src/features/settings/profile/controller/saveProfile.controller.js: 2
- src/features/settings/profile/controller/VportPublicDetails.controller.jsx: 2
- src/features/settings/profile/dal/profile.write.dal.js: 1
- src/features/settings/vports/hooks/useProfileActor.js: 1
- src/features/settings/vports/hooks/useVportsList.js: 1
- src/features/settings/vports/hooks/useVportSwitcher.js: 2

### social

- src/features/social/friend/request/dal/actorFollows.dal.js: 3
- src/features/social/friend/request/dal/followRequests.dal.js: 1
- src/features/social/friend/request/hooks/useSubscribeAction.js: 17
- src/features/social/friend/subscribe/dal/subscriberCount.dal.js: 7
- src/features/social/friend/subscribe/hooks/useFollowerCount.js: 4
- src/features/social/friend/subscribe/hooks/useFollowStatus.js: 1
- src/features/social/privacy/dal/actorPrivacy.dal.js: 1

### upload

- src/features/upload/controllers/createPostController.js: 1
- src/features/upload/hooks/useMentionAutocomplete.js: 1
- src/features/upload/lib/compressIfNeeded.js: 1

### vport

- src/features/vport/CreateVportForm.jsx: 1
- src/features/vport/model/vport.model.js: 1
- src/features/vport/model/vport.read.vportRecords.js: 1

### wanders

- src/features/wanders/components/WandersCardPreview.jsx: 8
- src/features/wanders/components/WandersSharePreview.jsx: 1
- src/features/wanders/core/controllers/cards.controller.js: 1
- src/features/wanders/core/controllers/mailbox.controller.js: 18
- src/features/wanders/core/controllers/replies.controller.js: 4
- src/features/wanders/core/hooks/useWandersMailboxExperience.hook.js: 1
- src/features/wanders/services/wandersSupabaseClient.js: 3

