import { supabase } from "@/services/supabase/supabaseClient";

const IMPORTED_INTAKE_COLS = [
  "id",
  "business_name",
  "business_type",
  "description",
  "city_name",
  "city_slug",
  "state_code",
  "country_code",
  "zip_code",
  "phone",
  "email",
  "website_url",
  "address_text",
  "google_maps_url",
  "instagram_url",
  "facebook_url",
  "avatar_url",
  "banner_url",
  "logo_url",
  "hours",
  "price_notes",
  "source_url",
  "notes",
  "status",
  "imported_provider_id",
  "created_at",
  "updated_at",
].join(", ");

const IMPORTED_INTAKE_COLS_WITHOUT_ZIP = IMPORTED_INTAKE_COLS
  .split(", ")
  .filter((column) => column !== "zip_code")
  .join(", ");

const PROVIDER_COLS = [
  "id",
  "source_provider_id",
  "slug",
  "display_name",
  "business_type",
  "primary_city_id",
  "primary_service_id",
  "short_bio",
  "phone",
  "email",
  "website_url",
  "address_text",
  "lat",
  "lng",
  "hours",
  "avatar_url",
  "banner_url",
  "logo_url",
  "google_maps_url",
  "instagram_url",
  "facebook_url",
  "platform_book_url",
  "claim_status",
  "claimed_by",
  "is_active",
  "is_indexable",
  "created_at",
  "updated_at",
].join(", ");

function isMissingZipColumn(error) {
  const message = String(error?.message ?? "");
  return Boolean(error) && message.includes("zip_code");
}

function toSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeImportedIntakeRow(row) {
  const cityName = row.city_name ?? "";
  const citySlug = row.city_slug || toSlug(cityName);
  const cityParts = [cityName, row.state_code].filter(Boolean);

  return {
    id: row.imported_provider_id ?? `intake:${row.id}`,
    actor_id: null,
    name: row.business_name,
    avatar_url: row.avatar_url,
    phone_public: row.phone,
    email: row.email,
    website_url: row.website_url,
    address_text: row.address_text,
    google_maps_url: row.google_maps_url,
    instagram_url: row.instagram_url,
    facebook_url: row.facebook_url,
    category_key: row.business_type,
    city_slug: citySlug,
    city: cityParts.length ? cityParts.join(", ") : citySlug,
    city_name: cityName,
    country_code: row.country_code,
    directory_visible: false,
    directory_status: "imported",
    hours: row.hours,
    booking_url: null,
    description: row.description,
    banner_url: row.banner_url,
    logo_url: row.logo_url,
    price_notes: row.price_notes,
    source_url: row.source_url,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    source: "traffic_intake",
    source_label: "Imported intake",
    intake_id: row.id,
    zip_code: row.zip_code ?? null,
    state_code: row.state_code ?? null,
  };
}

async function readImportedIntakeProviderRows() {
  const query = (cols) => supabase
    .schema("traffic")
    .from("business_intake_leads")
    .select(cols)
    .eq("status", "imported")
    .not("imported_provider_id", "is", null)
    .order("created_at", { ascending: false });

  let { data, error } = await query(IMPORTED_INTAKE_COLS);
  if (isMissingZipColumn(error)) {
    ({ data, error } = await query(IMPORTED_INTAKE_COLS_WITHOUT_ZIP));
  }

  if (error) throw error;
  return (data ?? []).map(normalizeImportedIntakeRow);
}

