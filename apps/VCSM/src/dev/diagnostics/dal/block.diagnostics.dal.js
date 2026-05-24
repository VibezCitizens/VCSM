// ============================================================
//  BLOCK SYSTEM — DIAGNOSTICS DAL (DEV-ONLY)
// ------------------------------------------------------------
//  These functions exist solely to support the dev diagnostics
//  panel. Never import this file from production code paths.
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

export async function fetchActorsIBlocked(actorId) {
  if (!actorId) return [];

  const { data, error } = await supabase
    .schema("moderation")
    .from("blocks")
    .select("blocked_actor_id")
    .eq("blocker_actor_id", actorId)
    .eq("status", "active");

  if (error) throw error;
  return data?.map((r) => r.blocked_actor_id) ?? [];
}

export async function fetchActorsWhoBlockedMe(actorId) {
  if (!actorId) return [];

  const { data, error } = await supabase
    .schema("moderation")
    .from("blocks")
    .select("blocker_actor_id")
    .eq("blocked_actor_id", actorId)
    .eq("status", "active");

  if (error) throw error;
  return data?.map((r) => r.blocker_actor_id) ?? [];
}

export async function fetchBlockGraph(actorId) {
  if (!actorId) return { iBlocked: new Set(), blockedMe: new Set() };

  const [{ data: iBlocked }, { data: blockedMe }] = await Promise.all([
    supabase
      .schema("moderation")
      .from("blocks")
      .select("blocked_actor_id")
      .eq("blocker_actor_id", actorId)
      .eq("status", "active"),

    supabase
      .schema("moderation")
      .from("blocks")
      .select("blocker_actor_id")
      .eq("blocked_actor_id", actorId)
      .eq("status", "active"),
  ]);

  return {
    iBlocked: new Set(iBlocked?.map((r) => r.blocked_actor_id)),
    blockedMe: new Set(blockedMe?.map((r) => r.blocker_actor_id)),
  };
}
