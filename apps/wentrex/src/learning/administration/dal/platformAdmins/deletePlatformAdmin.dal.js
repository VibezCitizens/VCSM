export async function deletePlatformAdminDal({ supabase, actorId }) {
  if (!supabase) {
    throw new Error("deletePlatformAdminDal requires supabase");
  }

  if (!actorId) {
    throw new Error("deletePlatformAdminDal requires actorId");
  }

  const { error } = await supabase
    .schema("learning")
    .from("platform_admins")
    .delete()
    .eq("actor_id", actorId);

  if (error) {
    throw error;
  }
}

export default deletePlatformAdminDal;
