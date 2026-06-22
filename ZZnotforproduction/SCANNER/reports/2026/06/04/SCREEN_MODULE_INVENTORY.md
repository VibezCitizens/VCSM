---
title: Screen → Feature → Module Inventory
status: COMPLETE
generated: 2026-06-04
scanner: apps/scanner v1.1.0 (2026-06-05T03:29:11Z)
source: screen-map.json + behavior-map.json + route-map.json
---

# SCREEN_MODULE_INVENTORY

Confidence key: HIGH = direct scanner/source evidence | MEDIUM = inferred from path and route | LOW = weak inference | UNKNOWN = insufficient evidence

## Feature: ads (2 screens)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| VportAdsSettingsScreen | apps/VCSM/src/features/ads/screens/VportAdsSettingsScreen.jsx | ads | ads | (none mapped) | features/ads | features/ads (flat OK) | MEDIUM |

## Feature: auth (9 screens)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| LoginScreen | apps/VCSM/src/features/auth/screens/LoginScreen.jsx | auth | auth | /login | features/auth | features/auth (flat OK) | HIGH |
| RegisterScreen | apps/VCSM/src/features/auth/screens/RegisterScreen.jsx | auth | auth | (none mapped) | features/auth | features/auth (flat OK) | MEDIUM |
| WelcomeScreen | apps/VCSM/src/features/auth/screens/WelcomeScreen.jsx | auth | auth | /welcome | features/auth | features/auth (flat OK) | HIGH |
| ResetPasswordScreen | apps/VCSM/src/features/auth/screens/ResetPasswordScreen.jsx | auth | auth | /reset-password | features/auth | features/auth (flat OK) | HIGH |
| ForgotPasswordScreen | apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx | auth | auth | (none mapped) | features/auth | features/auth (flat OK) | MEDIUM |
| VerifyEmailRequiredScreen | apps/VCSM/src/features/auth/screens/VerifyEmailRequiredScreen.jsx | auth | auth | (none mapped) | features/auth | features/auth (flat OK) | MEDIUM |
| AuthCallbackScreen | apps/VCSM/src/features/auth/screens/AuthCallbackScreen.jsx | auth | auth | /auth/callback | features/auth | features/auth (flat OK) | MEDIUM |
| CompleteProfileGate | apps/VCSM/src/features/auth/screens/CompleteProfileGate.jsx | auth | auth | (none mapped) | features/auth | features/auth (flat OK) | LOW |
| Onboarding (auth) | apps/VCSM/src/features/auth/screens/Onboarding.jsx | auth | auth | (none mapped) | features/auth | features/auth (flat OK) | LOW |

## Feature: chat (11 screens)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| InboxScreen | apps/VCSM/src/features/chat/inbox/screens/InboxScreen.jsx | chat | inbox | /chat | features/chat | features/chat/modules/inbox | MEDIUM |
| ArchivedInboxScreen | apps/VCSM/src/features/chat/inbox/screens/ArchivedInboxScreen.jsx | chat | inbox | /chat/archived | features/chat | features/chat/modules/inbox | HIGH |
| RequestsInboxScreen | apps/VCSM/src/features/chat/inbox/screens/RequestsInboxScreen.jsx | chat | inbox | /chat/requests | features/chat | features/chat/modules/inbox | HIGH |
| SpamInboxScreen | apps/VCSM/src/features/chat/inbox/screens/SpamInboxScreen.jsx | chat | inbox | /chat/spam | features/chat | features/chat/modules/inbox | HIGH |
| InboxChatSettingsScreen | apps/VCSM/src/features/chat/inbox/screens/InboxChatSettingsScreen.jsx | chat | inbox | /chat/settings | features/chat | features/chat/modules/inbox | HIGH |
| InboxSettingsScreen | apps/VCSM/src/features/chat/inbox/screens/InboxSettingsScreen.jsx | chat | inbox | /chat/settings/inbox | features/chat | features/chat/modules/inbox | HIGH |
| BlockedUsersScreen | apps/VCSM/src/features/chat/inbox/screens/settings/BlockedUsersScreen.jsx | chat | inbox | /chat/settings/blocked | features/chat | features/chat/modules/inbox | HIGH |
| MessagePrivacyScreen | apps/VCSM/src/features/chat/inbox/screens/settings/MessagePrivacyScreen.jsx | chat | inbox | /chat/settings/privacy | features/chat | features/chat/modules/inbox | HIGH |
| ConversationScreen | apps/VCSM/src/features/chat/conversation/screen/ConversationScreen.jsx | chat | conversation | /chat/:conversationId | features/chat | features/chat/modules/conversation | MEDIUM |
| ConversationView | apps/VCSM/src/features/chat/conversation/screen/ConversationView.jsx | chat | conversation | (none mapped) | features/chat | features/chat/modules/conversation | LOW |
| StartConversationModal | apps/VCSM/src/features/chat/start/screens/StartConversationModal.jsx | chat | start | /chat/new | features/chat | features/chat/modules/start | LOW |

