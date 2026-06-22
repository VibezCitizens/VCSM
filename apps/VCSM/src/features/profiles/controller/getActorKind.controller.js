// src/features/profiles/controller/getActorKind.controller.js
// [SHARED_ACTOR_PRIMITIVE] — serves both citizen and vport actor kinds

import { readActorKindDAL } from "@/features/profiles/dal/readActorKind.dal";

export async function getActorKindController(actorId) {
  const row = await readActorKindDAL(actorId);
  return row?.kind ?? null;
}
