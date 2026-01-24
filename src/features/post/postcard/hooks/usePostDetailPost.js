// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\screens\hooks\usePostDetailPost.js

import { useEffect, useState } from "react";
import { getPostById } from "@/features/post/postcard/controller/getPostById.controller";

export default function usePostDetailPost(postId) {
  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);

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
        if (!cancelled) setPost(null);
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    }

    loadPost();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  return { post, loadingPost };
}
