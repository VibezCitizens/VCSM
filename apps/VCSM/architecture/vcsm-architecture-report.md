# VCSM Architecture Audit Report

- Mode: audit-only
- Generated: 2026-03-09T00:56:04.348Z
- Project Root: `C:/Users/trest/OneDrive/Desktop/VCSM`
- Files Scanned: 1334
- Errors: 881
- Warnings: 451
- Files Auto-Fixed: 0

## Rule Summary

- File Naming Rule: 250
- Import Path Rule: 246
- Maximum Folder Depth Rule: 239
- Locked DAL Style: 216
- Module Build Order Rule: 186
- File Size & Decomposition Rule: 33
- File Size Review Warning: 31
- Adapter Contract: 26
- Hook Contract: 22
- Final Screen Contract: 19
- Single Responsibility File Rule: 14
- DAL Contract: 10
- Controller Fan-Out Rule: 9
- UI Ownership Rule: 9
- Cross-Feature Boundary Rule: 6
- Controller Contract: 5
- Shared Layer Contract: 5
- View Screen Contract: 3
- Dependency Direction Rule: 2
- Model Contract: 1

## Pending Fix List

### `src/app/platform/index.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ios
### `src/app/platform/ios/components/IosInstallPrompt.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./IosInstallSteps
### `src/app/platform/ios/index.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ios.env
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./useIOSPlatform
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./useIOSKeyboard
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./IOSDebugHUD
### `src/app/platform/ios/IOSDebugHUD.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ios.env
### `src/app/platform/ios/useIOSKeyboard.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ios.env
### `src/app/platform/ios/useIOSPlatform.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ios.env
### `src/app/routes/index.jsx`

- [WARNING] **File Size Review Warning** — File has 274 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/block.group.js`

- [ERROR] **File Size & Decomposition Rule** — File has 337 effective lines. Maximum allowed is 300.
### `src/dev/diagnostics/groups/bookingFeature.group.js`

- [ERROR] **File Size & Decomposition Rule** — File has 307 effective lines. Maximum allowed is 300.
### `src/dev/diagnostics/groups/bookings.group.js`

- [ERROR] **File Size & Decomposition Rule** — File has 305 effective lines. Maximum allowed is 300.
### `src/dev/diagnostics/groups/chatConversationFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 298 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/chatFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 277 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/chatInboxFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 279 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/chatStartFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 255 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/design.group.js`

- [WARNING] **File Size Review Warning** — File has 287 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/feedFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 283 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/messaging.group.js`

- [ERROR] **File Size & Decomposition Rule** — File has 310 effective lines. Maximum allowed is 300.
### `src/dev/diagnostics/groups/notificationsFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 260 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/onboarding.group.js`

- [WARNING] **File Size Review Warning** — File has 277 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/posts.group.js`

- [ERROR] **File Size & Decomposition Rule** — File has 355 effective lines. Maximum allowed is 300.
### `src/dev/diagnostics/groups/profilesFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 291 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/profilesKindsFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 259 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/reports.group.js`

- [ERROR] **File Size & Decomposition Rule** — File has 366 effective lines. Maximum allowed is 300.
### `src/dev/diagnostics/groups/settingsFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 260 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/settingsProfileFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 282 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/social.group.js`

- [ERROR] **File Size & Decomposition Rule** — File has 379 effective lines. Maximum allowed is 300.
### `src/dev/diagnostics/groups/uploadFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 295 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/vportFeature.group.js`

- [WARNING] **File Size Review Warning** — File has 254 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/groups/vports.group.js`

- [WARNING] **File Size Review Warning** — File has 294 effective lines and should be reviewed for decomposition.
### `src/dev/diagnostics/runAllDiagnostics.js`

- [ERROR] **File Size & Decomposition Rule** — File has 493 effective lines. Maximum allowed is 300.
### `src/dev/diagnostics/ui/DiagnosticsPanel.jsx`

- [WARNING] **File Size Review Warning** — File has 264 effective lines and should be reviewed for decomposition.
### `src/features/actors/dal/getActorSummariesByIds.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/actors/dal/searchActors.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/ads/adapters/ads.adapters.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/ads/dal/ad.storage.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/ads/hooks/useDesktopBreakpoint.js`

- [WARNING] **Module Build Order Rule** — Feature "ads" has layer "hooks" without lower layer "controller" defined.
### `src/features/ads/hooks/useVportAds.js`

- [WARNING] **Module Build Order Rule** — Feature "ads" has layer "hooks" without lower layer "controller" defined.
### `src/features/ads/screens/adsScreens.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "ads" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "ads" has layer "screens" without lower layer "components" defined.
### `src/features/ads/screens/VportAdsSettingsScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/ads/model/vportAdsSettingsShell.model
- [WARNING] **Module Build Order Rule** — Feature "ads" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "ads" has layer "screens" without lower layer "components" defined.
### `src/features/auth/components/RegisterFormCard.jsx`

- [WARNING] **Module Build Order Rule** — Feature "auth" has layer "components" without lower layer "controller" defined.
### `src/features/auth/controllers/createUserActor.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/actorCreate.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/actorOwnerCreate.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/actorGetByProfile.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../model/actor.model
### `src/features/auth/controllers/profile.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/profile.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../model/profile.model
### `src/features/auth/dal/actorCreate.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/auth/dal/actorGetByProfile.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/auth/dal/actorOwnerCreate.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/auth/dal/authSession.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/auth/dal/login.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/auth/dal/onboarding.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/auth/dal/profile.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/auth/dal/register.dal.js`

- [ERROR] **DAL Contract** — DAL must not import higher layers: @/features/wanders/adapters/services/wandersSupabaseClient.adapter
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/auth/dal/resetPassword.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/auth/hooks/useAuthOnboarding.js`

- [WARNING] **Module Build Order Rule** — Feature "auth" has layer "hooks" without lower layer "controller" defined.
### `src/features/auth/hooks/useCompleteProfileGate.js`

- [WARNING] **Module Build Order Rule** — Feature "auth" has layer "hooks" without lower layer "controller" defined.
### `src/features/auth/hooks/useLogin.js`

- [WARNING] **Module Build Order Rule** — Feature "auth" has layer "hooks" without lower layer "controller" defined.
### `src/features/auth/hooks/useRegister.js`

- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/auth/model/registerPasswordRules.model
- [WARNING] **Module Build Order Rule** — Feature "auth" has layer "hooks" without lower layer "controller" defined.
### `src/features/auth/hooks/useResetPassword.js`

- [WARNING] **Module Build Order Rule** — Feature "auth" has layer "hooks" without lower layer "controller" defined.
### `src/features/auth/screens/CompleteProfileGate.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "auth" has layer "screens" without lower layer "controller" defined.
### `src/features/auth/screens/LoginScreen.jsx`

- [WARNING] **Module Build Order Rule** — Feature "auth" has layer "screens" without lower layer "controller" defined.
### `src/features/auth/screens/Onboarding.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "auth" has layer "screens" without lower layer "controller" defined.
### `src/features/auth/screens/RegisterScreen.jsx`

- [WARNING] **Module Build Order Rule** — Feature "auth" has layer "screens" without lower layer "controller" defined.
### `src/features/auth/screens/ResetPasswordScreen.jsx`

- [WARNING] **Module Build Order Rule** — Feature "auth" has layer "screens" without lower layer "controller" defined.
### `src/features/block/adapters/dal/block.check.dal.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/block/dal/block.check.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/block/dal/block.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/block/dal/block.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/block/hooks/useBlockActions.js`

- [WARNING] **Module Build Order Rule** — Feature "block" has layer "hooks" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "block" has layer "hooks" without lower layer "controller" defined.
### `src/features/block/hooks/useBlockActorAction.js`

- [WARNING] **Module Build Order Rule** — Feature "block" has layer "hooks" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "block" has layer "hooks" without lower layer "controller" defined.
### `src/features/block/hooks/useBlockStatus.js`

