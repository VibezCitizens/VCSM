import { fetchPostsForActorDAL } from "../dal/fetchPostsForActor.dal";
import { PostModel } from "../models/post.model";
import { hydrateActorsFromRows } from "@/features/actors/controllers/hydrateActors.controller";
import { useActorStore } from "@/state/actors/actorStore";

/**
 * Controller — getActorPostsController
 * ------------------------------------------------------------
 * Owns:
 *  - Actor invariant enforcement
 *  - Pagination semantics
 *  - Actor hydration orchestration
 *  - Domain-safe return shape
 * ------------------------------------------------------------
 */
export async function getActorPostsController({ actorId, page, pageSize }) {
  console.log("[getActorPostsController] start", { actorId, page, pageSize });

  if (!actorId) {
    console.error("[getActorPostsController] ❌ actorId missing");
    throw new Error("actorId required");
  }

  const offset = page * pageSize;

  console.log("[getActorPostsController] pagination", { page, pageSize, offset });

  const { data, error } = await fetchPostsForActorDAL({
    actorId,
    limit: pageSize,
    offset,
  });

  if (error) {
    console.error("[getActorPostsController] ❌ DAL error", error);
    throw error;
  }

  console.log("[getActorPostsController] DAL returned rows:", data?.length, data);

  if (!Array.isArray(data)) {
    console.error("[getActorPostsController] ❌ data is not an array", data);
    return { posts: [], done: true };
  }

  // ------------------------------------------------------------
  // DEBUG — verify actor id shape BEFORE hydration
  // ------------------------------------------------------------
  const actorIdSample = data.map((r) => ({
    actor_id: r.actor_id,
    actorId: r.actorId,
  }));

  console.log(
    "[getActorPostsController] actor id sample (snake vs camel):",
    actorIdSample
  );

  // ------------------------------------------------------------
  // HYDRATE ACTORS (writes into useActorStore)
  // ------------------------------------------------------------
  console.log("[getActorPostsController] hydrateActorsFromRows → start");
  await hydrateActorsFromRows(data);
  console.log("[getActorPostsController] hydrateActorsFromRows → done");

  // ------------------------------------------------------------
  // READ BACK hydrated actors from store -> build quick lookup map
  // ------------------------------------------------------------
  const actorState = useActorStore.getState();
  const storeActors = actorState?.actors || {};
  const getStoredActor = actorState?.getActorById;

  const lookupActor = (id) => {
    if (!id) return null;

    // if your store exposes a selector, prefer it
    if (typeof getStoredActor === "function") return getStoredActor(id) ?? null;

    // otherwise, assume actors is a map keyed by actor_id
    return storeActors[id] ?? null;
  };

  // ------------------------------------------------------------
  // MODEL MAPPING + ATTACH actor object
  // ------------------------------------------------------------
  const posts = data.map((row) => {
    const model = PostModel(row);

    const hydratedActor = lookupActor(model?.actorId);

    if (!model?.actorId) {
      console.warn(
        "[getActorPostsController] ⚠️ PostModel missing actorId",
        row,
        model
      );
    }

    if (!hydratedActor) {
      console.warn(
        "[getActorPostsController] ⚠️ actor not hydrated/available",
        { actorId: model?.actorId, row }
      );
    }

    return {
      ...model,
      // ✅ IMPORTANT: give PostCardView what it needs
      actor: hydratedActor ?? model.actor ?? null,
    };
  });

  console.log("[getActorPostsController] mapped posts (with actor):", posts.length, posts);

  const done = data.length < pageSize;

  console.log("[getActorPostsController] done flag:", done);

  return { posts, done };
}
