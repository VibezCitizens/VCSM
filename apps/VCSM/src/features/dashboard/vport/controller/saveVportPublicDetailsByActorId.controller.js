import { readVportProfileByActorIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { upsertVportPublicDetailsDAL } from "@/features/dashboard/vport/dal/write/vportPublicDetails.write.dal";
import { resolveVportCity } from "@/features/dashboard/vport/dal/read/vportCities.read.dal";
import assertActorOwnsVportActorController from "@/features/booking/controller/assertActorOwnsVportActor.controller";

function safeObj(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function safeArr(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value].filter(Boolean);
}

function mapPayloadToRow(profileId, payload) {
  const p = payload || {};
  const address = safeObj(p.address);
  const cityPart = String(address.city || "").trim();
  const statePart = String(address.state || "").trim();
  const autoLocationText = [cityPart, statePart].filter(Boolean).join(", ");

  return {
    profile_id: profileId,
    website_url: (p.website_url ?? p.websiteUrl ?? "") || "",
    booking_url: (p.booking_url ?? p.bookingUrl ?? "") || "",
    email_public: (p.email_public ?? p.emailPublic ?? "") || "",
    phone_public: (p.phone_public ?? p.phonePublic ?? "") || "",
    location_text: autoLocationText,
    address,
    hours: safeObj(p.hours),
    highlights: safeArr(p.highlights),
    languages: safeArr(p.languages),
    payment_methods: safeArr(p.payment_methods ?? p.paymentMethods),
    social_links: safeObj(p.social_links ?? p.socialLinks),
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    price_tier: p.price_tier ?? p.priceTier ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function saveVportPublicDetailsByActorIdController(actorId, payload, { requestActorId, invalidateVportPublicDetails } = {}) {
  if (!actorId) throw new Error("saveVportPublicDetailsByActorId: actorId required");
  if (!requestActorId) throw new Error("saveVportPublicDetailsByActorId: requestActorId required");

  // Ownership check: verify the caller owns the target vport actor before any read or write.
  await assertActorOwnsVportActorController({
    requestActorId,
    targetActorId: actorId,
  });

  const vportProfile = await readVportProfileByActorIdDAL({ actorId });
  const profileId = vportProfile?.id ?? null;
  if (!profileId) throw new Error("Failed to save VPORT details.");

  const row = mapPayloadToRow(profileId, payload);

  const address = row.address;
  const cityRow = await resolveVportCity(address.city, address.state, address.country).catch((e) => {
    if (import.meta.env?.DEV) console.warn("[resolveVportCity] failed:", e?.message);
    return null;
  });
  row.city_id = cityRow?.id ?? null;

  const result = await upsertVportPublicDetailsDAL({ row });

  invalidateVportPublicDetails?.(actorId);

  return {
    ...(result || {}),
    cityId: result?.city_id ?? null,
    cityResolved: !!cityRow,
  };
}
