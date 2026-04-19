// src/app/routes/public/vportMenu.routes.jsx
import { releaseFlags } from "@/shared/config/releaseFlags";

export function vportMenuPublicRoutes({
  VportMenuRedirectScreen,
  VportActorMenuPublicScreen,
  VportActorMenuQrScreen,
  VportActorMenuFlyerScreen,
  VportMenuBySlugScreen,
  VportMenuQrBySlugScreen,
  VportReviewsBySlugScreen,
  VportReviewsQrBySlugScreen,
}) {
  return [
    // short public entry (legacy — resolves to canonical slug URL)
    { path: "/m/:actorId", element: <VportMenuRedirectScreen /> },

    // canonical public menu routes — slug-based
    { path: "/profile/:slug/menu", element: <VportMenuBySlugScreen /> },
    { path: "/profile/:slug/menu/qr", element: <VportMenuQrBySlugScreen /> },

    // canonical public reviews routes — slug-based
    { path: "/profile/:slug/reviews", element: <VportReviewsBySlugScreen /> },
    { path: "/profile/:slug/reviews/qr", element: <VportReviewsQrBySlugScreen /> },

    // legacy actor-based routes — redirect to canonical slug URL
    { path: "/actor/:actorId/menu", element: <VportActorMenuPublicScreen /> },
    { path: "/actor/:actorId/menu/qr", element: <VportActorMenuQrScreen /> },
    ...(releaseFlags.vportPrintableFlyer
      ? [{ path: "/actor/:actorId/menu/flyer", element: <VportActorMenuFlyerScreen /> }]
      : []),
  ];
}
