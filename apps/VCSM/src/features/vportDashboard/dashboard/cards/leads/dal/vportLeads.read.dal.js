import { vport } from "@/services/supabase/vportClient";

const LEAD_SELECT = "id,vport_profile_id,actor_id,name,phone,email,message,source,created_at";

// Status grouping is derived from the `source` text column — there is no status
// column. This mirrors normalizeVportLead()'s isContacted = source.includes("contacted"):
//   "contacted" → source ILIKE '%contacted%'
//   "active"    → source NOT ILIKE '%contacted%'
//   undefined   → no status filter (all leads)
function applyStatusGroupFilter(query, statusGroup) {
  if (statusGroup === "contacted") return query.ilike("source", "%contacted%");
  if (statusGroup === "active") return query.not("source", "ilike", "%contacted%");
  return query;
}

export async function readVportBusinessCardLeadsByProfileDAL(profileId, { limit = 100, statusGroup } = {}) {
  if (!profileId) return [];

  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, Number(limit))) : 100;

  let query = vport
    .from("business_card_leads")
    .select(LEAD_SELECT)
    .eq("vport_profile_id", profileId);

  query = applyStatusGroupFilter(query, statusGroup);

  const { data, error } = await query
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

// Lightweight head count of contacted leads — transfers no row data, used to
// render the "Contacted Leads (N)" badge without fetching the rows themselves.
export async function readContactedLeadsCountByProfileDAL(profileId) {
  if (!profileId) return 0;
  const { count, error } = await vport
    .from("business_card_leads")
    .select("id", { count: "exact", head: true })
    .eq("vport_profile_id", profileId)
    .ilike("source", "%contacted%");
  if (error) return 0;
  return count ?? 0;
}

export default readVportBusinessCardLeadsByProfileDAL;
