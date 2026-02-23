// src/app/routes/protected/app.routes.jsx

import React from "react";
import { Navigate, useParams } from "react-router-dom";

function VportToActorDashboardRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/dashboard`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

function VportToActorSettingsRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/settings`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

function VportToActorFlyerEditRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/menu/flyer/edit`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

function VportToActorMenuQrRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/menu/qr`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

function VportToActorMenuFlyerRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/menu/flyer`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

// ✅ legacy reviews dashboard redirect
function VportToActorDashboardReviewsRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/dashboard/reviews`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

// ✅ NEW: legacy exchange dashboard redirect
function VportToActorDashboardExchangeRedirect() {
  const { actorId } = useParams();
  return actorId ? (
    <Navigate to={`/actor/${actorId}/dashboard/exchange`} replace />
  ) : (
    <Navigate to="/feed" replace />
  );
}

export function protectedAppRoutes({
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

  VportScreen,
  VportGasPricesScreen,

  // owner-only (auth only for now)
  VportActorMenuFlyerEditorScreen,
  VportDashboardScreen,
  VportDashboardGasScreen,
  VportDashboardReviewScreen,
  VportDashboardServicesScreen,
  VportDashboardExchangeScreen, // ✅ ADDED
  VportSettingsScreen,

  // actor-first menu screens (used by dashboard navigation)
  VportActorMenuQrScreen,
  VportActorMenuFlyerScreen,
}) {
  return [
    { path: "/feed", element: <CentralFeed /> },
    { path: "/explore", element: <ExploreScreen /> },

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

    // legacy aliases (safe)
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
    { path: "/settings", element: <SettingsScreen /> },
    { path: "/void", element: <VoidScreen /> },

    { path: "/me", element: <Navigate to="/profile/self" replace /> },
    { path: "/u/:username", element: <UsernameProfileRedirect /> },

    // actor profile routes
    { path: "/profile/:actorId", element: <ActorProfileScreen /> },

    // GAS (canonical / citizen)
    { path: "/actor/:actorId/gas", element: <VportGasPricesScreen /> },

    { path: "/profile/:id/friends/top/edit", element: <TopFriendsRankEditor /> },

    // canonical owner routes (actor-first)
    { path: "/actor/:actorId/menu/qr", element: <VportActorMenuQrScreen /> },
    {
      path: "/actor/:actorId/menu/flyer",
      element: <VportActorMenuFlyerScreen />,
    },
    {
      path: "/actor/:actorId/menu/flyer/edit",
      element: <VportActorMenuFlyerEditorScreen />,
    },

    { path: "/actor/:actorId/dashboard", element: <VportDashboardScreen /> },

    // ✅ OWNER GAS DASHBOARD ROUTE
    {
      path: "/actor/:actorId/dashboard/gas",
      element: <VportDashboardGasScreen />,
    },

    // ✅ OWNER REVIEWS DASHBOARD ROUTE
    {
      path: "/actor/:actorId/dashboard/reviews",
      element: <VportDashboardReviewScreen />,
    },

    // ✅ OWNER SERVICES DASHBOARD ROUTE
    {
      path: "/actor/:actorId/dashboard/services",
      element: <VportDashboardServicesScreen />,
    },

    // ✅ OWNER EXCHANGE DASHBOARD ROUTE
    {
      path: "/actor/:actorId/dashboard/exchange",
      element: <VportDashboardExchangeScreen />,
    },

    { path: "/actor/:actorId/settings", element: <VportSettingsScreen /> },

    // ✅ keep /vport/* entrypoints BUT ACTOR-ID ONLY and redirect to /actor/*
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

    // ✅ legacy reviews dashboard redirect (optional but consistent)
    {
      path: "/vport/:actorId/dashboard/reviews",
      element: <VportToActorDashboardReviewsRedirect />,
    },

    // ✅ legacy exchange dashboard redirect (optional but consistent)
    {
      path: "/vport/:actorId/dashboard/exchange",
      element: <VportToActorDashboardExchangeRedirect />,
    },

    {
      path: "/vport/:actorId/settings",
      element: <VportToActorSettingsRedirect />,
    },

    { path: "/", element: <Navigate to="/feed" replace /> },
    { path: "*", element: <Navigate to="/feed" replace /> },
  ];
}