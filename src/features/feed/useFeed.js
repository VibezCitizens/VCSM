// src/features/feed/useFeed.js
import { useCallback, useRef, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import blocksDAL from '@/data/user/blocks';

function inferMediaType(url) {
  if (!url) return 'text';
  if (/\.(mp4|webm|mov)$/i.test(url)) return 'video';
  if (/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(url)) return 'image';
  return url ? 'image' : 'text';
}

export function useFeed(userId) {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [vports, setVports] = useState({});
  const [viewerIsAdult, setViewerIsAdult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef(null); // { created_at, id }

  const fetchViewer = useCallback(async () => {
    try {
      if (!userId) { setViewerIsAdult(null); return; }
      const { data, error } = await supabase
        .from('profiles')
        .select('is_adult')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      setViewerIsAdult(data?.is_adult ?? null);
    } catch {
      setViewerIsAdult(null);
    }
  }, [userId]);

  const fetchPosts = useCallback(async (fresh = false) => {
    try {
      setLoading(true);
      if (fresh) cursorRef.current = null;

      const PAGE = 10;
      let q = supabase
        .schema('vc')
        .from('posts')
        .select('id,user_id,actor_id,text,title,media_url,media_type,post_type,created_at')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE + 1);

      const after = cursorRef.current;
      if (after?.created_at) q = q.lt('created_at', after.created_at);

      const { data: rows, error } = await q;
      if (error) throw error;

      const list = Array.isArray(rows) ? rows : [];
      const hasMoreNow = list.length > PAGE;
      const pageItemsRaw = hasMoreNow ? list.slice(0, PAGE) : list;

      // ---- 1) Resolve ACTORS ----
      const actorIds = [...new Set(pageItemsRaw.map(r => r.actor_id).filter(Boolean))];
      let actorMap = {};
      if (actorIds.length) {
        const { data: actors, error: aErr } = await supabase
          .schema('vc')
          .from('actors')
          .select('id,kind,vport_id,profile_id')
          .in('id', actorIds);
        if (aErr) throw aErr;
        actorMap = (actors || []).reduce((acc, a) => { acc[a.id] = a; return acc; }, {});
      }

      // ---- 2) Profiles for user-authored posts (actor without vport_id) ----
      const userIds = [
        ...new Set(
          pageItemsRaw
            .filter(r => !actorMap[r.actor_id]?.vport_id)
            .map(r => r.user_id)
            .filter(Boolean)
        ),
      ];
      let profMap = {};
      if (userIds.length) {
        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('id,username,display_name,photo_url,is_adult,private')
          .in('id', userIds);
        if (pErr) throw pErr;
        profMap = (profs || []).reduce((acc, p) => {
          acc[p.id] = {
            id: p.id,
            username: p.username || '',
            display_name: p.display_name || '',
            photo_url: p.photo_url || '',
            is_adult: !!p.is_adult,
            private: !!p.private,
          };
          return acc;
        }, {});
      }

      // ---- 3) Vports for vport-authored posts ----
      const vportIds = [
        ...new Set(
          pageItemsRaw
            .map(r => actorMap[r.actor_id]?.vport_id || null)
            .filter(Boolean)
        ),
      ];
      let vportMap = {};
      if (vportIds.length) {
        const { data: vs, error: vErr } = await supabase
          .schema('vc')
          .from('vports')
          .select('id,name,avatar_url,slug,is_active')
          .in('id', vportIds);
        if (vErr) throw vErr;
        vportMap = (vs || []).reduce((acc, v) => {
          acc[v.id] = {
            id: v.id,
            name: v.name || 'VPORT',
            avatar_url: v.avatar_url || '/avatar.jpg',
            slug: v.slug || null,
            is_active: v.is_active !== false,
          };
          return acc;
        }, {});
      }

      // ---- 4) Blocks (viewer ↔ author) ----
      let blockedIdsByViewer = new Set();
      if (userId) {
        try {
          const rows = await blocksDAL.listMyBlocks({ limit: 1000, withReasons: false });
          blockedIdsByViewer = new Set((rows || []).map(r => r.blocked_id).filter(Boolean));
        } catch {}
      }

      // NOTE: user_blocks likely stores actor IDs for the blocked target.
      // We'll compute my actor ids (4a) and then check if *any* of my actors are blocked by authors.
      // ---- 4a) My actor ids ----
      let myActorIds = new Set();
      if (userId) {
        try {
          const { data: mine } = await supabase
            .schema('vc')
            .from('actor_owners')
            .select('actor_id')
            .eq('user_id', userId);
          myActorIds = new Set((mine || []).map(r => r.actor_id));
        } catch {}
      }

      // ---- 4b) Which authors block any of my actors? ----
      let blockedByAuthors = new Set();
      if (myActorIds.size && userIds.length) {
        try {
          const { data: bbRows } = await supabase
            .schema('vc')
            .from('user_blocks')
            .select('blocker_id, blocked_actor_id')
            .in('blocker_id', userIds) // author (user) who is the blocker
            .in('blocked_actor_id', Array.from(myActorIds)); // any of my actors
          blockedByAuthors = new Set((bbRows || []).map(r => r.blocker_id));
        } catch {}
      }

      // ---- 4c) Follows: allow private authors I follow (mirror DebugPrivacyPanel) ----
      let followerEdges = new Set();
      if (myActorIds.size && actorIds.length) {
        try {
          const { data: follows } = await supabase
            .schema('vc')
            .from('actor_follows')
            .select('follower_actor_id, followed_actor_id, is_active')
            .in('follower_actor_id', Array.from(myActorIds))
            .in('followed_actor_id', actorIds);
          (follows || []).forEach(f => {
            if (f.is_active) followerEdges.add(`${f.follower_actor_id}->${f.followed_actor_id}`);
          });
        } catch {}
      }

      function viewerFollowsAuthor(authorActorId) {
        for (const my of myActorIds) {
          if (followerEdges.has(`${my}->${authorActorId}`)) return true;
        }
        return false;
      }

      // ---- 5) Filter (privacy/blocks) and normalize ----
      const allowedUserIds = new Set(
        Object.values(profMap).filter(p => (!p.private || p.id === userId)).map(p => p.id)
      );

      const pageItems = pageItemsRaw.filter(r => {
        const actor = actorMap[r.actor_id];
        if (!actor) return false; // hidden by RLS ⇒ drop

        const isVport = !!actor.vport_id;

        if (!isVport) {
          const authorId = r.user_id;
          const authorActorId = actor.id;

          const isAuthorPublic = allowedUserIds.has(authorId);
          const isMe = authorId === userId;
          const IFollowAuthor = viewerFollowsAuthor(authorActorId);

          // allow if public, me, or I follow the private author
          if (!(isAuthorPublic || isMe || IFollowAuthor)) return false;

          // block checks (user ↔ user)
          if (blockedIdsByViewer.has(authorId)) return false;
          if (blockedByAuthors.has(authorId)) return false;
        } else {
          const vpId = actor.vport_id;
          const isActive = vportMap[vpId]?.is_active;
          if (isActive === false) return false;
        }
        return true;
      });

      const norm = pageItems.map(r => {
        const actor = actorMap[r.actor_id];
        const isVport = !!actor?.vport_id;

        if (isVport) {
          const vpId = actor.vport_id;
          return {
            id: r.id,
            authorId: vpId,
            type: 'vport',
            text: r.text || '',
            title: r.title || '',
            media_url: r.media_url || '',
            media_type: r.media_type || inferMediaType(r.media_url),
            created_at: r.created_at,
            post_type: r.post_type || 'post',
            vport: vportMap[vpId] || null,
          };
        }

        // user-authored
        return {
          id: r.id,
          authorId: r.user_id,
          type: 'user',
          text: r.text || '',
          title: r.title || '',
          media_url: r.media_url || '',
          media_type: r.media_type || inferMediaType(r.media_url),
          created_at: r.created_at,
          post_type: r.post_type || 'post',
        };
      });

      const last = norm[norm.length - 1] || null;
      if (last) cursorRef.current = { created_at: last.created_at, id: last.id };

      setHasMore(hasMoreNow);
      setPosts(prev => (fresh ? norm : [...prev, ...norm]));
      if (Object.keys(profMap).length) setProfiles(prev => ({ ...prev, ...profMap }));
      if (Object.keys(vportMap).length) setVports(prev => ({ ...prev, ...vportMap }));
    } catch (e) {
      console.warn('Fetch posts error:', e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    posts,
    profiles,
    vports,
    viewerIsAdult,
    loading,
    hasMore,
    fetchPosts,
    setPosts,
    fetchViewer,
    refresh: async () => { await fetchViewer(); await fetchPosts(true); },
  };
}
