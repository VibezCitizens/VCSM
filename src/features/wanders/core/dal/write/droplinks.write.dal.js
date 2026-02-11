// ============================================================================
// WANDERS DAL — DROP LINKS (WRITE)
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
 * Create drop link.
 * Payload keys MUST be snake_case DB columns.
 */
export async function createDropLink(payload) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(payload)
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Deactivate drop link by id.
 * @param {{ id: string }} input
 */
export async function deactivateDropLink(input) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update({ is_active: false })
    .eq("id", input.id)
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
