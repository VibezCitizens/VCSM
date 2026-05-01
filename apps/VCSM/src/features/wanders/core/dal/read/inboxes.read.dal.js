import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

const SCHEMA = "wanders";
const TABLE = "inboxes";

const COLS = [
  "id",
  "public_id",
  "realm_id",
  "owner_user_id",
  "owner_actor_id",
  "accepts_guests",
  "default_folder",
  "is_active",
  "created_at",
  "updated_at",
].join(",");

export async function readWandersInboxByIdDAL({ inboxId }) {
  if (!inboxId) return null;

  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("id", inboxId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function readWandersInboxByPublicIdDAL({ publicId }) {
  if (!publicId) return null;

  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("public_id", publicId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function listWandersInboxesByOwnerUserDAL({
  ownerUserId,
  isActive,
  limit = 50,
}) {
  if (!ownerUserId) return [];

  const supabase = getWandersSupabase();

  let query = supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (typeof isActive === "boolean") {
    query = query.eq("is_active", isActive);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
