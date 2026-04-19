// src/features/profiles/kinds/vport/screens/content/VportContentPublicView.jsx
// Public view: grid of published content cards for any viewer.

import { useState, useCallback } from "react";

import { useVportPublicContent } from "@/features/profiles/kinds/vport/screens/content/hooks/useVportPublicContent";
import VportContentPageCard from "@/features/profiles/kinds/vport/screens/content/components/VportContentPageCard";
import VportContentPageViewer from "@/features/profiles/kinds/vport/screens/content/components/VportContentPageViewer";
import VportContentEmptyState from "@/features/profiles/kinds/vport/screens/content/components/VportContentEmptyState";

export function VportContentPublicView({ actorId }) {
  const { pages, loading, error } = useVportPublicContent({ actorId });
  const [openPageId, setOpenPageId] = useState(null);

  const handleOpenPage = useCallback((page) => {
    setOpenPageId(page?.id ?? null);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setOpenPageId(null);
  }, []);

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
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {pages.map((page) => (
            <VportContentPageCard key={page.id} page={page} onClick={handleOpenPage} />
          ))}
        </div>
      )}

      {openPageId && (
        <VportContentPageViewer pageId={openPageId} onClose={handleCloseViewer} />
      )}
    </div>
  );
}

export default VportContentPublicView;
