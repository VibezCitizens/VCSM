import {
  hasRecentFuelPricePostDAL,
  resolveVportStationNameDAL,
} from "@/features/profiles/kinds/vport/dal/gas/vportFuelPricePost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { PUBLIC_REALM_ID } from "@/shared/utils/resolveRealm";
import { checkVportOwnershipController } from "@/features/profiles/adapters/kinds/vport/ownership.adapter";

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
  const lines = updatedFuels.map(
    ({ fuelKey, price, currencyCode, unit }) =>
      `${fuelLabel(fuelKey)}: ${currencyCode ?? "USD"} ${Number(price).toFixed(2)} / ${unit ?? "liter"}`
  );
  return `Fuel prices updated at ${name}\n\n${lines.join("\n")}`;
}

export async function publishFuelPriceUpdateAsPostController({ actorId, updatedFuels }) {
  if (!actorId) throw new Error("publishFuelPriceUpdateAsPost: actorId required");

  if (!Array.isArray(updatedFuels) || updatedFuels.length === 0) {
    return { published: false, reason: "no_fuels" };
  }

  const realmId = PUBLIC_REALM_ID;
  if (!realmId) return { published: false, reason: "missing_public_realm" };

  // ✅ SECURITY (F-002): verify actorId is a legitimate VPORT owner via actor_owners.
  // createSystemPost accepts actorId from caller without ownership verification —
  // this gate ensures only verified VPORT owners can post on behalf of their station.
  const isValidVport = await checkVportOwnershipController({
    callerActorId: actorId,
    targetActorId: actorId,
  });
  if (!isValidVport) return { published: false, reason: "not_owner" };

  // ✅ INPUT VALIDATION (F-010): filter to entries with a known fuelKey and a
  // finite non-negative price. Caller-supplied fuelKey strings and prices must
  // not reach buildPostText or the public feed unvalidated.
  const validFuels = updatedFuels.filter(({ fuelKey, price }) => {
    const p = Number(price);
    return FUEL_LABELS[fuelKey] !== undefined && Number.isFinite(p) && p >= 0;
  });
  if (validFuels.length === 0) return { published: false, reason: "no_valid_fuels" };

  const recent = await hasRecentFuelPricePostDAL({ actorId, windowMs: DEDUP_WINDOW_MS });
  if (recent) return { published: false, reason: "throttled" };

  const stationName = await resolveVportStationNameDAL(actorId);
  const text = buildPostText({ stationName, updatedFuels: validFuels });

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "fuel_price_update",
    realm_id: realmId,
  });

  return { published: true, postId: created?.id ?? null };
}