- [WARNING] **Module Build Order Rule** — Feature "block" has layer "hooks" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "block" has layer "hooks" without lower layer "controller" defined.
### `src/features/block/index.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./dal/block.check.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./dal/block.read.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./dal/block.write.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./helpers/applyBlockSideEffects
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./hooks/useBlockActions
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./hooks/useBlockStatus
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ui/BlockButton
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ui/BlockConfirmModal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ui/BlockedState
### `src/features/booking/controller/getResourceAvailability.controller.js`

- [ERROR] **Controller Fan-Out Rule** — Controller imports 7 external modules. Maximum allowed is 5.
### `src/features/booking/controller/setResourceSlotDuration.controller.js`

- [ERROR] **Controller Fan-Out Rule** — Controller imports 7 external modules. Maximum allowed is 5.
### `src/features/booking/dal/getActorById.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/getBookingById.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/getBookingResourceById.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/insertBooking.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/insertBookingResource.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/listAvailabilityExceptionsInRange.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/listAvailabilityRulesByResourceId.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/listBookingResourcesByOwnerActorId.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/listBookingResourceServicesByResourceId.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/listBookingServiceProfilesByServiceIds.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/listBookingsInRange.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/updateBookingStatus.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/upsertAvailabilityException.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/upsertAvailabilityRule.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/booking/dal/upsertBookingResourceServices.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/adapters/conversation/dal/read/messages.read.dal.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/chat/adapters/inbox/dal/inbox.write.dal.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/adapters/MessageGroup.adapter.jsx`

- [WARNING] **Adapter Contract** — Adapter should remain thin and declarative. Non-re-export logic detected.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./MessageRow.adapter
### `src/features/chat/conversation/adapters/MessageList.adapter.jsx`

- [ERROR] **Adapter Contract** — Adapter must not import or use Supabase.
- [WARNING] **Adapter Contract** — Adapter should remain thin and declarative. Non-re-export logic detected.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./MessageGroup.adapter
### `src/features/chat/conversation/adapters/MessageRow.jsx`

- [WARNING] **Adapter Contract** — Adapter should remain thin and declarative. Non-re-export logic detected.
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/MessageBubble
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/MessageActionsMenu
### `src/features/chat/conversation/components/ChatInput.jsx`

- [WARNING] **File Size Review Warning** — File has 253 effective lines and should be reviewed for decomposition.
### `src/features/chat/conversation/components/MessageGroup.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./MessageBubble
### `src/features/chat/conversation/components/MessageList.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./MessageGroup
### `src/features/chat/conversation/controllers/getConversationMessages.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/read/messages.read.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/read/messageVisibility.read.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../model/Message.model
### `src/features/chat/conversation/controllers/message-actions/deleteMessage.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../dal/write/messages.write.dal
### `src/features/chat/conversation/controllers/message-actions/deleteMessageForMe.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../ensureConversationMembership.controller
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../dal/write/messageReceipts.write.dal
### `src/features/chat/conversation/controllers/message-actions/editMessage.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../dal/read/fetchMessageForEditDAL
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../dal/write/editMessageDAL
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../model/Message.model
### `src/features/chat/conversation/controllers/message-actions/getConversationMembers.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../dal/read/members.read.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../model/ConversationMember.model
### `src/features/chat/conversation/controllers/message-actions/readConversationMembers.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../dal/read/members.read.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../model/ConversationMember.model
### `src/features/chat/conversation/controllers/message-actions/unsendMessage.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../dal/read/messages.read.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../dal/write/messages.write.dal
### `src/features/chat/conversation/controllers/sendMessage.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/write/messages.write.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/read/conversation_members.partner.read.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/inbox_entries.write.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../model/Message.model
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ensureConversationMembership.controller
### `src/features/chat/conversation/dal/conversations.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/inbox_entries.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/members.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/messages.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/messages.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/read/conversation_members.partner.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/read/conversationRead.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/read/fetchMessageForEditDAL.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/read/members.read.dal.js`

- [ERROR] **Cross-Feature Boundary Rule** — Feature "chat" imports "actors" internals directly: @/features/actors/dal/getActorSummariesByIds.dal
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/read/messages.last.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/read/messages.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/read/messageVisibility.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/realtime/typingPresence.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/write/conversationRead.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/write/editMessageDAL.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/write/messageReceipts.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/write/messages.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/dal/write/reports.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/conversation/hooks/conversation/useConversationGuards.js`

- [ERROR] **Hook Contract** — Hook must not import or use Supabase.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../permissions/canReadConversation
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../permissions/canSendMessage
### `src/features/chat/conversation/hooks/conversation/useConversationMessages.js`

- [WARNING] **File Size Review Warning** — File has 264 effective lines and should be reviewed for decomposition.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../controllers/getConversationMessages.controller
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../controllers/sendMessage.controller
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../controllers/message-actions/editMessage.controller
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../controllers/message-actions/deleteMessageForMe.controller
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../controllers/message-actions/unsendMessage.controller
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../realtime/subscribeToConversation
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../model/Message.model
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../features/messages/generateClientId
### `src/features/chat/conversation/hooks/conversation/useMediaViewer.js`

- [ERROR] **Hook Contract** — Hook must not import or use Supabase.
### `src/features/chat/conversation/hooks/conversation/useMessageActionsMenu.js`

- [ERROR] **Hook Contract** — Hook must not import or use Supabase.
### `src/features/chat/conversation/hooks/conversation/useSendMessageActions.js`

- [ERROR] **Hook Contract** — Hook must not import or use Supabase.
### `src/features/chat/conversation/screen/handlers/conversationView.handlers.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../controllers/markConversationSpam.controller
### `src/features/chat/conversation/screen/selectors/conversationView.selectors.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../lib/resolvePartnerActor
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../permissions/canReadConversation
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../permissions/canSendMessage
### `src/features/chat/inbox/components/InboxList.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./CardInbox
### `src/features/chat/inbox/controllers/deleteThreadForMe.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/deleteThreadForMe.dal
### `src/features/chat/inbox/dal/deleteThreadForMe.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/inbox/dal/inbox.entry.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/inbox/dal/inbox.read.dal.js`

- [ERROR] **Cross-Feature Boundary Rule** — Feature "chat" imports "actors" internals directly: @/features/actors/dal/getActorSummariesByIds.dal
- [ERROR] **File Size & Decomposition Rule** — File has 369 effective lines. Maximum allowed is 300.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/inbox/dal/inbox.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/inbox/hooks/useInbox.js`

- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/chat/inbox/model/InboxEntry.model
### `src/features/chat/inbox/hooks/useVexSettings.js`

- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/chat/inbox/model/vexSettings.model
### `src/features/chat/inbox/screens/ArchivedInboxScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/chat/inbox/model/vexSettings.model
### `src/features/chat/inbox/screens/InboxScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/chat/inbox/model/vexSettings.model
### `src/features/chat/inbox/screens/RequestsInboxScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/chat/inbox/model/vexSettings.model
### `src/features/chat/inbox/screens/SpamInboxScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/chat/inbox/model/vexSettings.model
### `src/features/chat/index.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./inbox/screens/InboxScreen
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./conversation/screen/ConversationScreen
### `src/features/chat/start/controllers/searchDirectory.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/read/searchActors.dal
### `src/features/chat/start/dal/read/searchActors.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/start/dal/rpc/getOrCreateDirectConversation.rpc.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/start/dal/rpc/openConversation.rpc.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/chat/start/hooks/useStartConversation.js`

- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/upload/adapters/model/resolveRealm.adapter
### `src/features/chat/start/models/directorySearchResult.model.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./profileSearchResult.model
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./vportSearchResult.model
### `src/features/chat/start/screens/StartConversationModal.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/dashboard/adapters/vport/screens/components/VportBackButton.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/dashboard/adapters/vport/screens/model/vportDashboardShellStyles.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/dashboard/adapters/vport/screens/useDesktopBreakpoint.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/dashboard/adapters/vport/vportDashboardShellStyles.adapter.js`

- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/dashboard/vport/screens/model/vportDashboardShellStyles
### `src/features/dashboard/flyerBuilder/components/FlyerEditorPanel.jsx`

