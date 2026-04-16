import { useEffect, useState } from "react";
import { getProfileView } from "@/features/profiles/controller/getProfileView.controller";

export function useProfileView({
  viewerActorId,
  profileActorId,
  canViewContent,
  version = 0, // ✅ ADD (force reload)
}) {
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Gate still resolving — don't fetch yet. This prevents the double-fetch
    // caused by canViewContent transitioning from undefined → true/false.
    if (canViewContent === undefined) return;

    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setLoadingPosts(true);
        setError(null);

        const result = await getProfileView({
          viewerActorId,
          profileActorId,
          canViewContent,
        });

        if (!alive) return;
        setProfile(result.profile);
        setPosts(Array.isArray(result.posts) ? result.posts : []);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) {
          setLoading(false);
          setLoadingPosts(false);
        }
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [viewerActorId, profileActorId, canViewContent, version]);

  return {
    loading,
    loadingPosts,
    error,
    profile,
    posts,
  };
}
