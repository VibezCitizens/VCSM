import vc from "@/services/supabase/vcClient";

export async function dalReadReviewTargetActor(targetActorId) {
  if (!targetActorId) return null;

  const { data, error } = await vc
    .from("actors")
    .select("id,kind,vport_id,is_void")
    .eq("id", targetActorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
