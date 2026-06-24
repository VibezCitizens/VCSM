import { lazyWithLog } from "@/app/routes/lazyPublic";

const devDiagnosticsEnabled = import.meta.env.DEV;

// ── Main App ──────────────────────────────────────────────────────────────────
export const CentralFeed = lazyWithLog("CentralFeed", () =>
  import("@/features/CentralFeed/screens/CentralFeedScreen"),
);
// TICKET-TRAZE-CLAIM-VPORT-007 (T7): approved-claim owner onboarding.
export const ClaimApprovedScreen = lazyWithLog("ClaimApprovedScreen", () =>
  import("@/features/claimOnboarding/adapters/claimOnboarding.adapter").then((m) => ({
    default: m.ClaimApprovedScreen,
  })),
);
export const ExploreScreen = lazyWithLog("Explore", () =>
  import("@/features/explore/screens/ExploreScreen"),
);
export const CitizenVibesScreen = lazyWithLog("CitizenVibesScreen", () =>
  import("@/features/initiation/adapters/onboarding.adapter").then((m) => ({
    default: m.CitizenVibesScreen,
  })),
);

// ── Notifications ─────────────────────────────────────────────────────────────
export const NotificationsScreen = lazyWithLog("Notifications", () =>
  import("@/features/notifications/screen/NotificationsScreen"),
);
export const NotiViewPostScreen = lazyWithLog("NotiViewPost", () =>
  import("@/features/notifications/screen/NotiViewPostScreen"),
);

// ── Upload / Professional ─────────────────────────────────────────────────────
export const UploadScreen = lazyWithLog("UploadScreen", () =>
  import("@/features/upload/screens/UploadScreen"),
);
export const ProfessionalAccessScreen = lazyWithLog("ProfessionalAccessScreen", () =>
  import("@/features/professional/screens/ProfessionalAccessScreen"),
);
export const ProfessionalBriefingsScreen = lazyWithLog(
  "ProfessionalBriefingsScreen",
  () => import("@/features/professional/briefings/screen/ProfessionalBriefingsScreen"),
);

// ── Account / Misc ────────────────────────────────────────────────────────────
export const InviteScreen = lazyWithLog("InviteScreen", () =>
  import("@/features/invite/screens/InviteScreen"),
);
export const SettingsScreen = lazyWithLog("Settings", () =>
  import("@/features/settings/screen/SettingsScreen"),
);
export const VportAdsSettingsScreen = lazyWithLog("VportAdsSettingsScreen", () =>
  import("@/features/ads/screens/VportAdsSettingsScreen"),
);
export const VoidScreen = lazyWithLog("VoidScreen", () =>
  import("@/features/void/VoidScreen"),
);
export const DevDiagnosticsScreen = devDiagnosticsEnabled
  ? lazyWithLog("DevDiagnosticsScreen", () => import("@/screens/DevDiagnosticsScreen"))
  : () => null;
export const PerfDashboardScreen = devDiagnosticsEnabled
  ? lazyWithLog("PerfDashboardScreen", () =>
      import("@debuggers/performance").then((m) => ({ default: m.PerfDashboardScreen })),
    )
  : () => null;

