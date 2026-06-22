import { normalizeDashboardVportDetails } from "@/features/vportDashboard/model/dashboardVportDetails.model";

export function mapPublicDetailsToDraft(details) {
  const src = normalizeDashboardVportDetails(details);

  return {
    cityId: src.cityId ?? null,
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
