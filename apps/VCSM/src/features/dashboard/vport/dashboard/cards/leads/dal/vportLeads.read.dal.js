import { vport } from "@/services/supabase/vportClient";

const LEAD_SELECT = "id,vport_profile_id,actor_id,name,phone,email,message,source,created_at";

export async function readVportBusinessCardLeadsByProfileDAL(profileId, { limit = 100 } = {}) {
  if (!profileId) return [];

  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, Number(limit))) : 100;

  const { data, error } = await vport
    .from("business_card_leads")
    .select(LEAD_SELECT)
    .eq("vport_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function readNewLeadsCountByProfileDAL(profileId) {
  if (!profileId) return 0;
  const { count, error } = await vport
    .from("business_card_leads")
    .select("id", { count: "exact", head: true })
    .eq("vport_profile_id", profileId)
    .not("source", "ilike", "%contacted%");
  if (error) return 0;
  return count ?? 0;
}

export default readVportBusinessCardLeadsByProfileDAL;
