import { fetchPostsForActorDAL } from "@/features/profiles/dal/post/fetchPostsForActor.dal";
import { PostModel } from "@/features/profiles/screens/views/tabs/post/models/post.model";
import { hydrateActorsFromRows } from "@/features/actors/adapters/controllers/hydrateActors.controller.adapter";
import { useActorStore } from "@/state/actors/actorStore";

export async function getActorPostsController({ actorId, page, pageSize }) {
  if (!actorId) {
    throw new Error("actorId required");
  }

  const offset = page * pageSize;

  const { data, error } = await fetchPostsForActorDAL({
    actorId,
    limit: pageSize,
    offset,
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
