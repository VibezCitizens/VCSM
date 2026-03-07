import {
  readProfileAdultFlagDAL,
  readViewerActorIdentityDAL,
} from "@/features/feed/dal/feed.read.viewerContext.dal";

export async function getFeedViewerIsAdult({ viewerActorId }) {
  if (!viewerActorId) return null;

  try {
    const actor = await readViewerActorIdentityDAL({ actorId: viewerActorId });

    if (actor?.vport_id) return true;
    if (!actor?.profile_id) return null;

    const profile = await readProfileAdultFlagDAL({ profileId: actor.profile_id });
    return profile?.is_adult ?? null;
  } catch {
    return null;
  }
}
