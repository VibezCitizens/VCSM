// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

import React, { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

/**
 * StartConversationModal
 * UI-only: styled to match Vox inbox theme.
 * No behavior changes.
 */
export default function StartConversationModal({ open, onClose, onPick, onSearch }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  const query = useMemo(() => q.trim(), [q])
  const canClear = !!query

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!open) return
      if (!query) {
        setRows([])
        return
      }
      if (typeof onSearch !== 'function') {
        setRows([])
        return
      }

      setLoading(true)
      try {
        const data = await onSearch(query)
        if (!cancelled) setRows(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [open, query, onSearch])

  const pickDirect = () => {
    if (!query) return
    onPick?.({
      id: query,
      display_name: query,
      username: query.startsWith('@') ? query.slice(1) : query.replace(/\s+/g, ''),
    })
    onClose?.()
  }

  const handlePickRow = (u) => {
    onPick?.({
      id: u.id,
      _kind: u._kind,
      kind: u.kind ?? u._kind,
      display_name: u.display_name ?? u.username,
      username: u.username ?? undefined,
      photo_url: u.photo_url ?? undefined,
    })
    onClose?.()
  }

  if (!open) return null

  return (
    <div className="chat-modern-page fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-4">
      <div
        className="module-modern-shell chat-modern-shell w-full max-w-lg rounded-3xl p-4 sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-label="New Vox"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">New Vox</h2>

          <button
            type="button"
            className="module-modern-btn module-modern-btn--ghost rounded-full px-3 py-1.5 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="relative mb-4">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            type="text"
            placeholder="Search Citizens, Vports..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="module-modern-input w-full rounded-2xl py-2.5 pl-10 pr-10 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') pickDirect()
            }}
          />

          {canClear && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-700/35 hover:text-slate-200"
              aria-label="Clear"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {loading && <div className="py-2 text-sm text-slate-400">Searching...</div>}

        {!loading && query && rows.length === 0 && (
          <div className="module-modern-card rounded-2xl p-3 text-sm text-slate-400">
            {typeof onSearch === 'function' ? (
              <>No results for "{query}".</>
            ) : (
              <>
                Connect <code>onSearch</code> to enable results.
              </>
            )}
          </div>
        )}

        {rows.length > 0 && (
          <ul className="max-h-80 space-y-2 overflow-auto pr-0.5">
            {rows.map((u) => (
              <li
                key={u.id}
                className="module-modern-card flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-slate-800/55"
                onClick={() => handlePickRow(u)}
              >
                <img
                  src={u.photo_url || '/avatar.jpg'}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-xl border border-slate-300/15 object-cover"
                />

                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-100">
                    {u.display_name || u.username}
                  </div>
                  {u.username && <div className="text-xs text-slate-400">@{u.username}</div>}
                </div>

                <span className="ml-auto rounded-full border border-indigo-300/25 bg-indigo-400/12 px-2.5 py-1 text-xs text-indigo-200 capitalize">
                  {(u.kind ?? u._kind) === 'user'
                    ? 'Citizen'
                    : (u.kind ?? u._kind) === 'vport'
                      ? 'Vport'
                      : (u.kind ?? u._kind)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

