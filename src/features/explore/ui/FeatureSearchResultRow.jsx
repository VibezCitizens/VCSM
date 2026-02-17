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
      className="
        w-full text-left
        flex items-center gap-3
        px-4 py-3
        bg-neutral-900/60 hover:bg-neutral-900/80
        rounded-xl
      "
    >
      <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-purple-300" />
      </div>

      <div className="min-w-0">
        <div className="text-sm text-white font-medium truncate">
          {feature.title || 'Feature'}
        </div>
        {!!feature.subtitle && (
          <div className="text-xs text-neutral-400 truncate">
            {feature.subtitle}
          </div>
        )}
      </div>

      <span
        className="
          ml-auto
          text-xs text-purple-300
          px-2 py-1 rounded-full
          border border-purple-700/40
          bg-purple-900/30
        "
      >
        Feature
      </span>
    </button>
  )
}
