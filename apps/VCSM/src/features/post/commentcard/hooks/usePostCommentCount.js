// src/features/post/commentcard/hooks/usePostCommentCount.js

import { useEffect, useState } from 'react';
import { getPostCommentCount } from '@/features/post/commentcard/controller/postComments.count.controller';

export function usePostCommentCount(postId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!postId) return;

    let alive = true;

    getPostCommentCount(postId)
      .then((c) => {
        if (alive) setCount(c);
      })
      .catch((err) => {
        console.error('[usePostCommentCount] failed:', err);
      });

    return () => {
      alive = false;
    };
  }, [postId]);

  return count;
}
