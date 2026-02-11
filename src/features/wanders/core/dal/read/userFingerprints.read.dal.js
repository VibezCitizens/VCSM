// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\core\dal\read\userFingerprints.read.dal.js
// ============================================================================
// WANDERS DAL — USER FINGERPRINTS (READ)
// Contract: raw rows only, explicit selects, no derived meaning.
// ============================================================================

import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";

const SCHEMA = "wanders";
const TABLE = "user_fingerprints";

const COLS = [
  "user_id",
  "created_at",
  "last_seen_at",
  "user_agent_hash",
  "ip_hash",
  "device_hash",
  "client_key",
].join(",");

/**
 * Read fingerprint by user_id.
 * @param {{ userId: string }} input
 */
export async function getWandersUserFingerprintByUserId(input) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Read fingerprint by client_key (if you use a stable local key).
 * @param {{ clientKey: string }} input
 */
export async function getWandersUserFingerprintByClientKey(input) {
  const supabase = getWandersSupabase();

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS)
    .eq("client_key", input.clientKey)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] ?? null;
}
