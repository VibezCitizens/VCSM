// src/features/profiles/kinds/vport/screens/content/hooks/useVportPublicContent.js
// Public hook — loads published content pages for any profile viewer.

import { useState, useEffect } from "react";

import listVportPublicContentPagesController from "@/features/profiles/kinds/vport/controller/content/listVportPublicContentPages.controller";

export function useVportPublicContent({ actorId } = {}) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!actorId) {
      setPages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    listVportPublicContentPagesController({ actorId })
      .then((result) => {
        if (!cancelled) {
          setPages(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load content.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [actorId]);

  return { pages, loading, error };
}

export default useVportPublicContent;
