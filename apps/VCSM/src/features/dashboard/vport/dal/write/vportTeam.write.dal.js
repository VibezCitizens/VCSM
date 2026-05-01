import vportSchema from "@/services/supabase/vportClient";

export async function insertTeamMemberDAL({ profileId, name }) {
  if (!profileId || !name) throw new Error("insertTeamMemberDAL: profileId and name required");

  const { data, error } = await vportSchema
    .from("resources")
    .insert({
      profile_id: profileId,
      name: String(name).trim(),
      resource_type: "staff",
      is_active: true,
    })
    .select("id, name, resource_type, is_active, member_actor_id, sort_order")
    .single();

  if (error) throw error;
  return data;
}
