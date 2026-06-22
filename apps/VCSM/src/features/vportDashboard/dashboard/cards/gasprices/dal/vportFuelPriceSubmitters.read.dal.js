import { hydrateAndReturnSummaries } from "@hydration";

/**
 * Resolve display identity ({ displayName, avatar }) for a set of submitter
 * actor ids, using the shared hydration store (cache-first, network only for
 * stale/missing). Returns a plain map keyed by actorId for the batch model to
 * attach. Degrades to an empty map on failure — the dashboard renders a generic
 * citizen label rather than erroring.
 *
 * Identity-safe: keyed on actorId only. No profileId / vportId surfaced.
 *
 * @param {{ actorIds: string[] }} opts
 * @returns {Promise<Record<string, { displayName: string, avatar: string }>>}
 */
export async function fetchSubmitterSummariesDAL({ actorIds = [] }) {
  const ids = [...new Set((Array.isArray(actorIds) ? actorIds : []).filter(Boolean))];
  if (!ids.length) return {};

  try {
    const { rows } = await hydrateAndReturnSummaries({ actorIds: ids });
    const map = {};
    for (const row of rows ?? []) {
      const actorId = row?.actorId ?? row?.actor_id ?? row?.id ?? null;
      if (!actorId) continue;
      map[actorId] = {
        displayName:
          row?.displayName ?? row?.display_name ?? row?.name ?? row?.username ?? null,
        avatar:
          row?.avatar ?? row?.photo_url ?? row?.avatar_url ?? row?.vport_avatar_url ?? "/avatar.jpg",
      };
    }
    return map;
  } catch {
    return {};
  }
}
