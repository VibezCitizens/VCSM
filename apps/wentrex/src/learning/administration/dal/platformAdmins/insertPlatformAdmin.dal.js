import { PLATFORM_ADMIN_COLUMNS } from "@/learning/administration/dal/platformAdmins/getPlatformAdmin.dal";

export async function insertPlatformAdminDal({ supabase, actorId }) {
  if (!supabase) {
    throw new Error("insertPlatformAdminDal requires supabase");
  }

  if (!actorId) {
    throw new Error("insertPlatformAdminDal requires actorId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("platform_admins")
    .insert({ actor_id: actorId })
    .select(PLATFORM_ADMIN_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default insertPlatformAdminDal;
