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
        explore-result-row
        ${className}
      `}
    >
      <div className="w-11 h-11 rounded-2xl bg-slate-900/80 flex items-center justify-center shrink-0 border border-indigo-400/20">
        <span className="relative inline-flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-sky-200" />
          <AtSign className="absolute w-3 h-3 text-indigo-100" />
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-slate-100 font-semibold truncate">
            Wanders
          </span>
          <Sparkles className="w-4 h-4 text-indigo-200/90" />
        </div>

        <div className="text-xs text-slate-300/80 truncate">
          Create a Card and share a link
        </div>
      </div>

      <span className="explore-result-pill shrink-0">
        Feature
      </span>
    </button>
  )
}
