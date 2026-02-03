// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\screens\hooks\usePostDetailPost.js

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase/supabaseClient";
import { getPostById } from "@/features/post/postcard/controller/getPostById.controller";

function makeActorRoute({ kind, username, actorId, vportId }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport" && vportId) return `/vport/${vportId}`;
  if (actorId) return `/profile/${actorId}`;
  return "/feed";
}

export default function usePostDetailPost(postId) {
  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      if (!postId) return;

      setLoadingPost(true);

      try {
        // 1) base post (your existing controller)
        const basePost = await getPostById(postId);

        if (!basePost) {
          if (!cancelled) setPost(null);
          return;
        }

        // ✅ normalize location here (detail endpoint shape may differ)
        const locationText = String(
          basePost.location_text ??
            basePost.locationText ??
            basePost.location_name ??
            basePost.location ??
            basePost.place_name ??
            basePost.place ??
            basePost.geo ??
            basePost.geo_name ??
            ""
        ).trim();

        // 2) mentions for this post
        const { data: mentionRows, error: mentionErr } = await supabase
          .schema("vc")
          .from("post_mentions")
          .select("mentioned_actor_id")
          .eq("post_id", postId);

        if (mentionErr) {
          console.warn("[usePostDetailPost] mention fetch failed:", mentionErr);
        }

        const mentionedActorIds = (mentionRows || [])
          .map((r) => r.mentioned_actor_id)
          .filter(Boolean);

        let mentionMap = {};

        if (mentionedActorIds.length > 0) {
          // 3) load vc.actors (PK is `id`)
          const { data: actors, error: actorsErr } = await supabase
            .schema("vc")
            .from("actors")
            .select("id, kind, profile_id, vport_id")
            .in("id", mentionedActorIds);

          if (actorsErr) {
            console.warn("[usePostDetailPost] actors fetch failed:", actorsErr);
          } else {
            const userProfileIds = [];
            const vportIds = [];

            for (const a of actors || []) {
              if (a?.kind === "user" && a?.profile_id) userProfileIds.push(a.profile_id);
              if (a?.kind === "vport" && a?.vport_id) vportIds.push(a.vport_id);
            }

            // 4) load user profile presentation fields (public.profiles)
            const profilesById = new Map();
            if (userProfileIds.length > 0) {
              const { data: profiles, error: pErr } = await supabase
                .from("profiles")
                .select("id, username, display_name, photo_url")
                .in("id", userProfileIds);

              if (pErr) {
                console.warn("[usePostDetailPost] profiles fetch failed:", pErr);
              } else {
                for (const p of profiles || []) profilesById.set(p.id, p);
              }
            }

            // 5) load vport presentation fields (vc.vports)
            const vportsById = new Map();
            if (vportIds.length > 0) {
              const { data: vports, error: vErr } = await supabase
                .schema("vc")
                .from("vports")
                .select("id, slug, name, avatar_url")
                .in("id", vportIds);

              if (vErr) {
                console.warn("[usePostDetailPost] vports fetch failed:", vErr);
              } else {
                for (const v of vports || []) vportsById.set(v.id, v);
              }
            }

            // 6) build mentionMap keyed by handle in text (lowercase)
            for (const a of actors || []) {
              const actorId = a?.id;
              if (!actorId) continue;

              let username = null;
              let displayName = null;
              let avatar = null;
              let vportId = null;

              if (a.kind === "user") {
                const p = profilesById.get(a.profile_id);
                username = p?.username ?? null;
                displayName = p?.display_name ?? p?.username ?? null;
                avatar = p?.photo_url ?? "/avatar.jpg";
              } else if (a.kind === "vport") {
                vportId = a.vport_id ?? null;
                const v = vportsById.get(a.vport_id);
                username = v?.slug ?? null;
                displayName = v?.name ?? v?.slug ?? null;
                avatar = v?.avatar_url ?? "/avatar.jpg";
              }

              if (!username) continue;

              const handleKey = String(username).toLowerCase();

              mentionMap[handleKey] = {
                id: actorId,
                kind: a.kind,
                displayName,
                username,
                avatar,
                route: makeActorRoute({
                  kind: a.kind,
                  username,
                  actorId,
                  vportId,
                }),
              };
            }
          }
        }

        const hydratedPost = {
          ...basePost,
          mentionMap,
          locationText, // ✅ now PostHeader can always use this
        };

        if (!cancelled) setPost(hydratedPost);
      } catch (err) {
        console.error("[PostDetail] load post failed:", err);
        if (!cancelled) setPost(null);
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    }

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  return { post, loadingPost };
}
