// src/features/actors/controllers/hydrateActors.controller.js

import { supabase } from "@/services/supabase/supabaseClient";
import { useActorStore } from "@/state/actors/actorStore";

export async function hydrateActorsFromRows(rows) {
  console.log("[hydrateActors] start");
  console.log("[hydrateActors] input rows:", rows);

  if (!Array.isArray(rows)) {
    console.warn("[hydrateActors] rows is not an array", rows);
    return;
  }

  const actorIds = [
    ...new Set(
      rows
        .map((r) =>
          r.actor_id ??
          r.actorId ??
          r.actor?.actor_id ??
          r.actor?.id ??
          r.actor?.actorId ??
          null
        )
        .filter(Boolean)
    ),
  ];

  console.log("[hydrateActors] extracted actorIds:", actorIds);

  if (!actorIds.length) {
    console.warn("[hydrateActors] no actorIds found — aborting");
    return;
  }

  const { data: actors, error: actorsError } = await supabase
    .schema("vc")
    .from("actors")
    .select("id, kind, profile_id, vport_id")
    .in("id", actorIds);

  if (actorsError) {
    console.error("[hydrateActors] failed to load actors", actorsError);
    return;
  }

  console.log("[hydrateActors] loaded actors:", actors);

  if (!actors?.length) {
    console.warn("[hydrateActors] no actors returned");
    return;
  }

  const profileIds = actors
    .filter((a) => a.kind === "user" && a.profile_id)
    .map((a) => a.profile_id);

  const vportIds = actors
    .filter((a) => a.kind === "vport" && a.vport_id)
    .map((a) => a.vport_id);

  const [pRes, vRes] = await Promise.all([
    profileIds.length
      ? supabase
          .from("profiles")
          .select("id, display_name, username, photo_url, banner_url, bio")
          .in("id", profileIds)
      : { data: [] },

    vportIds.length
      ? supabase
          .schema("vc")
          .from("vports")
          .select("id, name, slug, avatar_url, banner_url, bio")
          .in("id", vportIds)
      : { data: [] },
  ]);

  const profileMap = Object.fromEntries(
    (pRes.data || []).map((p) => [p.id, p])
  );

  const vportMap = Object.fromEntries(
    (vRes.data || []).map((v) => [v.id, v])
  );

  const hydratedActors = (actors || [])
    .map((a) => {
      if (!a?.id) return null;

      return {
        actor_id: a.id, // ✅ REQUIRED BY actorStore
        kind: a.kind,

        display_name:
          a.kind === "user"
            ? profileMap[a.profile_id]?.display_name ?? null
            : vportMap[a.vport_id]?.name ?? null,

        username:
          a.kind === "user"
            ? profileMap[a.profile_id]?.username ?? null
            : vportMap[a.vport_id]?.slug ?? null,

        photo_url:
          a.kind === "user"
            ? profileMap[a.profile_id]?.photo_url ?? null
            : vportMap[a.vport_id]?.avatar_url ?? null,

        banner_url:
          a.kind === "user"
            ? profileMap[a.profile_id]?.banner_url ?? null
            : vportMap[a.vport_id]?.banner_url ?? null,

        bio:
          a.kind === "user"
            ? profileMap[a.profile_id]?.bio ?? null
            : vportMap[a.vport_id]?.bio ?? null,
      };
    })
    .filter(Boolean);

  if (!hydratedActors.length) return;

  useActorStore.getState().upsertActors(hydratedActors);

  console.log("[hydrateActors] done");
}
