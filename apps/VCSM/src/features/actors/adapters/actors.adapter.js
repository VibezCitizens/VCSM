import { searchActors } from "@/features/actors/controllers/searchActors.controller";

export function searchActorsAdapter(params) {
  return searchActors(params);
}
