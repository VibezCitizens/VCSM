import { supabase } from "@/services/supabase/supabaseClient";

const ACTOR_OWNER_SELECT = [
  "actor_id",
  "user_id",
  "is_primary",
  "is_void",
  "created_at",
].join(",");

export async function readActorOwnerLinkByActorAndUserProfileDAL({
  targetActorId,
  userProfileId,
} = {}) {
  if (!targetActorId) {
    throw new Error("readActorOwnerLinkByActorAndUserProfileDAL: targetActorId is required");
  }
  if (!userProfileId) {
    throw new Error("readActorOwnerLinkByActorAndUserProfileDAL: userProfileId is required");
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select(ACTOR_OWNER_SELECT)
    .eq("actor_id", targetActorId)
    .eq("user_id", userProfileId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default readActorOwnerLinkByActorAndUserProfileDAL;
