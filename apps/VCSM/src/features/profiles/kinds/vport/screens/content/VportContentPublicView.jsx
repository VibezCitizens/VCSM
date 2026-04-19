// src/features/profiles/kinds/vport/screens/content/VportContentPublicView.jsx
// Public view: list of published content cards for any viewer.

import { useState, useCallback } from "react";

import { useVportPublicContent } from "@/features/profiles/kinds/vport/screens/content/hooks/useVportPublicContent";
import VportContentPageCard from "@/features/profiles/kinds/vport/screens/content/components/VportContentPageCard";
import VportContentPageViewer from "@/features/profiles/kinds/vport/screens/content/components/VportContentPageViewer";
import VportContentEmptyState from "@/features/profiles/kinds/vport/screens/content/components/VportContentEmptyState";

export function VportContentPublicView({ actorId }) {
  const { pages, loading, error } = useVportPublicContent({ actorId });
  const [openIndex, setOpenIndex] = useState(null);

  const handleOpenPage = useCallback((page) => {
    const idx = pages.findIndex((p) => p.id === page?.id);
    if (idx !== -1) setOpenIndex(idx);
  }, [pages]);

  const handleCloseViewer = useCallback(() => setOpenIndex(null), []);

  const handleNext = useCallback(() => {
    setOpenIndex((i) => (i < pages.length - 1 ? i + 1 : i));
  }, [pages.length]);

  const handlePrev = useCallback(() => {
    setOpenIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const openPageId = openIndex !== null ? pages[openIndex]?.id ?? null : null;

  return (
    <div className="mt-2 flex flex-col gap-3">
      {loading && (
        <div className="text-white/30 text-sm text-center py-8">Loading...</div>
      )}

      {error && !loading && (
        <div className="text-rose-400 text-sm text-center py-4">{error}</div>
      )}

      {!loading && !error && pages.length === 0 && (
        <VportContentEmptyState isOwner={false} />
      )}

      {!loading && pages.length > 0 && (
        <div className="flex flex-col gap-2">
          {pages.map((page) => (
            <VportContentPageCard key={page.id} page={page} onClick={handleOpenPage} />
          ))}
        </div>
      )}

      {openPageId && (
        <VportContentPageViewer
          pageId={openPageId}
          onClose={handleCloseViewer}
          onNext={openIndex < pages.length - 1 ? handleNext : null}
          onPrev={openIndex > 0 ? handlePrev : null}
          position={openIndex + 1}
          total={pages.length}
        />
      )}
    </div>
  );
}

export default VportContentPublicView;
