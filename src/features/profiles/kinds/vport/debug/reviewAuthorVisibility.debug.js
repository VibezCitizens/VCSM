// src/features/profiles/kinds/vport/debug/reviewAuthorVisibility.debug.js
import { supabase } from "@/services/supabase/supabaseClient";

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function normalizeId(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

export async function debugCheckAuthorVisibilityClient({
  authorIds,
  table = { schema: "vc", name: "actors" },
}) {
  const ids = uniq(authorIds).map(normalizeId).filter(Boolean);

  if (!ids.length) {
    return {
      ok: true,
      requested: 0,
      visibleCount: 0,
      notVisibleIds: [],
      visibleById: {},
      rawVisibleRows: [],
      rowsForStore: [],
      note: "No authorIds provided.",
    };
  }

  // 1) actors (RLS-gated)
  const { data: actorsData, error: actorsError } = await supabase
    .schema(table.schema)
    .from(table.name)
    .select("id, kind, profile_id, vport_id, is_void")
    .in("id", ids)
    .limit(500);

  if (actorsError) {
    return {
      ok: false,
      requested: ids.length,
      visibleCount: 0,
      notVisibleIds: ids,
      visibleById: {},
      rawVisibleRows: [],
      rowsForStore: [],
      error: actorsError,
      note: "Actor query errored (schema/table wrong or permission denied).",
    };
  }

  const rawVisibleRows = Array.isArray(actorsData) ? actorsData : [];
  const visibleById = {};
  for (const r of rawVisibleRows) visibleById[r.id] = r;

  const notVisibleIds = ids.filter((id) => !visibleById[id]);

  // 2) collect join keys
  const profileIds = [];
  const vportIds = [];

  for (const a of rawVisibleRows) {
    if (a?.kind === "user") {
      const pid = normalizeId(a?.profile_id);
      if (pid) profileIds.push(pid);
    } else if (a?.kind === "vport") {
      const vid = normalizeId(a?.vport_id);
      if (vid) vportIds.push(vid);
    }
  }

  // 3) fetch profiles
  let profilesById = {};
  if (profileIds.length) {
    const { data: profs, error: profErr } = await supabase
      .schema("public")
      .from("profiles")
      .select("id, display_name, username, photo_url, private")
      .in("id", uniq(profileIds))
      .limit(500);

    if (!profErr && Array.isArray(profs)) {
      profilesById = Object.fromEntries(profs.map((p) => [p.id, p]));
    }
  }

  // 4) fetch vports
  let vportsById = {};
  if (vportIds.length) {
    const { data: vps, error: vpErr } = await supabase
      .schema("vc")
      .from("vports")
      .select("id, name, slug, avatar_url, banner_url")
      .in("id", uniq(vportIds))
      .limit(500);

    if (!vpErr && Array.isArray(vps)) {
      vportsById = Object.fromEntries(vps.map((v) => [v.id, v]));
    }
  }

  // 5) build rowsForStore (actor_id keyed)
  const rowsForStore = rawVisibleRows.map((a) => {
    if (a.kind === "user") {
      const p = profilesById[a.profile_id] || null;
      return {
        id: a.id,
        kind: "user",
        display_name: p?.display_name ?? null,
        username: p?.username ?? null,
        photo_url: p?.photo_url ?? null,
        private: p?.private ?? null,
      };
    }

    if (a.kind === "vport") {
      const v = vportsById[a.vport_id] || null;
      return {
        id: a.id,
        kind: "vport",
        vport_name: v?.name ?? null,
        vport_slug: v?.slug ?? null,
        vport_avatar_url: v?.avatar_url ?? null,
        vport_banner_url: v?.banner_url ?? null,
      };
    }

    return { id: a.id, kind: a.kind ?? null };
  });

  return {
    ok: true,
    requested: ids.length,
    visibleCount: rawVisibleRows.length,
    notVisibleIds,
    visibleById,
    rawVisibleRows,
    rowsForStore,
    note:
      notVisibleIds.length > 0
        ? "Some authorIds are not visible to the client (RLS filtering or missing rows)."
        : "All authorIds are visible. rowsForStore includes joined profile/vport fields for hydration.",
  };
}