## Feature: dashboard (20+ screens)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| VportDashboardScreen | .../vport/screens/VportDashboardScreen.jsx | dashboard | dashboard | /actor/:actorId/dashboard | features/dashboard/modules/vport | features/dashboard/modules/dashboard | HIGH |
| VportDashboardBookingHistoryScreen | .../bookings/VportDashboardBookingHistoryScreen.jsx | dashboard | bookings | /actor/:actorId/dashboard/booking-history | features/dashboard/modules/bookings | features/dashboard/modules/bookings | HIGH |
| VportDashboardCalendarScreen | .../calendar/VportDashboardCalendarScreen.jsx | dashboard | calendar | /actor/:actorId/dashboard/calendar | features/dashboard/modules/calendar | features/dashboard/modules/calendar | HIGH |
| VportDashboardExchangeScreen | .../exchange/VportDashboardExchangeScreen.jsx | dashboard | exchange | /actor/:actorId/dashboard/exchange | features/dashboard/modules/exchange | features/dashboard/modules/exchange | HIGH |
| VportDashboardGasScreen | .../gasprices/screens/VportDashboardGasScreen.jsx | dashboard | gasprices | /actor/:actorId/dashboard/gas | features/dashboard/modules/gasprices | features/dashboard/modules/gasprices | HIGH |
| VportGasPricesScreen | .../gasprices/screens/VportGasPricesScreen.jsx | dashboard | gasprices | /actor/:actorId/gas | features/dashboard/modules/gasprices | features/dashboard/modules/gasprices | HIGH |
| VportDashboardLeadsScreen | .../leads/VportDashboardLeadsScreen.jsx | dashboard | leads | /actor/:actorId/dashboard/leads | features/dashboard/modules/leads | features/dashboard/modules/leads | HIGH |
| VportDashboardLocksmithScreen | .../locksmith/VportDashboardLocksmithScreen.jsx | dashboard | locksmith | /actor/:actorId/dashboard/locksmith | features/dashboard/modules/locksmith | features/dashboard/modules/locksmith | HIGH |
| VportDashboardPortfolioScreen | .../portfolio/VportDashboardPortfolioScreen.jsx | dashboard | portfolio | /actor/:actorId/dashboard/portfolio | features/dashboard/modules/portfolio | features/dashboard/modules/portfolio | HIGH |
| VportDashboardReviewScreen | .../reviews/VportDashboardReviewScreen.jsx | dashboard | reviews | /actor/:actorId/dashboard/reviews | features/dashboard/modules/reviews | features/dashboard/modules/reviews | HIGH |
| VportDashboardScheduleScreen | .../schedule/VportDashboardScheduleScreen.jsx | dashboard | schedule | /actor/:actorId/dashboard/schedule | features/dashboard/modules/schedule | features/dashboard/modules/schedule | HIGH |
| VportDashboardServicesScreen | .../services/VportDashboardServicesScreen.jsx | dashboard | services | /actor/:actorId/dashboard/services | features/dashboard/modules/services | features/dashboard/modules/services | HIGH |
| VportSettingsScreen | .../settings/VportSettingsScreen.jsx | dashboard | settings | /actor/:actorId/settings | features/dashboard/modules/settings | features/dashboard/modules/settings | HIGH |
| VportDashboardTeamScreen | .../team/VportDashboardTeamScreen.jsx | dashboard | team | /actor/:actorId/dashboard/team | features/dashboard/modules/team | features/dashboard/modules/team | HIGH |
| BarberTeamRequestsScreen | .../team/BarberTeamRequestsScreen.jsx | dashboard | team | /actor/:actorId/dashboard/team-requests | features/dashboard/modules/team | features/dashboard/modules/team | HIGH |
| VportDesignStudioViewScreen | .../designStudio/screens/VportDesignStudioViewScreen.jsx | dashboard | designStudio | (none mapped) | features/dashboard/modules/designStudio | features/dashboard/modules/designStudio | MEDIUM |
| VportActorMenuFlyerScreen | .../flyerBuilder/screens/VportActorMenuFlyerScreen.jsx | dashboard | flyerBuilder | /actor/:actorId/menu/flyer | features/dashboard/modules/flyerBuilder | features/dashboard/modules/flyerBuilder | HIGH |
| VportActorMenuFlyerEditorScreen | .../flyerBuilder/screens/VportActorMenuFlyerEditorScreen.jsx | dashboard | flyerBuilder | /actor/:actorId/menu/flyer/edit | features/dashboard/modules/flyerBuilder | features/dashboard/modules/flyerBuilder | HIGH |

## Feature: explore (2 screens)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| ExploreScreen | apps/VCSM/src/features/explore/screens/ExploreScreen.jsx | explore | explore | /explore | features/explore | features/explore (flat OK) | HIGH |
| SearchScreen | apps/VCSM/src/features/explore/ui/SearchScreen.view.jsx | explore | explore | (none mapped) | features/explore | features/explore (flat OK) | MEDIUM |

