// src/features/explore/ui/ActorSearchResultRow.jsx

import { useNavigate } from 'react-router-dom'

// ============================================================
// ActorSearchResultRow (UI-ONLY)
// ------------------------------------------------------------
// - Renders one actor search result
// - Navigates by actor_id
// - NO data fetching
// - NO business logic
// ============================================================

export default function ActorSearchResultRow({ actor }) {
  const navigate = useNavigate()

  if (!actor?.actor_id) return null

  return (
    <button
      type="button"
      onClick={() => navigate(`/profile/${actor.actor_id}`)}
      className="
        w-full flex items-center gap-3
        px-2 py-3
        text-left
        hover:bg-white/5
        transition-colors
      "
    >
      {/* Avatar */}
      <img
        src={actor.photo_url || '/avatar.jpg'}
        alt={actor.display_name || actor.username}
    className="w-10 h-10 rounded-lg object-cover"

      />

      {/* Text */}
      <div className="flex flex-col">
        <span className="text-white font-medium leading-tight">
          {actor.display_name || actor.username}
        </span>
        {actor.username && (
          <span className="text-sm text-neutral-400">
            @{actor.username}
          </span>
        )}
      </div>
    </button>
  )
}
