// ============================================================
// PostDetail Screen
// - Full post view
// - Actor-based (actorId only)
// - Uses READ-MODEL comment count (aligned with Feed)
// ============================================================

import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useIdentity } from "@/state/identity/identityContext";

// Post UI
import PostHeader from "@/features/post/postcard/components/PostHeader";
import PostBody from "@/features/post/postcard/components/PostBody";
import MediaCarousel from "@/features/post/postcard/components/MediaCarousel";
import ReactionBar from "@/features/post/postcard/components/ReactionBar";

// Comments
import useCommentThread from "@/features/post/commentcard/hooks/useCommentThread";
import { usePostCommentCount } from "@/features/post/commentcard/hooks/usePostCommentCount";
import CommentList from "@/features/post/commentcard/components/CommentList";
import CommentInputView from "@/features/post/commentcard/ui/CommentInput.view";

// Data (ACTOR-BASED READ MODEL)
import { getPostById } from "@/features/post/postcard/controller/getPostById.controller";


export default function PostDetailScreen() {
  const { postId } = useParams();
  const { identity } = useIdentity();

  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);

  // 🔥 READ MODEL (authoritative comment count)
  const commentCount = usePostCommentCount(postId);

  // THREAD = sparks (detail only)
  const thread = useCommentThread(postId);

  /* ============================================================
     LOAD POST (READ MODEL — ACTOR ID ONLY)
     ============================================================ */
  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      if (!postId) return;

      setLoadingPost(true);
      try {
        const data = await getPostById(postId);
        if (!cancelled) setPost(data);
      } catch (err) {
        console.error("[PostDetail] load post failed:", err);
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    }

    loadPost();
    return () => {
      cancelled = true;
    };
  }, [postId]);
/* ============================================================
   DEBUG — POST HEADER INPUT
   ============================================================ */
useEffect(() => {
  if (!post) return;

  console.group("[PostDetail → PostHeader DEBUG]");
  console.log("post.id:", post.id);
  console.log("post.actor:", post.actor);
  console.log("post.actor?.actorId:", post.actor?.actorId);
  console.log("post.created_at:", post.created_at);
  console.log("typeof post.actor:", typeof post.actor);
  console.log("post.media:", post.media);
  console.groupEnd();
}, [post]);

  /* ============================================================
     STATES
     ============================================================ */
  if (loadingPost) {
    return (
      <div className="p-6 text-center text-neutral-400">
        Loading post…
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6 text-center text-neutral-500">
        Post not found
      </div>
    );
  }

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="w-full max-w-2xl mx-auto pb-20"
    >
      {/* ================= POST ================= */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden mb-4">
        {/* 🔒 actor === actorId (uuid) */}
        <PostHeader
          actor={post.actor.actorId}
          createdAt={post.created_at}
        />

        <div className="px-4 pb-3">
          <PostBody text={post.text} />
        </div>

        {post.media?.length > 0 && (
          <div className="px-0 pb-3">
            <MediaCarousel media={post.media} />
          </div>
        )}

        {/* ✅ SAME COUNT AS FEED */}
        <div className="px-4 pb-3">
          <ReactionBar
            postId={post.id}
            commentCount={commentCount}
          />
        </div>
      </div>

      {/* ================= SPARKS (COMMENTS THREAD) ================= */}
      <div className="bg-black/40 rounded-2xl border border-neutral-900">
        <div className="px-4 py-3 border-b border-neutral-800 text-sm text-neutral-400">
          Sparks
        </div>

        <div className="px-2">
          {thread.loading && (
            <div className="py-6 text-center text-neutral-500 text-sm">
              Loading sparks…
            </div>
          )}

          {!thread.loading && thread.comments.length === 0 && (
            <div className="py-6 text-center text-neutral-500 text-sm">
              No sparks yet. Be the first.
            </div>
          )}

          <CommentList comments={thread.comments} />
        </div>

        {thread.actorId && identity && (
          <CommentInputView
            key={thread.actorId}
            actorId={thread.actorId}
            identity={identity}
            onSubmit={thread.addComment}
            disabled={thread.posting}
          />
        )}
      </div>
    </motion.div>
  );
}
