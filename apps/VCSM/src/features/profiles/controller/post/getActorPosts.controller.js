// [SHARED_ACTOR_PRIMITIVE] — serves both citizen and vport actor kinds
import { fetchPostsForActorDAL } from "@/features/profiles/dal/post/fetchPostsForActor.dal";
import { buildCanonicalProfilePostModel as PostModel } from "@/features/profiles/model/postCanonical.model";
import { hydrateActorsFromRows } from "@/state/actors/hydrateActors";
import { useActorStore } from "@/state/actors/actorStore";

const STORE_TTL_MS = 5 * 60 * 1000;

function makeActorRoute({ kind, username, actorId, vportId }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport" && vportId) return `/vport/${vportId}`;
  if (actorId) return `/profile/${actorId}`;
  return "/CentralFeed";
}

function buildAuthorActorEntryFromStore(actorId) {
  const stored = useActorStore.getState().actors?.[actorId];
  if (!stored?._hydratedAt || Date.now() - stored._hydratedAt > STORE_TTL_MS) return null;

  const kind = stored.kind ?? null;
  if (!kind) return null;

  const username =
    kind === "vport"
      ? (stored.vportSlug ?? stored.username ?? null)
      : (stored.username ?? null);
  const displayName =
    kind === "vport"
      ? (stored.vportName ?? stored.displayName ?? null)
      : (stored.displayName ?? null);
  const photoUrl =
    kind === "vport"
      ? (stored.vportAvatarUrl ?? stored.photoUrl ?? "/avatar.jpg")
      : (stored.photoUrl ?? "/avatar.jpg");

  return {
    actor_id: actorId,
    kind,
    display_name: displayName,
    username,
    photo_url: photoUrl,
    banner_url: stored.bannerUrl ?? null,
    bio: stored.bio ?? null,
    route: makeActorRoute({ kind, username, actorId, vportId: kind === "vport" ? actorId : null }),
  };
}

export async function getActorPostsController({ actorId, page, pageSize }) {
  if (!actorId) {
    throw new Error("actorId required");
  }

  const offset = page * pageSize;

  const { data, error } = await fetchPostsForActorDAL({
    actorId,
    limit: pageSize,
    offset,
    cachedAuthorActorEntry: buildAuthorActorEntryFromStore(actorId),
  });

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return { posts: [], done: true };
  }

  await hydrateActorsFromRows(data);

  const actorState = useActorStore.getState();
  const storeActors = actorState?.actors || {};
  const getStoredActor = actorState?.getActorById;

  const lookupActor = (id) => {
    if (!id) return null;
    if (typeof getStoredActor === "function") return getStoredActor(id) ?? null;
    return storeActors[id] ?? null;
  };

  const posts = data.map((row) => {
    const model = PostModel(row);
    const hydratedActor = lookupActor(model?.actorId);

    return {
      ...model,
      actor: hydratedActor ?? model.actor ?? null,
    };
  });

  const done = data.length < pageSize;
  return { posts, done };
}
