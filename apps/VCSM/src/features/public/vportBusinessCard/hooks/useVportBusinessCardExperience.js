import { useCallback, useEffect, useState } from "react";
import { getVportBusinessCardPublicController } from "@/features/public/vportBusinessCard/controller/vportBusinessCard.controller";

export function useVportBusinessCardExperience({ slug } = {}) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const key = String(slug || "").trim().toLowerCase();

    if (!key) {
      setCard(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const next = await getVportBusinessCardPublicController({ slug: key });
      setCard(next || null);
    } catch (e) {
      setCard(null);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    card,
    loading,
    error,
    unavailable: !loading && !card,
    refresh,
  };
}

export default useVportBusinessCardExperience;
