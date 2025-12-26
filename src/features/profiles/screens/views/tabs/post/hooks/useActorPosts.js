import { useState, useCallback, useRef } from "react";
import { getActorPostsController } from "../controllers/getActorPosts.controller";

const PAGE_SIZE = 20;

export function useActorPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(0);
  const actorRef = useRef(null);

  // ============================================================
  // DEBUG — STATE SNAPSHOT
  // ============================================================
  // console.log("[useActorPosts][STATE]", {
  //   actorRef: actorRef.current,
  //   page: pageRef.current,
  //   postsCount: posts.length,
  //   loading,
  //   hasMore,
  // });

  // ============================================================
  // RESET
  // ============================================================
  const reset = useCallback((actorId) => {
    // console.log("[useActorPosts][RESET]", {
    //   actorId,
    //   prevActor: actorRef.current,
    // });

    actorRef.current = actorId;
    pageRef.current = 0;
    setPosts([]);
    setHasMore(true);
    setError("");
  }, []);

  // ============================================================
  // LOAD INITIAL
  // ============================================================
  const loadInitial = useCallback(async () => {
    if (!actorRef.current) return;

    // console.log("[useActorPosts][LOAD_INITIAL:START]", {
    //   actorId: actorRef.current,
    //   page: 0,
    // });

    setLoading(true);

    try {
      const result = await getActorPostsController({
        actorId: actorRef.current,
        page: 0,
        pageSize: PAGE_SIZE,
      });

      // console.log("[useActorPosts][LOAD_INITIAL:RESULT]", {
      //   count: result.posts?.length,
      //   done: result.done,
      //   sample: result.posts?.[0],
      // });

      setPosts(result.posts);
      setHasMore(!result.done);
    } catch (err) {
      // console.error("[useActorPosts][LOAD_INITIAL:ERROR]", err);
      setError(err?.message || "Failed to load posts");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // LOAD MORE
  // ============================================================
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !actorRef.current) return;

    const nextPage = pageRef.current + 1;

    // console.log("[useActorPosts][LOAD_MORE:START]", {
    //   actorId: actorRef.current,
    //   nextPage,
    // });

    setLoading(true);

    try {
      const result = await getActorPostsController({
        actorId: actorRef.current,
        page: nextPage,
        pageSize: PAGE_SIZE,
      });

      // console.log("[useActorPosts][LOAD_MORE:RESULT]", {
      //   added: result.posts?.length,
      //   done: result.done,
      // });

      pageRef.current = nextPage;
      setPosts((prev) => [...prev, ...result.posts]);
      setHasMore(!result.done);
    } catch (err) {
      // console.error("[useActorPosts][LOAD_MORE:ERROR]", err);
      setError(err?.message || "Failed to load more posts");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  return {
    posts,
    loading,
    error,
    hasMore,
    reset,
    loadInitial,
    loadMore,
  };
}
