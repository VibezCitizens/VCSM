import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

const SCHEMA = "wanders";
const TABLE = "inboxes";

const COLS = [
  "id",
  "public_id",
  "realm_id",
  "owner_user_id",
  "owner_actor_id",
  "owner_anon_id",
  "accepts_anon",
  "default_folder",
  "is_active",
  "created_at",
  "updated_at",
].join(",");

export async function createWandersInboxDAL(payload) {
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

export async function updateWandersInboxDAL({ inboxId, patch }) {
  if (!inboxId) return null;

  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq("id", inboxId)
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
