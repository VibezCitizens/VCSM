import { fetchVportPublicDetailsByActorId } from "@/features/profiles/dal/vportPublicDetails.read.dal";
import { upsertVportPublicDetails } from "@/features/settings/profile/dal/vportPublicDetails.write.dal";

export async function saveVportPublicDetailsByActorId(actorId, payload) {
  if (!actorId) throw new Error("saveVportPublicDetailsByActorId: actorId required");

  const details = await fetchVportPublicDetailsByActorId(actorId);
  const vportId = details?.vport_id ?? null;
  if (!vportId) throw new Error("Failed to save VPORT details.");

  return upsertVportPublicDetails(vportId, payload || {});
}

export function mapPublicDetailsToDraft(details) {
  const src = details || {};
  return {
    locationText: src.location_text ?? src.locationText ?? "",
    websiteUrl: src.website_url ?? src.websiteUrl ?? "",
    bookingUrl: src.booking_url ?? src.bookingUrl ?? "",
    emailPublic: src.email_public ?? src.emailPublic ?? "",
    phonePublic: src.phone_public ?? src.phonePublic ?? "",
    address: src.address ?? {},
    hours: src.hours ?? {},
    highlights: Array.isArray(src.highlights) ? src.highlights : [],
    languages: Array.isArray(src.languages) ? src.languages : [],
    paymentMethods: Array.isArray(src.payment_methods)
      ? src.payment_methods
      : Array.isArray(src.paymentMethods)
      ? src.paymentMethods
      : [],
  };
}
