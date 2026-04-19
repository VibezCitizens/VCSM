// src/features/profiles/kinds/vport/screens/content/hooks/useVportContentPages.js
// Owner hook — manages full content page lifecycle for the authenticated vport owner.

import { useState, useEffect, useCallback } from "react";

import listVportContentPagesController from "@/features/profiles/kinds/vport/controller/content/listVportContentPages.controller";
import createVportContentPageController from "@/features/profiles/kinds/vport/controller/content/createVportContentPage.controller";
import updateVportContentPageController from "@/features/profiles/kinds/vport/controller/content/updateVportContentPage.controller";
import deleteVportContentPageController from "@/features/profiles/kinds/vport/controller/content/deleteVportContentPage.controller";
import toggleVportContentPagePublishController from "@/features/profiles/kinds/vport/controller/content/toggleVportContentPagePublish.controller";

export function useVportContentPages({ actorId } = {}) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!actorId) {
      setPages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    listVportContentPagesController({ actorId })
      .then((result) => {
        if (!cancelled) {
          setPages(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load content pages.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [actorId, version]);

  const createPage = useCallback(
    async (fields) => {
      try {
        const page = await createVportContentPageController({ actorId, ...fields });
        refresh();
        return { ok: true, page };
      } catch (err) {
        return { ok: false, error: err?.message ?? "Failed to create page." };
      }
    },
    [actorId, refresh]
  );

  const updatePage = useCallback(
    async (id, fields) => {
      try {
        const page = await updateVportContentPageController({ actorId, id, ...fields });
        refresh();
        return { ok: true, page };
      } catch (err) {
        return { ok: false, error: err?.message ?? "Failed to update page." };
      }
    },
    [actorId, refresh]
  );

  const deletePage = useCallback(
    async (id) => {
      try {
        await deleteVportContentPageController({ actorId, id });
        refresh();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err?.message ?? "Failed to delete page." };
      }
    },
    [actorId, refresh]
  );

  const togglePublish = useCallback(
    async (id, isPublished) => {
      try {
        const page = await toggleVportContentPagePublishController({ actorId, id, isPublished });
        refresh();
        return { ok: true, page };
      } catch (err) {
        return { ok: false, error: err?.message ?? "Failed to update publish status." };
      }
    },
    [actorId, refresh]
  );

  return { pages, loading, error, createPage, updatePage, deletePage, togglePublish, refresh };
}

export default useVportContentPages;
