import { dalCountVportSubscribers } from "@/features/profiles/kinds/vport/dal/subscribersCount.dal";
import { dalListVportSubscribers } from "@/features/profiles/kinds/vport/dal/subscribersList.dal";
import { dalCanViewActorSignal } from "@/features/social/adapters/privacy/actorSignalVisibility.adapter";

export async function getSubscribersController({ actorId, viewerActorId, limit = 50, offset = 0 }) {
  if (!actorId) {
    return {
      count: 0,
      rows: [],
    };
  }

  const viewer = viewerActorId ?? null;

  const [count, rows, canViewCount, canViewList] = await Promise.all([
    dalCountVportSubscribers(actorId),
    dalListVportSubscribers({ actorId, limit, offset }),
    dalCanViewActorSignal({ targetActorId: actorId, viewerActorId: viewer, signal: 'follower_count' }),
    dalCanViewActorSignal({ targetActorId: actorId, viewerActorId: viewer, signal: 'follower_list' }),
  ]);

  const restricted = !canViewCount || !canViewList;

  return {
    count: canViewCount ? (count ?? 0) : null,
    rows: canViewList ? (Array.isArray(rows) ? rows : []) : [],
    ...(restricted && { visibility: 'restricted' }),
  };
}
