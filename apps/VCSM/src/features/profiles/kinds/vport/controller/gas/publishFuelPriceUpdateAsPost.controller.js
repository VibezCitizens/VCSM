import {
  hasRecentFuelPricePostDAL,
  resolveVportStationNameDAL,
} from "@/features/profiles/kinds/vport/dal/gas/vportFuelPricePost.read.dal";
import { createSystemPost } from "@/features/upload/adapters/posts.adapter";
import { resolvePublicRealmIdDAL } from "@/features/feed/dal/resolvePublicRealm.dal";

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

  const realmId = await resolvePublicRealmIdDAL();
  if (!realmId) return { published: false, reason: "missing_public_realm" };

  const recent = await hasRecentFuelPricePostDAL({ actorId, windowMs: DEDUP_WINDOW_MS });
  if (recent) return { published: false, reason: "throttled" };

  const stationName = await resolveVportStationNameDAL(actorId);
  const text = buildPostText({ stationName, updatedFuels });

  const created = await createSystemPost({
    actorId,
    text,
    post_type: "fuel_price_update",
    realm_id: realmId,
  });

  return { published: true, postId: created?.id ?? null };
}
