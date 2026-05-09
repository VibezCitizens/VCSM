function text(value) {
  return String(value ?? "").trim();
}

function slugify(value) {
  return text(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function lowerStatus(value) {
  return text(value).toLowerCase() || "draft";
}

function hasContact(seed) {
  return Boolean(seed.phone || seed.websiteUrl || seed.googleMapsUrl);
}

export function toSeedSlug(value) {
  return slugify(value);
}

export function mapSeedIntakeRow(row) {
  const cityName = text(row.city_name);
  const neighborhoodName = text(row.neighborhood_name);

  return {
    id: text(row.id),
    businessName: text(row.business_name) || "Unnamed seed",
    slug: text(row.slug) || slugify(row.business_name),
    businessType: text(row.business_type),
    description: text(row.description),
    serviceId: text(row.service_id),
    cityId: text(row.city_id),
    neighborhoodId: text(row.neighborhood_id),
    countryCode: text(row.country_code).toUpperCase(),
    stateCode: text(row.state_code).toUpperCase(),
    cityName,
    citySlug: text(row.city_slug) || slugify(cityName),
    zipCode: text(row.zip_code),
    neighborhoodName,
    neighborhoodSlug: text(row.neighborhood_slug) || slugify(neighborhoodName),
    addressText: text(row.address_text),
    lat: row.lat ?? "",
    lng: row.lng ?? "",
    phone: text(row.phone),
    email: text(row.email),
    websiteUrl: text(row.website_url),
    googleMapsUrl: text(row.google_maps_url),
    instagramUrl: text(row.instagram_url),
    facebookUrl: text(row.facebook_url),
    hours: row.hours ?? null,
    source: text(row.source) || "manual_dashboard",
    sourceUrl: text(row.source_url),
    notes: text(row.notes),
    status: lowerStatus(row.status),
    importedProviderId: row.imported_provider_id ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function buildSeedHealth(seeds) {
  const total = seeds.length;

  return {
    total,
    needsReview: seeds.filter((seed) => ["draft", "needs_review", "pending", "review"].includes(seed.status)).length,
    imported: seeds.filter((seed) => seed.status === "imported" || seed.importedProviderId).length,
    missingNeighborhood: seeds.filter((seed) => !seed.neighborhoodName && !seed.neighborhoodId).length,
    missingService: seeds.filter((seed) => !seed.businessType && !seed.serviceId).length,
    missingCity: seeds.filter((seed) => !seed.cityName && !seed.cityId).length,
    missingContact: seeds.filter((seed) => !hasContact(seed)).length,
  };
}

export const EXAMPLE_SEED_MAPPING = {
  country_code: "MX",
  state_code: "MEX",
  city_name: "Tecámac",
  city_slug: "tecamac",
  zip_code: "55740",
  neighborhood_name: "San Nicolás la Redonda",
  neighborhood_slug: "san-nicolas-la-redonda",
  address_text: "Carr. México - Pachuca Km 40.8",
};
