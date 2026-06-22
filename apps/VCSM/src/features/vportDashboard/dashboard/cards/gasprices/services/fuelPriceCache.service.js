import { invalidateFuelPriceCache } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal";
import { invalidatePendingSubmissionsCache } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal";
import { invalidateSettingsCache } from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal";

export const FuelPriceCacheService = {
  invalidateOfficialPrices(actorId) {
    invalidateFuelPriceCache(actorId);
  },

  invalidatePendingSubmissions(actorId) {
    invalidatePendingSubmissionsCache(actorId);
  },

  invalidateSettings(actorId) {
    invalidateSettingsCache(actorId);
  },

  invalidateAll(actorId) {
    invalidateFuelPriceCache(actorId);
    invalidatePendingSubmissionsCache(actorId);
    invalidateSettingsCache(actorId);
  },
};
