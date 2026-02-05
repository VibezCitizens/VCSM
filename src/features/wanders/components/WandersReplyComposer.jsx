// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersReplyComposer.jsx
// ============================================================================
// WANDERS COMPONENT — REPLY COMPOSER
// UI-only: controlled textarea + submit.
// No DAL, no controllers.
// ============================================================================

import React, { useMemo, useState } from 'react'

/**
 * @param {{
 *  onSubmit: (input: { body: string }) => void,
 *  loading?: boolean,
 *  disabled?: boolean,
 *  placeholder?: string,
 *  buttonLabel?: string,
 *  className?: string,
 * }} props
 */
export function WandersReplyComposer({
  onSubmit,
  loading = false,
  disabled = false,
  placeholder = 'Write a reply…',
  buttonLabel = 'Send',
  className = '',
}) {
  const [body, setBody] = useState('')

  const canSubmit = useMemo(() => {
    return !!body.trim() && !loading && !disabled
  }, [body, loading, disabled])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    if (typeof onSubmit !== 'function') return

    onSubmit({ body: trimmed })
    setBody('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        'w-full rounded-2xl border border-gray-200 bg-white p-3',
        className,
      ].join(' ')}
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={disabled || loading}
        className={[
          'w-full resize-none rounded-xl border bg-gray-50 px-3.5 py-2.5 text-[14px] leading-6 shadow-sm',
          'border-gray-200 text-gray-900 placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 focus:bg-gray-50',
          (disabled || loading) ? 'opacity-60 cursor-not-allowed' : '',
        ].join(' ')}
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          {body.trim().length ? `${body.trim().length} chars` : ''}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={[
            'rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition',
            'hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500/30',
            !canSubmit ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {loading ? 'Sending…' : buttonLabel}
        </button>
      </div>
    </form>
  )
}

export default WandersReplyComposer
