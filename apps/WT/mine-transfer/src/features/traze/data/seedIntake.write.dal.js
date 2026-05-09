import { supabase } from "@/services/supabase/supabaseClient";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TEXT_FIELDS = [
  "business_name",
  "slug",
  "description",
  "business_type",
  "country_code",
  "state_code",
  "city_name",
  "city_slug",
  "zip_code",
  "address_text",
  "phone",
  "email",
  "website_url",
  "instagram_url",
  "facebook_url",
  "google_maps_url",
  "source_url",
  "notes",
  "status",
];

const UUID_FIELDS = [
  "service_id",
  "city_id",
  "neighborhood_id",
];

function cleanText(value) {
  return String(value ?? "").trim() || null;
}

function cleanCode(value) {
  return String(value ?? "").trim().toUpperCase() || null;
}

function cleanUuid(value) {
  const text = cleanText(value);
  return text && UUID_PATTERN.test(text) ? text : null;
}

function cleanNumber(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanHours(value) {
  const text = cleanText(value);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Hours must be valid JSON when provided.");
  }
}

function buildSeedPayload(fields) {
  const payload = {};

  for (const field of TEXT_FIELDS) {
    if (!(field in fields)) continue;
    payload[field] = field === "country_code" || field === "state_code"
      ? cleanCode(fields[field])
      : cleanText(fields[field]);
  }

  for (const field of UUID_FIELDS) {
    if (field in fields) payload[field] = cleanUuid(fields[field]);
  }

  if ("lat" in fields) payload.lat = cleanNumber(fields.lat);
  if ("lng" in fields) payload.lng = cleanNumber(fields.lng);
  if ("hours" in fields) payload.hours = cleanHours(fields.hours);

  payload.updated_at = new Date().toISOString();
  return payload;
}

export async function updateSeedIntakeRow(seedId, fields) {
  const payload = buildSeedPayload(fields);
  const { data, error } = await supabase
    .schema("traffic")
    .from("business_intake_leads")
    .update(payload)
    .eq("id", seedId)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function insertSeedIntakeRow(fields) {
  const payload = buildSeedPayload(fields);
  delete payload.updated_at;

  const { data, error } = await supabase
    .schema("traffic")
    .from("business_intake_leads")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}
