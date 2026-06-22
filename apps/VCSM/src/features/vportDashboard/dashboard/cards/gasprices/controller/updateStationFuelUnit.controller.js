import { updateFuelPriceUnitForActorDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal";
import { checkVportOwnershipController } from "@/features/vportDashboard/controller/checkVportOwnership.controller";
import { FuelPriceCacheService } from "@/features/vportDashboard/dashboard/cards/gasprices/services/fuelPriceCache.service";

const ALLOWED_UNITS = ["liter", "gallon"];

export async function updateStationFuelUnitController({ actorId, targetActorId, unit }) {
  if (!actorId || !targetActorId) return { ok: false, reason: "missing_actor" };

  // ✅ SECURITY: verify ownership via actor_owners — not string comparison.
  const isOwner = await checkVportOwnershipController({ callerActorId: actorId, targetActorId });
  if (!isOwner) return { ok: false, reason: "not_owner" };
  if (!ALLOWED_UNITS.includes(unit)) return { ok: false, reason: "invalid_unit" };

  const { error } = await updateFuelPriceUnitForActorDAL({ actorId: targetActorId, unit });
  if (error) return { ok: false, reason: error.message };

  FuelPriceCacheService.invalidateOfficialPrices(targetActorId);
  return { ok: true, unit };
}
