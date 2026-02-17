// src/features/profiles/controller/getVportType.controller.js

import { readVportTypeDAL } from "@/features/profiles/dal/readVportType.dal";
import { toVportType } from "@/features/profiles/model/VportTypeModel";

/**
 * Returns null for non-vport actors.
 *
 * Returns:
 * {
 *   vportId: string,
 *   type: "barber" | "restaurant" | "generic"
 * }
 */
export async function getVportTypeController(actorId) {
  if (!actorId) return null;

  const row = await readVportTypeDAL(actorId);

  if (!row || row.kind !== "vport") return null;

  return {
    vportId: row.vport_id ?? null,
    type: toVportType(row),
  };
}
