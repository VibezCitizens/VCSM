import React from "react";

export default function MentionAutocompleteList({ open, items, onPick }) {
  if (!open) return null;
  if (!items?.length) return null;

  return (
    <div
      className="upload-typeahead absolute z-50 mt-2 w-full rounded-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((it) => (
        <button
          key={it.actor_id}
          type="button"
          className="group w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors duration-150"
          onClick={() => onPick(it)}
        >
          <img
            src={it.photo_url || "/avatar.jpg"}
            alt=""
            className="h-9 w-9 rounded-lg object-cover border border-white/12 bg-white/5 flex-shrink-0"
            onError={(e) => { e.currentTarget.src = "/avatar.jpg" }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm text-white/90 truncate">
              {it.display_name || it.handle}
            </div>
            <div className="text-xs text-white/50 truncate">@{it.handle}</div>
          </div>
          <span className="ml-2 flex-shrink-0 w-[18px] h-[18px] rounded-full border border-white/20 relative overflow-hidden transition-colors duration-150 group-hover:border-transparent">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
