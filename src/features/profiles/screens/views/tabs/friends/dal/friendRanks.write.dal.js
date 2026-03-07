import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Normalize incoming friend ids:
 * - remove null/undefined
 * - remove duplicates (keep first occurrence)
 * - cap to top 10
 */
function normalizeFriendIds(friendActorIds = [], maxCount = 10) {
  const unique = [];
  const seen = new Set();

  for (const id of Array.isArray(friendActorIds) ? friendActorIds : []) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(id);
    if (unique.length >= maxCount) break;
  }

  return unique;
}

/**
 * Replace all top-friend ranks atomically.
 * Prefers DB contract RPC `vc.save_friend_ranks`.
 * Falls back to direct delete+insert when RPC is unavailable.
 * @param {string} ownerActorId
 * @param {string[]} friendActorIds ordered list (first wins)
 * @param {{ autofill?: boolean, maxCount?: number }} options
 * @returns {Promise<Array<{ owner_actor_id: string, friend_actor_id: string, rank: number }>>}
 */
export async function saveFriendRanks(
  ownerActorId,
  friendActorIds = [],
  { autofill = false, maxCount = 10 } = {}
) {
  if (!ownerActorId) throw new Error("ownerActorId required");

  const safeMaxCount = Math.max(1, Math.min(10, Number(maxCount || 10)));
  const normalizedIds = normalizeFriendIds(friendActorIds, safeMaxCount);

  // Prefer RPC path (eligibility + reconciliation in DB).
  const { data: rpcData, error: rpcError } = await supabase
    .schema("vc")
    .rpc("save_friend_ranks", {
      p_owner_actor_id: ownerActorId,
      p_friend_actor_ids: normalizedIds,
      p_autofill: Boolean(autofill),
      p_max_count: safeMaxCount,
    });

  if (!rpcError) {
    return Array.isArray(rpcData) ? rpcData : [];
  }

  console.warn("[saveFriendRanks] RPC fallback -> direct write", {
    ownerActorId,
    message: rpcError?.message ?? null,
    code: rpcError?.code ?? null,
    details: rpcError?.details ?? null,
    hint: rpcError?.hint ?? null,
  });

  const payload = normalizedIds.map((friendActorId, i) => ({
    owner_actor_id: ownerActorId,
    friend_actor_id: friendActorId,
    rank: i + 1,
  }));

  // Fallback: wipe existing rows.
  const { error: delErr } = await supabase
    .schema("vc")
    .from("friend_ranks")
    .delete()
    .eq("owner_actor_id", ownerActorId);

  if (delErr) throw delErr;

  // Fallback: insert new rows.
  if (payload.length > 0) {
    const { error: insErr } = await supabase
      .schema("vc")
      .from("friend_ranks")
      .insert(payload);

    if (insErr) throw insErr;
  }

  const { data: rows, error: readErr } = await supabase
    .schema("vc")
    .from("friend_ranks")
    .select("owner_actor_id,friend_actor_id,rank")
    .eq("owner_actor_id", ownerActorId)
    .order("rank", { ascending: true });

  if (readErr) throw readErr;
  return rows ?? [];
}
