import { useCallback, useEffect, useState } from "react";
import { readWanderExProfileBundleBySlugDAL } from "@/features/wanderex/dal/wanderexPublic.read.dal";

export function useWanderExProfile(slug) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bundle, setBundle] = useState(null);

  const load = useCallback(async () => {
    const key = String(slug || "").trim().toLowerCase();
    if (!key) {
      setBundle(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await readWanderExProfileBundleBySlugDAL({ slug: key });
      setBundle(data || null);
    } catch (err) {
      setError(err);
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    error,
    bundle,
    refresh: load,
  };
}

export default useWanderExProfile;
