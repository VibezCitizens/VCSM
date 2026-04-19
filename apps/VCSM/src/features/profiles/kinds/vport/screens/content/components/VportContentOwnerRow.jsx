// src/features/profiles/kinds/vport/screens/content/components/VportContentOwnerRow.jsx
// Owner list row — shows page status, publish toggle, edit and delete actions.

import { useState } from "react";

const CATEGORY_LABELS = {
  guide: "Guide",
  faq: "FAQ",
  emergency: "Emergency",
  tips: "Tips",
  educational: "Educational",
};

export function VportContentOwnerRow({ page, onEdit, onDelete, onTogglePublish }) {
  const [publishPending, setPublishPending] = useState(false);

  if (!page) return null;

  const categoryLabel = page.category ? CATEGORY_LABELS[page.category] ?? page.category : null;

  async function handleTogglePublish() {
    if (publishPending) return;
    setPublishPending(true);
    try {
      await onTogglePublish?.(page.id, !page.isPublished);
    } finally {
      setPublishPending(false);
    }
  }

  async function handleDelete() {
    const ok = window.confirm(`Delete "${page.title}"? This cannot be undone.`);
    if (!ok) return;
    await onDelete?.(page.id);
  }

  return (
    <div className="profiles-subcard rounded-xl px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-semibold text-[14px] leading-snug line-clamp-1">
            {page.title}
          </span>
          {categoryLabel && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-300/70 shrink-0">
              {categoryLabel}
            </span>
          )}
        </div>

        {page.slug && (
          <div className="text-white/30 text-[11px] mt-0.5 font-mono truncate">/{page.slug}</div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleTogglePublish}
          disabled={publishPending}
          title={page.isPublished ? "Click to unpublish" : "Click to publish"}
          className={`
            flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition select-none
            ${page.isPublished
              ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
              : "bg-white/6 text-white/35 hover:bg-white/12 hover:text-white/60"
            }
            ${publishPending ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <span
            className={`
              relative inline-flex w-7 h-4 rounded-full transition-colors duration-200 shrink-0
              ${page.isPublished ? "bg-green-500" : "bg-white/20"}
            `}
          >
            <span
              className={`
                absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200
                ${page.isPublished ? "translate-x-3" : "translate-x-0"}
              `}
            />
          </span>
          {publishPending ? "Saving..." : page.isPublished ? "Live" : "Draft"}
        </button>

        <button
          type="button"
          onClick={() => onEdit?.(page)}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/8 text-white/60 hover:bg-white/15 transition"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/8 text-rose-400/70 hover:bg-rose-500/15 transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default VportContentOwnerRow;
