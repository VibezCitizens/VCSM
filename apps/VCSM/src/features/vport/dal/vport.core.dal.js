// Minimal data-layer for VPORTs under schema `vc`.

import supabase from "@/services/supabase/supabaseClient";
import vc from "@/services/supabase/vcClient";
import { refreshVcActorDirectory } from "@/features/identity/dal/refreshActorDirectory.dal";

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

export async function createVport({
  name,
  slug = null,
  avatarUrl,
  bio,
  bannerUrl,
  vportType,
} = {}) {
  await requireUser();

  const cleanName = ensureString(name).trim();
  if (!cleanName) raise("Vport name is required");

  const cleanSlugBase = normalizeSlug(slug);
  const cleanType = ensureString(vportType).trim().toLowerCase() || null;

  if (import.meta.env.DEV) {
    console.log('[VportCreate] START', { name: cleanName, type: cleanType })
  }

  const { data, error } = await vc.rpc("create_vport", {
    p_name: cleanName,
    p_slug: cleanSlugBase,
    p_avatar_url: avatarUrl ?? null,
    p_bio: bio ?? null,
    p_banner_url: bannerUrl ?? null,
    p_vport_type: cleanType,
  });

  if (error) {
    const msg = error.message || String(error);
    if (msg.includes("not authenticated")) raise("Not authenticated");
    if (msg.includes("owner profile") || msg.includes("23503")) {
      raise("Owner profile not found. Ensure profiles row exists for this user.");
    }
    // Pass through the RPC's own error message — do not rewrite it
    raise(msg, { error });
  }

  if (!data || typeof data !== "object" || !data.ok) {
    raise("create_vport failed");
  }

  if (import.meta.env.DEV) {
    console.log('[VportCreate] SUCCESS', {
      vport_id: data.vport_id,
      actor_id: data.actor_id,
      actor_link_id: data.actor_link_id ?? null,
      user_app_account_id: data.user_app_account_id ?? null,
      slug: data.slug,
    })

    // Post-create: snapshot actor links + prefs for this account
    try {
      const uaaId = data.user_app_account_id
      if (uaaId) {
        const [linksRes, prefsRes, stateRes] = await Promise.all([
          supabase.schema('platform').from('user_app_actor_links')
            .select('id, actor_id, actor_kind, is_primary, is_switchable, status')
            .eq('user_app_account_id', uaaId),
          supabase.schema('platform').from('user_app_preferences')
            .select('active_actor_link_id, last_actor_link_id')
            .eq('user_app_account_id', uaaId)
            .maybeSingle(),
          supabase.schema('platform').from('user_app_state')
            .select('last_actor_link_id, onboarding_status, requires_onboarding')
            .eq('user_app_account_id', uaaId)
            .maybeSingle(),
        ])
        console.log('[VportCreate] POST_CREATE_LINKS', {
          uaaId,
          linkCount: linksRes.data?.length ?? 0,
          links: (linksRes.data ?? []).map(l => ({
            id: l.id?.slice(0, 8),
            actorId: l.actor_id?.slice(0, 8),
            kind: l.actor_kind,
            primary: l.is_primary,
            status: l.status,
          })),
        })
        console.log('[VportCreate] POST_CREATE_PREFS', prefsRes.data)
        console.log('[VportCreate] POST_CREATE_STATE', stateRes.data)
      }
    } catch (snapErr) {
      console.warn('[VportCreate] snapshot failed', snapErr?.message)
    }
  }

  // Refresh actor directory projection (non-fatal)
  if (data.actor_id) refreshVcActorDirectory(data.actor_id)

  // The RPC is the single source of truth. Return its payload directly
  // with camelCase aliases for convenience.
  return {
    ok: true,
    vport_id: data.vport_id,
    actor_id: data.actor_id,
    actor_link_id: data.actor_link_id ?? null,
    user_app_account_id: data.user_app_account_id ?? null,
    slug: data.slug,
    handle: data.handle,
    name: data.name,
    vport_type: data.vport_type,
    // camelCase aliases
    vportId: data.vport_id,
    actorId: data.actor_id,
    actorLinkId: data.actor_link_id ?? null,
    userAppAccountId: data.user_app_account_id ?? null,
    vportType: data.vport_type,
  };
}

export async function listMyVports() {
  const user = await requireUser();
  const { data, error } = await vc
    .from("vports")
    .select("id, name, slug, avatar_url, banner_url, bio, is_active, created_at")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) raise("Failed to load your Vports", { error });
  return data || [];
}

export async function getVportById(vportId) {
  const { data, error } = await vc
    .from("vports")
    .select("id, owner_user_id, name, slug, avatar_url, banner_url, bio, is_active, created_at, updated_at")
    .eq("id", vportId)
    .single();

  if (error) raise("Failed to load Vport", { error });
  return data || null;
}

export async function getVportBySlug(slug) {
  const clean = normalizeSlug(slug);
  if (!clean) return null;

  const { data, error } = await vc
    .from("vports")
    .select("id, owner_user_id, name, slug, avatar_url, banner_url, bio, is_active, created_at, updated_at")
    .eq("slug", clean)
    .maybeSingle();

  if (error) raise("Failed to load Vport", { error });
  return data || null;
}

export async function getVportsByIds(ids = []) {
  const uniq = [...new Set((ids || []).filter(Boolean))];
  if (!uniq.length) return [];
  const { data, error } = await vc
    .from("vports")
    .select("id, name, slug, avatar_url, banner_url, is_active")
    .in("id", uniq);
  if (error) raise("Failed to load Vports", { error });
  return data || [];
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

  const { data, error } = await vc
    .from("vports")
    .update(patch)
    .eq("id", vportId)
    .select("id, name, slug, avatar_url, banner_url, bio, is_active, created_at, updated_at")
    .single();

  if (error) raise("Failed to update Vport", { error });

  // Refresh actor directory projection (non-fatal)
  try {
    const { data: actor } = await vc.from('actors').select('id').eq('vport_id', vportId).eq('kind', 'vport').maybeSingle()
    if (actor?.id) refreshVcActorDirectory(actor.id)
  } catch {}

  return data;
}

export default {
  createVport,
  listMyVports,
  getVportById,
  getVportBySlug,
  getVportsByIds,
  updateVport,
};
