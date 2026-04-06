import { readActorVportLinkDAL } from "@/features/dashboard/vport/dal/read/actorVport.read.dal";
import { upsertVportPublicDetailsDAL } from "@/features/dashboard/vport/dal/write/vportPublicDetails.write.dal";

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

function mapPayloadToRow(vportId, payload) {
  const p = payload || {};

  return {
    vport_id: vportId,
    website_url: (p.website_url ?? p.websiteUrl ?? "") || "",
    booking_url: (p.booking_url ?? p.bookingUrl ?? "") || "",
    email_public: (p.email_public ?? p.emailPublic ?? "") || "",
    phone_public: (p.phone_public ?? p.phonePublic ?? "") || "",
    location_text: (p.location_text ?? p.locationText ?? "") || "",
    address: safeObj(p.address),
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

export async function saveVportPublicDetailsByActorIdController(actorId, payload) {
  if (!actorId) throw new Error("saveVportPublicDetailsByActorId: actorId required");

  const actor = await readActorVportLinkDAL({ actorId });
  const vportId = actor?.vport_id ?? null;
  if (!vportId) throw new Error("Failed to save VPORT details.");

  return upsertVportPublicDetailsDAL({
    row: mapPayloadToRow(vportId, payload),
  });
}
