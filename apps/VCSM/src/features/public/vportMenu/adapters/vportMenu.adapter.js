/**
 * Public adapter surface for features/public/vportMenu.
 *
 * All cross-feature imports into this module must route through this file.
 * Never import directly from vportMenu/view/*, vportMenu/hooks/*, or
 * vportMenu/components/* from outside this feature.
 *
 * Exports:
 *   Views     — composable view screens for cross-feature use
 *   Hooks     — data hooks for cross-feature consumption
 *   Slug util — slug resolution hooks
 *
 * Not exported (internal only):
 *   DAL       — database access, internal to this feature
 *   Models    — domain transformers, internal to this feature
 *   Controllers — business logic, internal to this feature
 *   Screens   — route entry points, consumed by route files via lazy import only
 */

// ─── Views ────────────────────────────────────────────────────────────────────

export { VportPublicMenuView } from "@/features/public/vportMenu/view/VportPublicMenuView";
export { VportPublicMenuQrView } from "@/features/public/vportMenu/view/VportPublicMenuQrView";
export { VportPublicReviewsView } from "@/features/public/vportMenu/view/VportPublicReviewsView";
export { VportPublicReviewsQrView } from "@/features/public/vportMenu/view/VportPublicReviewsQrView";

// ─── Data hooks ───────────────────────────────────────────────────────────────

export { useVportPublicMenu } from "@/features/public/vportMenu/hooks/useVportPublicMenu";
export { useVportPublicDetails } from "@/features/public/vportMenu/hooks/useVportPublicDetails";
export { useVportPublicReviews } from "@/features/public/vportMenu/hooks/useVportPublicReviews";

// ─── Slug resolution hooks ────────────────────────────────────────────────────

export { useResolveMenuSlug } from "@/features/public/vportMenu/hooks/useResolveMenuSlug";
export { useResolveVportSlug } from "@/features/public/vportMenu/hooks/useResolveVportSlug";
