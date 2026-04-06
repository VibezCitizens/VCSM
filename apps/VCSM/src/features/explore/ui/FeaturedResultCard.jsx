import { AtSign, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function FeaturedResultCard({ item }) {
  const navigate = useNavigate()

  if (!item) return null

  if (item.result_type === 'actor' && item.actor_id) {
    return (
      <button
        type="button"
        onClick={() => navigate(`/profile/${item.actor_id}`)}
        className="explore-featured-card"
      >
        <img
          src={item.photo_url || '/avatar.jpg'}
          alt={item.display_name || item.username || 'Actor'}
          className="explore-featured-card-media"
        />

        <div className="explore-featured-overlay">
          <p className="explore-featured-label">Featured Result</p>
          <p className="text-base font-semibold text-slate-100 truncate">
            {item.display_name || item.username}
          </p>
          {item.username ? (
            <p className="text-xs text-slate-300/80 truncate">@{item.username}</p>
          ) : null}
        </div>
      </button>
    )
  }

  if (item.result_type === 'feature') {
    const route = item.route || '/explore'
    const title = item.title || 'Feature'
    const subtitle = item.subtitle || ''

    return (
      <button
        type="button"
        onClick={() => navigate(route)}
        className="explore-featured-card"
      >
        <div className="absolute inset-0 bg-[radial-gradient(40%_45%_at_12%_8%,rgba(138,98,255,0.35),transparent_70%),radial-gradient(45%_55%_at_88%_16%,rgba(74,151,255,0.32),transparent_70%)]" />

        <div className="explore-featured-overlay">
          <p className="explore-featured-label">Featured Feature</p>

          <div className="flex items-center gap-2">
            <span className="relative inline-flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-sky-200" />
              <AtSign className="absolute h-3 w-3 text-indigo-100" />
            </span>
            <p className="text-base font-semibold text-slate-100 truncate">{title}</p>
          </div>

          {subtitle ? (
            <p className="text-xs text-slate-300/80 truncate">{subtitle}</p>
          ) : null}
        </div>
      </button>
    )
  }

  return null
}
