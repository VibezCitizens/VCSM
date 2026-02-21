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
  ];
}