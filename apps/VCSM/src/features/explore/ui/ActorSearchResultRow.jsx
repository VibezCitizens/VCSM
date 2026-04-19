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
      onClick={() => navigate(`/profile/${actor.username ?? actor.actor_id}`)}
      className="explore-result-row"
    >
      <img
        src={actor.photo_url || '/avatar.jpg'}
        alt={actor.display_name || actor.username}
        className="explore-result-avatar"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">
          {actor.display_name || actor.username}
        </p>
        {actor.username && (
          <p className="text-xs text-white/70/80 truncate">
            @{actor.username}
          </p>
        )}
      </div>

      <span className="explore-result-pill">Profile</span>
    </button>
  )
}
