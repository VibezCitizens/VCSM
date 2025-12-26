import { useMemo } from "react";
import { useActorStore } from "@/state/actors/actorStore";

const DEFAULT_BANNER = "/default-banner.jpg";

/**
 * ⚠️ LEGACY ADAPTER — DO NOT EXPAND
 * ------------------------------------------------------------
 * This hook exists ONLY for backward compatibility.
 * It MUST tolerate both snake_case and camelCase actor shapes.
 * New code should NOT depend on this.
 * ------------------------------------------------------------
 */
export function useActorPresentation(actorId) {
  const actor = useActorStore((s) => s.actors[actorId]);

  return useMemo(() => {
    if (!actor) return null;

    const isVport = actor.kind === "vport";

    // ----------------------------------------------------------
    // DISPLAY NAME (compat: camelCase → snake_case)
    // ----------------------------------------------------------
    const displayName = isVport
      ? actor.vportName ?? actor.vport_name ?? null
      : actor.displayName ??
        actor.display_name ??
        actor.username ??
        "User";

    // ----------------------------------------------------------
    // USERNAME (compat)
    // ----------------------------------------------------------
    const username = isVport
      ? actor.vportSlug ?? actor.vport_slug ?? null
      : actor.username ?? null;

    // ----------------------------------------------------------
    // AVATAR (DO NOT RENAME — legacy UI depends on this)
    // ----------------------------------------------------------
    const avatar =
      actor.photoUrl ??
      actor.photo_url ??
      "/avatar.jpg";

    // ----------------------------------------------------------
    // BANNER (safe add)
    // ----------------------------------------------------------
    const bannerUrl =
      actor.bannerUrl ??
      actor.banner_url ??
      DEFAULT_BANNER;

    // ----------------------------------------------------------
    // ROUTE (unchanged behavior)
    // ----------------------------------------------------------
    const route = isVport
      ? username
        ? `/v/${encodeURIComponent(username)}`
        : `/v/id/${encodeURIComponent(actor.id)}`
      : username
        ? `/u/${encodeURIComponent(username)}`
        : `/u/id/${encodeURIComponent(actor.id)}`;

    return {
      id: actor.id,
      kind: actor.kind,
      displayName,
      username,
      avatar,
      bannerUrl,
      route,
    };
  }, [actor]);
}
