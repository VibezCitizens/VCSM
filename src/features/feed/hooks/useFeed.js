// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\feed\hooks\useFeed.js
import { useCallback, useRef, useState, useEffect } from "react";
import { supabase } from "@/services/supabase/supabaseClient";
import { useActorStore } from "@/state/actors/actorStore";
import { filterBlockedActors } from "@/features/block/dal/block.read.dal";

// ------------------------------------------------------------
// Media type inference
// ------------------------------------------------------------
function inferMediaType(url) {
  if (!url) return "text";
  if (/\.(mp4|webm|mov)$/i.test(url)) return "video";
  if (/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(url)) return "image";
  return "image";
}

export function useFeed(viewerActorId, realmId) {
  const [posts, setPosts] = useState([]);
  const [viewerIsAdult, setViewerIsAdult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ✅ server-driven hidden posts for this viewer (persisted)
  const [hiddenPostIds, setHiddenPostIds] = useState(() => new Set());

  const cursorRef = useRef(null);
  const didInitialFetchRef = useRef(false);
  const loadingRef = useRef(false);

  const upsertActors = useActorStore((s) => s.upsertActors);

  useEffect(() => {
    console.log("[useFeed] MOUNT", { viewerActorId, realmId });
    return () => console.log("[useFeed] UNMOUNT", { viewerActorId, realmId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    didInitialFetchRef.current = false;
    cursorRef.current = null;
    loadingRef.current = false;

    setPosts([]);
    setHasMore(true);
    setLoading(false);
    setViewerIsAdult(null);

    setHiddenPostIds(new Set());
  }, [viewerActorId, realmId]);

  /* ============================================================
     VIEWER CONTEXT
     ============================================================ */
  const fetchViewer = useCallback(async () => {
    try {
      if (!viewerActorId) {
        setViewerIsAdult(null);
        return;
      }

      const { data: actor } = await supabase
        .schema("vc")
        .from("actors")
        .select("profile_id, vport_id")
        .eq("id", viewerActorId)
        .maybeSingle();

      if (actor?.vport_id) {
        setViewerIsAdult(true);
        return;
      }

      if (!actor?.profile_id) {
        setViewerIsAdult(null);
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("is_adult")
        .eq("id", actor.profile_id)
        .maybeSingle();

      setViewerIsAdult(prof?.is_adult ?? null);
    } catch {
      setViewerIsAdult(null);
    }
  }, [viewerActorId]);

  /* ============================================================
     FETCH FEED
     ============================================================ */
  const fetchPosts = useCallback(
    async (fresh = false) => {
      try {
        if (!viewerActorId || !realmId) return;
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);

        if (fresh) cursorRef.current = null;

        const PAGE = 10;

        let q = supabase
          .schema("vc")
          .from("posts")
          .select(
            "id, actor_id, text, title, media_url, media_type, post_type, created_at, realm_id, edited_at, deleted_at, deleted_by_actor_id"
          )
          .eq("realm_id", realmId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(PAGE + 1);

        if (cursorRef.current?.created_at) {
          q = q.lt("created_at", cursorRef.current.created_at);
        }

        const { data: rows } = await q;
        const list = Array.isArray(rows) ? rows : [];

        const hasMoreNow = list.length > PAGE;
        const pageRows = hasMoreNow ? list.slice(0, PAGE) : list;

        const pagePostIds = pageRows.map((r) => r.id).filter(Boolean);

        // ============================================================
        // ✅ MULTI MEDIA: fetch vc.post_media for these posts
        // ============================================================
        const mediaMap = new Map(); // post_id -> [{type,url}, ...]
        if (pagePostIds.length > 0) {
          const { data: pm, error: pmErr } = await supabase
            .schema("vc")
            .from("post_media")
            .select("post_id, url, media_type, sort_order")
            .in("post_id", pagePostIds)
            .order("sort_order", { ascending: true });

          if (!pmErr && Array.isArray(pm) && pm.length > 0) {
            for (const it of pm) {
              const pid = it?.post_id;
              const url = it?.url;
              if (!pid || !url) continue;

              const type = (it.media_type || inferMediaType(url)) === "video" ? "video" : "image";
              const arr = mediaMap.get(pid) || [];
              arr.push({ type, url });
              mediaMap.set(pid, arr);
            }
          }
        }

        // ✅ SERVER-SIDE PERSISTENT HIDE (per viewer)
        let hiddenByMeSet = new Set();
        if (pagePostIds.length > 0) {
          const { data: actions, error: actionsErr } = await supabase
            .schema("vc")
            .from("moderation_actions")
            .select("object_id, action_type, created_at")
            .eq("actor_id", viewerActorId)
            .eq("object_type", "post")
            .in("object_id", pagePostIds)
            .in("action_type", ["hide", "unhide"])
            .order("created_at", { ascending: false });

          if (!actionsErr && Array.isArray(actions) && actions.length > 0) {
            const latest = new Map(); // object_id -> action_type
            for (const a of actions) {
              const id = a?.object_id;
              if (!id) continue;
              if (latest.has(id)) continue; // newest first due to desc
              latest.set(id, a.action_type);
            }

            hiddenByMeSet = new Set(
              Array.from(latest.entries())
                .filter(([, t]) => t === "hide")
                .map(([id]) => id)
            );
          }
        }

        setHiddenPostIds((prev) => {
          const next = fresh ? new Set() : new Set(prev);
          hiddenByMeSet.forEach((id) => next.add(id));
          return next;
        });

        // ACTORS
        const actorIds = [...new Set(pageRows.map((r) => r.actor_id).filter(Boolean))];

        const { data: actors } = actorIds.length
          ? await supabase
              .schema("vc")
              .from("actors")
              .select("id, kind, profile_id, vport_id")
              .in("id", actorIds)
          : { data: [] };

        const actorMap = {};
        (actors || []).forEach((a) => (actorMap[a.id] = a));

        // BLOCK FILTER
        const blockedActorSet = await filterBlockedActors(viewerActorId, actorIds);

        // PROFILES
        const profileIds = (actors || [])
          .filter((a) => a.profile_id)
          .map((a) => a.profile_id);

        const { data: profiles } = profileIds.length
          ? await supabase
              .from("profiles")
              .select("id, display_name, username, photo_url, private")
              .in("id", profileIds)
          : { data: [] };

        const profileMap = {};
        (profiles || []).forEach((p) => (profileMap[p.id] = p));

        // VPORTS
        const vportIds = (actors || [])
          .filter((a) => a.vport_id)
          .map((a) => a.vport_id);

        const { data: vports } = vportIds.length
          ? await supabase
              .schema("vc")
              .from("vports")
              .select("id, name, slug, avatar_url, is_active")
              .in("id", vportIds)
          : { data: [] };

        const vportMap = {};
        (vports || []).forEach((v) => (vportMap[v.id] = v));

        // UPSERT ACTORS
        upsertActors(
          (actors || []).map((a) => ({
            actor_id: a.id,
            kind: a.kind,
            display_name: a.profile_id ? profileMap[a.profile_id]?.display_name ?? null : null,
            username: a.profile_id ? profileMap[a.profile_id]?.username ?? null : null,
            photo_url: a.profile_id
              ? profileMap[a.profile_id]?.photo_url ?? null
              : vportMap[a.vport_id]?.avatar_url ?? null,
            vport_name: a.vport_id ? vportMap[a.vport_id]?.name ?? null : null,
            vport_slug: a.vport_id ? vportMap[a.vport_id]?.slug ?? null : null,
          }))
        );

        // FILTER + NORMALIZE
        const normalized = pageRows
          .filter((r) => {
            if (blockedActorSet.has(r.actor_id)) return false;

            const a = actorMap[r.actor_id];
            if (!a) return false;

            if (a.vport_id) return vportMap[a.vport_id]?.is_active !== false;

            const prof = profileMap[a.profile_id];
            if (!prof) return false;

            if (!prof.private) return true;
            return a.id === viewerActorId;
          })
          .map((r) => {
            const a = actorMap[r.actor_id];
            const prof = a?.profile_id ? profileMap[a.profile_id] : null;
            const vp = a?.vport_id ? vportMap[a.vport_id] : null;

            // ✅ prefer vc.post_media, fallback to posts.media_url
            const multi = mediaMap.get(r.id) || [];
            const legacy = r.media_url
              ? [{ type: r.media_type || inferMediaType(r.media_url), url: r.media_url }]
              : [];
            const media = multi.length ? multi : legacy;

            return {
              id: r.id,
              text: r.text || "",
              title: r.title || "",
              created_at: r.created_at,
              edited_at: r.edited_at ?? null,
              deleted_at: r.deleted_at ?? null,
              deleted_by_actor_id: r.deleted_by_actor_id ?? null,
              post_type: r.post_type || "post",
              actor_id: r.actor_id,

              is_hidden_for_viewer: hiddenByMeSet.has(r.id),

              actor: {
                id: a.id,
                kind: a.kind,
                displayName: a.kind === "vport" ? vp?.name ?? null : prof?.display_name ?? null,
                username: a.kind === "vport" ? vp?.slug ?? null : prof?.username ?? null,
                avatar: a.kind === "vport" ? vp?.avatar_url ?? null : prof?.photo_url ?? null,
                vport_name: vp?.name ?? null,
                vport_slug: vp?.slug ?? null,
              },

              media,
            };
          });

        const lastRow = pageRows.at(-1);
        if (lastRow) cursorRef.current = { created_at: lastRow.created_at };

        setPosts((prev) => {
          if (fresh) return normalized;
          const map = new Map(prev.map((p) => [p.id, p]));
          normalized.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });

        setHasMore(hasMoreNow);
      } catch (e) {
        console.warn("[useFeed] error", e);
        setHasMore(false);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [viewerActorId, realmId, upsertActors]
  );

  useEffect(() => {
    if (!viewerActorId || !realmId) return;
    if (didInitialFetchRef.current) return;

    didInitialFetchRef.current = true;
    fetchPosts(true);
  }, [viewerActorId, realmId, fetchPosts]);

  return {
    posts,
    viewerIsAdult,
    loading,
    hasMore,
    fetchPosts,
    setPosts,
    fetchViewer,
    hiddenPostIds,
  };
}
