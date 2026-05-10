import { updateFuelPriceUnitForActorDAL } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPrices.write.dal";
import { invalidateFuelPriceCache } from "@/features/profiles/kinds/vport/dal/gas/vportFuelPrices.read.dal";

const ALLOWED_UNITS = ["liter", "gallon"];

export async function updateStationFuelUnitController({ actorId, targetActorId, unit }) {
  if (!actorId || !targetActorId) return { ok: false, reason: "missing_actor" };
  if (String(actorId) !== String(targetActorId)) return { ok: false, reason: "not_owner" };
  if (!ALLOWED_UNITS.includes(unit)) return { ok: false, reason: "invalid_unit" };

  const { error } = await updateFuelPriceUnitForActorDAL({ actorId: targetActorId, unit });
  if (error) return { ok: false, reason: error.message };

  invalidateFuelPriceCache(targetActorId);
  return { ok: true, unit };
}
