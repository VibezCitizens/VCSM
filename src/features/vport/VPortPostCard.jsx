import React, { useEffect, useRef, useState } from 'react';
import { Link, generatePath, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { getOrCreateConversation } from '@/features/chat/utils/getOrCreateConversation';
import { usePostReactions } from '@/features/vport/hooks/usePostReactions';
import { LIKE, DISLIKE } from '@/features/vport/constants';

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function VPortPostCard({ post, canDelete = false, onDelete }) {
  const { user: viewer } = useAuth();
  const viewerId = viewer?.id || null;
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  // ===== reactions (via your hook) =====
  const { countsByPost, myReactions, reacting, toggleReaction } =
    usePostReactions([post], viewerId, /* onAuthRequired */ undefined);

  const counts = countsByPost[post.id] || {}; // { [reaction]: number }
  const myReaction = myReactions[post.id];    // reaction | undefined

  // ===== comments / other UI =====
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [reply, setReply] = useState('');

  const ownerId = post.created_by ?? null;
  const [isSubscribed, setIsSubscribed] = useState(false);

  const v = post.vport || {
    id: post.vport_id,
    name: 'VPort',
    avatar_url: null,
    verified: false,
    city: null, region: null, country: null,
  };
  const location = [v.city, v.region, v.country].filter(Boolean).join(', ');
  const avatarSrc = v.avatar_url ? `${v.avatar_url}${v.updated_at ? `?t=${encodeURIComponent(v.updated_at)}` : ''}` : null;
  const vportHref = v?.id ? generatePath('/vports/:id', { id: v.id }) : '/vports';

  async function loadComments() {
    const { data, error } = await supabase
      .from('vport_post_comments')
      .select(`
        id, content, created_at, user_id,
        profiles!vport_post_comments_user_id_fkey ( id, display_name, photo_url, username )
      `)
      .eq('vport_post_id', post.id)
      .order('created_at', { ascending: true });
    if (!error) setComments(data || []);
  }

  async function checkSubscription() {
    if (!viewerId || !ownerId || viewerId === ownerId) return setIsSubscribed(false);
    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', viewerId)
      .eq('followed_id', ownerId)
      .maybeSingle();
    if (!error) setIsSubscribed(Boolean(data));
  }

  useEffect(() => {
    mountedRef.current = true;
    checkSubscription();
    loadComments();

    // realtime subscribe for comments only (reactions are handled by the hook’s fetch, not realtime)
    const csub = supabase
      .channel(`vp_comments_${post.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vport_post_comments', filter: `vport_post_id=eq.${post.id}` },
        loadComments
      )
      .subscribe();

    return () => { mountedRef.current = false; supabase.removeChannel(csub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, ownerId, viewerId]);

  async function handlePostComment() {
    const text = reply.trim();
    if (!text || !viewerId) return;
    const { error } = await supabase
      .from('vport_post_comments')
      .insert({ vport_post_id: post.id, user_id: viewerId, content: text });
    if (!error) setReply('');
  }

  async function handleToggleSubscribe() {
    if (!viewerId || !ownerId || viewerId === ownerId) return;
    if (isSubscribed) {
      const { error } = await supabase.from('followers').delete().eq('follower_id', viewerId).eq('followed_id', ownerId);
      if (!error) setIsSubscribed(false);
    } else {
      const { error } = await supabase.from('followers').insert({ follower_id: viewerId, followed_id: ownerId });
      if (!error) setIsSubscribed(true);
    }
  }

  async function handleMessage() {
    if (!viewerId || !ownerId || viewerId === ownerId) return;
    const convo = await getOrCreateConversation(ownerId);
    if (convo?.id) window.location.assign(`/chat/${convo.id}`);
  }

  async function handleDelete() {
    if (!canDelete) return;
    onDelete?.(post.id);
  }

  const goToVport = (e) => {
    if (!v?.id) { e.preventDefault(); return; }
    e.preventDefault();
    navigate(vportHref);
  };

  const reactionsToDisplay = [LIKE, DISLIKE];

  // Add the mapping here to translate constants to emojis for display
  const reactionEmojis = {
    [LIKE]: '👍',
    [DISLIKE]: '👎',
  };

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow mb-4 mx-2 relative text-white">
      {/* header */}
      <div className="flex items-center justify-between mb-2">
        <Link
          to={vportHref}
          onClick={goToVport}
          className="flex items-center gap-3 no-underline hover:no-underline text-white"
          aria-label={`Open ${v.name} profile`}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt={`${v.name} logo`} className="w-9 h-9 rounded-md object-cover border border-neutral-700" />
          ) : (
            <div className="w-9 h-9 rounded-md bg-neutral-700 grid place-items-center text-xs font-semibold">
              {(v.name || 'VP').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="leading-tight">
            <div className="text-sm font-medium">{v.name}</div>
            <div className="text-xs text-white/60">{timeAgo(post.created_at)}{location ? ` • ${location}` : ''}</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {viewerId && ownerId && viewerId !== ownerId && (
            <>
              <button onClick={handleToggleSubscribe} className={`text-xs px-2 py-1 rounded ${isSubscribed ? 'bg-purple-600' : 'bg-neutral-700'} text-white`}>
                {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
              <button onClick={handleMessage} className="text-xs px-2 py-1 rounded bg-neutral-700 text-white">
                Message
              </button>
            </>
          )}
          {canDelete && <button onClick={handleDelete} className="text-xs text-red-400">Delete</button>}
        </div>
      </div>

      {/* body */}
      {post.body && <p className="text-white text-sm mb-3 whitespace-pre-wrap">{post.body}</p>}

      {post.media_type === 'image' && post.media_url && (
        <div className="w-full rounded-xl overflow-hidden border border-neutral-700 mb-3">
          <img src={post.media_url} alt="" className="w-full max-h-[70vh] object-contain bg-black" />
        </div>
      )}

      {/* reactions (emoji-aware, via your hook) */}
      <div className="flex flex-wrap gap-3 items-center mb-2">
        {reactionsToDisplay.map((reaction) => {
          const n = counts[reaction] || 0;
          const active = myReaction === reaction;
          return (
            <button
              key={reaction}
              onClick={() => toggleReaction(post.id, reaction)}
              disabled={!!reacting[post.id]}
              className={`text-sm px-2 py-1 rounded transition ${
                active ? 'bg-white/10 ring-1 ring-white/40' : 'bg-neutral-700 hover:bg-neutral-600'
              }`}
              aria-pressed={active}
              title={active ? `You reacted ${reaction}` : `React ${reaction}`}
            >
              {/* Use the new mapping for the emoji display */}
              <span className="mr-1">{reactionEmojis[reaction]}</span>
              <span className="opacity-80">{n}</span>
            </button>
          );
        })}
      </div>

      {/* comment input */}
      <div className="flex mt-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="bg-neutral-900 text-white p-2 rounded-l w-full text-sm"
          placeholder="Write a comment..."
        />
        <button onClick={handlePostComment} className="bg-purple-600 px-4 rounded-r text-sm text-white">Post</button>
      </div>

      {/* comments toggle */}
      <div className="mt-2">
        {comments.length > 0 ? (
          showComments ? (
            <button onClick={() => setShowComments(false)} className="text-xs text-purple-400">Hide comments ({comments.length})</button>
          ) : (
            <button onClick={() => setShowComments(true)} className="text-xs text-purple-400">View comments ({comments.length})</button>
          )
        ) : (
          !showComments && <button onClick={() => setShowComments(true)} className="text-xs text-purple-400">Be the first to comment!</button>
        )}
      </div>

      {/* comments list */}
      {showComments && (
        <div className="space-y-2 mt-2">
          {comments.length === 0 ? (
            <p className="text-neutral-400 text-sm text-center py-2">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="text-sm text-white/90">
                <div className="flex items-center gap-2">
                  {c.profiles?.photo_url ? <img src={c.profiles.photo_url} alt="" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-neutral-700" />}
                  <span className="font-medium">{c.profiles?.display_name ?? 'User'}</span>
                  <span className="text-white/50 text-xs">{timeAgo(c.created_at)}</span>
                </div>
                <div className="ml-8">{c.content}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}