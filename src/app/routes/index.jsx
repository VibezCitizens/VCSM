// src/app/routes/index.jsx
// ============================================================================
// APP ROUTES — ACTOR-BASED (LOCKED, NO BLOCKGATE, NO MeScreen)
// ============================================================================

import { Suspense, lazy } from "react";
import { Navigate, useRoutes } from "react-router-dom";

import ProtectedRoute from "@/app/guards/ProtectedRoute";
import RootLayout from "@/app/layout/RootLayout";
import { resolveRealm } from "@/features/upload/model/resolveRealm";

import { authPublicRoutes } from "@/app/routes/public/auth.routes";
import { wandersPublicRoutes } from "@/app/routes/public/wanders.routes";
import { vportMenuPublicRoutes } from "@/app/routes/public/vportMenu.routes";
import { protectedAppRoutes } from "@/app/routes/protected/app.routes";

// ----------------------------------------------------------------------------
// Lazy helper with debugging
// ----------------------------------------------------------------------------
function lazyWithLog(label, importer) {
  return lazy(() =>
    importer().catch((e) => {
      console.error(`[lazy import] ${label} failed`, e);
      throw e;
    })
  );
}

// ============================================================================
// LAZY SCREENS (KEEP THESE DEFINED IN THIS FILE SCOPE)
// ============================================================================

/* ================= AUTH ================= */
const LoginScreen = lazyWithLog("LoginScreen", () =>
  import("@/features/auth/screens/LoginScreen")
);
const RegisterScreen = lazyWithLog("RegisterScreen", () =>
  import("@/features/auth/screens/RegisterScreen")
);
const ResetPasswordScreen = lazyWithLog("ResetPasswordScreen", () =>
  import("@/features/auth/screens/ResetPasswordScreen")
);
const OnboardingScreen = lazyWithLog("OnboardingScreen", () =>
  import("@/features/auth/screens/Onboarding")
);

/* ================= MAIN APP ================= */
const CentralFeed = lazyWithLog("CentralFeed", () =>
  import("@/features/feed/screens/CentralFeed")
);
const ExploreScreen = lazyWithLog("Explore", () =>
  import("@/features/explore/screens/ExploreScreen")
);

/* ================= NOTIFICATIONS ================= */
const NotificationsScreen = lazyWithLog("Notifications", () =>
  import("@/features/notifications/screen/NotificationsScreen")
);
const NotiViewPostScreen = lazyWithLog("NotiViewPost", () =>
  import("@/features/notifications/screen/NotiViewPostScreen")
);

/* ================= UPLOAD ================= */
const UploadScreen = lazyWithLog("UploadScreen", () =>
  import("@/features/upload/screens/UploadScreen")
);

/* ================= ACCOUNT / MISC ================= */
const SettingsScreen = lazyWithLog("Settings", () =>
  import("@/features/settings/screen/SettingsScreen")
);
const VoidScreen = lazyWithLog("VoidScreen", () =>
  import("@/features/void/VoidScreen")
);

/* ================= PROFILES ================= */
const UsernameProfileRedirect = lazyWithLog("UsernameProfileRedirect", () =>
  import("@/features/profiles/screens/UsernameProfileRedirect")
);
const ActorProfileScreen = lazyWithLog("ActorProfileScreen", () =>
  import("@/features/profiles/screens/ActorProfileScreen")
);
const TopFriendsRankEditor = lazyWithLog("TopFriendsRankEditor", () =>
  import(
    "@/features/profiles/screens/views/tabs/friends/components/TopFriendsRankEditor"
  )
);

/* ================= OWNER / DASHBOARD (PROTECTED for now) ================= */
const VportActorMenuFlyerEditorScreen = lazyWithLog(
  "VportActorMenuFlyerEditorScreen",
  () =>
    import(
      "@/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerEditorScreen"
    )
);

const VportDashboardScreen = lazyWithLog("VportDashboardScreen", () =>
  import("@/features/dashboard/vport/screens/VportDashboardScreen")
);

// ✅ OWNER GAS DASHBOARD SCREEN
const VportDashboardGasScreen = lazyWithLog("VportDashboardGasScreen", () =>
  import("@/features/dashboard/vport/screens/VportDashboardGasScreen")
);

// ✅ OWNER REVIEWS DASHBOARD SCREEN
const VportDashboardReviewScreen = lazyWithLog("VportDashboardReviewScreen", () =>
  import("@/features/dashboard/vport/screens/VportDashboardReviewScreen")
);

const VportSettingsScreen = lazyWithLog("VportSettingsScreen", () =>
  import("@/features/dashboard/vport/screens/VportSettingsScreen")
);

/* ================= GAS (PROTECTED) ================= */
const VportGasPricesScreen = lazyWithLog("VportGasPricesScreen", () =>
  import("@/features/profiles/kinds/vport/screens/gas/screens/VportGasPricesScreen")
);

/* ================= PUBLIC MENU (ACTOR-FIRST) ================= */
const VportMenuRedirectScreen = lazyWithLog("VportMenuRedirectScreen", () =>
  import("@/features/profiles/kinds/vport/screens/VportMenuRedirectScreen")
);

const VportActorMenuPublicScreen = lazyWithLog("VportActorMenuPublicScreen", () =>
  import("@/features/profiles/kinds/vport/screens/menu/VportActorMenuPublicScreen")
);