function normalizeTrafficProviderRow(row, { cityMap = new Map(), serviceMap = new Map() } = {}) {
  const city = cityMap.get(row.primary_city_id);
  const service = serviceMap.get(row.primary_service_id);
  const cityParts = [city?.name, city?.state_code].filter(Boolean);
  const categoryKey = row.business_type || service?.slug || service?.category || null;

  return {
    id: row.id,
    actor_id: row.claimed_by,
    name: row.display_name,
    avatar_url: row.avatar_url,
    banner_url: row.banner_url,
    logo_url: row.logo_url,
    phone_public: row.phone,
    email: row.email,
    website_url: row.website_url,
    address_text: row.address_text,
    google_maps_url: row.google_maps_url,
    instagram_url: row.instagram_url,
    facebook_url: row.facebook_url,
    category_key: categoryKey,
    city_slug: city?.slug ?? "",
    city: cityParts.length ? cityParts.join(", ") : "",
    city_name: city?.name ?? "",
    state_code: city?.state_code ?? "",
    country_code: city?.country_code ?? "",
    directory_visible: row.is_active,
    directory_status: row.is_indexable ? "listed" : "unlisted",
    hours: row.hours,
    booking_url: row.platform_book_url,
    description: row.short_bio,
    source_url: null,
    notes: null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    source: "traffic_provider",
    source_label: "Traffic provider",
    intake_id: null,
    zip_code: null,
    provider_service_id: row.primary_service_id ?? null,
  };
}

async function readTrafficProviderRows() {
  const [{ data, error }, { data: cityRows, error: cityError }, { data: serviceRows, error: serviceError }] = await Promise.all([
    supabase
      .schema("traffic")
      .from("providers")
      .select(PROVIDER_COLS)
      .order("created_at", { ascending: false }),
    supabase
      .schema("traffic")
      .from("cities")
      .select("id, name, slug, state_code, country_code"),
    supabase
      .schema("traffic")
      .from("services")
      .select("id, slug, name, category"),
  ]);

  if (error) throw error;
  if (cityError) throw cityError;
  if (serviceError) throw serviceError;

  const maps = {
    cityMap: new Map((cityRows ?? []).map((city) => [city.id, city])),
    serviceMap: new Map((serviceRows ?? []).map((service) => [service.id, service])),
  };

  return (data ?? []).map((row) => normalizeTrafficProviderRow(row, maps));
}

export async function readAllProviderRows() {
  const [providerRows, importedRows] = await Promise.all([
    readTrafficProviderRows(),
    readImportedIntakeProviderRows(),
  ]);

  const importedIds = new Set(importedRows.map((row) => row.id).filter(Boolean));
  const trafficOnly = providerRows.filter((row) => {
    if (!row.id || importedIds.has(row.id)) return false;
    return true;
  });
  const seen = new Set();
  const importedUnique = importedRows.filter((row) => {
    if (!row.id || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  return [...importedUnique, ...trafficOnly];
}

export async function readActiveCategories() {
  const [
    { data: services, error: servicesError },
    { data: providerServices, error: providerServicesError },
    { data: providers, error: providersError },
  ] = await Promise.all([
    supabase
      .schema("traffic")
      .from("services")
      .select("id, slug, name, category")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .schema("traffic")
      .from("provider_services")
      .select("service_id")
      .eq("is_active", true),
    supabase
      .schema("traffic")
      .from("providers")
      .select("primary_service_id, business_type")
      .eq("is_active", true),
  ]);

  if (servicesError) throw servicesError;
  if (providerServicesError) throw providerServicesError;
  if (providersError) throw providersError;

  const serviceCounts = new Map();
  for (const row of providerServices ?? []) {
    if (!row.service_id) continue;
    serviceCounts.set(row.service_id, (serviceCounts.get(row.service_id) ?? 0) + 1);
  }
  for (const row of providers ?? []) {
    if (!row.primary_service_id) continue;
    serviceCounts.set(row.primary_service_id, (serviceCounts.get(row.primary_service_id) ?? 0) + 1);
  }

  const categories = new Map();

  for (const service of services ?? []) {
    const key = String(service.category ?? "uncategorized").trim();
    if (!key) continue;

    if (!categories.has(key)) {
      categories.set(key, {
        key,
        label: key,
        description: null,
        providerCount: 0,
        isLive: false,
        sortOrder: categories.size,
        services: [],
      });
    }

    const providerCount = Number(serviceCounts.get(service.id) ?? 0);
    const category = categories.get(key);
    category.providerCount += providerCount;
    category.isLive = category.isLive || providerCount > 0;
    category.services.push({
      key: service.slug,
      id: service.id,
      label: service.name ?? service.slug,
      providerCount,
      sortOrder: category.services.length,
    });
  }

  return [...categories.values()];
}
