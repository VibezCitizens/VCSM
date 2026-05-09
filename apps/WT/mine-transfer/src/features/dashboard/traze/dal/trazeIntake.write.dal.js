import { supabase } from "@/services/supabase/supabaseClient";

function isMissingZipColumn(error) {
  const message = String(error?.message ?? "");
  return Boolean(error) && message.includes("zip_code");
}

function moveZipIntoNotes(fields) {
  const { zip_code: zipCode, ...rest } = fields;
  if (!zipCode) return rest;
  const zipNote = `ZIP/postal: ${zipCode}`;
  return { ...rest, notes: rest.notes ? `${rest.notes}\n${zipNote}` : zipNote };
}

export async function insertIntakeLead(fields) {
  let { data, error } = await supabase
    .schema("traffic")
    .from("business_intake_leads")
    .insert(fields)
    .select("id, business_name, slug, status, created_at")
    .single();

  if (isMissingZipColumn(error)) {
    ({ data, error } = await supabase
      .schema("traffic")
      .from("business_intake_leads")
      .insert(moveZipIntoNotes(fields))
      .select("id, business_name, slug, status, created_at")
      .single());
  }

  if (error) throw error;
  return data;
}

export async function patchIntakeStatus(id, status, extra = {}) {
  const { error } = await supabase
    .schema("traffic")
    .from("business_intake_leads")
    .update({ status, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...extra })
    .eq("id", id);
  if (error) throw error;
}

export async function insertProvider(fields) {
  // providers.id has no DEFAULT in schema — must supply UUID
  const id = crypto.randomUUID();
  const { data, error } = await supabase
    .schema("traffic")
    .from("providers")
    .insert({ ...fields, id })
    .select("id, display_name, slug, is_active, is_indexable, claim_status, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function insertProviderService(fields) {
  // provider_services.id is bigint sequence — do not supply
  const { error } = await supabase
    .schema("traffic")
    .from("provider_services")
    .insert(fields);
  if (error) throw error;
}

export async function patchClaimStatus(id, claimStatus, extra = {}) {
  const { error } = await supabase
    .schema("traffic")
    .from("business_claim_requests")
    .update({ claim_status: claimStatus, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...extra })
    .eq("id", id);
  if (error) throw error;
}
