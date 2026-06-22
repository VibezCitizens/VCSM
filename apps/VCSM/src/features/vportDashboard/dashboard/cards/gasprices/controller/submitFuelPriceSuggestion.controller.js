import { getVportProfileIdByActorDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import { ALLOWED_FUEL_KEYS } from "@/features/vportDashboard/dashboard/cards/gasprices/model/gasPrices.model";
import { submitCitizenFuelPriceSuggestionController } from "@/features/vportDashboard/dashboard/cards/gasprices/controller/submitCitizenFuelPriceSuggestion.controller";
import { submitOwnerFuelPriceUpdateController } from "@/features/vportDashboard/dashboard/cards/gasprices/controller/submitOwnerFuelPriceUpdate.controller";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

export async function submitFuelPriceSuggestionController({
  targetActorId,
  fuelKey,
  proposedPrice,
  actorId,
  currencyCode = "USD",
  unit = "liter",
  ownerUpdate = false,
  isAvailable = true,
  source = "manual",
  submissionBatchId = null,
  notify = true,
}) {
  try {
    if (!targetActorId) throw new Error("targetActorId required");
    if (!fuelKey) throw new Error("fuelKey required");
    if (!ALLOWED_FUEL_KEYS.has(String(fuelKey).toLowerCase())) {
      return { ok: false, reason: "invalid_fuel_key" };
    }
    if (proposedPrice == null) throw new Error("proposedPrice required");
    if (!actorId) throw new Error("actorId required");

    const profileId = await getVportProfileIdByActorDAL({ actorId: targetActorId });
    if (!profileId) return { ok: false, reason: "profile_not_found" };

    if (ownerUpdate) {
      return submitOwnerFuelPriceUpdateController({
        targetActorId,
        fuelKey,
        proposedPrice,
        currencyCode,
        unit,
        actorId,
        source,
        isAvailable,
      });
    }

    return submitCitizenFuelPriceSuggestionController({
      targetActorId,
      fuelKey,
      proposedPrice,
      currencyCode,
      unit,
      actorId,
      submissionBatchId,
      notify,
    });
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'gasprices.submitFuelPriceSuggestion.controller', severity: 'error', message: `submitFuelPriceSuggestionController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'submitFuelPriceSuggestion', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
