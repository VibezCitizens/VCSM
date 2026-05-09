import { createTenantBootstrap } from "@/superadmin/services/createTenantBootstrap";

export async function createTenantController({
  supabase,
  principalEmail,
  schoolName,
  schoolSlug,
  primaryColor,
}) {
  if (!schoolName?.trim()) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "School name is required" } };
  }

  if (!principalEmail?.trim()) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "Principal email is required" } };
  }

  // Platform owner check is enforced server-side by the edge function.
  // The caller must already be authenticated via Supabase session.
  return createTenantBootstrap({
    supabase,
    principalEmail,
    schoolName,
    schoolSlug: schoolSlug || null,
    primaryColor: primaryColor || "#0f4a72",
  });
}
