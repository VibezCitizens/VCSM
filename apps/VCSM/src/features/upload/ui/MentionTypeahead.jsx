import React from "react";

export default function MentionTypeahead({ open, items, onPick }) {
  if (!open) return null;
  if (!items?.length) return null;

  return (
    <div className="upload-typeahead mt-2">
      {items.map((it, idx) => {
        const actorId = it?.actor_id ?? it?.actorId ?? null;
        const handle = it?.handle ?? "";
        const displayName = it?.display_name ?? it?.displayName ?? null;
        const avatarUrl = it?.photo_url ?? it?.avatarUrl ?? null;

        return (
          <button
            key={`${actorId || "na"}:${handle || "na"}:${idx}`}
            type="button"
            className="group w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors duration-150"
            onClick={() => onPick(it)}
          >
            <img
              src={avatarUrl || "/avatar.jpg"}
              alt=""
              className="w-8 h-8 rounded-lg object-cover border border-white/12 flex-shrink-0"
              onError={(e) => { e.currentTarget.src = "/avatar.jpg" }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-white/90 text-sm truncate">
                {displayName || handle}
              </div>
              <div className="text-white/50 text-xs truncate">@{handle}</div>
            </div>
            <span className="ml-2 flex-shrink-0 w-[18px] h-[18px] rounded-full border border-white/20 relative overflow-hidden transition-colors duration-150 group-hover:border-transparent">
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
