import { updateFuelPriceUnitForActorDAL } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal";
import { invalidateFuelPriceCache } from "@/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal";
import { checkVportOwnershipController } from "@/features/profiles/adapters/kinds/vport/ownership.adapter";

const ALLOWED_UNITS = ["liter", "gallon"];

export async function updateStationFuelUnitController({ actorId, targetActorId, unit }) {
  if (!actorId || !targetActorId) return { ok: false, reason: "missing_actor" };

  // ✅ SECURITY: verify ownership via actor_owners — not string comparison.
  const isOwner = await checkVportOwnershipController({ callerActorId: actorId, targetActorId });
  if (!isOwner) return { ok: false, reason: "not_owner" };
  if (!ALLOWED_UNITS.includes(unit)) return { ok: false, reason: "invalid_unit" };

  const { error } = await updateFuelPriceUnitForActorDAL({ actorId: targetActorId, unit });
  if (error) return { ok: false, reason: error.message };

  invalidateFuelPriceCache(targetActorId);
  return { ok: true, unit };
}
