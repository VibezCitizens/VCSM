// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\core\controllers\wandersInboxescontroller.js
// ============================================================================
// WANDERS CORE CONTROLLER — INBOXES
// Contract: orchestration only (Supabase query + ensure guest user + model mapper).
// No React. No UI state.
// NOTE: This version does NOT import or call wandersInboxes.dal at all.
// It talks to Supabase directly via getWandersSupabase().
// ============================================================================

import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";
import { ensureGuestUser } from "@/features/wanders/core/controllers/_ensureGuestUser";
import { toWandersInbox } from "@/features/wanders/models/wandersInbox.model";

function makePublicId(prefix = "w_inbox") {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
  return `${prefix}_${id}`;
}

// Keep projection explicit (no select "*")
const INBOX_SELECT = [
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

function table() {
  // ✅ schema-qualified table
  return "wanders.inboxes";
}

/**
 * Create a user-owned inbox (guest user / auth.uid()).
 * @param {{ realmId: string, publicId?: string, acceptsAnon?: boolean, defaultFolder?: 'inbox'|'requests', isActive?: boolean }} input
 */
export async function createAnonWandersInbox(input) {
  const supabase = getWandersSupabase();
  const user = await ensureGuestUser();

  const payload = {
    public_id: input?.publicId ?? makePublicId(),
    realm_id: input?.realmId,
    owner_user_id: user?.id,
    owner_actor_id: null,
    owner_anon_id: null,
    is_active: input?.isActive ?? true,
    accepts_anon: input?.acceptsAnon ?? true,
    default_folder: input?.defaultFolder ?? "inbox",
  };

  const { data, error } = await supabase
    .from(table())
    .insert(payload)
    .select(INBOX_SELECT)
    .single();

  if (error) throw error;
  return toWandersInbox(data);
}

/**
 * Read inbox by id (domain return).
 * @param {{ inboxId: string }} input
 */
export async function readWandersInboxById(input) {
  const supabase = getWandersSupabase();
  const inboxId = input?.inboxId;
  if (!inboxId) return null;

  const { data, error } = await supabase
    .from(table())
    .select(INBOX_SELECT)
    .eq("id", inboxId)
    .maybeSingle();

  if (error) throw error;
  return data ? toWandersInbox(data) : null;
}

/**
 * Public lookup by publicId.
 * @param {{ publicId: string }} input
 */
export async function readWandersInboxByPublicId(input) {
  const supabase = getWandersSupabase();
  const publicId = input?.publicId;
  if (!publicId) return null;

  const { data, error } = await supabase
    .from(table())
    .select(INBOX_SELECT)
    .eq("public_id", publicId)
    .maybeSingle();

  if (error) throw error;
  return data ? toWandersInbox(data) : null;
}

/**
 * List inboxes for current auth user (guest user).
 * @param {{ isActive?: boolean|null, limit?: number }} input
 */
export async function listMyWandersInboxesAsAnon(input = {}) {
  const supabase = getWandersSupabase();
  const user = await ensureGuestUser();

  let q = supabase
    .from(table())
    .select(INBOX_SELECT)
    .eq("owner_user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(input?.limit ?? 50);

  if (typeof input?.isActive === "boolean") {
    q = q.eq("is_active", input.isActive);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map(toWandersInbox);
}

/**
 * Update my inbox (user-owned; RLS enforces ownership).
 * @param {{ inboxId: string, acceptsAnon?: boolean, defaultFolder?: 'inbox'|'requests', isActive?: boolean }} input
 */
export async function updateMyWandersInbox(input) {
  const supabase = getWandersSupabase();
  const inboxId = input?.inboxId;
  if (!inboxId) throw new Error("updateMyWandersInbox requires { inboxId }");

  const patch = {};
  if (typeof input?.acceptsAnon === "boolean") patch.accepts_anon = input.acceptsAnon;
  if (typeof input?.defaultFolder === "string") patch.default_folder = input.defaultFolder;
  if (typeof input?.isActive === "boolean") patch.is_active = input.isActive;

  const { data, error } = await supabase
    .from(table())
    .update(patch)
    .eq("id", inboxId)
    .select(INBOX_SELECT)
    .single();

  if (error) throw error;
  return toWandersInbox(data);
}
