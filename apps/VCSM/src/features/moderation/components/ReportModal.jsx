// src/features/moderation/components/ReportModal.jsx
// ============================================================
// ReportModal (PURE UI)
// ------------------------------------------------------------
// - Collects report reason + optional details
// - Emits intents only (onSubmit / onClose)
// - No Supabase, no DAL, no controllers, no hooks
// ============================================================

import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const REASONS = [
  'spam',
  'harassment',
  'hate',
  'nudity',
  'violence',
  'scam',
  'illegal',
  'self_harm',
  'impersonation',
  'copyright',
  'privacy',
  'other',
]

export default function ReportModal({
  open,
  title = 'Report',
  subtitle = null,
  loading = false,
  defaultReason = 'spam',
  onClose,
  onSubmit, // ({ reasonCode, reasonText }) => void
}) {
  const [reasonCode, setReasonCode] = useState(defaultReason)
  const [reasonText, setReasonText] = useState('')

  useEffect(() => {
    if (!open) return
    setReasonCode(defaultReason)
    setReasonText('')
  }, [open, defaultReason])

  // ✅ Lock body scroll while modal is open (prevents PullToRefresh / container scroll weirdness)
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const canSubmit = useMemo(() => {
    return !loading && typeof onSubmit === 'function' && !!reasonCode
  }, [loading, onSubmit, reasonCode])

  if (!open) return null

  const node = (
    <div
      className="fixed inset-0 z-[999999] bg-black flex items-center justify-center"
      onClick={(e) => {
        // ✅ Only close when the click is on the backdrop itself.
        if (e.target === e.currentTarget) onClose?.()
      }}
      // ✅ Prevent scroll / pull-to-refresh interactions while selecting
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => {
        e.preventDefault()
      }}
    >
      {/* ✅ wrapper to apply OUTER purple glow like StartConversationModal */}
      <div className="w-full max-w-sm px-4">
        <div
          className="
            w-full rounded-xl
            bg-neutral-950 border border-neutral-800
            shadow-[0_0_40px_-16px_rgba(128,0,255,0.45)]
            p-5
          "
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="space-y-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {subtitle ? <p className="text-sm text-neutral-400">{subtitle}</p> : null}
          </header>

          <div className="mt-4">
            <label className="text-xs text-neutral-400">Reason</label>
            <select
              className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 p-2 text-sm text-white"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              disabled={loading}
              onMouseDown={(e) => {
                // ✅ Stop propagation so no ancestor listeners treat it like an outside click
                e.stopPropagation()
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <label className="text-xs text-neutral-400">Details (optional)</label>
            <textarea
              className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 p-2 text-sm text-white"
              rows={3}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Add context for moderators…"
              disabled={loading}
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="button"
              className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
              disabled={!canSubmit}
              onClick={() => {
                const text = reasonText.trim()
                onSubmit?.({
                  reasonCode,
                  reasonText: text ? text : null,
                })
              }}
            >
              {loading ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ✅ Portal to body to avoid stacking-context issues from PullToRefresh/scroll containers
  return createPortal(node, document.body)
}
