import { vport } from "@/services/supabase/vportClient";

const LEAD_SELECT = "id,vport_profile_id,actor_id,name,phone,email,message,source,created_at";

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeContactedSource(source) {
  const normalized = toText(source).toLowerCase();
  if (!normalized) return "contacted";
  if (normalized.includes("contacted")) return normalized;
  return `${normalized}_contacted`;
}

export async function markVportBusinessCardLeadContactedDAL({
  profileId,
  leadId,
  source,
} = {}) {
  if (!profileId) throw new Error("markVportBusinessCardLeadContactedDAL: profileId required");
  if (!leadId) throw new Error("markVportBusinessCardLeadContactedDAL: leadId required");

  const nextSource = normalizeContactedSource(source);

  const { data, error } = await vport
    .from("business_card_leads")
    .update({
      source: nextSource,
    })
    .eq("id", leadId)
    .eq("vport_profile_id", profileId)
    .select(LEAD_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function deleteVportBusinessCardLeadDAL({
  profileId,
  leadId,
} = {}) {
  if (!profileId) throw new Error("deleteVportBusinessCardLeadDAL: profileId required");
  if (!leadId) throw new Error("deleteVportBusinessCardLeadDAL: leadId required");

  const { error } = await vport
    .from("business_card_leads")
    .delete()
    .eq("id", leadId)
    .eq("vport_profile_id", profileId);

  if (error) throw error;
  return true;
}

export default {
  markVportBusinessCardLeadContactedDAL,
  deleteVportBusinessCardLeadDAL,
};
