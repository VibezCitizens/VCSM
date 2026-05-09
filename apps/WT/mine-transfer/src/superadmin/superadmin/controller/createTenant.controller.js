import { createTenantBootstrap } from "@/services/supabase/createTenantBootstrap";
import { isAdminAuthorized } from "@/learning/admin/controller/adminAccess";

export async function createTenantController({
  supabase,
  userId,
  actorId,
  principalEmail,
  schoolName,
  schoolSlug,
  primaryColor,
}) {
  if (!schoolName?.trim()) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "School name is required" },
    };
  }

  if (!principalEmail?.trim()) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Principal email is required" },
    };
  }

  const isAdmin = await isAdminAuthorized({ supabase, userId, actorId });

  if (!isAdmin) {
    return { ok: false, error: { code: "FORBIDDEN" } };
  }

  return createTenantBootstrap({
    supabase,
    principalEmail,
    schoolName,
    schoolSlug: schoolSlug || null,
    primaryColor: primaryColor || "#0f4a72",
  });
}

export default createTenantController;
