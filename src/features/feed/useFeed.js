// src/features/feed/useFeed.js
import { useCallback, useRef, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { useIdentity } from '@/state/identityContext'; // 1. ADDED

function inferMediaType(url) {
  if (!url) return 'text';
  if (/\.(mp4|webm|mov)$/i.test(url)) return 'video';
  if (/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(url)) return 'image';
  return 'text';
}

export function useFeed(userId) {
  const { identity } = useIdentity(); // 2. GET IDENTITY CONTEXT

  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [vports, setVports] = useState({});
  const [viewerIsAdult, setViewerIsAdult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef(null);

  // 3. DETERMINE THE ACTIVE ACTOR FOR ACTOR-BASED CHECKS
  const viewerActorId = identity?.actorId;
  
  const fetchViewer = useCallback(async () => {
    try {
      if (!userId) return setViewerIsAdult(null);
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
    // Add check for viewerActorId to prevent unnecessary queries if identity is loading
    if (!viewerActorId && userId) {
      // If logged in but actor ID isn't resolved yet, wait. If not logged in, viewerActorId is undefined, which is fine.
      return;
    }

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

      /* ----------------------- Resolve ACTORS ----------------------- */
      const actorIds = [...new Set(pageItemsRaw.map(r => r.actor_id).filter(Boolean))];
      let actorMap = {};
      if (actorIds.length) {
        const { data: actors, error: aErr } = await supabase
          .schema('vc')
          .from('actors')
          .select('id,kind,vport_id,profile_id');
        if (aErr) throw aErr;
        actorMap = (actors || []).reduce((acc, a) => {
          acc[a.id] = a;
          return acc;
        }, {});
      }

      /* ----------------------- Profiles ----------------------- */
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

      /* ----------------------- Vports ----------------------- */
      const vportIds = [
        ...new Set(pageItemsRaw.map(r => actorMap[r.actor_id]?.vport_id).filter(Boolean)),
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

      /* ----------------------- My Actor IDs (The Viewer's Actors) ----------------------- */
      // These are needed for two-way block/follow checks.
      let myActorIds = new Set();
      if (userId) {
        const { data: mine } = await supabase
          .schema('vc')
          .from('actor_owners')
          .select('actor_id')
          .eq('user_id', userId);
        myActorIds = new Set((mine || []).map(r => r.actor_id));
      }

      /* ----------------------- Blocked Actors ----------------------- */
      // Who I block (using the active actor for the immediate block check)
      let blockedActorIds = new Set();
      if (viewerActorId) { // 4. USE viewerActorId
        const { data: rows } = await supabase
          .schema('vc')
          .from('user_blocks')
          .select('blocked_actor_id')
          .eq('blocker_actor_id', viewerActorId); // 4. USE viewerActorId
        blockedActorIds = new Set((rows || []).map(r => r.blocked_actor_id));
      }

      // Who blocks me (check if any author blocks the ACTIVE viewer actor)
      let blockedByAuthors = new Set();
      if (viewerActorId && actorIds.length) { // 5. USE viewerActorId
        const { data: bb } = await supabase
          .schema('vc')
          .from('user_blocks')
          .select('blocker_actor_id')
          .in('blocker_actor_id', actorIds)
          .eq('blocked_actor_id', viewerActorId); // 5. USE viewerActorId
        blockedByAuthors = new Set((bb || []).map(r => r.blocker_actor_id));
      }

      /* ----------------------- Follows ----------------------- */
      // Check if the ACTIVE viewer actor follows the post authors
      let followerEdges = new Set();
      if (viewerActorId && actorIds.length) { // 6. USE viewerActorId
        const { data: follows } = await supabase
          .schema('vc')
          .from('actor_follows')
          .select('follower_actor_id,followed_actor_id,is_active')
          .eq('follower_actor_id', viewerActorId) // 6. USE viewerActorId
          .in('followed_actor_id', actorIds);
        (follows || []).forEach(f => {
          if (f.is_active) followerEdges.add(`${f.follower_actor_id}->${f.followed_actor_id}`);
        });
      }

      const viewerFollowsAuthor = (authorActorId) => {
        // 7. Simplified check using only the active actor
        return followerEdges.has(`${viewerActorId}->${authorActorId}`);
      };

      /* ----------------------- Filter Posts ----------------------- */
      const allowedUserIds = new Set(
        Object.values(profMap)
          .filter(p => !p.private || p.id === userId)
          .map(p => p.id)
      );

      const pageItems = pageItemsRaw.filter(r => {
        const actor = actorMap[r.actor_id];
        if (!actor) return false;

        const authorActorId = actor.id;
        const isVport = !!actor.vport_id;

        // Check block status first, using the active viewer actor's relationship
        if (blockedActorIds.has(authorActorId)) return false; // Author is blocked by the viewerActorId
        if (blockedByAuthors.has(authorActorId)) return false; // ViewerActorId is blocked by the author

        if (!isVport) {
          const authorId = r.user_id;
          const isAuthorPublic = allowedUserIds.has(authorId);
          const isMe = authorId === userId;
          const iFollow = viewerFollowsAuthor(authorActorId);

          // visibility
          if (!(isAuthorPublic || isMe || iFollow)) return false;
        } else {
          const vpId = actor.vport_id;
          if (vportMap[vpId]?.is_active === false) return false;

          // The block checks are now handled above, before the user/vport split
        }

        return true;
      });

      /* ----------------------- Normalize Output ----------------------- */
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
            media_type: inferMediaType(r.media_url),
            created_at: r.created_at,
            post_type: r.post_type || 'post',
            vport: vportMap[vpId] || null,
          };
        }

        return {
          id: r.id,
          authorId: r.user_id,
          type: 'user',
          text: r.text || '',
          title: r.title || '',
          media_url: r.media_url || '',
          media_type: inferMediaType(r.media_url),
          created_at: r.created_at,
          post_type: r.post_type || 'post',
        };
      });

      const last = norm[norm.length - 1];
      if (last) cursorRef.current = { created_at: last.created_at, id: last.id };

      setHasMore(hasMoreNow);
      setPosts(prev => (fresh ? norm : [...prev, ...norm]));
      setProfiles(prev => ({ ...prev, ...profMap }));
      setVports(prev => ({ ...prev, ...vportMap }));
    } catch (e) {
      console.warn('Fetch posts error:', e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [userId, viewerActorId]); // 8. ADD viewerActorId to dependencies

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