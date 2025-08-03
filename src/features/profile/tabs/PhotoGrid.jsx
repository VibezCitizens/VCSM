// PhotoGrid.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import ImageViewerModal from './components/ImageViewerModal';
import CommentModal from './components/CommentModal';
import {
  toggleReaction as toggleReactionAPI,
  sendRose as sendRoseAPI,
} from '@/lib/postReactions';

// Helper: Enrich posts with reaction + comment counts
async function enrichImagePosts(posts, userId) {
  const postIds = posts.map((p) => p.id);

  // 🔥 Fetch reactions
  const { data: reactions, error: reactionErr } = await supabase
    .from('post_reactions')
    .select('post_id, user_id, type')
    .in('post_id', postIds);

  // 🔥 Fetch comment counts
  const { data: comments, error: commentErr } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds);

  if (reactionErr || commentErr) {
    console.error('Failed to enrich posts', { reactionErr, commentErr });
    return posts;
  }

  const commentMap = {};
  comments.forEach((c) => {
    commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1;
  });

  // 🔥 Attach counts + user reaction
  return posts.map((post) => {
    const reactionsForPost = reactions.filter((r) => r.post_id === post.id);
    const userReaction = reactionsForPost.find((r) => r.user_id === userId);
    return {
      ...post,
      likeCount: reactionsForPost.filter((r) => r.type === 'like').length,
      dislikeCount: reactionsForPost.filter((r) => r.type === 'dislike').length,
      roseCount: reactionsForPost.filter((r) => r.type === 'rose').length,
      commentCount: commentMap[post.id] || 0,
      userHasReacted: userReaction?.type || null,
    };
  });
}

export default function PhotoGrid({ posts = [], handleShare }) {
  const { user } = useAuth();

  // 🔥 Only use enrichedPosts for UI and modal
  const [enrichedPosts, setEnrichedPosts] = useState([]);
  const [showViewer, setShowViewer] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // 🔥 Filter image posts
  const imagePosts = posts.filter(
    (p) => p.media_type === 'image' && p.media_url
  );

  // 🔥 Load enriched posts once
  useEffect(() => {
    const loadEnriched = async () => {
      const enriched = await enrichImagePosts(imagePosts, user?.id);
      setEnrichedPosts(enriched);
    };
    if (user?.id && imagePosts.length > 0) {
      loadEnriched();
    }
  }, [imagePosts, user?.id]);

  // 🔥 Toggle reactions
  const toggleReaction = async (postId, type) => {
    if (!user?.id) return;
    await toggleReactionAPI(postId, user.id, type);
    const updated = await enrichImagePosts(imagePosts, user.id);
    setEnrichedPosts(updated);
  };

  // 🔥 Send rose
  const sendRose = async (postId) => {
    if (!user?.id) return;
    await sendRoseAPI(postId, user.id);
    const updated = await enrichImagePosts(imagePosts, user.id);
    setEnrichedPosts(updated);
  };

  // 🔥 Default share logic
  const defaultHandleShare = (post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Check this out!',
        text: 'Look what I found on Vibez Citizens!',
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard');
    }
  };

  // 🔥 Empty state
  if (enrichedPosts.length === 0) {
    return (
      <div className="text-center text-neutral-400 py-10">
        No images yet.
      </div>
    );
  }

  return (
    <>
      {/* 🔥 Display enrichedPosts so the index matches modal */}
      <div className="grid grid-cols-3 gap-1 p-2">
        {enrichedPosts.map((post, index) => (
          <img
            key={post.id}
            src={post.media_url}
            alt="Post"
            className="w-full aspect-square object-cover cursor-pointer"
            onClick={() => {
              setActiveIndex(index); // 🔥 Exact match with enrichedPosts
              setShowViewer(true);
            }}
            loading="lazy"
          />
        ))}
      </div>

      {/* 🔥 Image viewer modal */}
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

      {/* 🔥 Comments modal */}
      {showComments && (
        <CommentModal
          postId={selectedPostId}
          onClose={() => setShowComments(false)}
        />
      )}
    </>
  );
}