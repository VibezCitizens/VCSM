/* eslint-disable react-refresh/only-export-components */

import React from "react";
import { Navigate } from "react-router-dom";
import { releaseFlags } from "@/shared/config/releaseFlags";
import { learningProtectedRoutes } from "@/app/routes/learning/learning.routes";
import {
  BlockedVportGuard,
  OwnerOnlyDashboardGuard,
  VportToActorDashboardRedirect,
  VportToActorSettingsRedirect,
  VportToActorAdsRedirect,
  VportToActorFlyerEditRedirect,
  VportToActorMenuQrRedirect,
  VportToActorMenuFlyerRedirect,
  VportToActorDashboardReviewsRedirect,
  VportToActorDashboardLeadsRedirect,
  VportToActorDashboardExchangeRedirect,
  VportToActorDashboardCalendarRedirect,
} from "@/app/routes/protected/appRoutes.redirects";

const devDiagnosticsEnabled = import.meta.env.DEV;

export function protectedAppRoutes({
  CentralFeed,
  ExploreScreen,
  CitizenVibesScreen,
  PostFeedScreen,
  PostDetailScreen,
  EditPostScreen,

  ChatInboxScreen,
  NewChatScreen,
  SpamInboxScreen,
  RequestsInboxScreen,
  ArchivedInboxScreen,
  InboxChatSettingsScreen,
  InboxSettingsScreen,
  MessagePrivacyScreen,
  BlockedUsersScreen,
  ChatConversationScreen,

  NotificationsScreen,
  NotiViewPostScreen,

  UploadScreen,
  InviteScreen,
  ProfessionalAccessScreen,
  ProfessionalBriefingsScreen,
  SettingsScreen,
  VportAdsSettingsScreen,
  VoidScreen,
  DevDiagnosticsScreen,
  PerfDashboardScreen,

  UsernameProfileRedirect,
  ActorProfileScreen,
  TopFriendsRankEditor,

  VportScreen,
  VportGasPricesScreen,

  VportActorMenuFlyerEditorScreen,
  RestoreVportScreen,
  VportDashboardScreen,
  VportDashboardGasScreen,
  VportDashboardReviewScreen,
  VportDashboardLeadsScreen,
  VportDashboardServicesScreen,
  VportDashboardExchangeScreen,
  VportDashboardCalendarScreen,
  VportDashboardPortfolioScreen,
  VportDashboardLocksmithScreen,
  VportDashboardBookingHistoryScreen,
  VportDashboardTeamScreen,
  BarberTeamRequestsScreen,
  VportDashboardScheduleScreen,
  VportSettingsScreen,

  LearningHomeScreen,
  LearningCourseScreen,
  LearningLessonScreen,
  LearningAssignmentScreen,

  LearningStudentDashboardScreen,
  LearningStudentCourseScreen,

  LearningTeacherDashboardScreen,
  LearningTeacherCourseScreen,
  LearningSubmissionReviewScreen,

  LearningParentDashboardScreen,
  LearningObservedStudentScreen,

  LearningAdminDashboardScreen,
  LearningOrganizationScreen,
  LearningCourseRosterScreen,
}) {
  return [
    { path: "/feed", element: <CentralFeed /> },
    { path: "/explore", element: <ExploreScreen /> },
    { path: "/citizen/vibes", element: <CitizenVibesScreen /> },

    { path: "/posts", element: <PostFeedScreen /> },
    { path: "/posts/:postId", element: <PostDetailScreen /> },
    { path: "/post/:postId", element: <PostDetailScreen /> },
    { path: "/posts/:postId/edit", element: <EditPostScreen /> },
    { path: "/post/:postId/edit", element: <EditPostScreen /> },

    { path: "/chat", element: <ChatInboxScreen /> },
    { path: "/chat/new", element: <NewChatScreen /> },
    { path: "/chat/spam", element: <SpamInboxScreen /> },
    { path: "/chat/requests", element: <RequestsInboxScreen /> },
    { path: "/chat/archived", element: <ArchivedInboxScreen /> },

    { path: "/chat/settings", element: <InboxChatSettingsScreen /> },
    { path: "/chat/settings/inbox", element: <InboxSettingsScreen /> },
    { path: "/chat/settings/privacy", element: <MessagePrivacyScreen /> },
    { path: "/chat/settings/blocked", element: <BlockedUsersScreen /> },

    { path: "/chat/:conversationId", element: <ChatConversationScreen /> },

    { path: "/vport/inbox", element: <Navigate to="/chat" replace /> },
    { path: "/vport/chat/:conversationId", element: <ChatConversationScreen /> },
    { path: "/vport/chat", element: <Navigate to="/chat" replace /> },

    { path: "/notifications", element: <NotificationsScreen /> },
    {
      path: "/vport/notifications",
      element: <Navigate to="/notifications" replace />,
    },
    { path: "/noti/post/:postId", element: <NotiViewPostScreen /> },

    { path: "/upload", element: <UploadScreen /> },
    {
      path: "/professional-access",
      element: releaseFlags.professionalWorkspace ? (
        <ProfessionalAccessScreen />
      ) : (
        <Navigate to="/settings?tab=profile" replace />
      ),
    },
    {
      path: "/professional/briefings",
      element: releaseFlags.professionalWorkspace ? (
        <ProfessionalBriefingsScreen />
      ) : (
        <Navigate to="/settings?tab=profile" replace />
      ),
    },
    { path: "/settings", element: <SettingsScreen /> },
    { path: "/invite", element: <InviteScreen /> },
    {
      path: "/ads/vport/:actorId",
      element: releaseFlags.vportAdsPipeline ? (
        <VportAdsSettingsScreen />
      ) : (
        <Navigate to="/feed" replace />
      ),
    },
    { path: "/void", element: <VoidScreen /> },
    {
      path: "/dev/diagnostics",
      element: devDiagnosticsEnabled ? (
        <DevDiagnosticsScreen />
      ) : (
        <Navigate to="/feed" replace />
      ),
    },
    {
      path: "/dev/performance",
      element: devDiagnosticsEnabled ? (
        <PerfDashboardScreen />
      ) : (
        <Navigate to="/feed" replace />
      ),
    },

    { path: "/me", element: <Navigate to="/profile/self" replace /> },
    { path: "/u/:username", element: <UsernameProfileRedirect /> },

    { path: "/profile/:actorId", element: <ActorProfileScreen /> },

    { path: "/actor/:actorId/gas", element: <VportGasPricesScreen /> },

    { path: "/profile/:id/friends/top/edit", element: <TopFriendsRankEditor /> },

    {
      path: "/actor/:actorId/menu/flyer/edit",
      element: releaseFlags.vportFlyerEditor ? (
        <VportActorMenuFlyerEditorScreen />
      ) : (
        <Navigate to="/feed" replace />
      ),
    },

    { path: "/vport/restore", element: <RestoreVportScreen /> },

    {
      element: <BlockedVportGuard />,
      children: [
        {
          element: <OwnerOnlyDashboardGuard />,
          children: [
            { path: "/actor/:actorId/dashboard", element: <VportDashboardScreen /> },
            { path: "/actor/:actorId/dashboard/gas", element: <VportDashboardGasScreen /> },
            { path: "/actor/:actorId/dashboard/reviews", element: <VportDashboardReviewScreen /> },
            { path: "/actor/:actorId/dashboard/leads", element: <VportDashboardLeadsScreen /> },
            { path: "/actor/:actorId/dashboard/services", element: <VportDashboardServicesScreen /> },
            { path: "/actor/:actorId/dashboard/exchange", element: <VportDashboardExchangeScreen /> },
            { path: "/actor/:actorId/dashboard/calendar", element: <VportDashboardCalendarScreen /> },
            { path: "/actor/:actorId/dashboard/portfolio", element: <VportDashboardPortfolioScreen /> },
            { path: "/actor/:actorId/dashboard/locksmith", element: <VportDashboardLocksmithScreen /> },
            { path: "/actor/:actorId/dashboard/booking-history", element: <VportDashboardBookingHistoryScreen /> },
            { path: "/actor/:actorId/dashboard/team", element: <VportDashboardTeamScreen /> },
            { path: "/actor/:actorId/dashboard/team-requests", element: <BarberTeamRequestsScreen /> },
            { path: "/actor/:actorId/dashboard/schedule", element: <VportDashboardScheduleScreen /> },
            { path: "/actor/:actorId/settings", element: <VportSettingsScreen /> },
          ],
        },
      ],
    },

    {
      path: "/vport/:actorId/menu/qr",
      element: <VportToActorMenuQrRedirect />,
    },
    {
      path: "/vport/:actorId/menu/flyer",
      element: <VportToActorMenuFlyerRedirect />,
    },
    {
      path: "/vport/:actorId/menu/flyer/edit",
      element: <VportToActorFlyerEditRedirect />,
    },
    {
      path: "/vport/:actorId/dashboard",
      element: <VportToActorDashboardRedirect />,
    },
    {
      path: "/vport/:actorId/dashboard/reviews",
      element: <VportToActorDashboardReviewsRedirect />,
    },
    {
      path: "/vport/:actorId/dashboard/leads",
      element: <VportToActorDashboardLeadsRedirect />,
    },
    {
      path: "/vport/:actorId/dashboard/exchange",
      element: <VportToActorDashboardExchangeRedirect />,
    },
    {
      path: "/vport/:actorId/dashboard/calendar",
      element: <VportToActorDashboardCalendarRedirect />,
    },
    {
      path: "/vport/:actorId/settings",
      element: <VportToActorSettingsRedirect />,
    },
    { path: "/vport/:actorId/ads", element: <VportToActorAdsRedirect /> },

    ...learningProtectedRoutes({
      LearningHomeScreen,
      LearningCourseScreen,
      LearningLessonScreen,
      LearningAssignmentScreen,

      LearningStudentDashboardScreen,
      LearningStudentCourseScreen,

      LearningTeacherDashboardScreen,
      LearningTeacherCourseScreen,
      LearningSubmissionReviewScreen,

      LearningParentDashboardScreen,
      LearningObservedStudentScreen,

      LearningAdminDashboardScreen,
      LearningOrganizationScreen,
      LearningCourseRosterScreen,
    }),

    { path: "/", element: <Navigate to="/feed" replace /> },
    { path: "*", element: <Navigate to="/feed" replace /> },
  ];
}

export default protectedAppRoutes;
