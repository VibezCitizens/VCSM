import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ctrlCreateDesignPage,
  ctrlDeleteDesignPage,
  ctrlLoadDesignStudio,
  ctrlQueueDesignExport,
  ctrlRefreshDesignExports,
  ctrlSaveDesignPageScene,
  ctrlUploadDesignAsset,
} from "@/features/dashboard/flyerBuilder/designStudio/controller/designStudio.controller";
import { useDesignStudioSceneActions } from "@/features/dashboard/flyerBuilder/designStudio/hooks/useDesignStudioSceneActions";

export function useDesignStudio({ ownerActorId, starter }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [document, setDocument] = useState(null);
  const [pages, setPages] = useState([]);
  const [versionsByPageId, setVersionsByPageId] = useState({});
  const [activePageId, setActivePageId] = useState(null);

  const [scene, setScene] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [assets, setAssets] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [exportsList, setExportsList] = useState([]);
  const [jobsByExportId, setJobsByExportId] = useState({});
  const [exporting, setExporting] = useState(false);

  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) || null,
    [pages, activePageId]
  );

  const sceneActions = useDesignStudioSceneActions({
    scene,
    selectedNodeId,
    setScene,
    setDirty,
    setSelectedNodeId,
  });

  const toggleCanvasOrientation = useCallback(() => {
    setScene((prev) => {
      const baseMeta = prev?.meta && typeof prev.meta === "object" ? prev.meta : {};
      const width = clampCanvasSize(Number(baseMeta.width) || 1080);
      const height = clampCanvasSize(Number(baseMeta.height) || 1350);

      return {
        ...(prev || {}),
        meta: {
          ...baseMeta,
          width: height,
          height: width,
        },
      };
    });
    setDirty(true);
  }, []);

  const loadStudio = useCallback(async () => {
    if (!ownerActorId) return;

    setLoading(true);
    setError("");

    try {
      const snapshot = await ctrlLoadDesignStudio({ ownerActorId, starter });
      setDocument(snapshot.document);
      setPages(snapshot.pages);
      setVersionsByPageId(snapshot.versionsByPageId || {});
      setAssets(snapshot.assets || []);
      setExportsList(snapshot.exports || []);
      setJobsByExportId({});

      const firstPage = snapshot.pages[0] || null;
      const nextPageId = firstPage?.id || null;
      setActivePageId(nextPageId);
      setScene(nextPageId ? snapshot.versionsByPageId?.[nextPageId]?.content || null : null);
      setSelectedNodeId(null);
      setDirty(false);
    } catch (e) {
      setError(e?.message || "Failed to load design studio.");
    } finally {
      setLoading(false);
    }
  }, [ownerActorId, starter]);

  useEffect(() => {
    loadStudio();
  }, [loadStudio]);

  const selectPage = useCallback(
    (pageId) => {
      setActivePageId(pageId);
      setSelectedNodeId(null);
      setScene(versionsByPageId?.[pageId]?.content || null);
      setDirty(false);
    },
    [versionsByPageId]
  );

  const saveCurrentPage = useCallback(async () => {
    if (!document?.id || !activePage?.id || !scene) return null;

    setSaving(true);
    setError("");

    try {
      const result = await ctrlSaveDesignPageScene({
        ownerActorId,
        documentId: document.id,
        pageId: activePage.id,
        scene,
      });

      setPages((prev) => prev.map((page) => (page.id === result.page.id ? result.page : page)));
      setVersionsByPageId((prev) => ({ ...prev, [result.page.id]: result.version }));
      setScene(result.version.content);
      setDirty(false);
      return result;
    } catch (e) {
      setError(e?.message || "Failed to save page.");
      return null;
    } finally {
      setSaving(false);
    }
  }, [ownerActorId, document, activePage, scene]);

  const createPage = useCallback(async () => {
    if (!ownerActorId || !document?.id) return;
    if ((pages || []).length >= 1) {
      setError("Only 1 page is available right now.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const created = await ctrlCreateDesignPage({ ownerActorId, documentId: document.id });
      setPages((prev) => sortByOrder([...prev, created.page]));
      setVersionsByPageId((prev) => ({ ...prev, [created.page.id]: created.version }));
      setActivePageId(created.page.id);
      setScene(created.version.content);
      setSelectedNodeId(null);
      setDirty(false);
    } catch (e) {
      setError(e?.message || "Failed to create page.");
    } finally {
      setLoading(false);
    }
  }, [ownerActorId, document?.id, pages]);

  const deletePage = useCallback(
    async (pageId) => {
      if (!ownerActorId || !document?.id || !pageId) return false;
      if ((pages || []).length <= 1) {
        setError("At least one page is required.");
        return false;
      }

      setLoading(true);
      setError("");

      try {
        await ctrlDeleteDesignPage({
          ownerActorId,
          documentId: document.id,
          pageId,
        });

        const nextPages = sortByOrder((pages || []).filter((page) => page.id !== pageId));
        const nextVersions = { ...(versionsByPageId || {}) };
        delete nextVersions[pageId];

        const nextActivePageId =
          activePageId && activePageId !== pageId && nextPages.some((page) => page.id === activePageId)
            ? activePageId
            : nextPages[0]?.id || null;

        setPages(nextPages);
        setVersionsByPageId(nextVersions);
        setActivePageId(nextActivePageId);
        setScene(nextActivePageId ? nextVersions[nextActivePageId]?.content || null : null);
        setSelectedNodeId(null);
        setDirty(false);
        return true;
      } catch (e) {
        setError(e?.message || "Failed to delete page.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [ownerActorId, document?.id, pages, versionsByPageId, activePageId]
  );

  const uploadAsset = useCallback(
    async (file) => {
      if (!ownerActorId || !file) return null;
      setUploading(true);
      setError("");

      try {
        const asset = await ctrlUploadDesignAsset({ ownerActorId, file });
        setAssets((prev) => [asset, ...prev]);
        return asset;
      } catch (e) {
        setError(e?.message || "Failed to upload asset.");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [ownerActorId]
  );

  const queueExport = useCallback(
    async (format) => {
      if (!ownerActorId || !document?.id || !activePage?.id) return null;
      setExporting(true);
      setError("");

      try {
        let latestVersion = versionsByPageId?.[activePage.id] || null;
        if (dirty) {
          const saveRes = await saveCurrentPage();
          if (!saveRes?.version?.id) {
            setError("Save failed. Resolve errors before exporting.");
            return null;
          }
          latestVersion = saveRes.version;
        }

        if (!latestVersion?.id) {
          setError("Save the page before exporting.");
          return null;
        }

        const queued = await ctrlQueueDesignExport({
          ownerActorId,
          documentId: document.id,
          pageId: activePage.id,
          versionId: latestVersion.id,
          format,
        });

        setExportsList((prev) => [queued.exportRecord, ...prev]);
        setJobsByExportId((prev) => ({ ...prev, [queued.exportRecord.id]: queued.renderJob }));
        return queued;
      } catch (e) {
        setError(e?.message || "Failed to queue export.");
        return null;
      } finally {
        setExporting(false);
      }
    },
    [ownerActorId, document, activePage, versionsByPageId, dirty, saveCurrentPage]
  );

  const refreshExports = useCallback(async () => {
    if (!ownerActorId || !document?.id) return;

    try {
      const next = await ctrlRefreshDesignExports({ ownerActorId, documentId: document.id });
      setExportsList(next.exports || []);
      setJobsByExportId(next.jobsByExportId || {});
    } catch {
      // ignore polling errors
    }
  }, [ownerActorId, document?.id]);

  useEffect(() => {
    if (!document?.id) return undefined;
    const id = setInterval(() => {
      refreshExports();
    }, 10000);

    return () => clearInterval(id);
  }, [document?.id, refreshExports]);

  return {
    loading,
    error,
    document,
    pages,
    versionsByPageId,
    activePage,
    activePageId,
    scene,
    dirty,
    saving,
    assets,
    uploading,
    exportsList,
    jobsByExportId,
    exporting,
    selectedNodeId,
    selectedNode: sceneActions.selectedNode,

    loadStudio,
    selectPage,
    updateScene: sceneActions.updateScene,
    updateSceneMeta: sceneActions.updateSceneMeta,
    addText: sceneActions.addText,
    addShape: sceneActions.addShape,
    addImageFromAsset: sceneActions.addImageFromAsset,
    patchNode: sceneActions.patchNode,
    setSelectedNodeId,
    bringNodeToFront: sceneActions.bringNodeToFront,
    sendNodeToBack: sceneActions.sendNodeToBack,
    bringNodeForward: sceneActions.bringNodeForward,
    sendNodeBackward: sceneActions.sendNodeBackward,
    removeSelectedNode: sceneActions.removeSelectedNode,
    toggleCanvasOrientation,
    saveCurrentPage,
    createPage,
    deletePage,
    uploadAsset,
    queueExport,
    refreshExports,
  };
}

function sortByOrder(pages) {
  return [...(pages || [])].sort((a, b) => (a.pageOrder || 0) - (b.pageOrder || 0));
}

function clampCanvasSize(value) {
  if (!Number.isFinite(value)) return 1080;
  return Math.max(320, Math.min(4000, Math.round(value)));
}