- [ERROR] **File Size & Decomposition Rule** — File has 349 effective lines. Maximum allowed is 300.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ImageDropzone
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/flyer.upload.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/flyer.write.dal
### `src/features/dashboard/flyerBuilder/dal/flyer.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/dashboard/flyerBuilder/dal/flyer.upload.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/dashboard/flyerBuilder/dal/flyer.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/dashboard/flyerBuilder/dal/flyerDraft.model.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/dashboard/flyerBuilder/designStudio/components/canvasStage/canvasMath.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/dashboard/flyerBuilder/designStudio/components/canvasStage/DesignStudioNodeBody.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/dashboard/flyerBuilder/designStudio/components/DesignStudioCanvasStage.jsx`

- [ERROR] **File Size & Decomposition Rule** — File has 523 effective lines. Maximum allowed is 300.
### `src/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioInlineColorPicker.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioSidebarLayersSection.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioSidebarPageSection.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/designStudioSidebarRight.styles.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioSidebarSelectionSection.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/dashboard/flyerBuilder/designStudio/components/topBar/DesignStudioTextColorPicker.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js`

- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 3 use-cases. Prefer one controller file per use-case.
### `src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.pages.controller.js`

- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 3 use-cases. Prefer one controller file per use-case.
### `src/features/dashboard/flyerBuilder/designStudio/dal/designStudio.auth.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/dashboard/flyerBuilder/designStudio/hooks/useDesignStudio.js`

- [WARNING] **File Size Review Warning** — File has 293 effective lines and should be reviewed for decomposition.
### `src/features/dashboard/flyerBuilder/designStudio/hooks/useDesignStudioSceneActions.js`

- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/dashboard/flyerBuilder/designStudio/model/designStudioScene.model
### `src/features/dashboard/flyerBuilder/model/vportActorMenuFlyerEditorScreen.styles.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerEditorScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/flyerBuilder/model/vportActorMenuFlyerEditorScreen.styles
### `src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/dashboard/qrcode/components/flyer/PosterFlyer.jsx`

- [ERROR] **File Size & Decomposition Rule** — File has 361 effective lines. Maximum allowed is 300.
### `src/features/dashboard/qrcode/components/QrCard.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./QrCode
### `src/features/dashboard/qrcode/menu/VportActorMenuQrView.jsx`

- [WARNING] **File Size Review Warning** — File has 272 effective lines and should be reviewed for decomposition.
### `src/features/dashboard/vport/screens/components/VportBackButton.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/dashboard/vport/screens/components/VportDashboardGasPanels.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **UI Ownership Rule** — Feature component must not import another feature's internal UI: @/features/profiles/adapters/kinds/vport/screens/gas/components/GasPricesPanel.adapter
- [ERROR] **UI Ownership Rule** — Feature component must not import another feature's internal UI: @/features/profiles/adapters/kinds/vport/screens/gas/components/GasStates.adapter
- [ERROR] **UI Ownership Rule** — Feature component must not import another feature's internal UI: @/features/profiles/adapters/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList.adapter
### `src/features/dashboard/vport/screens/components/VportDashboardParts.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/dashboard/vport/screens/components/VportSettingsAdsPreview.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/dashboard/vport/screens/model/buildDashboardCards.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/dashboard/vport/screens/model/dashboardViewByVportType.model.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/dashboard/vport/screens/model/vportDashboardShellStyles.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/dashboard/vport/screens/useDesktopBreakpoint.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/dashboard/vport/screens/VportDashboardCalendarScreen.jsx`

- [ERROR] **File Size & Decomposition Rule** — File has 713 effective lines. Maximum allowed is 300.
- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/screens/model/vportDashboardShellStyles
### `src/features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/screens/model/vportDashboardShellStyles
### `src/features/dashboard/vport/screens/VportDashboardGasScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/screens/model/vportDashboardShellStyles
### `src/features/dashboard/vport/screens/VportDashboardReviewScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/screens/model/vportDashboardShellStyles
### `src/features/dashboard/vport/screens/VportDashboardScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/screens/model/buildDashboardCards
- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/screens/model/vportDashboardShellStyles
- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/screens/model/dashboardViewByVportType.model
### `src/features/dashboard/vport/screens/VportDashboardServicesScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/screens/model/vportDashboardShellStyles
### `src/features/dashboard/vport/screens/VportSettingsScreen.jsx`

- [WARNING] **File Size Review Warning** — File has 297 effective lines and should be reviewed for decomposition.
- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/screens/model/vportDashboardShellStyles
- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/screens/model/buildDashboardCards
- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/screens/model/dashboardViewByVportType.model
- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/dashboard/vport/model/vportSettingsDraft.model
### `src/features/explore/controller/searchResults.controller.js`

- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 3 use-cases. Prefer one controller file per use-case.
### `src/features/explore/dal/search.dal.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./search.data
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/explore/dal/search.data.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Size & Decomposition Rule** — File has 308 effective lines. Maximum allowed is 300.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/explore/screens/ExploreScreen.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../ui/SearchScreen.view
- [WARNING] **Module Build Order Rule** — Feature "explore" has layer "screens" without lower layer "components" defined.
### `src/features/explore/ui/ResultList.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ActorSearchResultRow
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./FeaturedResultCard
### `src/features/explore/ui/SearchScreen.view.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../hooks/useSearchActor
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ResultList
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ExploreFeed
### `src/features/explore/usecases/search.usecase.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/search.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../model/search.model
### `src/features/feed/adapters/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/feed/dal/feed.mentions.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/dal/feed.posts.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/dal/feed.read.actorsBundle.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/dal/feed.read.blockRows.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/dal/feed.read.debugPrivacyRows.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/dal/feed.read.followRows.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/dal/feed.read.hiddenPosts.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/dal/feed.read.media.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/dal/feed.read.posts.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/dal/feed.read.viewerContext.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/dal/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/dal/listActorPostsByActor.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/feed/hooks/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "hooks" without lower layer "controller" defined.
### `src/features/feed/hooks/useCentralFeedActions.js`

- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "hooks" without lower layer "controller" defined.
### `src/features/feed/hooks/useDebugPrivacyRows.js`

- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "hooks" without lower layer "controller" defined.
### `src/features/feed/hooks/useFeed.js`

- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "hooks" without lower layer "controller" defined.
### `src/features/feed/model/buildMentionMaps.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/feed/model/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/feed/model/inferMediaType.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/feed/model/normalizeFeedRows.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/feed/screens/CentralFeedScreen.jsx`

- [WARNING] **File Size Review Warning** — File has 266 effective lines and should be reviewed for decomposition.
- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "screens" without lower layer "components" defined.
### `src/features/feed/screens/DebugFeedFilterPanel.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "screens" without lower layer "components" defined.
### `src/features/feed/screens/DebugPrivacyPanel.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "screens" without lower layer "components" defined.
### `src/features/feed/screens/FeedConfirmModal.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "screens" without lower layer "components" defined.
### `src/features/feed/screens/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "feed" has layer "screens" without lower layer "components" defined.
### `src/features/language/generate-visible-ui-language.mjs`

- [ERROR] **File Size & Decomposition Rule** — File has 594 effective lines. Maximum allowed is 300.
### `src/features/moderation/components/ChatSpamCover.jsx`

- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "components" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "components" without lower layer "controller" defined.
### `src/features/moderation/components/ReportCoverScreen.jsx`

- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "components" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "components" without lower layer "controller" defined.
### `src/features/moderation/components/ReportedObjectCover.jsx`

- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "components" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "components" without lower layer "controller" defined.
### `src/features/moderation/components/ReportModal.jsx`

- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "components" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "components" without lower layer "controller" defined.
### `src/features/moderation/components/ReportThanksOverlay.jsx`

- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "components" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "components" without lower layer "controller" defined.
### `src/features/moderation/controllers/getConversationCoverStatus.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/moderationActions.dal
### `src/features/moderation/controllers/undoConversationCover.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/moderationActions.dal
### `src/features/moderation/dal/moderationActions.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/moderation/dal/reports.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/moderation/hooks/useConversationCover.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../controllers/getConversationCoverStatus.controller
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../controllers/undoConversationCover.controller
- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "hooks" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "hooks" without lower layer "controller" defined.
### `src/features/moderation/hooks/useHidePostForActor.js`

- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "hooks" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "hooks" without lower layer "controller" defined.
### `src/features/moderation/hooks/useReportFlow.js`

- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "hooks" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "moderation" has layer "hooks" without lower layer "controller" defined.
### `src/features/notifications/inbox/controller/inboxUnread.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/inboxUnreadCount.dal
### `src/features/notifications/inbox/controller/Notifications.controller.js`

- [ERROR] **Controller Fan-Out Rule** — Controller imports 7 external modules. Maximum allowed is 5.
- [ERROR] **Cross-Feature Boundary Rule** — Feature "notifications" imports "social" internals directly: @/features/social/friend/request/controllers/followRequests.controller
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/notifications.read.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/notifications.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../lib/blockFilter
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../lib/resolveSenders
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../model/notification.mapper
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../lib/resolveInboxActor
### `src/features/notifications/inbox/controller/notificationsCount.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/notifications.count.dal
### `src/features/notifications/inbox/controller/NotificationsHeader.controller.js`

- [ERROR] **Controller Contract** — Controller must not import or use Supabase directly.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/notifications.count.dal
- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 2 use-cases. Prefer one controller file per use-case.
### `src/features/notifications/inbox/dal/inboxUnreadCount.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/notifications/inbox/dal/notifications.count.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/notifications/inbox/dal/notifications.create.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/notifications/inbox/dal/notifications.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/notifications/inbox/dal/notifications.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/notifications/inbox/dal/notifications.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/notifications/inbox/hooks/useNotiCount.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../controller/notificationsCount.controller
### `src/features/notifications/inbox/hooks/useNotifications.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./useNotificationsInternal
### `src/features/notifications/inbox/hooks/useNotificationsHeader.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../controller/NotificationsHeader.controller
### `src/features/notifications/inbox/hooks/useNotificationsInternal.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../controller/Notifications.controller
### `src/features/notifications/inbox/hooks/useUnreadBadge.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../controller/inboxUnread.controller
### `src/features/notifications/inbox/lib/resolveSenders.js`

- [ERROR] **Cross-Feature Boundary Rule** — Feature "notifications" imports "actors" internals directly: @/features/actors/dal/getActorSummariesByIds.dal
### `src/features/notifications/inbox/model/notification.mapper.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/notifications/inbox/ui/Notifications.view.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./NotificationItem.view
### `src/features/notifications/screen/NotificationsScreen.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./views/NotificationsScreenView
### `src/features/notifications/screen/views/NotificationsScreenView.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../inbox/hooks/useNotifications
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../inbox/hooks/useNotificationsHeader
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../inbox/ui/Notifications.view
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../inbox/ui/NotificationsHeader.view
### `src/features/onboarding/controller/onboardingController.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **File Size Review Warning** — File has 270 effective lines and should be reviewed for decomposition.
### `src/features/onboarding/controller/vibeTagsOnboarding.controller.js`

- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 2 use-cases. Prefer one controller file per use-case.
### `src/features/onboarding/dal/onboardingSteps.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/onboarding/dal/profileCompletion.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/onboarding/dal/vibeInvites.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/onboarding/dal/vibeTags.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/onboarding/screens/OnboardingCardsView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/post/adapters/postcard/controller/sendRose.controller.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/post/adapters/postcard/controller/togglePostReaction.controller.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/post/adapters/postcard/postReactions.adapter.js`

- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/post/adapters/postcard/controller/togglePostReaction.controller.adapter
- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/post/adapters/postcard/controller/sendRose.controller.adapter
### `src/features/post/adapters/screens/PostDetail.view.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/post/commentcard/components/CommentCard.container.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../hooks/useCommentCard
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../ui/CommentCard.view
### `src/features/post/commentcard/components/CommentList.jsx`

- [ERROR] **UI Ownership Rule** — Feature component must not import another feature's internal UI: @/features/moderation/adapters/components/ReportThanksOverlay.adapter
### `src/features/post/commentcard/components/CommentReplies.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./CommentCard.container
### `src/features/post/commentcard/controller/commentReactions.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/commentLikes.dal
### `src/features/post/commentcard/controller/commentReactions.hydrator.controller.js`

- [ERROR] **Controller Contract** — Controller must not import or use Supabase directly.
### `src/features/post/commentcard/controller/postComments.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/postComments.read.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/comments.dal
- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 4 use-cases. Prefer one controller file per use-case.
### `src/features/post/commentcard/dal/commentLikes.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/commentcard/dal/comments.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/commentcard/dal/comments.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/commentcard/dal/postComments.count.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/commentcard/dal/postComments.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/commentcard/hooks/useCommentCard.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../model/Comment.model
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../controller/commentReactions.controller
### `src/features/post/commentcard/ui/CommentCard.view.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/cc/CommentHeader
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/cc/CommentBody
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/cc/CommentActions
### `src/features/post/postcard/adapters/PostCard.jsx`

- [WARNING] **Adapter Contract** — Adapter should remain thin and declarative. Non-re-export logic detected.
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../ui/PostCard.view
### `src/features/post/postcard/components/PostFooter.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ReactionBar
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../commentcard/components/CommentInput
### `src/features/post/postcard/components/ReactionBar.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../hooks/usePostReactions
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./BinaryReactionButton
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./RoseReactionButton
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./CommentButton
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ShareReactionButton
### `src/features/post/postcard/controller/getPostReactions.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/postReactions.read.dal
### `src/features/post/postcard/controller/togglePostReaction.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/postReactions.read.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/postReactions.write.dal
### `src/features/post/postcard/dal/post.listByActor.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/postcard/dal/post.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/postcard/dal/post.write.dal.js`

- [ERROR] **DAL Contract** — DAL must not import higher layers: @/features/upload/adapters/dal/insertPostMentions.adapter
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/postcard/dal/postMentions.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/postcard/dal/postReactions.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/postcard/dal/postReactions.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/postcard/dal/roseGifts.actor.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/post/postcard/hooks/usePostReactions.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../controller/togglePostReaction.controller
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../controller/getPostReactions.controller
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../controller/sendRose.controller
### `src/features/post/postcard/ui/PostCard.view.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/MediaCarousel
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/ReactionBar
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/PostHeader
### `src/features/post/screens/PostDetail.screen.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "dal" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "hooks" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "components" defined.
### `src/features/post/screens/PostDetail.view.jsx`

- [ERROR] **File Size & Decomposition Rule** — File has 383 effective lines. Maximum allowed is 300.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "dal" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "hooks" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "components" defined.
### `src/features/post/screens/PostFeed.screen.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "dal" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "hooks" defined.
- [WARNING] **Module Build Order Rule** — Feature "post" has layer "screens" without lower layer "components" defined.
### `src/features/professional/briefings/controller/listProfessionalBriefings.controller.js`

- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 2 use-cases. Prefer one controller file per use-case.
### `src/features/professional/briefings/dal/professionalBriefings.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/professional/enterprise/hooks/useEnterpriseWorkspace.js`

- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/professional/enterprise/model/buildEnterpriseView.model
### `src/features/professional/enterprise/ui/EnterpriseWorkspace.jsx`

- [ERROR] **File Size & Decomposition Rule** — File has 331 effective lines. Maximum allowed is 300.
### `src/features/professional/professional-nurse/housing/ui/HousingNoteCard.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./HousingCategoryBadge
### `src/features/professional/professional-nurse/housing/ui/HousingNotesList.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./HousingNoteCard
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./HousingEmptyState
### `src/features/professional/professional-nurse/screens/NurseHomeScreen.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./NurseHomeScreenView
### `src/features/professional/professional-nurse/screens/NurseHomeScreenView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./views/FacilityInsightsTabView
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./views/HousingTabView
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./views/NurseAddMenu
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./views/NurseWorkspaceTabs
### `src/features/professional/professional-nurse/screens/views/FacilityInsightsTabView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/professional/professional-nurse/screens/views/HousingTabView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/professional/professional-nurse/screens/views/NurseAddMenu.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/professional/professional-nurse/screens/views/NurseWorkspaceTabs.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/professional/screens/ProfessionalAccessScreen.jsx`

