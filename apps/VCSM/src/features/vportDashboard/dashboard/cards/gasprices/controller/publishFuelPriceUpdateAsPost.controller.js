import {
  hasRecentFuelPricePostDAL,
  resolveVportStationNameDAL,
} from "@/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPricePost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";
import { checkVportOwnershipController } from "@/features/vportDashboard/controller/checkVportOwnership.controller";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

const DEDUP_WINDOW_MS = 60 * 60 * 1000;

const FUEL_LABELS = {
  regular: "Regular",
  midgrade: "Mid-Grade",
  premium: "Premium",
  diesel: "Diesel",
  e85: "E85",
  kerosene: "Kerosene",
};

function fuelLabel(fuelKey) {
  if (FUEL_LABELS[fuelKey]) return FUEL_LABELS[fuelKey];
  const s = String(fuelKey);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildPostText({ stationName, updatedFuels }) {
  const name = stationName ?? "this station";
  const stationUnit = updatedFuels[0]?.unit ?? "liter";
  const lines = updatedFuels.map(
    ({ fuelKey, price, currencyCode, unit }) =>
      `${fuelLabel(fuelKey)}: ${currencyCode ?? "USD"} ${Number(price).toFixed(2)} / ${unit ?? stationUnit}`
  );
  return `Fuel prices updated at ${name}\n\nunit:${stationUnit}\n${lines.join("\n")}`;
}

export async function publishFuelPriceUpdateAsPostController({ actorId, updatedFuels }) {
  try {
    if (!actorId) throw new Error("publishFuelPriceUpdateAsPost: actorId required");

    if (!Array.isArray(updatedFuels) || updatedFuels.length === 0) {
      return { published: false, status: "skipped", reason: "no_fuels" };
    }

    const realmId = PUBLIC_REALM_ID;
    if (!realmId) return { published: false, status: "skipped", reason: "missing_public_realm" };

    // ✅ SECURITY (F-002): verify actorId is a legitimate VPORT owner via actor_owners.
    const isValidVport = await checkVportOwnershipController({
      callerActorId: actorId,
      targetActorId: actorId,
    });
    if (!isValidVport) return { published: false, status: "failed", reason: "not_owner" };

    // ✅ INPUT VALIDATION (F-010): filter to entries with a known fuelKey and a
    // finite non-negative price.
    const validFuels = updatedFuels.filter(({ fuelKey, price }) => {
      const p = Number(price);
      return FUEL_LABELS[fuelKey] !== undefined && Number.isFinite(p) && p >= 0;
    });
    if (validFuels.length === 0) {
      return { published: false, status: "skipped", reason: "no_valid_fuels" };
    }

    const recent = await hasRecentFuelPricePostDAL({ actorId, windowMs: DEDUP_WINDOW_MS });
    if (recent) return { published: false, status: "skipped", reason: "throttled" };

    const stationName = await resolveVportStationNameDAL(actorId);
    const stationUnit = validFuels[0]?.unit ?? "liter";
    const text = buildPostText({ stationName, updatedFuels: validFuels });

    const created = await createSystemPost({
      actorId,
      text,
      post_type: "fuel_price_update",
      realm_id: realmId,
      payload: {
        stationUnit,
        fuels: validFuels.map(({ fuelKey, price, currencyCode, unit }) => ({
          fuelKey,
          price,
          currencyCode: currencyCode ?? "USD",
          unit: unit ?? stationUnit,
        })),
      },
    });

    return { published: true, status: "published", postId: created?.id ?? null };
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'gasprices.publishFuelPriceUpdateAsPost.controller', severity: 'error', message: `publishFuelPriceUpdateAsPostController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'publishFuelPriceUpdateAsPost', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
