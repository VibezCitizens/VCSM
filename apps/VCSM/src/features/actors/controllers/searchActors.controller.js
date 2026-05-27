import { searchActorsDAL } from "@/features/actors/dal/searchActors.dal";
import { mapSearchActorsRows } from "@/features/actors/model/searchActors.model";

export async function searchActors({ query, limit = 12, viewerActorId = null } = {}) {
  const rows = await searchActorsDAL({ query, limit, viewerActorId });
  return mapSearchActorsRows(rows);
}