## Feature: feed (3 screens)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| CentralFeedScreen | apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx | feed | feed | / (home) | features/feed | features/feed/modules/feed | LOW |
| DebugFeedFilterPanel | apps/VCSM/src/features/feed/screens/DebugFeedFilterPanel.jsx | feed | feed | /dev/* | features/feed | features/feed/modules/feed | LOW |
| DebugPrivacyPanel | apps/VCSM/src/features/feed/screens/DebugPrivacyPanel.jsx | feed | feed | /dev/* | features/feed | features/feed/modules/feed | LOW |

## Feature: invite (3 screens)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| InviteScreen | apps/VCSM/src/features/invite/screens/InviteScreen.jsx | invite | invite | /invite | features/invite | features/invite (flat OK) | HIGH |

## Feature: join (5 screens)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| JoinBarbershopScreen | apps/VCSM/src/features/join/screens/JoinBarbershopScreen.jsx | join | join | /join/barbershop/:token | features/join | features/join (flat OK) | HIGH |

## Feature: legal (9 screens)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| AboutScreen | apps/VCSM/src/features/legal/screens/AboutScreen.jsx | legal | legal | /about | features/legal | features/legal/modules/legal | HIGH |
| ContactScreen | apps/VCSM/src/features/legal/screens/ContactScreen.jsx | legal | legal | /contact | features/legal | features/legal/modules/legal | HIGH |
| LegalDocumentScreen | apps/VCSM/src/features/legal/screens/LegalDocumentScreen.jsx | legal | docs | /legal/:docType | features/legal | features/legal/modules/docs | HIGH |
| HowToCreateProfileScreen | apps/VCSM/src/features/legal/screens/HowToCreateProfileScreen.jsx | legal | docs | /how-to/create-profile | features/legal | features/legal/modules/docs | HIGH |
| HowToCreateVportScreen | apps/VCSM/src/features/legal/screens/HowToCreateVportScreen.jsx | legal | docs | /how-to/create-vport | features/legal | features/legal/modules/docs | HIGH |
| VportCategoryLandingScreen | apps/VCSM/src/features/legal/screens/VportCategoryLandingScreen.jsx | legal | legal | /vport/:type | features/legal | features/legal/modules/legal | HIGH |
| ConsentGateScreen | apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx | legal | engine | (none mapped) | features/legal | features/legal/modules/engine | MEDIUM |

## Feature: notifications (5 screens)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| NotificationsScreen | apps/VCSM/src/features/notifications/screen/NotificationsScreen.jsx | notifications | inbox | /notifications | features/notifications | features/notifications/modules/inbox | HIGH |
| NotiViewPostScreen | apps/VCSM/src/features/notifications/screen/NotiViewPostScreen.jsx | notifications | notifications | /noti/post/:postId | features/notifications | features/notifications/modules/notifications | HIGH |

## Feature: post (screens in post + postcard + commentcard)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| (post screens) | apps/VCSM/src/features/post/post/* | post | post | /post/* | features/post | features/post/modules/post | MEDIUM |
| (postcard screens) | apps/VCSM/src/features/post/postcard/* | post | postcard | (embedded) | features/post | features/post/modules/postcard | MEDIUM |
| (commentcard screens) | apps/VCSM/src/features/post/commentcard/* | post | commentcard | (embedded) | features/post | features/post/modules/commentcard | MEDIUM |

## Feature: profiles (large — 374 source files)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| (citizen profile screens) | apps/VCSM/src/features/profiles/kinds/* | profiles | kinds | /profile/:slug | features/profiles | features/profiles/modules/kinds | MEDIUM |
| (config screens) | apps/VCSM/src/features/profiles/config/* | profiles | config | (config) | features/profiles | features/profiles/modules/config | MEDIUM |

## Feature: settings (6 modules)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| (account settings) | apps/VCSM/src/features/settings/account/* | settings | account | /settings/account | features/settings | features/settings/modules/account | MEDIUM |
| (privacy settings) | apps/VCSM/src/features/settings/privacy/* | settings | privacy | /settings/privacy | features/settings | features/settings/modules/privacy | MEDIUM |
| (profile settings) | apps/VCSM/src/features/settings/profile/* | settings | profile | /settings/profile | features/settings | features/settings/modules/profile | MEDIUM |
| (vports settings) | apps/VCSM/src/features/settings/vports/* | settings | vports | /settings/vports | features/settings | features/settings/modules/vports | MEDIUM |

## Feature: vport (29 source files, 3 modules)

| Screen | Source Path | Feature | Module | Route | Existing ZZ Folder | Required ZZ Folder | Confidence |
|---|---|---|---|---|---|---|---|
| (public vport screens) | apps/VCSM/src/features/vport/public/* | vport | public | /vport/* | features/vport | features/vport/modules/public | MEDIUM |
| (vport core screens) | apps/VCSM/src/features/vport/vport/* | vport | vport | /actor/:actorId/* | features/vport | features/vport/modules/vport | MEDIUM |

---

## Summary Counts

| Category | Count |
|---|---|
| Total VCSM features with screens | ~25 |
| Total screens (scanner) | 368 |
| Screens with HIGH confidence route | ~120 |
| Features needing modules/ | 15 |
| Module folders already present (dashboard) | 18 |
| Module folders needed across all features | 49 |
