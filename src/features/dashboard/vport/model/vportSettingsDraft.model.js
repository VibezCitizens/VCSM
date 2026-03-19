import { normalizeDashboardVportDetails } from "@/features/dashboard/vport/model/dashboardVportDetails.model";

export function mapPublicDetailsToDraft(details) {
  const src = normalizeDashboardVportDetails(details);

  return {
    locationText: src.locationText,
    websiteUrl: src.websiteUrl,
    bookingUrl: src.bookingUrl,
    emailPublic: src.emailPublic,
    phonePublic: src.phonePublic,
    address: src.address,
    hours: src.hours,
    highlights: src.highlights,
    languages: src.languages,
    paymentMethods: src.paymentMethods,
  };
}
