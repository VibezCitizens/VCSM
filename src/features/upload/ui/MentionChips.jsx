// src/features/upload/ui/MentionChips.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * mentions: Array<{
 *   handle: string,      // username (citizen) OR slug (vport)
 *   actorId?: string,
 *   kind?: "user" | "vport",
 *   displayName?: string,
 * }>
 */
export default function MentionChips({ mentions, onRemove }) {
  if (!mentions?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {mentions.map((m, idx) => {
        const handle = String(m?.handle || "").toLowerCase();
        if (!handle) return null;

        const actorId = m?.actorId || null;

        const ChipInner = (
          <>
            <span className="truncate max-w-[220px]">@{handle}</span>
            <button
              type="button"
              className="opacity-70 hover:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove?.(handle);
              }}
              aria-label={`Remove @${handle}`}
              title={`Remove @${handle}`}
            >
              ×
            </button>
          </>
        );

        if (actorId) {
          return (
            <Link
              key={`${actorId}:${handle}:${idx}`}
              to={`/actor/${actorId}`}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white/80 border border-white/10 text-sm hover:bg-white/10"
              onClick={(e) => e.stopPropagation()}
              title={`Open @${handle}`}
            >
              {ChipInner}
            </Link>
          );
        }

        return (
          <span
            key={`unresolved:${handle}:${idx}`}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white/80 border border-white/10 text-sm"
            title={`@${handle}`}
          >
            {ChipInner}
          </span>
        );
      })}
    </div>
  );
}