const VportActorMenuQrScreen = lazyWithLog("VportActorMenuQrScreen", () =>
  import("@/features/dashboard/qrcode/menu/VportActorMenuQrScreen")
);

const VportActorMenuFlyerScreen = lazyWithLog("VportActorMenuFlyerScreen", () =>
  import("@/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerScreen")
);

/* ================= POSTS ================= */
const PostFeedScreen = lazyWithLog("PostFeedScreen", () =>
  import("@/features/post/screens/PostFeed.screen")
);
const PostDetailScreen = lazyWithLog("PostDetailScreen", () =>
  import("@/features/post/screens/PostDetail.screen")
);
const EditPostScreen = lazyWithLog("EditPostScreen", () =>
  import("@/features/post/postcard/ui/EditPost")
);

/* ================= CHAT ================= */
const ChatInboxScreen = lazyWithLog("ChatInbox", () =>
  import("@/features/chat").then((m) => ({ default: m.InboxScreen }))
);
const ChatConversationScreen = lazyWithLog("ChatConversation", () =>
  import("@/features/chat").then((m) => ({ default: m.ConversationScreen }))
);
const NewChatScreen = lazyWithLog("NewChat", () =>
  import("@/features/chat").then((m) => ({ default: m.NewConversationScreen }))
);

const InboxChatSettingsScreen = lazyWithLog("InboxChatSettingsScreen", () =>
  import("@/features/chat/inbox/screens/InboxChatSettingsScreen")
);
const InboxSettingsScreen = lazyWithLog("InboxSettingsScreen", () =>
  import("@/features/chat/inbox/screens/InboxSettingsScreen")
);
const MessagePrivacyScreen = lazyWithLog("MessagePrivacyScreen", () =>
  import("@/features/chat/inbox/screens/settings/MessagePrivacyScreen")
);
const SpamInboxScreen = lazyWithLog("SpamInboxScreen", () =>
  import("@/features/chat/inbox/screens/SpamInboxScreen")
);
const RequestsInboxScreen = lazyWithLog("RequestsInboxScreen", () =>
  import("@/features/chat/inbox/screens/RequestsInboxScreen")
);
const ArchivedInboxScreen = lazyWithLog("ArchivedInboxScreen", () =>
  import("@/features/chat/inbox/screens/ArchivedInboxScreen")
);
const BlockedUsersScreen = lazyWithLog("BlockedUsersScreen", () =>
  import("@/features/chat/inbox/screens/settings/BlockedUsersScreen")
);

/* ================= WANDERS (PUBLIC + APP) ================= */
const WandersHomeScreen = lazyWithLog("WandersHomeScreen", () =>
  import("@/features/wanders/screens/WandersHome.screen")
);
const WandersInboxPublicScreen = lazyWithLog("WandersInboxPublicScreen", () =>
  import("@/features/wanders/screens/WandersInboxPublic.screen")
);
const WandersCardPublicScreen = lazyWithLog("WandersCardPublicScreen", () =>
  import("@/features/wanders/screens/WandersCardPublic.screen")
);
const WandersSentScreen = lazyWithLog("WandersSentScreen", () =>
  import("@/features/wanders/screens/WandersSent.screen")
);
const WandersIntegrateActorScreen = lazyWithLog(
  "WandersIntegrateActorScreen",
  () => import("@/features/wanders/screens/WandersIntegrateActor.screen")
);
const WandersMailboxScreen = lazyWithLog("WandersMailboxScreen", () =>
  import("@/features/wanders/screens/WandersMailbox.screen")
);
const WandersOutboxScreen = lazyWithLog("WandersOutboxScreen", () =>
  import("@/features/wanders/screens/WandersOutbox.screen")
);
const WandersCreateScreen = lazyWithLog("WandersCreateScreen", () =>
  import("@/features/wanders/screens/WandersCreate.screen")
);

// ============================================================================
// ROUTES (useRoutes)
// ============================================================================
export default function AppRoutes() {
  const baseUrl = window.location.origin;
  const wandersRealmId = resolveRealm(false);

  const routes = [
    ...authPublicRoutes({
      LoginScreen,
      RegisterScreen,
      ResetPasswordScreen,
      OnboardingScreen,
    }),

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
    }),

    // ✅ PUBLIC MENU ROUTES (actor-first)
    ...vportMenuPublicRoutes({
      VportMenuRedirectScreen,
      VportActorMenuPublicScreen,
      VportActorMenuQrScreen,
      VportActorMenuFlyerScreen,
    }),

    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <RootLayout />,
          children: protectedAppRoutes({
            CentralFeed,
            ExploreScreen,

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
            SettingsScreen,
            VoidScreen,

            UsernameProfileRedirect,
            ActorProfileScreen,
            TopFriendsRankEditor,

            VportGasPricesScreen,

            VportActorMenuFlyerEditorScreen,
            VportDashboardScreen,
            VportDashboardGasScreen, // ✅ ADDED
            VportDashboardReviewScreen, // ✅ ADDED
            VportSettingsScreen,

            // ✅ so protected routes can render these too
            VportActorMenuQrScreen,
            VportActorMenuFlyerScreen,
          }),
        },
      ],
    },

    // public fallback
    { path: "*", element: <Navigate to="/login" replace /> },
  ];

  const element = useRoutes(routes);

  return (
    <Suspense fallback={<div className="text-center p-10">Loading…</div>}>
      {element}
    </Suspense>
  );
}