// Data-layer for VPORTs.
// All VPORTs are in vport.profiles. Legacy vc.vports is no longer used.

import supabase from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";
import { refreshVcActorDirectory } from "@/features/identity/adapters/identityOps.adapter";

function ensureString(x) {
  return typeof x === "string" ? x : "";
}

function normalizeSlug(s) {
  const base = ensureString(s).trim().toLowerCase();
  if (!base) return null;
  return base
    .replace(/[^a-z0-9\\s-]+/g, "")
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const user = data?.user || null;
  if (!user) throw new Error("Not authenticated");
  return user;
}

function raise(message, meta) {
  const e = new Error(message);
  if (meta) e.meta = meta;
  throw e;
}

// Converts a display label or space-separated value to a vport.categories key.
// "Gas Station" → "gas_station", "Nail Technician" → "nail_technician"
function toCategoryKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}


export async function createVport({
  name,
  avatarUrl,
  bio,
  bannerUrl,
  vportType,
  directoryVisible = true,
} = {}) {
  await requireUser();

  const cleanName = ensureString(name).trim();
  if (!cleanName) raise("Vport name is required");

  const cleanType = toCategoryKey(vportType) || null;
  if (!cleanType) raise("Vport type is required");

  // Generate slug client-side — DB requires it, does not auto-generate
  const slugBase = cleanName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'vport';
  const suffix = Math.random().toString(36).slice(2, 6);
  const cleanSlug = `${slugBase}-${suffix}`;

  const { data, error } = await vportSchema.rpc("create_vport", {
    p_slug: cleanSlug,
    p_name: cleanName,
    p_primary_category_key: cleanType,
    p_bio: bio ?? null,
    p_avatar_url: avatarUrl ?? null,
    p_banner_url: bannerUrl ?? null,
    p_directory_visible: directoryVisible ?? true,
  });

  if (error) {
    const msg = error.message || String(error);
    if (msg.includes("AUTH_REQUIRED")) raise("Not authenticated");
    if (msg.includes("ACTOR_NOT_FOUND")) raise("Your account is not fully set up. Please try again.");
    if (msg.includes("SLUG_ALREADY_EXISTS")) raise("That name is already taken. Please try a different name.");
    if (msg.includes("INVALID_CATEGORY")) raise("Invalid Vport type.");
    if (msg.includes("VPORT_ALREADY_EXISTS_FOR_ACTOR")) raise("You already have a Vport of this type.");
    raise(msg, { error });
  }

  // RETURNS TABLE — PostgREST returns array of rows
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.profile_id) raise("create_vport returned no result");

  // Awaited — the platform.user_app_actor_links row must be committed before
  // createVport() returns, otherwise switchToVport races against a missing link.
  if (row.actor_id) {
    try {
      await refreshVcActorDirectory(row.actor_id);
    } catch { /* non-fatal */ }
  }

  return {
    ok: true,
    vport_id: row.profile_id,
    profile_id: row.profile_id,
    actor_id: row.actor_id,
    slug: row.slug,
    // camelCase aliases
    profileId: row.profile_id,
    vportId: row.profile_id,
    actorId: row.actor_id,
  };
}

export async function listMyVports() {
  const user = await requireUser();

  const SELECT = "id,owner_user_id,name,slug,avatar_url,banner_url,bio,is_active,created_at,actor_id";

  const { data, error } = await vportSchema
    .from("profiles")
    .select(SELECT)
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) raise("Failed to load your Vports", { error });

  return data || [];
}

export async function getVportById(vportId) {
  if (!vportId) return null;

  const SELECT = "id,owner_user_id,name,slug,avatar_url,banner_url,bio,is_active,created_at,updated_at,actor_id";

  const { data, error } = await vportSchema
    .from("profiles")
    .select(SELECT)
    .eq("id", vportId)
    .maybeSingle();

  if (error) raise("Failed to load Vport", { error });
  return data || null;
}

