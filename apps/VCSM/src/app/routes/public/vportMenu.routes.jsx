// src/app/routes/public/vportMenu.routes.jsx
import { releaseFlags } from "@/shared/config/releaseFlags";

export function vportMenuPublicRoutes({
  VportMenuRedirectScreen,
  VportActorMenuPublicScreen,
  VportActorMenuQrScreen,
  VportActorMenuFlyerScreen,
}) {
  return [
    // short public entry
    { path: "/m/:actorId", element: <VportMenuRedirectScreen /> },

    // canonical public menu routes (actor-first)
    { path: "/actor/:actorId/menu", element: <VportActorMenuPublicScreen /> },
    { path: "/actor/:actorId/menu/qr", element: <VportActorMenuQrScreen /> },
    ...(releaseFlags.vportPrintableFlyer
      ? [{ path: "/actor/:actorId/menu/flyer", element: <VportActorMenuFlyerScreen /> }]
      : []),
  ];
}
