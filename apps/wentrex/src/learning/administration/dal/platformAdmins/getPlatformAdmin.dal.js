const PLATFORM_ADMIN_COLUMNS = `
  id,
  actor_id,
  created_at
`;

export async function getPlatformAdminDal({ supabase, actorId }) {
  if (!supabase) {
    throw new Error("getPlatformAdminDal requires supabase");
  }

  if (!actorId) {
    throw new Error("getPlatformAdminDal requires actorId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("platform_admins")
    .select(PLATFORM_ADMIN_COLUMNS)
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export { PLATFORM_ADMIN_COLUMNS };
export default getPlatformAdminDal;
