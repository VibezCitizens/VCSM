import { dalCountSubscribers } from "@/features/social/friend/subscribe/dal/subscriberCount.dal";

export async function ctrlGetFollowerCount({ actorId }) {
  if (!actorId) return 0;
  return dalCountSubscribers({ actorId });
}
