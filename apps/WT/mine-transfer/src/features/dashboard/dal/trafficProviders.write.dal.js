import { supabase } from "@/services/supabase/supabaseClient";

const EDITABLE_INTAKE_FIELDS = [
  "business_name",
  "business_type",
  "description",
  "city_name",
  "country_code",
  "state_code",
  "zip_code",
  "address_text",
  "phone",
  "email",
  "website_url",
  "google_maps_url",
  "instagram_url",
  "facebook_url",
  "avatar_url",
  "banner_url",
  "logo_url",
  "price_notes",
  "source_url",
  "notes",
];

function isMissingZipColumn(error) {
  const message = String(error?.message ?? "");
  return Boolean(error) && message.includes("zip_code");
}

function isDeleteBlocked(error) {
  const message = String(error?.message ?? "").toLowerCase();
  return Boolean(error) && (
    error.code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("policy")
  );
}

function cleanText(value) {
  if (typeof value !== "string") return value ?? null;
  return value.trim() || null;
}

function cleanCode(value) {
  return String(value ?? "").trim().toUpperCase() || null;
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

function buildIntakePatch(fields) {
  const payload = {};

  for (const key of EDITABLE_INTAKE_FIELDS) {
    if (!(key in fields)) continue;
    payload[key] = key === "country_code" || key === "state_code"
      ? cleanCode(fields[key])
      : cleanText(fields[key]);
  }

  if ("business_name" in fields) {
    payload.slug = toSlug(fields.business_name);
  }

  if ("city_name" in fields) {
    payload.city_slug = toSlug(fields.city_name);
  }

  payload.updated_at = new Date().toISOString();
  return payload;
}

function removeZipFromPatch(patch) {
  const rest = { ...patch };
  delete rest.zip_code;
  return rest;
}

export async function updateImportedIntakeProviderRow(intakeId, fields) {
  const patch = buildIntakePatch(fields);

  let { data, error } = await supabase
    .schema("traffic")
    .from("business_intake_leads")
    .update(patch)
    .eq("id", intakeId)
    .select("id")
    .single();

  if (isMissingZipColumn(error)) {
    ({ data, error } = await supabase
      .schema("traffic")
      .from("business_intake_leads")
      .update(removeZipFromPatch(patch))
      .eq("id", intakeId)
      .select("id")
      .single());
  }

  if (error) throw error;
  return data;
}

async function archiveImportedIntakeProviderRow(intakeId) {
  const { data, error } = await supabase
    .schema("traffic")
    .from("business_intake_leads")
    .update({
      status: "rejected",
      imported_provider_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", intakeId)
    .select("id");

  if (error) throw error;
  return { mode: data?.length ? "archived" : "none" };
}

export async function deleteImportedIntakeProviderRow(intakeId) {
  const { data, error } = await supabase
    .schema("traffic")
    .from("business_intake_leads")
    .delete()
    .eq("id", intakeId)
    .select("id");

  if (error) {
    if (isDeleteBlocked(error)) return archiveImportedIntakeProviderRow(intakeId);
    throw error;
  }

  if (data?.length) return { mode: "deleted" };
  return archiveImportedIntakeProviderRow(intakeId);
}
