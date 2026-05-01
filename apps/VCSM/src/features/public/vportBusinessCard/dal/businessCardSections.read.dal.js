import vportSchema from "@/services/supabase/vportClient";

export async function readBusinessCardSectionsDAL(profileId) {
  if (!profileId) return null;

  const { data, error } = await vportSchema.rpc("get_business_card_sections", {
    p_profile_id: profileId,
  });

  if (error) throw error;
  return data && typeof data === "object" ? data : null;
}
