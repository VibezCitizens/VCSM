// src/features/profiles/kinds/vport/screens/content/components/VportContentPageViewer.jsx
// Modal viewer — loads full page body and renders it when a public card is clicked.

import { useState, useEffect } from "react";
import readVportPublicContentPageController from "@/features/profiles/kinds/vport/controller/content/readVportPublicContentPage.controller";

const CATEGORY_META = {
  guide:       { label: "Guide",       color: "text-purple-300",  border: "border-purple-400/40" },
  faq:         { label: "FAQ",         color: "text-sky-300",     border: "border-sky-400/40" },
  emergency:   { label: "Emergency",   color: "text-rose-300",    border: "border-rose-400/40" },
  tips:        { label: "Tips",        color: "text-amber-300",   border: "border-amber-400/40" },
  educational: { label: "Educational", color: "text-teal-300",    border: "border-teal-400/40" },
};

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Renders inline **bold** markers into React elements
function renderInline(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span key={key}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
          : part
      )}
    </span>
  );
}

// Renders body text: paragraph-aware, inline bold, numbered/bullet lists
function BodyText({ text }) {
  if (!text) return null;

  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className="flex flex-col gap-4">
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n").filter((l) => l.trim() !== "");

        // Numbered list
        if (lines.every((l) => /^\d+\.\s/.test(l.trim()))) {
          return (
            <ol key={pi} className="list-decimal list-outside pl-5 flex flex-col gap-1.5">
              {lines.map((l, li) => (
                <li key={li} className="text-white/75 text-sm leading-relaxed">
                  {renderInline(l.replace(/^\d+\.\s/, ""), li)}
                </li>
              ))}
            </ol>
          );
        }

        // Bullet list
        if (lines.every((l) => /^[-*]\s/.test(l.trim()))) {
          return (
            <ul key={pi} className="list-disc list-outside pl-5 flex flex-col gap-1.5">
              {lines.map((l, li) => (
                <li key={li} className="text-white/75 text-sm leading-relaxed">
                  {renderInline(l.replace(/^[-*]\s/, ""), li)}
                </li>
              ))}
            </ul>
          );
        }

        // Regular paragraph — render each line, join with line breaks
        return (
          <p key={pi} className="text-white/75 text-sm leading-relaxed">
            {lines.map((l, li) => (
              <span key={li}>
                {li > 0 && <br />}
                {renderInline(l, li)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function VportContentPageViewer({ pageId, onClose, onPrev, onNext, position, total }) {
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
        if (!cancelled) { setPage(result); setLoading(false); }
      })
      .catch((err) => {
        if (!cancelled) { setError(err?.message ?? "Failed to load content."); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [pageId]);

  if (!pageId) return null;

  const meta = page?.category ? (CATEGORY_META[page.category] ?? null) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-2xl bg-[#0d1322] rounded-3xl overflow-y-auto max-h-[85dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-5 pb-4 bg-[#0d1322] border-b border-white/6">
          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-bold uppercase tracking-widest ${meta?.color ?? "text-white/30"}`}>
              {meta?.label ?? "Content"}
            </span>
            {total > 1 && (
              <span className="text-white/20 text-[11px]">{position} / {total}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition text-sm"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-12 pt-6">
          {loading && (
            <div className="py-12 text-center text-white/30 text-sm">Loading...</div>
          )}

          {error && (
            <div className="py-12 text-center text-rose-400 text-sm">{error}</div>
          )}

          {page && !loading && (
            <>
              {page.coverImageUrl && (
                <div className="mb-6 rounded-2xl overflow-hidden">
                  <img
                    src={page.coverImageUrl}
                    alt={page.title}
                    className="w-full h-[200px] object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </div>
              )}

              <h1 className="text-white text-[22px] font-bold leading-snug mb-2">
                {page.title}
              </h1>

              {page.publishedAt && (
                <div className="text-white/25 text-xs mb-5">{formatDate(page.publishedAt)}</div>
              )}

              {page.excerpt && (
                <p className={`text-white/55 text-sm leading-relaxed mb-6 border-l-2 pl-4 ${meta?.border ?? "border-white/20"}`}>
                  {page.excerpt}
                </p>
              )}

              {page.body && <BodyText text={page.body} />}

              {!page.body && !page.excerpt && (
                <div className="text-white/30 text-sm">No content available.</div>
              )}

              {(onPrev || onNext) && (
                <div className="flex items-center justify-between gap-3 mt-10 pt-5 border-t border-white/8">
                  {onPrev ? (
                    <button
                      type="button"
                      onClick={onPrev}
                      className="text-sm text-white/50 hover:text-white transition"
                    >
                      Previous
                    </button>
                  ) : <div />}
                  {onNext ? (
                    <button
                      type="button"
                      onClick={onNext}
                      className="text-sm text-white/50 hover:text-white transition"
                    >
                      Next
                    </button>
                  ) : <div />}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VportContentPageViewer;