// ── Profiles ──────────────────────────────────────────────────────────────────
export const UsernameProfileRedirect = lazyWithLog("UsernameProfileRedirect", () =>
  import("@/features/profiles/screens/UsernameProfileRedirect"),
);
export const ActorProfileScreen = lazyWithLog("ActorProfileScreen", () =>
  import("@/features/profiles/screens/ActorProfileScreen"),
);
export const TopFriendsRankEditor = lazyWithLog("TopFriendsRankEditor", () =>
  import(
    "@/features/profiles/kinds/citizen/tabs/friends/components/TopFriendsRankEditor"
  ),
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const VportActorMenuFlyerEditorScreen = lazyWithLog(
  "VportActorMenuFlyerEditorScreen",
  () =>
    import(
      "@/features/flyerBuilder/screens/VportActorMenuFlyerEditorScreen"
    ),
);
export const RestoreVportScreen = lazyWithLog("RestoreVportScreen", () =>
  import("@/features/vport/screens/RestoreVportScreen"),
);
export const VportDashboardScreen = lazyWithLog("VportDashboardScreen", () =>
  import("@/features/vportDashboard/screens/VportDashboardScreen"),
);
export const VportDashboardGasScreen = lazyWithLog("VportDashboardGasScreen", () =>
  import("@/features/vportDashboard/dashboard/cards/gasprices/screens/VportDashboardGasScreen"),
);
export const VportDashboardReviewScreen = lazyWithLog(
  "VportDashboardReviewScreen",
  () => import("@/features/vportDashboard/dashboard/cards/reviews/VportDashboardReviewScreen"),
);
export const VportDashboardLeadsScreen = lazyWithLog(
  "VportDashboardLeadsScreen",
  () => import("@/features/vportDashboard/dashboard/cards/leads/VportDashboardLeadsScreen"),
);
export const VportDashboardServicesScreen = lazyWithLog(
  "VportDashboardServicesScreen",
  () => import("@/features/vportDashboard/dashboard/cards/services/VportDashboardServicesScreen"),
);
export const VportDashboardExchangeScreen = lazyWithLog(
  "VportDashboardExchangeScreen",
  () => import("@/features/vportDashboard/dashboard/cards/exchange/VportDashboardExchangeScreen"),
);
export const VportDashboardCalendarScreen = lazyWithLog(
  "VportDashboardCalendarScreen",
  () => import("@/features/vportDashboard/dashboard/cards/calendar/VportDashboardCalendarScreen"),
);
export const VportDashboardPortfolioScreen = lazyWithLog(
  "VportDashboardPortfolioScreen",
  () => import("@/features/vportDashboard/dashboard/cards/portfolio/VportDashboardPortfolioScreen"),
);
export const VportDashboardLocksmithScreen = lazyWithLog(
  "VportDashboardLocksmithScreen",
  () => import("@/features/vportDashboard/dashboard/cards/locksmith/VportDashboardLocksmithScreen"),
);
export const VportDashboardBookingHistoryScreen = lazyWithLog(
  "VportDashboardBookingHistoryScreen",
  () =>
    import("@/features/vportDashboard/dashboard/cards/bookings/VportDashboardBookingHistoryScreen"),
);
export const VportDashboardTeamScreen = lazyWithLog(
  "VportDashboardTeamScreen",
  () => import("@/features/vportDashboard/dashboard/cards/team/VportDashboardTeamScreen"),
);
export const BarberTeamRequestsScreen = lazyWithLog(
  "BarberTeamRequestsScreen",
  () => import("@/features/vportDashboard/dashboard/cards/team/BarberTeamRequestsScreen"),
);
export const VportDashboardScheduleScreen = lazyWithLog(
  "VportDashboardScheduleScreen",
  () => import("@/features/vportDashboard/dashboard/cards/schedule/VportDashboardScheduleScreen"),
);
export const VportSettingsScreen = lazyWithLog("VportSettingsFinalScreen", () =>
  import("@/features/vportDashboard/dashboard/cards/settings/VportSettingsFinalScreen"),
);

// ── Gas ───────────────────────────────────────────────────────────────────────
// FROZEN — VportGasPricesScreen (/actor/:actorId/gas) unwired 2026-06-08.
// Future feature; lazy export intentionally removed. See freeze notice in
// VportGasPricesScreen.jsx to re-enable.

// ── Posts ─────────────────────────────────────────────────────────────────────
export const PostFeedScreen = lazyWithLog("PostFeedScreen", () =>
  import("@/features/post/postcard/screens/PostFeed.screen"),
);
export const PostDetailScreen = lazyWithLog("PostDetailScreen", () =>
  import("@/features/post/postcard/screens/PostDetail.screen"),
);
export const EditPostScreen = lazyWithLog("EditPostScreen", () =>
  import("@/features/post/postcard/components/EditPost"),
);

// ── Chat ──────────────────────────────────────────────────────────────────────
export const ChatInboxScreen = lazyWithLog("ChatInbox", () =>
  import("@/features/chat").then((m) => ({ default: m.InboxScreen })),
);
export const ChatConversationScreen = lazyWithLog("ChatConversation", () =>
  import("@/features/chat").then((m) => ({ default: m.ConversationScreen })),
);
export const NewChatScreen = lazyWithLog("NewChat", () =>
  import("@/features/chat").then((m) => ({ default: m.NewConversationScreen })),
);
export const InboxChatSettingsScreen = lazyWithLog("InboxChatSettingsScreen", () =>
  import("@/features/chat/inbox/screens/InboxChatSettingsScreen"),
);
export const InboxSettingsScreen = lazyWithLog("InboxSettingsScreen", () =>
  import("@/features/chat/inbox/screens/InboxSettingsScreen"),
);
export const MessagePrivacyScreen = lazyWithLog("MessagePrivacyScreen", () =>
  import("@/features/chat/inbox/screens/settings/MessagePrivacyScreen"),
);
export const SpamInboxScreen = lazyWithLog("SpamInboxScreen", () =>
  import("@/features/chat/inbox/screens/SpamInboxScreen"),
);
export const RequestsInboxScreen = lazyWithLog("RequestsInboxScreen", () =>
  import("@/features/chat/inbox/screens/RequestsInboxScreen"),
);
export const ArchivedInboxScreen = lazyWithLog("ArchivedInboxScreen", () =>
  import("@/features/chat/inbox/screens/ArchivedInboxScreen"),
);
export const BlockedUsersScreen = lazyWithLog("BlockedUsersScreen", () =>
  import("@/features/chat/inbox/screens/settings/BlockedUsersScreen"),
);

// ── Learning ──────────────────────────────────────────────────────────────────
export const LearningHomeScreen = lazyWithLog("LearningHomeScreen", () =>
  import("@/learning/adapters/learning.adapter").then((m) => ({
    default: m.LearningHomeScreen,
  })),
);
export const LearningCourseScreen = lazyWithLog("LearningCourseScreen", () =>
  import("@/learning/adapters/learning.adapter").then((m) => ({
    default: m.LearningCourseScreen,
  })),
);
export const LearningLessonScreen = lazyWithLog("LearningLessonScreen", () =>
  import("@/learning/adapters/learning.adapter").then((m) => ({
    default: m.LearningLessonScreen,
  })),
);
export const LearningAssignmentScreen = lazyWithLog("LearningAssignmentScreen", () =>
  import("@/learning/adapters/learning.adapter").then((m) => ({
    default: m.LearningAssignmentScreen,
  })),
);
export const LearningStudentDashboardScreen = lazyWithLog(
  "LearningStudentDashboardScreen",
  () =>
    import("@/learning/adapters/learning.adapter").then((m) => ({
      default: m.LearningStudentDashboardScreen,
    })),
);
export const LearningStudentCourseScreen = lazyWithLog(
  "LearningStudentCourseScreen",
  () =>
    import("@/learning/adapters/learning.adapter").then((m) => ({
      default: m.LearningStudentCourseScreen,
    })),
);
export const LearningTeacherDashboardScreen = lazyWithLog(
  "LearningTeacherDashboardScreen",
  () =>
    import("@/learning/adapters/learning.adapter").then((m) => ({
      default: m.LearningTeacherDashboardScreen,
    })),
);
export const LearningTeacherCourseScreen = lazyWithLog(
  "LearningTeacherCourseScreen",
  () =>
    import("@/learning/adapters/learning.adapter").then((m) => ({
      default: m.LearningTeacherCourseScreen,
    })),
);
export const LearningSubmissionReviewScreen = lazyWithLog(
  "LearningSubmissionReviewScreen",
  () =>
    import("@/learning/adapters/learning.adapter").then((m) => ({
      default: m.LearningSubmissionReviewScreen,
    })),
);
export const LearningParentDashboardScreen = lazyWithLog(
  "LearningParentDashboardScreen",
  () =>
    import("@/learning/adapters/learning.adapter").then((m) => ({
      default: m.LearningParentDashboardScreen,
    })),
);
export const LearningObservedStudentScreen = lazyWithLog(
  "LearningObservedStudentScreen",
  () =>
    import("@/learning/adapters/learning.adapter").then((m) => ({
      default: m.LearningObservedStudentScreen,
    })),
);
export const LearningAdminDashboardScreen = lazyWithLog(
  "LearningAdminDashboardScreen",
  () =>
    import("@/learning/adapters/learning.adapter").then((m) => ({
      default: m.LearningAdminDashboardScreen,
    })),
);
export const LearningOrganizationScreen = lazyWithLog(
  "LearningOrganizationScreen",
  () =>
    import("@/learning/adapters/learning.adapter").then((m) => ({
      default: m.LearningOrganizationScreen,
    })),
);
export const LearningCourseRosterScreen = lazyWithLog(
  "LearningCourseRosterScreen",
  () =>
    import("@/learning/adapters/learning.adapter").then((m) => ({
      default: m.LearningCourseRosterScreen,
    })),
);
