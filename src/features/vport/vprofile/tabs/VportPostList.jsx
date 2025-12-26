import { useEffect, useState, useCallback } from "react";
import supabase from '@/services/supabase/supabaseClient'; //transfer;
import PostCard from "@/features/post/components/PostCard";

export default function VportPostList({ vport }) {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Resolve ACTOR for this vport (vc.actors.vport_id is UNIQUE)
  const [actorId, setActorId] = useState(null);
  const [loadingActor, setLoadingActor] = useState(true);

  // 1) Load actorId for this vport
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!vport?.id) {
        console.warn("[VportPostList] Missing vport.id → cannot resolve actor");
        setActorId(null);
        setLoadingActor(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .schema("vc")
          .from("actors")
          .select("id")
          .eq("vport_id", vport.id)
          .maybeSingle();

        if (error) {
          console.error("[VportPostList] error resolving actorId:", error);
          if (!cancelled) {
            setActorId(null);
          }
        } else if (!cancelled) {
          setActorId(data?.id ?? null);
        }
      } catch (err) {
        console.error("[VportPostList] exception resolving actorId:", err);
        if (!cancelled) {
          setActorId(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingActor(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [vport?.id]);

  // 2) Load posts for this actor (TEXT-ONLY)
  const loadPosts = useCallback(async () => {
    if (!actorId) {
      console.warn("[VportPostList] Missing actorId → cannot load posts");
      setPosts([]);
      setLoadingPosts(false);
      return;
    }

    setLoadingPosts(true);

    const { data, error } = await supabase
      .schema("vc")
      .from("posts")
      .select(
        `
        id,
        text,
        title,
        media_type,
        media_url,
        post_type,
        tags,
        created_at,
        actor_id,
        user_id
      `
      )
      .eq("actor_id", actorId)
      .eq("media_type", "text") // ⬅️ only text posts
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[VportPostList] Supabase error:", error);
      setPosts([]);
    } else {
      const enriched = (data ?? []).map((p) => ({
        ...p,

        // Common convenience fields many cards read
        author_display_name: vport?.name ?? "VPORT",
        author_username: vport?.slug ?? null,
        author_avatar_url: vport?.avatar_url ?? null,

        // Actor-like shape some components expect
        actor: {
          id: actorId,
          kind: "vport",
          vport: {
            id: vport?.id ?? null,
            name: vport?.name ?? null,
            slug: vport?.slug ?? null,
            avatar_url: vport?.avatar_url ?? null,
          },
        },

        // Extra compatibility: some paths read `profiles` on user posts.
        profiles: {
          id: vport?.owner_user_id ?? null,
          full_name: vport?.name ?? null,
          username: vport?.slug ?? null,
          avatar_url: vport?.avatar_url ?? null,
        },
      }));

      setPosts(enriched);
    }

    setLoadingPosts(false);
  }, [
    actorId,
    vport?.id,
    vport?.name,
    vport?.slug,
    vport?.avatar_url,
    vport?.owner_user_id,
  ]);

  // Trigger load once actorId is known
  useEffect(() => {
    if (!loadingActor) {
      loadPosts();
    }
  }, [loadingActor, loadPosts]);

  if (loadingActor || loadingPosts) {
    return (
      <p className="text-center text-neutral-500 py-6">
        Loading posts…
      </p>
    );
  }

  if (!actorId) {
    return (
      <p className="text-center text-neutral-500 py-6">
        No posts yet.
      </p>
    );
  }

  if (!posts.length) {
    return (
      <p className="text-center text-neutral-500 py-6">
        No posts yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-16">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onSubscriptionChange={loadPosts} />
      ))}
    </div>
  );
}
