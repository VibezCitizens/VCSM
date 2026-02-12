// src/features/wanders/core/controllers/wandersInboxescontroller.js
import { getWandersSupabase } from "@/features/wanders/services/wandersSupabaseClient";
import { ensureGuestUser } from "@/features/wanders/core/controllers/_ensureGuestUser";

function makePublicId(prefix = "w_inbox") {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
  return `${prefix}_${id}`;
}

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
  return "wanders.inboxes";
}

// ✅ tiny local mapper (no dependency on wandersInbox.model.js)
function toInbox(row) {
  if (!row) return null;
  return {
    id: row.id ?? null,
    publicId: row.public_id ?? null,
    realmId: row.realm_id ?? null,

    ownerUserId: row.owner_user_id ?? null,
    ownerActorId: row.owner_actor_id ?? null,
    ownerAnonId: row.owner_anon_id ?? null,

    acceptsAnon: !!row.accepts_anon,
    defaultFolder: row.default_folder ?? "inbox",
    isActive: !!row.is_active,

    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

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
  return toInbox(data);
}

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
  return toInbox(data);
}

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
  return toInbox(data);
}

export async function listMyWandersInboxesAsAnon(input = {}) {
  const supabase = getWandersSupabase();
  const user = await ensureGuestUser();

  let q = supabase
    .from(table())
    .select(INBOX_SELECT)
    .eq("owner_user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(input?.limit ?? 50);

  if (typeof input?.isActive === "boolean") q = q.eq("is_active", input.isActive);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map(toInbox);
}

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
  return toInbox(data);
}

// compatibility aliases
export const listWandersInboxesForViewer = listMyWandersInboxesAsAnon;
export const listMyInboxesAsGuest = listMyWandersInboxesAsAnon;
