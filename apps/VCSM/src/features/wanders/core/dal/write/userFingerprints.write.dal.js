// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\core\dal\write\userFingerprints.write.dal.js
// ============================================================================
// WANDERS DAL — USER FINGERPRINTS (WRITE)
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
 * Insert fingerprint row.
 * NOTE: user_id is PK so this is typically used once.
 *
 * @param {{
 *  userId: string,
 *  userAgentHash?: string|null,
 *  ipHash?: string|null,
 *  deviceHash?: string|null,
 *  clientKey?: string|null,
 * }} input
 */
export async function createWandersUserFingerprint(input) {
  const supabase = getWandersSupabase();

  const payload = {
    user_id: input.userId,
    user_agent_hash: input.userAgentHash ?? null,
    ip_hash: input.ipHash ?? null,
    device_hash: input.deviceHash ?? null,
    client_key: input.clientKey ?? null,
    // created_at, last_seen_at defaults exist in DB
  };

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(payload)
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Touch fingerprint (update last_seen_at and optional hashes).
 *
 * @param {{
 *  userId: string,
 *  userAgentHash?: string|null,
 *  ipHash?: string|null,
 *  deviceHash?: string|null,
 *  clientKey?: string|null,
 * }} input
 */
export async function touchWandersUserFingerprint(input) {
  const supabase = getWandersSupabase();

  const patch = {
    last_seen_at: new Date().toISOString(),
  };

  if (input.userAgentHash !== undefined) patch.user_agent_hash = input.userAgentHash;
  if (input.ipHash !== undefined) patch.ip_hash = input.ipHash;
  if (input.deviceHash !== undefined) patch.device_hash = input.deviceHash;
  if (input.clientKey !== undefined) patch.client_key = input.clientKey;

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .update(patch)
    .eq("user_id", input.userId)
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  return data;
}
