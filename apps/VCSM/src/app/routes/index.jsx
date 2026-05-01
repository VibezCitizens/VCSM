import { Suspense } from "react";
import { Navigate, useRoutes } from "react-router-dom";

import ProtectedRoute from "@/app/guards/ProtectedRoute";
import ProfileGatedOutlet from "@/app/guards/ProfileGatedOutlet";
import RootLayout from "@/app/layout/RootLayout";
import { resolveRealm } from "@/shared/utils/resolveRealm";

import { aboutPublicRoutes } from "@/app/routes/public/about.routes";
import { authPublicRoutes } from "@/app/routes/public/auth.routes";
import { contactPublicRoutes } from "@/app/routes/public/contact.routes";
import { howToPublicRoutes } from "@/app/routes/public/howto.routes";
import { legalPublicRoutes } from "@/app/routes/public/legal.routes";
import { wandersPublicRoutes } from "@/app/routes/public/wanders.routes";
import { vportMenuPublicRoutes } from "@/app/routes/public/vportMenu.routes";
import { protectedAppRoutes } from "@/app/routes/protected/app.routes";

import {
  LegalDocumentScreen,
  AboutScreen,
  ContactScreen,
  HowToCreateProfileScreen,
  HowToCreateVportScreen,
  VportCategoryLandingScreen,
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  OnboardingScreen,
  WelcomeScreen,
  AuthCallbackScreen,
  VerifyEmailRequiredScreen,
  WandersHomeScreen,
  WandersInboxPublicScreen,
  WandersCardPublicScreen,
  WandersSentScreen,
  WandersIntegrateActorScreen,
  WandersMailboxScreen,
  WandersOutboxScreen,
  WandersCreateScreen,
  VportBusinessCardPublicScreen,
  VportMenuRedirectScreen,
  VportActorMenuPublicScreen,
  VportActorMenuQrScreen,
  VportActorMenuFlyerScreen,
  VportMenuBySlugScreen,
  VportMenuQrBySlugScreen,
  VportReviewsBySlugScreen,
  VportReviewsQrBySlugScreen,
} from "@/app/routes/lazyPublic";

import {
  CentralFeed,
  ExploreScreen,
  CitizenVibesScreen,
  NotificationsScreen,
  NotiViewPostScreen,
  UploadScreen,
  ProfessionalAccessScreen,
  ProfessionalBriefingsScreen,
  InviteScreen,
  SettingsScreen,
  VportAdsSettingsScreen,
  VoidScreen,
  DevDiagnosticsScreen,
  PerfDashboardScreen,
  UsernameProfileRedirect,
  ActorProfileScreen,
  TopFriendsRankEditor,
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
  VportGasPricesScreen,
  PostFeedScreen,
  PostDetailScreen,
  EditPostScreen,
  ChatInboxScreen,
  ChatConversationScreen,
  NewChatScreen,
  InboxChatSettingsScreen,
  InboxSettingsScreen,
  MessagePrivacyScreen,
  SpamInboxScreen,
  RequestsInboxScreen,
  ArchivedInboxScreen,
  BlockedUsersScreen,
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
} from "@/app/routes/lazyApp";

export default function AppRoutes() {
  const baseUrl = window.location.origin;
  const wandersRealmId = resolveRealm(false);

  const routes = [
    ...authPublicRoutes({
      LoginScreen,
      RegisterScreen,
      ForgotPasswordScreen,
      ResetPasswordScreen,
      AuthCallbackScreen,
      VerifyEmailRequiredScreen,
    }),

    ...aboutPublicRoutes({ AboutScreen }),
    ...contactPublicRoutes({ ContactScreen }),

    ...howToPublicRoutes({
      HowToCreateProfileScreen,
      HowToCreateVportScreen,
      VportCategoryLandingScreen,
    }),

    ...legalPublicRoutes({ LegalDocumentScreen }),

    ...wandersPublicRoutes({
      baseUrl,
      wandersRealmId,
      WandersHomeScreen,
      WandersInboxPublicScreen,
      WandersCardPublicScreen,
      WandersCreateScreen,
      WandersMailboxScreen,
      WandersOutboxScreen,
      WandersSentScreen,
      WandersIntegrateActorScreen,
      VportBusinessCardPublicScreen,
    }),

    ...vportMenuPublicRoutes({
      VportMenuRedirectScreen,
      VportActorMenuPublicScreen,
      VportActorMenuQrScreen,
      VportActorMenuFlyerScreen,
      VportMenuBySlugScreen,
      VportMenuQrBySlugScreen,
      VportReviewsBySlugScreen,
      VportReviewsQrBySlugScreen,
    }),

    {
      element: <ProtectedRoute />,
      children: [
        { path: "/onboarding", element: <OnboardingScreen /> },
        { path: "/welcome", element: <WelcomeScreen /> },
        {
          element: <ProfileGatedOutlet />,
          children: [
            {
              element: <RootLayout />,
              children: protectedAppRoutes({
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
              }),
            },
          ],
        },
      ],
    },

    { path: "*", element: <Navigate to="/login" replace /> },
  ];

  const element = useRoutes(routes);

  return (
    <Suspense fallback={<div className="text-center p-10">Loading…</div>}>
      {element}
    </Suspense>
  );
}
