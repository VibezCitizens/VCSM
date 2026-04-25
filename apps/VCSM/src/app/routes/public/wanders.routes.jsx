export function wandersPublicRoutes({
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
}) {
  return [
    { path: "/wanders", element: <WandersHomeScreen /> },
    { path: "/wanders/i/:publicId", element: <WandersInboxPublicScreen /> },
    { path: "/wanders/c/:publicId", element: <WandersCardPublicScreen /> },
    {
      path: "/wanders/create",
      element: <WandersCreateScreen realmId={wandersRealmId} baseUrl={baseUrl} />,
    },
    { path: "/wanders/mailbox", element: <WandersMailboxScreen /> },
    { path: "/wanders/outbox", element: <WandersOutboxScreen /> },
    { path: "/wanders/sent", element: <WandersSentScreen /> },
    { path: "/wanders/sent/:cardPublicId", element: <WandersSentScreen /> },
    { path: "/wanders/claim", element: <WandersIntegrateActorScreen /> },
    { path: "/wanders/connect", element: <WandersIntegrateActorScreen /> },

    // Public shareable VPORT business card (Wanders-owned v1 implementation)
    { path: "/vport/:slug/card", element: <VportBusinessCardPublicScreen /> },
  ];
}
