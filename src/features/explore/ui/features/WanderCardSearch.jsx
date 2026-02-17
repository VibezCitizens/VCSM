// src/features/explore/ui/features/WanderCardSearch.jsx

import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AtSign, MessageCircle, Sparkles } from 'lucide-react'

/**
 * WanderCardSearch (UI-only)
 * - Renders the "Wanders" feature card inside Explore search results
 * - Navigates to /wanders/create
 * - Passes realmId/baseUrl via location.state (optional)
 *
 * NO data fetching
 * NO business logic
 */
export default function WanderCardSearch({
  query = '',
  realmId = null,
  baseUrl = null,
  className = '',
}) {
  const navigate = useNavigate()

  const show = useMemo(() => {
    const needle = (query || '').trim().toLowerCase()
    if (!needle) return false
    return (
      needle.includes('wander') ||
      needle.includes('wanders') ||
      needle.startsWith('@wander') ||
      needle === 'w'
    )
  }, [query])

  if (!show) return null

  return (
    <button
      type="button"
      onClick={() =>
        navigate('/wanders/create', {
          state: {
            realmId: realmId || null,
            baseUrl: baseUrl || null,
          },
        })
      }
      className={`
        w-full text-left
        flex items-center gap-3
        px-4 py-3
        rounded-2xl
        bg-neutral-900/60 hover:bg-neutral-900/80
        border border-purple-700/30
        shadow-[0_0_18px_-8px_rgba(128,0,255,0.45)]
        transition
        ${className}
      `}
    >
      {/* Icon */}
      <div className="w-11 h-11 rounded-2xl bg-neutral-800 flex items-center justify-center shrink-0 border border-purple-700/20">
        <span className="relative inline-flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-purple-300" />
          <AtSign className="absolute w-3 h-3 text-purple-200" />
        </span>
      </div>

      {/* Text */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-white font-semibold truncate">
            Wanders
          </span>
          <Sparkles className="w-4 h-4 text-purple-300 opacity-80" />
        </div>

        <div className="text-xs text-neutral-400 truncate">
          Create a Card and share a link
        </div>
      </div>

      {/* Pill */}
      <span
        className="
          ml-auto
          text-xs text-purple-300
          px-2 py-1 rounded-full
          border border-purple-700/40
          bg-purple-900/30
          shrink-0
        "
      >
        Feature
      </span>
    </button>
  )
}
