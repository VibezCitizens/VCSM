// src/features/profiles/controller/getVportType.controller.js

import { readVportTypeDAL } from "@/features/profiles/dal/readVportType.dal";
import { toVportType } from "@/features/profiles/model/VportTypeModel";

/**
 * Returns null for non-vport actors.
 *
 * Returns:
 * {
 *   type: "barber" | "restaurant" | "generic"
 * }
 *
 * NOTE:
 * - vportId must NOT be exposed upward (locked identity rule).
 * - If something needs vportId, it must be resolved internally in the controller that performs that use-case.
 */
export async function getVportTypeController(actorId) {
  if (!actorId) return null;

  const row = await readVportTypeDAL(actorId);

  if (!row || row.kind !== "vport") return null;

  return {
    type: toVportType(row),
  };
}