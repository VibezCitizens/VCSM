import { useCallback, useEffect, useState } from "react";
import {
  ctrlQueueDesignExport,
  ctrlRefreshDesignExports,
} from "@/features/flyerBuilder/designStudio/controllers/designStudio.controller";

export function useDesignStudioExports({
  ownerActorId,
  documentId,
  activePage,
  versionsByPageId,
  dirty,
  saveCurrentPage,
  initialExports = [],
}) {
  const [exportsList, setExportsList] = useState(initialExports);
  const [jobsByExportId, setJobsByExportId] = useState({});
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const refreshExports = useCallback(async () => {
    if (!ownerActorId || !documentId) return;
    try {
      const next = await ctrlRefreshDesignExports({ ownerActorId, documentId });
      setExportsList(next.exports || []);
      setJobsByExportId(next.jobsByExportId || {});
    } catch {
      // ignore polling errors
    }
  }, [ownerActorId, documentId]);

  useEffect(() => {
    if (!documentId) return undefined;
    const id = setInterval(() => {
      refreshExports();
    }, 10000);
    return () => clearInterval(id);
  }, [documentId, refreshExports]);

  const queueExport = useCallback(
    async (format) => {
      if (!ownerActorId || !documentId || !activePage?.id) return null;
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
          documentId,
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
    [ownerActorId, documentId, activePage, versionsByPageId, dirty, saveCurrentPage]
  );

  return {
    exportsList,
    setExportsList,
    jobsByExportId,
    exporting,
    exportError: error,
    queueExport,
    refreshExports,
  };
}
