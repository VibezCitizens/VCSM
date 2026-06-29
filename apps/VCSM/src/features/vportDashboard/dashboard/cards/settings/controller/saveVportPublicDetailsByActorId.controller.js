import { readVportProfileByActorIdDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import { upsertVportPublicDetailsDAL } from "@/features/vportDashboard/dashboard/cards/settings/dal/vportPublicDetails.write.dal";
import { resolveVportCity } from "@/features/vportDashboard/dal/read/vportCities.read.dal";
import { assertSessionOwnsActorController } from "@/features/authorization/adapters/authorization.adapter";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

// VPORT-DASHBOARD-OWNERSHIP-CONSISTENCY-001: authorize the active VPORT actor through
// the same vportDashboard ownership surface the gas dashboard uses, so the active
// VPORT-kind actor can self-manage and the error wording is VPORT-safe.
const OWNERSHIP_DENIED_MESSAGE = "Only owners or managers can manage this VPORT.";

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
  try {
    if (!actorId) throw new Error("saveVportPublicDetailsByActorId: actorId required");
    if (!requestActorId) throw new Error("saveVportPublicDetailsByActorId: requestActorId required");

    // Ownership check (V03A-H2): session-derived ownership of the target vport actor
    // before any read or write (replaces the self-grantable checkVportOwnership write gate).
    try {
      await assertSessionOwnsActorController({ targetActorId: actorId });
    } catch {
      throw new Error(OWNERSHIP_DENIED_MESSAGE);
    }

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
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'settings.saveVportPublicDetailsByActorId.controller', severity: 'error', message: `saveVportPublicDetailsByActorIdController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'saveVportPublicDetailsByActorId', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
