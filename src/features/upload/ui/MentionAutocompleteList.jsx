// src/features/upload/ui/MentionAutocompleteList.jsx
import React from "react";

export default function MentionAutocompleteList({ open, items, onPick }) {
  if (!open) return null;
  if (!items?.length) return null;

  return (
    <div
      className="
        absolute z-50 mt-2 w-full
        rounded-xl border border-white/10
        bg-black/95 backdrop-blur
        shadow-lg overflow-hidden
      "
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((it) => (
        <button
          key={it.actor_id}
          type="button"
          className="
            w-full flex items-center gap-3
            px-3 py-2 text-left
            hover:bg-white/5
          "
          onClick={() => onPick(it)}
        >
          <img
            src={it.photo_url || "/avatar.jpg"}
            alt=""
            className="h-9 w-9 rounded-full object-cover bg-white/5"
          />
          <div className="min-w-0">
            <div className="text-sm text-white/90 truncate">
              {it.display_name || it.handle}
            </div>
            <div className="text-xs text-white/50 truncate">@{it.handle}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
