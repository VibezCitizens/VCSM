// src/state/actors/actorStore.js
import { create } from "zustand";

export const useActorStore = create((set) => ({
  actors: {},

  upsertActors(rows = []) {
  set((s) => {
    const next = { ...s.actors };

    for (const r of rows) {
      next[r.actor_id] = {
        id: r.actor_id,
        kind: r.kind,

        // ✅ CANONICAL (camelCase) — UI reads these
        displayName: r.display_name ?? null,
        username: r.username ?? null,
        photoUrl: r.photo_url ?? null,
        bannerUrl: r.banner_url ?? null,
        bio: r.bio ?? null,

        // 🧠 Legacy snake_case (keep for now if other code uses it)
        display_name: r.display_name ?? null,
        photo_url: r.photo_url ?? null,
        banner_url: r.banner_url ?? null,

        // vport fields (if needed later)
        vportName: r.vport_name ?? null,
        vportSlug: r.vport_slug ?? null,
        vportAvatarUrl: r.vport_avatar_url ?? null,
        vportBannerUrl: r.vport_banner_url ?? null,
      };
    }

    return { actors: next };
  });
}
,
}));
