import { fetchVportStationPriceSettingsDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal";
import { upsertVportFuelPriceDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal";
import { createVportFuelPriceHistoryDAL } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceHistory.write.dal";
import { mapVportFuelPriceRow } from "@/features/vportDashboard/dashboard/cards/gasprices/model/vportFuelPrice.model";
import { mapVportStationPriceSettingsRow } from "@/features/vportDashboard/dashboard/cards/gasprices/model/vportStationPriceSettings.model";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { FuelPriceCacheService } from "@/features/vportDashboard/dashboard/cards/gasprices/services/fuelPriceCache.service";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

export async function submitOwnerFuelPriceUpdateController({
  targetActorId,
  actorId,
  fuelKey,
  proposedPrice,
  currencyCode = "USD",
  unit = "liter",
  isAvailable = true,
  source = "manual",
}) {
  try {
    const { data: settingsRow, error: settingsErr } =
      await fetchVportStationPriceSettingsDAL({ targetActorId });
    if (settingsErr) throw settingsErr;

    const settings = mapVportStationPriceSettingsRow(settingsRow);
    const price = Number(proposedPrice);
    if (!Number.isFinite(price)) return { ok: false, reason: "invalid_number" };

    // V03A-H2: session-derived ownership via actor_owners (replaces the self-grantable checkVportOwnership write gate).
    try {
      await assertSessionOwnsActorController({ targetActorId });
    } catch {
      return { ok: false, reason: "not_owner" };
    }

    if (settings.requireSanityForSuggestion && (price < settings.minPrice || price > settings.maxPrice)) {
      return { ok: false, reason: "out_of_range" };
    }

    const { data: row, error } = await upsertVportFuelPriceDAL({
      targetActorId,
      fuelKey,
      price,
      currencyCode,
      unit,
      updatedByActorId: actorId,
      source,
      isAvailable,
    });
    if (error) throw error;

    const { error: histErr } = await createVportFuelPriceHistoryDAL({
      targetActorId,
      fuelKey,
      price,
      currencyCode,
      unit,
      actorId,
      source,
      isAvailable,
    });
    if (histErr) throw histErr;

    FuelPriceCacheService.invalidateOfficialPrices(targetActorId);

    return { ok: true, official: mapVportFuelPriceRow(row) };
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'gasprices.submitOwnerFuelPriceUpdate.controller', severity: 'error', message: `submitOwnerFuelPriceUpdateController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'submitOwnerFuelPriceUpdate', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
