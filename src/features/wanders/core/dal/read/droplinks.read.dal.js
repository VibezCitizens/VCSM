// ============================================================================
// WANDERS DAL — DROP LINKS (READ)
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

const SCHEMA = "wanders";
const TABLE = "inbox_drop_links";

const COLS = [
  "id",
  "inbox_id",
  "owner_user_id",
  "public_id",
  "is_active",
  "accepts_guests",
  "title",
  "expires_at",
  "created_at",
  "updated_at",
].join(",");

/**
 * Get latest active drop link for owner_user_id.
 * @param {{ ownerUserId: string }} input
 */
export async function getActiveDropLinkByOwnerUserId(input) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("owner_user_id", input.ownerUserId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
