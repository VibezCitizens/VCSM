// src/features/upload/ui/MentionTypeahead.jsx
import React from "react";

export default function MentionTypeahead({ open, items, onPick }) {
  if (!open) return null;
  if (!items?.length) return null;

  return (
    <div className="mt-2 rounded-2xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur">
      {items.map((it, idx) => {
        const actorId = it?.actor_id ?? it?.actorId ?? null;
        const handle = it?.handle ?? "";
        const displayName = it?.display_name ?? it?.displayName ?? null;
        const avatarUrl = it?.photo_url ?? it?.avatarUrl ?? null;

        return (
          <button
            key={`${actorId || "na"}:${handle || "na"}:${idx}`}
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left"
            onClick={() => onPick(it)}
          >
            <img
              src={avatarUrl || "/avatar.jpg"}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="min-w-0">
              <div className="text-white/90 text-sm truncate">
                {displayName || handle}
              </div>
              <div className="text-white/50 text-xs truncate">@{handle}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
