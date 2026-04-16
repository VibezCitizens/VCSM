// src/features/settings/vports/hooks/useVportSwitch.js
import { ctrlGetAuthedUserId } from "@/features/settings/vports/controller/getAuthedUserId.controller";
import { recordVportResolution } from "@debuggers/actor-switch";

/**
 * Resolve the correct actorId for a vport profile row against the engine's
 * available actor links.  vport.profiles.actor_id can be stale; the platform
 * user_app_actor_links table is the source of truth.
 *
 * Resolution order:
 *   1. Exact match:   link.actorId === v.actor_id
 *   2. Name match:    link.displayName === v.name  (snapshot field on actor link)
 *
 * Single-link fallback is intentionally REMOVED — it silently switched to the
 * wrong vport when v.actor_id was stale and only one link existed.
 *
 * Returns the resolved actorId string, or null if resolution fails.
 */
function resolveActorIdFromLinks(v, availableActors) {
  const vportLinks = (availableActors ?? []).filter(
    (a) => a.actorKind === 'vport' && a.isSwitchable !== false,
  );
  const availableVportIds = vportLinks.map((a) => a.actorId);

  // 1. Exact match on actor_id
  const exactMatch = vportLinks.find((a) => a.actorId === v.actor_id);
  if (exactMatch) {
    recordVportResolution({
      clickedId:         v.actor_id,
      profileName:       v.name ?? null,
      resolvedId:        exactMatch.actorId,
      fallback:          'exact',
      aborted:           false,
      availableVportIds,
    });
    return exactMatch.actorId;
  }

  // 2. Name match fallback (actor_id on profile row is stale)
  if (v.name) {
    const byName = vportLinks.find((a) => a.displayName === v.name);
    if (byName) {
      recordVportResolution({
        clickedId:         v.actor_id,
        profileName:       v.name,
        resolvedId:        byName.actorId,
        fallback:          'name',
        aborted:           false,
        availableVportIds,
      });
      return byName.actorId;
    }
  }

  // No resolution — abort. Do NOT fall back to single-link; that was the bug.
  recordVportResolution({
    clickedId:         v.actor_id,
    profileName:       v.name ?? null,
    resolvedId:        null,
    fallback:          null,
    aborted:           true,
    availableVportIds,
  });
  return null;
}

export function useVportSwitch({ user, identity, switchActor, availableActors, navigate }) {
  const getAuthedUserId = async () => {
    if (user?.id) return user.id;
    return ctrlGetAuthedUserId();
  };

  const switchToProfile = async (profileActorId, setBusy) => {
    if (identity?.kind === "user") return;
    if (!profileActorId) {
      if (import.meta.env.DEV) console.error("[Vports] profile actor not resolved");
      return;
    }

    setBusy(true);
    try {
      await switchActor(profileActorId, 'useVportSwitcher.switchToProfile');
      const meId = await getAuthedUserId();
      navigate(`/notifications?actor=profile:${meId}`);
    } finally {
      setBusy(false);
    }
  };

  const switchToVport = async (v, setBusy) => {
    // Resolve correct actorId from the cached actor links.
    // If the cache misses (e.g. vport was just created and availableActors hasn't
    // refreshed yet), fall through to v.actor_id and let switchActor be the
    // authoritative gate — it always fetches fresh engine context and will
    // TERMINAL ABORT if the actor genuinely isn't in the platform links.
    const resolvedActorId = resolveActorIdFromLinks(v, availableActors) ?? v.actor_id;

    if (!resolvedActorId) return;

    setBusy(true);
    try {
      const result = await switchActor(resolvedActorId, 'useVportSwitcher.switchToVport');
      // Only navigate when the switch actually committed. A null result (old
      // code path) is treated as success for backward compat.
      if (result === undefined || result?.success) {
        navigate(`/vport/notifications?actor=vport:${v.id}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return { switchToProfile, switchToVport };
}
