// src/features/notifications/notificationcenter/NotiViewPostScreen.jsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Spinner from '@/components/Spinner';
import PostCard from '@/features/post/components/PostCard';
import PostReactionsPanel from '@/features/post/components/PostReactionsPanel';

// ⬇️ actor helpers: synchronous storage + change events
import { getActor, setVportMode, onActorChange } from '@/lib/actors/actor';

export default function NotiViewPostScreen() {
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const commentId = searchParams.get('commentId') || null;

  const initialKind = useMemo(() => {
    const raw = (searchParams.get('tab') || 'rose').toLowerCase();
    const singular = raw.endsWith('s') ? raw.slice(0, -1) : raw;
    return ['rose', 'like', 'dislike'].includes(singular) ? singular : 'rose';
  }, [searchParams]);

  // —— ensure we’re acting as the VPORT if URL says so
  const urlWantsVport = (searchParams.get('as') || '').toLowerCase() === 'vport';
  const urlVportId = searchParams.get('v') || null;

  const [actorReady, setActorReady] = useState(() => {
    if (!urlWantsVport || !urlVportId) return true; // no constraint
    const cur = getActor();
    return cur?.kind === 'vport' && cur?.id === urlVportId;
  });

  useEffect(() => {
    if (!urlWantsVport || !urlVportId) return;

    // 1) force vport mode immediately (sync to localStorage)
    try {
      const cur = getActor();
      if (cur?.kind !== 'vport' || cur?.id !== urlVportId) {
        setVportMode(urlVportId);
      }
    } catch {}

    // 2) wait until actor matches, then allow render
    const unsub = onActorChange((a) => {
      if (a?.kind === 'vport' && a?.id === urlVportId) {
        setActorReady(true);
      }
    });

    // also do a quick re-check in case it was already set
    const now = getActor();
    if (now?.kind === 'vport' && now?.id === urlVportId) {
      setActorReady(true);
    }

    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlWantsVport, urlVportId]);

  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  // fetch post + author (doesn’t depend on actor)
  useEffect(() => {
    let cancelled = false;
    if (!postId) return;

    (async () => {
      setLoading(true);

      const p = await supabase
        .schema('vc')
        .from('posts')
        .select('id, created_at, user_id, media_type, title, text, media_url')
        .eq('id', postId)
        .maybeSingle();

      let normalized = null;

      if (p.data && !p.error) {
        const row = p.data;
        const rawTitle = (row.title || '').trim();
        const rawBody  = (row.text  || '').trim();

        const title = rawTitle || null;
        const body  = rawBody && rawBody !== rawTitle ? rawBody : null;

        normalized = {
          id: row.id,
          created_at: row.created_at,
          type: 'user',          // authorType for PostCard
          authorId: row.user_id,
          media_type: row.media_type || null,
          title,
          text: body,
          media_url: row.media_url || null,
          source: 'vc.posts',
          raw: row,
        };
      }

      if (!normalized) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: authorData } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url, private')
        .eq('id', normalized.authorId)
        .maybeSingle();

      if (cancelled) return;
      setPost(normalized);
      setAuthor(authorData ?? null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [postId]);

  // ——— Gate: if URL requires VPORT, don’t render content until actor is set
  if (!actorReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <Spinner />
          <span>Switching to VPORT…</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <Spinner />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        Post not available (deleted or private).
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 py-6 overflow-y-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-400 mb-4">← Back</button>

      <PostCard
        post={post}
        user={author}
        authorType={post.type}
        showComments
        commentHighlightId={commentId}
      />

      <PostReactionsPanel postId={post.id} initialKind={initialKind} />
    </div>
  );
}
