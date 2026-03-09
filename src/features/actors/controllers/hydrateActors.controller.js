import { useActorStore } from "@/state/actors/actorStore";
import { getActorSummariesByIdsDAL } from "@/features/actors/dal/getActorSummariesByIds.dal";
import { extractActorIdsForHydration } from "@/features/actors/model/extractActorIdsForHydration.model";

export async function hydrateActorsFromRows(rows) {
  const actorIds = extractActorIdsForHydration(rows);
  if (!actorIds.length) return;

  const { rows: actorSummaries, error } = await getActorSummariesByIdsDAL({
    actorIds,
  });

  if (error || !actorSummaries.length) return;

  const normalized = actorSummaries.map((row) => ({
    ...row,
    id: row.actor_id,
  }));

  if (normalized.length) {
    useActorStore.getState().upsertActors(normalized);
  }
}