- [WARNING] **Module Build Order Rule** — Feature "professional" has layer "screens" without lower layer "dal" defined.
- [WARNING] **Module Build Order Rule** — Feature "professional" has layer "screens" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "professional" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "professional" has layer "screens" without lower layer "hooks" defined.
- [WARNING] **Module Build Order Rule** — Feature "professional" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/adapters/dal/vportPublicDetails.read.dal.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/adapters/friends/friendsData.adapter.js`

- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/dal/friends/friends.read.dal
- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/dal/friends/friendRanks.reconcile.dal
- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/dal/friends/friendRanks.write.dal
- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/model/friends/friendGraph.model
### `src/features/profiles/adapters/friends/topFriends.adapter.js`

- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/controller/friends/getFriendLists.controller
- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/controller/friends/getTopFriendActorIds.controller
- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/controller/friends/getTopFriendCandidates.controller
- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/controller/friends/saveTopFriendRanks.controller
- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/controller/friends/hydrateActorsIntoStore.controller
### `src/features/profiles/adapters/kinds/vport/config/vportTypes.config.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/dal/services/readVportServiceCatalogByType.js.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/dal/services/readVportServicesByActor.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/hooks/rates/useUpsertVportRate.js.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/hooks/services/useUpsertVportServices.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/model/gas/getVportTabsByType.model.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/model/services/vportService.model.js.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/screens/gas/components/GasPricesPanel.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 6. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/screens/gas/components/GasStates.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 6. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 6. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/screens/rates/components/VportRateEditorCard.jsx.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 6. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/screens/rates/view/VportRatesView.jsx.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 6. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/screens/review/VportReviewsView.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/kinds/vport/screens/services/view/VportServicesView.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 6. Maximum allowed is 3 below feature root.
### `src/features/profiles/adapters/photos/photoData.adapter.js`

- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/dal/photos/listPostReactions.dal
- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/dal/photos/listPostCommentsCount.dal
- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/dal/photos/listPostRoseCount.dal
### `src/features/profiles/adapters/photos/photoReactions.adapter.js`

- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/controller/photos/photoReactions.controller
### `src/features/profiles/adapters/post/actorPosts.adapter.js`

- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/controller/post/getActorPosts.controller
### `src/features/profiles/adapters/post/postData.adapter.js`

- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/dal/post/fetchPostsForActor.dal
### `src/features/profiles/adapters/tags/actorVibeTags.adapter.js`

- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/controller/tags/getActorVibeTags.controller
### `src/features/profiles/adapters/tags/tagsData.adapter.js`

- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/dal/tags/readActorVibeTags.dal
### `src/features/profiles/controller/friends/getTopFriendActorIds.controller.js`

- [ERROR] **Cross-Feature Boundary Rule** — Feature "profiles" imports "block" internals directly: @/features/block
### `src/features/profiles/controller/friends/getTopFriendCandidates.controller.js`

- [ERROR] **Cross-Feature Boundary Rule** — Feature "profiles" imports "block" internals directly: @/features/block
### `src/features/profiles/controller/friends/hydrateActorsIntoStore.controller.js`

- [ERROR] **Controller Contract** — Controller must not import or use Supabase directly.
### `src/features/profiles/controller/getProfileView.controller.js`

- [ERROR] **Controller Fan-Out Rule** — Controller imports 7 external modules. Maximum allowed is 5.
### `src/features/profiles/controller/photos/photoReactions.controller.js`

- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 3 use-cases. Prefer one controller file per use-case.
### `src/features/profiles/controller/post/getActorPosts.controller.js`

- [ERROR] **Dependency Direction Rule** — Layer "controller" must not depend on higher layer "screens".
### `src/features/profiles/controller/tags/getActorVibeTags.controller.js`

- [ERROR] **Dependency Direction Rule** — Layer "controller" must not depend on higher layer "screens".
### `src/features/profiles/dal/friends/friendRanks.reconcile.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/friends/friendRanks.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/friends/friends.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/photos/listPostCommentsCount.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/photos/listPostReactions.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/photos/listPostRoseCount.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/post/fetchPostsForActor.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/readActorIdByUsername.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/readActorKind.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/readActorPosts.dal.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./readPostMediaByPostIds.dal
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/readActorProfile.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/readFollowState.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/readPostMediaByPostIds.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/readPostReactionsDAL.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/readPostRoseCountsDAL.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/readVportType.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/tags/readActorVibeTags.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/dal/vportPublicDetails.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/hooks/header/useProfileHeaderMessaging.js`

- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/upload/adapters/model/resolveRealm.adapter
### `src/features/profiles/kinds/vport/adapters/review.adapter.js`

- [ERROR] **Adapter Contract** — Adapter must never export or depend on DAL, Model, or Controller internals: @/features/profiles/kinds/vport/controller/review/VportReviews.controller
### `src/features/profiles/kinds/vport/controller/gas/getVportGasPrices.controller.js`

- [ERROR] **Controller Fan-Out Rule** — Controller imports 6 external modules. Maximum allowed is 5.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/gas/reviewFuelPriceSuggestion.controller.js`

- [ERROR] **Controller Fan-Out Rule** — Controller imports 6 external modules. Maximum allowed is 5.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/gas/submitFuelPriceSuggestion.controller.js`

- [ERROR] **Controller Fan-Out Rule** — Controller imports 7 external modules. Maximum allowed is 5.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuCategory.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuItem.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/menu/getVportActorMenu.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuCategory.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/rates/getVportRates.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js`

- [ERROR] **Controller Contract** — Controller must not import or use Supabase directly.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js`

- [ERROR] **Controller Fan-Out Rule** — Controller imports 6 external modules. Maximum allowed is 5.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 6 use-cases. Prefer one controller file per use-case.
### `src/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 2 use-cases. Prefer one controller file per use-case.
### `src/features/profiles/kinds/vport/controller/services/createOrUpdateVportServiceAddon.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/services/deleteVportServiceAddon.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/services/getVportServices.controller.js`

