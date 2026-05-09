import {
  readIntakeLeads,
  readIntakeLead,
  readCities,
  readServices,
  readTrazeProvider,
  readClaimRequests,
} from "@/features/dashboard/traze/dal/trazeIntake.read.dal";
import {
  insertIntakeLead,
  patchIntakeStatus,
  insertProvider,
  insertProviderService,
  patchClaimStatus,
} from "@/features/dashboard/traze/dal/trazeIntake.write.dal";
import {
  mapIntakeLeadRow,
  mapTrazeProviderRow,
  mapClaimRequestRow,
} from "@/features/dashboard/traze/model/intakeLead.model";

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function buildLookupMaps() {
  const [cities, services] = await Promise.all([
    readCities().catch(() => []),
    readServices().catch(() => []),
  ]);
  return {
    cities,
    services,
    cityMap:    new Map(cities.map((c) => [c.id, c])),
    serviceMap: new Map(services.map((s) => [s.id, s])),
  };
}

export async function loadIntakeQueue() {
  const [rows, maps] = await Promise.all([readIntakeLeads(), buildLookupMaps()]);
  return rows.map((row) => mapIntakeLeadRow(row, maps));
}

export async function loadCityOptions() {
  return readCities().catch(() => []);
}

export async function loadServiceOptions() {
  return readServices().catch(() => []);
}

export async function saveDraftIntakeLead(fields) {
  const slug = fields.slug || toSlug(fields.business_name);
  return insertIntakeLead({ ...fields, slug, status: "draft" });
}

export async function approveIntakeLead(leadId) {
  await patchIntakeStatus(leadId, "approved");
}

export async function rejectIntakeLead(leadId) {
  await patchIntakeStatus(leadId, "rejected");
}

export async function convertLeadToProvider(leadId, { isIndexable = true } = {}) {
  const raw  = await readIntakeLead(leadId);
  const lead = mapIntakeLeadRow(raw);

  const slug = lead.slug || toSlug(lead.businessName);

  const providerFields = {
    slug,
    display_name:            lead.businessName,
    business_type:           lead.businessType     || null,
    short_bio:               lead.description      || null,
    primary_city_id:         lead.cityId           || null,
    primary_neighborhood_id: lead.neighborhoodId   || null,
    primary_service_id:      lead.serviceId        || null,
    phone:                   lead.phone            || null,
    email:                   lead.email            || null,
    website_url:             lead.websiteUrl        || null,
    address_text:            lead.addressText      || null,
    lat:                     lead.lat              || null,
    lng:                     lead.lng              || null,
    hours:                   lead.hours            || null,
    avatar_url:              lead.avatarUrl        || null,
    banner_url:              lead.bannerUrl        || null,
    logo_url:                lead.logoUrl          || null,
    google_maps_url:         lead.googleMapsUrl    || null,
    instagram_url:           lead.instagramUrl     || null,
    facebook_url:            lead.facebookUrl      || null,
    claim_status:            "unclaimed",
    is_active:               true,
    is_indexable:            Boolean(isIndexable),
    source_provider_id:      leadId,               // text column
  };

  const providerRow = await insertProvider(providerFields);

  if (lead.serviceId) {
    await insertProviderService({
      provider_id:   providerRow.id,
      service_id:    lead.serviceId,
      is_active:     true,
      currency_code: "USD",
    });
  }

  await patchIntakeStatus(leadId, "imported", { imported_provider_id: providerRow.id });
  return mapTrazeProviderRow(providerRow);
}

export async function loadTrazeProvider(id) {
  const row = await readTrazeProvider(id);
  return mapTrazeProviderRow(row);
}

export async function loadClaimQueue() {
  const rows = await readClaimRequests();
  return rows.map(mapClaimRequestRow);
}

export async function approveClaimRequest(id) {
  await patchClaimStatus(id, "approved");
}

export async function rejectClaimRequest(id) {
  await patchClaimStatus(id, "rejected");
}

export async function flagClaimForReview(id) {
  await patchClaimStatus(id, "needs_review");
}
