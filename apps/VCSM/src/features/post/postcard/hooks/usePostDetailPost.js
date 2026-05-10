// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\screens\hooks\usePostDetailPost.js

import { useEffect, useState } from "react";
import { getPostById } from "@/features/post/postcard/controller/getPostById.controller";
import { getPostMentionMap } from "@/features/post/postcard/controller/getPostMentionMap.controller";

export default function usePostDetailPost(postId, viewerActorId = null) {
  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      if (!postId) return;

      setLoadingPost(true);

      try {
        const basePost = await getPostById(postId, viewerActorId);

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

        // 2) mention map for this post
        const mentionMap = await getPostMentionMap({ postId });

        const hydratedPost = {
          ...basePost,
          mentionMap,
          locationText, // ✅ now PostHeader can always use this
        };

        if (!cancelled) setPost(hydratedPost);
      } catch (err) {
        if (import.meta.env.DEV) console.error("[PostDetail] load post failed:", err);
        if (!cancelled) setPost(null);
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    }

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [postId, viewerActorId]);

  return { post, loadingPost };
}