- [ERROR] **Controller Fan-Out Rule** — Controller imports 6 external modules. Maximum allowed is 5.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/services/reorderVportServiceAddon.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/gas/vportFuelPriceHistory.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/gas/vportFuelPriceReviews.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/gas/vportFuelPrices.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/gas/vportFuelPrices.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/gas/vportStationPriceSettings.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/menu/createVportActorMenuCategory.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/menu/createVportActorMenuItem.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuItem.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/menu/listVportActorMenuCategories.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/menu/listVportActorMenuItems.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/menu/readVportActorMenuCategories.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/menu/readVportActorMenuItems.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/menu/updateVportActorMenuCategory.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/menu/updateVportActorMenuItem.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/rates/vportRates.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/readVportActorIdByVportId.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/review/vportReviews.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/review/vportReviews.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/services/readVportServiceAddonsByActor.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/services/readVportServicesByActor.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/services/readVportTypeByActorId.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/services/upsertVportServicesByActor.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/dal/subscribersCount.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/kinds/vport/dal/subscribersList.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/profiles/kinds/vport/hooks/gas/useGasPricesPanel.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/gas/useOwnerPendingSuggestions.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/gas/useReviewFuelPriceSuggestion.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/gas/useVportGasPrices.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/menu/useIsActorOwner.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/menu/useVportActorMenu.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/menu/useVportActorMenuCategoriesMutations.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/menu/useVportActorMenuItemsMutations.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/rates/useUpsertVportRate.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/rates/useVportRates.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/review/useVportReviews.helpers.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/review/useVportReviews.js`

- [ERROR] **File Size & Decomposition Rule** — File has 349 effective lines. Maximum allowed is 300.
- [ERROR] **Hook Contract** — Hook must not import or use Supabase.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/services/useCreateOrUpdateVportServiceAddon.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/services/useDeleteVportServiceAddon.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/services/useReorderVportServiceAddon.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/services/useUpsertVportServices.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/services/useVportServices.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/services/useVportServicesQuery.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/hooks/subscribers/useSubscribers.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/model/gas/getVportTabsByType.model.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/model/gas/vportFuelPrice.model.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/model/gas/vportFuelPriceSubmission.model.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/model/gas/vportStationPriceSettings.model.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/model/menu/VportActorMenu.model.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/model/menu/VportActorMenuCategory.model.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/model/menu/VportActorMenuItem.model.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/model/rates/vportRates.model.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/model/review/VportReview.model.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
- [ERROR] **Model Contract** — Model must not import or use Supabase.
### `src/features/profiles/kinds/vport/model/services/vportService.model.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/model/services/vportServiceCatalogFallback.model.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/booking/components/BookingCalendarAgendaPanel.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/booking/components/BookingCalendarDayPanel.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Size & Decomposition Rule** — File has 305 effective lines. Maximum allowed is 300.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/booking/components/BookingCalendarMonthGrid.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingMutations.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/profiles/kinds/vport/screens/booking/model/bookingCalendarDate.model
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Size & Decomposition Rule** — File has 346 effective lines. Maximum allowed is 300.
- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/profiles/kinds/vport/screens/booking/model/bookingCalendarAvailability.model
- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/profiles/kinds/vport/screens/booking/model/bookingCalendarDate.model
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/booking/model/bookingCalendar.model.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/booking/model/bookingCalendarAvailability.model.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **File Size Review Warning** — File has 255 effective lines and should be reviewed for decomposition.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/booking/model/bookingCalendarDate.model.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/booking/view/VportBookingView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/gas/components/CommunitySuggestionBadge.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/gas/components/FuelPriceRow.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/gas/components/GasPricesPanel.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Size & Decomposition Rule** — File has 389 effective lines. Maximum allowed is 300.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/gas/components/GasStates.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/gas/components/OwnerSuggestionReviewCard.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/gas/components/PriceSourceToggle.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/gas/components/SubmitFuelPriceSuggestionModal.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/gas/screens/VportGasPricesScreen.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/gas/view/VportGasPricesView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/MenuReviewCTA.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategory.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **File Size Review Warning** — File has 279 effective lines and should be reviewed for decomposition.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryFormModal.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Size & Decomposition Rule** — File has 334 effective lines. Maximum allowed is 300.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryHeader.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryInlineCreate.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryItemList.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryItemRow.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuConfirmDeleteModal.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuDragList.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuEmptyState.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItem.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemForm.styles.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormActions.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportActorMenuItemForm.styles
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormFields.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportActorMenuItemForm.styles
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportActorMenuItemFormPhotoField
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormHeader.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportActorMenuItemForm.styles
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormModal.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Size & Decomposition Rule** — File has 304 effective lines. Maximum allowed is 300.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportActorMenuItemForm.styles
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportActorMenuItemFormHeader
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportActorMenuItemFormFields
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportActorMenuItemFormActions
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormPhotoField.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportActorMenuItemForm.styles
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManageHeader.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManageModals.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManagePanel.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **File Size Review Warning** — File has 277 effective lines and should be reviewed for decomposition.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuPublicPanel.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuSection.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuToolbar.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/model/vportActorMenuConfirmDeleteModal.styles.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/model/vportActorMenuPublicPanel.model.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/VportActorMenuPublicScreen.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/VportActorMenuPublicView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **File Size Review Warning** — File has 291 effective lines and should be reviewed for decomposition.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/VportMenuManageView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/menu/VportMenuView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./components/MenuReviewCTA
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/owner/VportOwnerView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/portfolio/view/VportPortfolioView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/rates/components/VportRateCard.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/rates/components/VportRateEditorCard.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/rates/view/VportRatesOwnerView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/review/components/OverallDashboard.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/review/components/ReviewComposer.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/review/components/ReviewsHeader.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/review/components/ReviewsList.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/review/components/ServicesPicker.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/review/components/VportReviewsControls.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/review/styles/reviewStyles.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Size & Decomposition Rule** — File has 342 effective lines. Maximum allowed is 300.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./components/ReviewsList
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerCategorySection.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 6. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerPanel.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 6. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerToolbar.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 6. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/components/owner/VportServiceToggleRow.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 6. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/components/VportServiceBadge.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/components/VportServicesCategorySection.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportServiceBadge
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/components/VportServicesEmptyState.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/components/VportServicesHeader.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/components/VportServicesPanel.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportServicesHeader
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportServicesEmptyState
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportServicesCategorySection
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/components/VportServicesSkeleton.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/model/vportServicesEnabledMap.model.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/screens/VportServicesScreen.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/views/tabs/VportAboutView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Size & Decomposition Rule** — File has 309 effective lines. Maximum allowed is 300.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/views/tabs/VportBookingView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/views/tabs/VportMenuView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/views/tabs/VportPortfolioView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/screens/VportProfileKindScreen.jsx`

- [ERROR] **Final Screen Contract** — Final Screen must not import DAL, Model, or Controller directly: @/features/profiles/kinds/vport/model/gas/getVportTabsByType.model
### `src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`

- [ERROR] **File Size & Decomposition Rule** — File has 341 effective lines. Maximum allowed is 300.
- [ERROR] **View Screen Contract** — View Screen must not import DAL, Model, or Controller directly: @/features/profiles/kinds/vport/model/gas/getVportTabsByType.model
### `src/features/profiles/kinds/vport/screens/VportToActorRedirect.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/profiles/kinds/vport/ui/tabs/VportProfileTabs.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/kinds/vport/ui/vportprofileheader/VportProfileHeader.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/profiles/model/ActorProfileViewModel.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/profiles/model/PostModel.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/profiles/model/ProfileModel.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/profiles/model/VportTypeModel.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/profiles/screens/ActorProfileScreen.jsx`

- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/UsernameProfileRedirect.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/ActorProfileFriendsView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/ActorProfileHeader.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/ActorProfilePhotosView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./tabs/photos/components/PhotoGrid
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/ActorProfilePostsView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/ActorProfileTabs.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/ActorProfileTagsView.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/ActorProfileViewScreen.jsx`

- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/profileheader/ProfileHeaderQRCodeModal.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/profileheader/VisibleQRCode.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/components/FriendListSection.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/components/FriendsEmptyState.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/components/FriendsList.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/components/RankedFriendsPublic.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/components/RankPickerModal.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/components/TopFriendsRankEditor.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/controller/getFriendLists.controller.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/controller/getTopFriendActorIds.controller.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/controller/getTopFriendCandidates.controller.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/controller/saveTopFriendRanks.controller.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/dal/friendGraph.utils.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/dal/friendRanks.reconcile.dal.js`

- [ERROR] **DAL Contract** — DAL must not import higher layers: @/features/profiles/adapters/friends/friendsData.adapter
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/dal/friendRanks.write.dal.js`

- [ERROR] **DAL Contract** — DAL must not import higher layers: @/features/profiles/adapters/friends/friendsData.adapter
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/dal/friends.read.dal.js`

- [ERROR] **DAL Contract** — DAL must not import higher layers: @/features/profiles/adapters/friends/friendsData.adapter
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/helpers/hydrateActorsIntoStore.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/helpers/renderFriendEntry.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/hooks/useFriendLists.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/hooks/useSaveTopFriendRanks.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/hooks/useTopFriendActorIds.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/hooks/useTopFriendCandidates.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/screens/FriendsScreen.jsx`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/ui/FriendCard.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/friends/ui/ProfileFriendItem.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/photos/components/CommentComposeModal.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/photos/components/CommentModal.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./CommentComposeModal
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
- [ERROR] **UI Ownership Rule** — Feature component must not import another feature's internal UI: @/features/post/adapters/commentcard/components/CommentCard.container.adapter
### `src/features/profiles/screens/views/tabs/photos/components/ImageViewerModal.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
- [ERROR] **UI Ownership Rule** — Feature component must not import another feature's internal UI: @/features/post/adapters/postcard/components/BinaryReactionButton.adapter
- [ERROR] **UI Ownership Rule** — Feature component must not import another feature's internal UI: @/features/post/adapters/postcard/components/RoseReactionButton.adapter
- [ERROR] **UI Ownership Rule** — Feature component must not import another feature's internal UI: @/features/post/adapters/postcard/components/CommentButton.adapter
- [ERROR] **UI Ownership Rule** — Feature component must not import another feature's internal UI: @/features/post/adapters/postcard/components/ShareReactionButton.adapter
### `src/features/profiles/screens/views/tabs/photos/components/PhotoGrid.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ImageViewerModal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./CommentModal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../hooks/usePhotoReactions
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/photos/dal/listPostCommentsCount.dal.js`

- [ERROR] **DAL Contract** — DAL must not import higher layers: @/features/profiles/adapters/photos/photoData.adapter
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/photos/dal/listPostReactions.dal.js`

