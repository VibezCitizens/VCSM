// src/state/actors/actorStore.js
import { create } from "zustand";

export const useActorStore = create((set) => ({
  actors: {},

  upsertActors(rows = []) {
    set((s) => {
      const next = { ...s.actors };

      for (const r of rows) {
        const actorId = r.actor_id ?? r.actorId ?? r.id ?? null;
        if (!actorId) continue;

        next[actorId] = {
          id: actorId,
          kind: r.kind ?? null,

          // ✅ CANONICAL (camelCase) — UI reads these
          displayName: r.display_name ?? r.displayName ?? null,
          username: r.username ?? null,
          photoUrl: r.photo_url ?? r.photoUrl ?? null,
          bannerUrl: r.banner_url ?? r.bannerUrl ?? null,
          bio: r.bio ?? null,

          // 🧠 Legacy snake_case (keep for now if other code uses it)
          display_name: r.display_name ?? r.displayName ?? null,
          photo_url: r.photo_url ?? r.photoUrl ?? null,
          banner_url: r.banner_url ?? r.bannerUrl ?? null,

          // vport fields (if needed later)
          vportName: r.vport_name ?? r.vportName ?? null,
          vportSlug: r.vport_slug ?? r.vportSlug ?? null,
          vportAvatarUrl: r.vport_avatar_url ?? r.vportAvatarUrl ?? null,
          vportBannerUrl: r.vport_banner_url ?? r.vportBannerUrl ?? null,
        };
      }

      return { actors: next };
    });
  },
}));