import { dalCountSubscribers } from "@/features/profiles/kinds/vport/dal/subscribersCount.dal";
import { dalListSubscribers } from "@/features/profiles/kinds/vport/dal/subscribersList.dal";

export async function getSubscribersController({ actorId, limit = 50, offset = 0 }) {
  if (!actorId) {
    return {
      count: 0,
      rows: [],
    };
  }

  const [count, rows] = await Promise.all([
    dalCountSubscribers(actorId),
    dalListSubscribers({ actorId, limit, offset }),
  ]);

  return {
    count: count ?? 0,
    rows: Array.isArray(rows) ? rows : [],
  };
}
