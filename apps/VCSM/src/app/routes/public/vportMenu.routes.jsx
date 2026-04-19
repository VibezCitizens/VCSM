// src/app/routes/public/vportMenu.routes.jsx
import { releaseFlags } from "@/shared/config/releaseFlags";

export function vportMenuPublicRoutes({
  VportMenuRedirectScreen,
  VportActorMenuPublicScreen,
  VportActorMenuQrScreen,
  VportActorMenuFlyerScreen,
  VportMenuBySlugScreen,
}) {
  return [
    // short public entry (legacy — resolves to canonical slug URL)
    { path: "/m/:actorId", element: <VportMenuRedirectScreen /> },

    // canonical public menu route — slug-based
    { path: "/profile/:slug/menu", element: <VportMenuBySlugScreen /> },

    // legacy actor-based routes — redirect to canonical slug URL
    { path: "/actor/:actorId/menu", element: <VportActorMenuPublicScreen /> },
    { path: "/actor/:actorId/menu/qr", element: <VportActorMenuQrScreen /> },
    ...(releaseFlags.vportPrintableFlyer
      ? [{ path: "/actor/:actorId/menu/flyer", element: <VportActorMenuFlyerScreen /> }]
      : []),
  ];
}