- [ERROR] **DAL Contract** — DAL must not import higher layers: @/features/profiles/adapters/photos/photoData.adapter
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/photos/dal/listPostRoseCount.dal.js`

- [ERROR] **DAL Contract** — DAL must not import higher layers: @/features/profiles/adapters/photos/photoData.adapter
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/photos/dal/toggleReaction.dal.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/photos/hooks/usePhotoReactions.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/post/controllers/getActorPosts.controller.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/post/dal/fetchPostsForActor.dal.js`

- [ERROR] **DAL Contract** — DAL must not import higher layers: @/features/profiles/adapters/post/postData.adapter
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/post/hooks/useActorPosts.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/post/models/post.model.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/tags/controller/getActorVibeTags.controller.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/tags/dal/readActorVibeTags.dal.js`

- [ERROR] **DAL Contract** — DAL must not import higher layers: @/features/profiles/adapters/tags/tagsData.adapter
- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/tags/hooks/useActorVibeTags.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/profiles/screens/views/tabs/tags/model/actorVibeTags.model.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 5. Maximum allowed is 3 below feature root.
- [WARNING] **Module Build Order Rule** — Feature "profiles" has layer "screens" without lower layer "components" defined.
### `src/features/public/screens/VportMenuRedirect.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "public" has layer "screens" without lower layer "dal" defined.
- [WARNING] **Module Build Order Rule** — Feature "public" has layer "screens" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "public" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "public" has layer "screens" without lower layer "hooks" defined.
- [WARNING] **Module Build Order Rule** — Feature "public" has layer "screens" without lower layer "components" defined.
### `src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/public/vportMenu/dal/readVportPublicMenu.rpc.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/account/controller/account.controller.js`

- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 3 use-cases. Prefer one controller file per use-case.
### `src/features/settings/account/dal/account.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/account/dal/account.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/adapters/profile/dal/vportPublicDetails.write.dal.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/privacy/controller/actorPrivacy.controller.js`

- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 2 use-cases. Prefer one controller file per use-case.
### `src/features/settings/privacy/controller/Blocks.controller.js`

- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 4 use-cases. Prefer one controller file per use-case.
### `src/features/settings/privacy/dal/blocks.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/privacy/dal/visibility.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/profile/adapter/ProfileTab.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./UserProfileTab
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./VportProfileTab
### `src/features/settings/profile/adapter/UserProfileTab.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../ui/ProfileTab.view
### `src/features/settings/profile/adapter/VportProfileTab.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../ui/ProfileTab.view
### `src/features/settings/profile/controller/Profile.controller.core.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/profile.read.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/profile.write.dal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../model/profile.mapper
- [WARNING] **Single Responsibility File Rule** — Controller appears to expose 2 use-cases. Prefer one controller file per use-case.
### `src/features/settings/profile/controller/saveProfile.controller.js`

- [ERROR] **Controller Contract** — Controller must not import or use Supabase directly.
### `src/features/settings/profile/dal/actors.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/profile/dal/auth.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/profile/dal/profile.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/profile/dal/profile.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/profile/dal/vportPublicDetails.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/profile/dal/vportPublicDetails.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/profile/model/profile.mapper.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/settings/profile/model/vportPublicDetails.mapper.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/settings/profile/ui/ProfileTab.view.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ProfessionalAccessButton
### `src/features/settings/profile/ui/VportAboutDetails.view.jsx`

- [WARNING] **File Size Review Warning** — File has 300 effective lines and should be reviewed for decomposition.
### `src/features/settings/ui/Card.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../constants
### `src/features/settings/ui/Row.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../constants
### `src/features/settings/vports/dal/actorOwners.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/vports/dal/auth.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/vports/dal/vports.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/settings/vports/hooks/useVportsList.js`

- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/vport/adapters/model/vport.read.vportRecords.adapter
### `src/features/settings/vports/index.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ui/VportsTab.view
### `src/features/settings/vports/model/vport.mapper.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/social/adapters/friend/request/controllers/followRequests.controller.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/social/adapters/friend/request/hooks/useFollowRequestActions.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/social/adapters/friend/request/hooks/useIncomingFollowRequests.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/social/adapters/friend/request/hooks/useSubscribeAction.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/social/adapters/friend/subscribe/components/SubscribeDebugPanel.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/social/adapters/friend/subscribe/controllers/getFollowStatus.controller.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/social/adapters/friend/subscribe/hooks/useFollowActorToggle.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/social/adapters/friend/subscribe/hooks/useFollowerCount.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/social/adapters/friend/subscribe/hooks/useFollowStatus.adapter.js`

- [ERROR] **Maximum Folder Depth Rule** — Feature file depth is 4. Maximum allowed is 3 below feature root.
### `src/features/social/components/PrivateProfileNotice.jsx`

- [WARNING] **Module Build Order Rule** — Feature "social" has layer "components" without lower layer "dal" defined.
- [WARNING] **Module Build Order Rule** — Feature "social" has layer "components" without lower layer "model" defined.
- [WARNING] **Module Build Order Rule** — Feature "social" has layer "components" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "social" has layer "components" without lower layer "hooks" defined.
### `src/features/social/friend/request/controllers/followRequests.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/followRequests.dal
### `src/features/social/friend/request/dal/actorFollows.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/social/friend/request/hooks/useIncomingFollowRequests.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../models/followRequest.model
### `src/features/social/friend/subscribe/dal/subscriberCount.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/social/friend/subscribe/hooks/useFollowActorToggle.js`

- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/social/friend/subscribe/model/followRelationState.model
### `src/features/social/friend/subscribe/hooks/useFollowRelationshipState.js`

- [ERROR] **Hook Contract** — Hook must not import DAL or Model directly: @/features/social/friend/subscribe/model/followRelationState.model
### `src/features/social/privacy/dal/actorPrivacy.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/upload/adapters/dal/insertPostMentions.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/upload/adapters/model/resolveRealm.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/upload/api/uploadMedia.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../lib/compressIfNeeded
### `src/features/upload/controllers/createPostController.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../model/resolveRealm
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/insertPost
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/insertPostMedia
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../lib/extractHashtags
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../lib/extractMentions
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/findActorsByHandles
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../dal/insertPostMentions
### `src/features/upload/dal/findActorsByHandles.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/upload/dal/findPostMentionsByPostIds.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/upload/dal/insertPost.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/upload/dal/insertPostMedia.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/upload/dal/insertPostMentions.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/upload/dal/postAuthRollback.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/upload/dal/searchMentionSuggestions.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/upload/hooks/useMediaSelection.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../lib/classifyFile
### `src/features/upload/hooks/useUploadSubmit.js`

- [ERROR] **Hook Contract** — Hook must not import or use Supabase.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../api/uploadMedia
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../controllers/createPostController
### `src/features/upload/model/resolveRealm.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/upload/model/uploadTypes.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/upload/screens/UploadScreen.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./UploadScreenModern
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../hooks/useUploadSubmit
- [WARNING] **Module Build Order Rule** — Feature "upload" has layer "screens" without lower layer "components" defined.
### `src/features/upload/screens/UploadScreenModern.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../ui/UploadHeader
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../ui/UploadCard
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../ui/SelectedThumbStrip
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../ui/CaptionCard
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../ui/PrimaryActionButton
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../hooks/useMediaSelection
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../lib/extractMentions
- [WARNING] **Module Build Order Rule** — Feature "upload" has layer "screens" without lower layer "components" defined.
### `src/features/upload/ui/UploadCard.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../hooks/useMediaSelection
### `src/features/upload/ui/UploadHeader.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./ActorPill
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./SegmentedButton
### `src/features/vgrid/adapters/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/vgrid/dal/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/vgrid/hooks/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "vgrid" has layer "hooks" without lower layer "controller" defined.
### `src/features/vgrid/model/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/vgrid/screens/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "vgrid" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "vgrid" has layer "screens" without lower layer "components" defined.
### `src/features/void/adapters/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/void/dal/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/void/hooks/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "void" has layer "hooks" without lower layer "controller" defined.
### `src/features/void/model/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/void/screens/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "void" has layer "screens" without lower layer "controller" defined.
- [WARNING] **Module Build Order Rule** — Feature "void" has layer "screens" without lower layer "components" defined.
### `src/features/vport/adapters/model/vport.read.vportRecords.adapter.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/vport/CreateVportForm.jsx`

