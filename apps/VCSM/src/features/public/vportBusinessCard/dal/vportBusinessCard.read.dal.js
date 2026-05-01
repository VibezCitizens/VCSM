import vportSchema from "@/services/supabase/vportClient";

/**
 * Public read by slug.
 * Returns null when card is unavailable (unpublished/inactive/deleted/missing).
 */
export async function readVportBusinessCardPublicBySlugDAL({ slug } = {}) {
  const key = String(slug || "").trim().toLowerCase();
  if (!key) return null;

  const { data, error } = await vportSchema.rpc("read_business_card_public", {
    p_slug: key,
  });

  if (error) throw error;

  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

export default readVportBusinessCardPublicBySlugDAL;
