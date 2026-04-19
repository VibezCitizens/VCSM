// src/features/profiles/kinds/vport/screens/content/components/VportContentPageViewer.jsx
// Modal viewer — loads full page body and renders it when a public card is clicked.

import { useState, useEffect } from "react";
import readVportPublicContentPageController from "@/features/profiles/kinds/vport/controller/content/readVportPublicContentPage.controller";

const CATEGORY_LABELS = {
  guide: "Guide",
  faq: "FAQ",
  emergency: "Emergency",
  tips: "Tips",
  educational: "Educational",
};

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function VportContentPageViewer({ pageId, onClose }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pageId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(null);

    readVportPublicContentPageController({ id: pageId })
      .then((result) => {
        if (!cancelled) {
          setPage(result);
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
  }, [pageId]);

  if (!pageId) return null;

  const categoryLabel = page?.category ? CATEGORY_LABELS[page.category] ?? page.category : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-2xl bg-[#0d1322] rounded-t-3xl overflow-y-auto max-h-[90dvh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-5 pb-4 bg-[#0d1322]">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/40">
            {categoryLabel ?? "Content"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition text-sm"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-10">
          {loading && (
            <div className="py-12 text-center text-white/30 text-sm">Loading...</div>
          )}

          {error && (
            <div className="py-12 text-center text-rose-400 text-sm">{error}</div>
          )}

          {page && !loading && (
            <>
              {page.coverImageUrl && (
                <div className="mb-5 rounded-2xl overflow-hidden">
                  <img
                    src={page.coverImageUrl}
                    alt={page.title}
                    className="w-full h-[200px] object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              <h1 className="text-white text-xl font-bold leading-snug mb-2">{page.title}</h1>

              {page.publishedAt && (
                <div className="text-white/30 text-xs mb-5">{formatDate(page.publishedAt)}</div>
              )}

              {page.summary && (
                <p className="text-white/60 text-sm leading-relaxed mb-5 border-l-2 border-purple-400/30 pl-4">
                  {page.summary}
                </p>
              )}

              {page.body && (
                <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                  {page.body}
                </div>
              )}

              {!page.body && !page.summary && (
                <div className="text-white/30 text-sm">No content available.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VportContentPageViewer;
