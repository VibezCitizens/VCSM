// File: src/features/gallery/PhotoGrid.jsx (or wherever you keep it)
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import ImageViewerModal from './components/ImageViewerModal';
import CommentModal from './components/CommentModal';

// ✅ New helpers aligned to rebuilt schema
import { setReaction, giveRoses } from '@/lib/reactions';

/* -------------------------- enrichment (new schema) -------------------------- */
/**
 * Enrich posts with:
 *  - likeCount / dislikeCount / roseCount (from posts denorm fields)
 *  - userHasReacted: 'like' | 'dislike' | null (from post_reactions.reaction for current user)
 *  - commentCount
 */
async function enrichImagePosts(posts, userId) {
  if (!posts?.length) return [];

  const postIds = posts.map((p) => p.id);

  // 1) Pull denormalized counters from posts (FAST)
  const { data: postRows, error: postErr } = await supabase
    .from('posts')
    .select('id, like_count, dislike_count, rose_count')
    .in('id', postIds);

  // 2) Pull current viewer's reaction per post (if logged in)
  let myReacts = [];
  if (userId) {
    const { data: reacts, error: reactErr } = await supabase
      .from('post_reactions')
      .select('post_id, reaction') // ✅ no id, no type
      .eq('user_id', userId)
      .in('post_id', postIds);
    if (reactErr) console.error('post_reactions select error', reactErr);
    else myReacts = reacts || [];
  }

  // 3) Comment counts (simple count by post_id)
  const { data: comments, error: commentErr } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds);

  if (postErr || commentErr) {
    console.error('Failed to enrich posts', { postErr, commentErr });
  }

  const countByPost = {};
  (comments || []).forEach((c) => {
    countByPost[c.post_id] = (countByPost[c.post_id] || 0) + 1;
  });

  const countersById = Object.fromEntries(
    (postRows || []).map((r) => [
      r.id,
      {
        likeCount: r.like_count ?? 0,
        dislikeCount: r.dislike_count ?? 0,
        roseCount: r.rose_count ?? 0,
      },
    ])
  );

  const myReactionByPost = Object.fromEntries(
    myReacts.map((r) => [r.post_id, r.reaction]) // 'like' | 'dislike'
  );

  return posts.map((post) => {
    const ctrs = countersById[post.id] || { likeCount: 0, dislikeCount: 0, roseCount: 0 };
    return {
      ...post,
      ...ctrs,
      commentCount: countByPost[post.id] || 0,
      userHasReacted: myReactionByPost[post.id] ?? null, // 'like' | 'dislike' | null
    };
  });
}

/* -------------------------------- component -------------------------------- */

export default function PhotoGrid({ posts = [], handleShare }) {
  const { user } = useAuth();

  // Only use enrichedPosts for UI and modal (to keep index aligned)
  const [enrichedPosts, setEnrichedPosts] = useState([]);
  const [showViewer, setShowViewer] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Filter only image posts
  const imagePosts = posts.filter((p) => p.media_type === 'image' && p.media_url);

  // Load enriched posts whenever input posts or user changes
  useEffect(() => {
    let alive = true;
    const loadEnriched = async () => {
      try {
        const enriched = await enrichImagePosts(imagePosts, user?.id || null);
        if (alive) setEnrichedPosts(enriched);
      } catch (e) {
        console.error('loadEnriched error', e);
      }
    };
    if (imagePosts.length > 0) loadEnriched();
    else setEnrichedPosts([]);
    return () => {
      alive = false;
    };
  }, [imagePosts, user?.id]);

  /* ------------------------------ actions (UI) ------------------------------ */

  // Keep the same function signature for the modal, but call the new API.
  const toggleReaction = async (postId, type) => {
    if (!user?.id) return;
    // type: 'like' | 'dislike' | null
    await setReaction(postId, type);
    const updated = await enrichImagePosts(imagePosts, user.id);
    setEnrichedPosts(updated);
  };

  const sendRose = async (postId, qty = 1) => {
    if (!user?.id) return;
    await giveRoses(postId, qty);
    const updated = await enrichImagePosts(imagePosts, user.id);
    setEnrichedPosts(updated);
  };

  /* ------------------------------ share fallback ---------------------------- */

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

  /* ---------------------------------- UI ---------------------------------- */

  if (enrichedPosts.length === 0) {
    return <div className="text-center text-neutral-400 py-10">No images yet.</div>;
  }

  return (
    <>
      {/* Show enrichedPosts so index matches the modal */}
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

      {/* Image viewer modal */}
      {showViewer && activeIndex !== null && (
        <ImageViewerModal
          imagePosts={enrichedPosts}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onClose={() => setShowViewer(false)}
          toggleReaction={toggleReaction} // uses setReaction() inside
          sendRose={sendRose}             // uses giveRoses() inside
          handleShare={handleShare || defaultHandleShare}
          openComments={(postId) => {
            setSelectedPostId(postId);
            setShowComments(true);
          }}
        />
      )}

      {/* Comments modal */}
      {showComments && (
        <CommentModal postId={selectedPostId} onClose={() => setShowComments(false)} />
      )}
    </>
  );
}
