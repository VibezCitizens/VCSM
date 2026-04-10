import { useNavigate } from 'react-router-dom'
import { AtSign, MessageCircle } from 'lucide-react'

export default function FeatureSearchResultRow({ feature }) {
  const navigate = useNavigate()
  if (!feature) return null

  const Icon =
    feature.icon === 'at-bubble'
      ? ({ className }) => (
          <span className="relative inline-flex items-center justify-center">
            <MessageCircle className={className} />
            <AtSign className="absolute w-3 h-3" />
          </span>
        )
      : ({ className }) => <AtSign className={className} />

  return (
    <button
      type="button"
      onClick={() => {
        if (feature.route) navigate(feature.route)
      }}
      className="explore-result-row"
    >
      <div className="w-10 h-10 rounded-xl bg-white/4/80 flex items-center justify-center shrink-0 border border-purple-400/15">
        <Icon className="w-5 h-5 text-sky-200" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm text-white font-medium truncate">
          {feature.title || 'Feature'}
        </div>
        {!!feature.subtitle && (
          <div className="text-xs text-white/70/80 truncate">
            {feature.subtitle}
          </div>
        )}
      </div>

      <span className="explore-result-pill">
        Feature
      </span>
    </button>
  )
}
