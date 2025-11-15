// src/features/posts/PhotoGrid.jsx
import { useEffect, useMemo, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import ImageViewerModal from './components/ImageViewerModal';
import CommentModal from './components/CommentModal';
import {
  toggleReaction as toggleReactionAPI,
  sendRose as sendRoseAPI,
} from '@/lib/postReactions';

// --- helper: resolve the current user's actor_id once ---
async function getActorIdForUser(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actor_owners')
    .select('actor_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[PhotoGrid] failed to resolve actor_id', error);
    return null;
  }
  return data?.actor_id ?? null;
}

// Helper: Enrich posts with reaction + comment counts (vc schema)
async function enrichImagePosts(posts, actorId) {
  const postIds = posts.map((p) => p.id);
  if (postIds.length === 0) return [];

  // NOTE: correct columns -> post_id, actor_id, reaction
  const { data: reactions, error: reactionErr } = await supabase
    .schema('vc')
    .from('post_reactions')
    .select('post_id, actor_id, reaction')
    .in('post_id', postIds);

  const { data: comments, error: commentErr } = await supabase
    .schema('vc')
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds);

  if (reactionErr || commentErr) {
    console.error('Failed to enrich posts', { reactionErr, commentErr });
    return posts;
  }

  const commentMap = {};
  (comments || []).forEach((c) => {
    commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1;
  });

  return posts.map((post) => {
    const rForPost = (reactions || []).filter((r) => r.post_id === post.id);
    const userReaction = actorId ? rForPost.find((r) => r.actor_id === actorId) : null;

    return {
      ...post,
      likeCount:    rForPost.filter((r) => r.reaction === 'like').length,
      dislikeCount: rForPost.filter((r) => r.reaction === 'dislike').length,
      roseCount:    rForPost.filter((r) => r.reaction === 'rose').length,
      commentCount: commentMap[post.id] || 0,
      userHasReacted: userReaction?.reaction || null,
    };
  });
}

export default function PhotoGrid({ posts = [], handleShare }) {
  const { user } = useAuth();
  const [actorId, setActorId] = useState(null);
  const [enrichedPosts, setEnrichedPosts] = useState([]);
  const [showViewer, setShowViewer] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Memoize to avoid new array identity each render
  const imagePosts = useMemo(
    () => posts.filter((p) => p.media_type === 'image' && p.media_url),
    [posts]
  );

  // resolve actor once per user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        setActorId(null);
        return;
      }
      const id = await getActorIdForUser(user.id);
      if (!cancelled) setActorId(id);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    const loadEnriched = async () => {
      const enriched = await enrichImagePosts(imagePosts, actorId);
      setEnrichedPosts(enriched);
    };
    if (actorId && imagePosts.length > 0) {
      loadEnriched();
    } else {
      setEnrichedPosts([]);
    }
  }, [imagePosts, actorId]);

  useEffect(() => {
    if (activeIndex !== null && activeIndex >= enrichedPosts.length) {
      setActiveIndex(enrichedPosts.length ? enrichedPosts.length - 1 : null);
    }
  }, [enrichedPosts.length, activeIndex]);

  const toggleReaction = async (postId, type) => {
    if (!actorId) return;
    // API resolves current actor internally
    await toggleReactionAPI(postId, type);
    const updated = await enrichImagePosts(imagePosts, actorId);
    setEnrichedPosts(updated);
  };

  const sendRose = async (postId) => {
    if (!actorId) return;
    await sendRoseAPI(postId);
    const updated = await enrichImagePosts(imagePosts, actorId);
    setEnrichedPosts(updated);
  };

  const defaultHandleShare = (post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: post.title || 'Check this out!',
          text: 'Look what I found on Vibez Citizens!',
          url: shareUrl,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard');
    }
  };

  if (enrichedPosts.length === 0) {
    return <div className="text-center text-neutral-400 py-10">No images yet.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1 p-2">
        {enrichedPosts.map((post, index) => (
          <img
            key={post.id}
            src={post.media_url}
            alt="Post"
            className="w-full aspect-square object-cover cursor-pointer"
            onClick={() => {
              setActiveIndex(index);
              setShowViewer(true);
            }}
            loading="lazy"
          />
        ))}
      </div>

      {showViewer && activeIndex !== null && (
        <ImageViewerModal
          imagePosts={enrichedPosts}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onClose={() => setShowViewer(false)}
          toggleReaction={toggleReaction}
          sendRose={sendRose}
          handleShare={handleShare || defaultHandleShare}
          openComments={(postId) => {
            setSelectedPostId(postId);
            setShowComments(true);
          }}
        />
      )}

      {showComments && (
        <CommentModal postId={selectedPostId} onClose={() => setShowComments(false)} />
      )}
    </>
  );
}
