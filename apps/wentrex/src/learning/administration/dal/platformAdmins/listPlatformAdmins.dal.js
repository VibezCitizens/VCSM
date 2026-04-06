import { PLATFORM_ADMIN_COLUMNS } from "@/learning/administration/dal/platformAdmins/getPlatformAdmin.dal";

export async function listPlatformAdminsDal({ supabase }) {
  if (!supabase) {
    throw new Error("listPlatformAdminsDal requires supabase");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("platform_admins")
    .select(PLATFORM_ADMIN_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listPlatformAdminsDal;
