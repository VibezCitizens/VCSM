import { supabase } from "@/services/supabase/supabaseClient";

const BASE_SEED_COLUMNS = [
  "id",
  "business_name",
  "business_type",
  "description",
  "service_id",
  "city_id",
  "neighborhood_id",
  "country_code",
  "state_code",
  "city_name",
  "city_slug",
  "address_text",
  "lat",
  "lng",
  "phone",
  "email",
  "website_url",
  "google_maps_url",
  "instagram_url",
  "facebook_url",
  "source",
  "source_url",
  "notes",
  "status",
  "imported_provider_id",
  "created_at",
  "updated_at",
];

const OPTIONAL_COLUMNS = [
  "zip_code",
  "slug",
  "hours",
  "neighborhood_name",
  "neighborhood_slug",
];

function columnList(optionalColumns = OPTIONAL_COLUMNS) {
  return [...BASE_SEED_COLUMNS, ...optionalColumns].join(", ");
}

function missingOptionalColumn(error, column) {
  const message = String(error?.message ?? "");
  return Boolean(error) && message.includes(column);
}

async function readSeedRowsWithOptionalColumns(optionalColumns) {
  const { data, error } = await supabase
    .schema("traffic")
    .from("business_intake_leads")
    .select(columnList(optionalColumns))
    .order("created_at", { ascending: false });

  if (!error) {
    return data ?? [];
  }

  const missingColumn = optionalColumns.find((column) => missingOptionalColumn(error, column));
  if (missingColumn) {
    const nextColumns = optionalColumns.filter((column) => column !== missingColumn);
    const rows = await readSeedRowsWithOptionalColumns(nextColumns);
    return rows.map((row) => ({ ...row, [missingColumn]: null }));
  }

  throw error;
}

export async function readSeedIntakeRows() {
  return readSeedRowsWithOptionalColumns(OPTIONAL_COLUMNS);
}