- [ERROR] **File Size & Decomposition Rule** — File has 366 effective lines. Maximum allowed is 300.
### `src/features/vport/dal/vport.core.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/vport/dal/vport.read.vportRecords.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/vport/model/vport.read.vportRecords.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/wanders/components/cardstemplates/birthday.modern.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/business.professional.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/CardBuilder.jsx`

- [WARNING] **File Size Review Warning** — File has 275 effective lines and should be reviewed for decomposition.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./registry
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/generic.minimal.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/lovedrop/valentines.bold.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/lovedrop/valentines.classic.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/lovedrop/valentines.cute.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/lovedrop/valentines.minimal.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/lovedrop/valentines.poem.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/lovedrop/valentines.romantic.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/photo/photo.basic.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./PhotoCard.form
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./PhotoCard.preview
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/photo/PhotoCard.form.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/photo/PhotoCard.preview.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/cardstemplates/registry.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./generic.minimal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./birthday.modern
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./business.professional
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./lovedrop/valentines.romantic
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./lovedrop/valentines.bold
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./lovedrop/valentines.classic
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./lovedrop/valentines.cute
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./lovedrop/valentines.minimal
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./lovedrop/valentines.poem
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./photo/photo.basic
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/model/wandersSendCardTemplates.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersCardDetail.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersCardPreview.jsx`

- [ERROR] **File Size & Decomposition Rule** — File has 357 effective lines. Maximum allowed is 300.
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersEmptyState.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersLoading.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersMailboxItemRow.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersMailboxList.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersMailboxToolbar.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersRepliesList.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersReplyComposer.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersSendCardForm.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersSendCardSentView.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersSharePreview.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersShareVCSM.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/components/WandersShowLoveCTA.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "components" without lower layer "controller" defined.
### `src/features/wanders/controllers/createWandersCard.controller.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../services/wandersSupabaseClient
### `src/features/wanders/core/dal/read/cardKeys.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/read/cards.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/read/droplinks.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/read/events.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/read/mailbox.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/read/replies.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/read/userFingerprints.read.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/rpc/mailbox.rpc.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/write/cardKeys.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/write/cards.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/write/droplinks.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/write/events.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/write/mailbox.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/write/replies.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/dal/write/userFingerprints.write.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/core/hooks/mailboxExperience/mailboxExperience.constants.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/wanders/core/hooks/mailboxExperience/mailboxExperience.helpers.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/wanders/core/hooks/mailboxExperience/mailboxExperience.selection.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/wanders/core/hooks/mailboxExperience/mailboxExperience.storage.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/features/wanders/core/hooks/useWandersMailboxExperience.hook.js`

- [ERROR] **Hook Contract** — Hook must not import or use Supabase.
### `src/features/wanders/core/hooks/useWandersSentExperience.hook.js`

- [ERROR] **Hook Contract** — Hook must not import or use Supabase.
### `src/features/wanders/dal/wandersCardKeys.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/dal/wandersCards.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/dal/wandersClaims.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/dal/wandersEvents.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/dal/wandersMailbox.dal.js`

- [WARNING] **Locked DAL Style** — DAL should use supabase.schema('vc').
### `src/features/wanders/hooks/useWandersActorIntegration.js`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "hooks" without lower layer "controller" defined.
### `src/features/wanders/hooks/useWandersCardKey.js`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "hooks" without lower layer "controller" defined.
### `src/features/wanders/screens/view/WandersCardPublic.view.jsx`

- [ERROR] **File Size & Decomposition Rule** — File has 308 effective lines. Maximum allowed is 300.
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
### `src/features/wanders/screens/view/WandersCreate.view.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
### `src/features/wanders/screens/view/WandersHome.view.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
- [ERROR] **View Screen Contract** — View Screen must not import DAL, Model, or Controller directly: @/features/upload/adapters/model/resolveRealm.adapter
### `src/features/wanders/screens/view/WandersMailbox.view.jsx`

- [ERROR] **File Size & Decomposition Rule** — File has 312 effective lines. Maximum allowed is 300.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../components/WandersMailboxToolbar
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../components/WandersMailboxList
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../components/WandersCardDetail
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../components/WandersRepliesList
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../components/WandersReplyComposer
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../components/WandersEmptyState
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../components/WandersLoading
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../../components/WandersShareVCSM
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
- [ERROR] **View Screen Contract** — View Screen must not import or use Supabase.
### `src/features/wanders/screens/view/WandersSent.view.jsx`

- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
### `src/features/wanders/screens/WandersCardPublic.screen.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
### `src/features/wanders/screens/WandersCreate.screen.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
### `src/features/wanders/screens/WandersHome.screen.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
### `src/features/wanders/screens/WandersInboxPublic.screen.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersSendCardForm
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersCardPreview
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersLoading
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersEmptyState
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
### `src/features/wanders/screens/WandersIntegrateActor.screen.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../hooks/useWandersActorIntegration
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersLoading
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersEmptyState
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
### `src/features/wanders/screens/WandersMailbox.screen.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
### `src/features/wanders/screens/WandersOutbox.screen.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [ERROR] **File Size & Decomposition Rule** — File has 364 effective lines. Maximum allowed is 300.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersMailboxToolbar
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersMailboxList
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersMailboxItemRow
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersCardDetail
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersRepliesList
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersReplyComposer
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersEmptyState
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ../components/WandersLoading
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
### `src/features/wanders/screens/WandersSent.screen.jsx`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
- [WARNING] **Module Build Order Rule** — Feature "wanders" has layer "screens" without lower layer "controller" defined.
### `src/main.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./App
### `src/scripts/load/simulateAppUsers.mjs`

- [ERROR] **File Size & Decomposition Rule** — File has 311 effective lines. Maximum allowed is 300.
### `src/scripts/load/simulateAuthenticatedActors.mjs`

- [ERROR] **File Size & Decomposition Rule** — File has 635 effective lines. Maximum allowed is 300.
### `src/season/index.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./themes/christmas
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./themes/default
### `src/shared/components/BottomNavBar.jsx`

- [ERROR] **Shared Layer Contract** — Shared layer must not import feature modules: @/features/notifications/inbox/hooks/useNotiCount
- [ERROR] **Shared Layer Contract** — Shared layer must not import feature modules: @/features/notifications/inbox/hooks/useUnreadBadge
### `src/shared/components/components/ActorActionsMenu.jsx`

- [ERROR] **Shared Layer Contract** — Shared layer must not import feature modules: @/features/block/ui/BlockConfirmModal
- [ERROR] **Shared Layer Contract** — Shared layer must not import feature modules: @/features/block/hooks/useBlockStatus
- [ERROR] **Shared Layer Contract** — Shared layer must not import feature modules: @/features/block/hooks/useBlockActions
### `src/shared/hooks/index.js`

- [ERROR] **File Naming Rule** — File name does not match required naming convention.
### `src/shared/hooks/useUserLocation.js`

- [ERROR] **Hook Contract** — Hook must not import or use Supabase.
### `src/state/identity/identityContext.jsx`

- [WARNING] **File Size Review Warning** — File has 262 effective lines and should be reviewed for decomposition.
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./identityStorage
### `src/state/identity/IdentityDebugger.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./identityContext
### `src/state/identity/identitySwitcher.jsx`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./identityContext
### `src/state/identity/useIdentitySync.js`

- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./identityContext
- [ERROR] **Import Path Rule** — Relative import is forbidden in new modules: ./identityStorage

## Suggested Manual Fix Order

1. Fix import path violations
2. Fix cross-feature imports
3. Fix DAL / controller / screen contract violations
4. Fix dependency direction violations
5. Split oversized or multi-responsibility files
6. Fix warnings after all errors are resolved