export async function getVportBySlug(slug) {
  const clean = normalizeSlug(slug);
  if (!clean) return null;

  const SELECT = "id,owner_user_id,name,slug,avatar_url,banner_url,bio,is_active,created_at,updated_at,actor_id";

  const { data, error } = await vportSchema
    .from("profiles")
    .select(SELECT)
    .eq("slug", clean)
    .maybeSingle();

  if (error) raise("Failed to load Vport", { error });
  return data || null;
}

export async function getVportsByIds(ids = []) {
  const uniq = [...new Set((ids || []).filter(Boolean))];
  if (!uniq.length) return [];

  const SELECT = "id,name,slug,avatar_url,banner_url,is_active,actor_id";

  const { data, error } = await vportSchema
    .from("profiles")
    .select(SELECT)
    .in("id", uniq);

  if (error) raise("Failed to load Vports", { error });

  const rows = data || [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  return uniq.map((id) => byId.get(id)).filter(Boolean);
}

export async function updateVport(
  vportId,
  {
    name,
    slug,
    avatarUrl,
    avatar_url,
    bannerUrl,
    banner_url,
    bio,
    is_active,
  } = {}
) {
  await requireUser();

  const patch = {};
  if (name !== undefined) patch.name = ensureString(name).trim();
  if (slug !== undefined) patch.slug = normalizeSlug(slug);

  if (avatarUrl !== undefined) patch.avatar_url = avatarUrl ?? null;
  if (avatar_url !== undefined) patch.avatar_url = avatar_url ?? patch.avatar_url ?? null;

  if (bannerUrl !== undefined) patch.banner_url = bannerUrl ?? null;
  if (banner_url !== undefined) patch.banner_url = banner_url ?? patch.banner_url ?? null;

  if (bio !== undefined) patch.bio = bio ?? null;
  if (is_active !== undefined) patch.is_active = !!is_active;

  if (Object.keys(patch).length === 0) return getVportById(vportId);

  const SELECT = "id,name,slug,avatar_url,banner_url,bio,is_active,created_at,updated_at,actor_id";

  const { data, error } = await vportSchema
    .from("profiles")
    .update(patch)
    .eq("id", vportId)
    .select(SELECT)
    .single();

  if (error) raise("Failed to update Vport", { error });

  if (data?.actor_id) {
    Promise.resolve(refreshVcActorDirectory(data.actor_id)).catch(() => {})
  }

  return data;
}

export async function softDeleteVport(vportId) {
  if (!vportId) raise("softDeleteVport: vportId is required");

  const { data, error } = await vportSchema.rpc("soft_delete_vport", {
    p_vport_id: vportId,
  });

  if (error) {
    const msg = error.message || String(error);
    if (msg.includes("AUTH_REQUIRED")) raise("Not authenticated");
    if (msg.includes("VPORT_NOT_FOUND_OR_UNAUTHORIZED")) raise("Vport not found or not owned by you");
    raise(msg, { error });
  }

  return data;
}

export async function hardDeleteVport(vportId) {
  if (!vportId) raise("hardDeleteVport: vportId is required");

  const { data, error } = await vportSchema.rpc("hard_delete_vport", {
    p_vport_id: vportId,
  });

  if (error) {
    const msg = error.message || String(error);
    if (msg.includes("AUTH_REQUIRED")) raise("Not authenticated");
    if (msg.includes("VPORT_NOT_FOUND_OR_NOT_DELETED")) raise("Vport must be soft-deleted before hard delete");
    raise(msg, { error });
  }

  return data;
}

export async function restoreVport(vportId) {
  if (!vportId) raise("restoreVport: vportId is required");

  const { data, error } = await vportSchema.rpc("restore_vport", {
    p_vport_id: vportId,
  });

  if (error) {
    const msg = error.message || String(error);
    if (msg.includes("AUTH_REQUIRED")) raise("Not authenticated");
    if (msg.includes("VPORT_NOT_FOUND_OR_NOT_DELETED")) raise("Vport not found or not currently deleted");
    raise(msg, { error });
  }

  return data;
}

export default {
  createVport,
  listMyVports,
  getVportById,
  getVportBySlug,
  getVportsByIds,
  updateVport,
  softDeleteVport,
  restoreVport,
  hardDeleteVport,
};
