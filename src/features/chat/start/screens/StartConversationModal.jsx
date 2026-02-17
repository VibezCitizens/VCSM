// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

import React, { useEffect, useMemo, useState } from 'react'

/**
 * StartConversationModal
 * VISUAL UPDATE –  + PURPLE THEME
 * NO LOGIC CHANGED
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
      if (!query) { setRows([]); return }
      if (typeof onSearch !== 'function') { setRows([]); return }

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
    return () => { cancelled = true }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      {/* ✅ make modal background closer to Explore (darker, less “grey card” effect) */}
      <div
        className="w-full sm:sm:max-w-lg rounded-3xl
                   bg-black border border-white/10
                   shadow-[0_0_40px_-16px_rgba(128,0,255,0.45)] p-6"
      >
        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New Vox</h2>

          <button
            type="button"
            className="rounded-lg px-3 py-1 text-sm text-purple-300 hover:bg-purple-900/40"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* ================= SEARCH INPUT (MATCH Explore SearchScreen) ================= */}
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search Citizens, Vports…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="
              w-full px-4 py-2 pr-10
              rounded-2xl bg-neutral-900 text-white
              border border-purple-700
              focus:ring-2 focus:ring-purple-500
            "
            onKeyDown={(e) => {
              if (e.key === 'Enter') pickDirect()
            }}
          />

          {canClear && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
              aria-label="Clear"
            >
              ×
            </button>
          )}
        </div>

        {loading && (
          <div className="py-2 text-sm text-gray-400">Searching…</div>
        )}

        {!loading && query && rows.length === 0 && (
          <div className="py-2 text-sm text-gray-500">
            {typeof onSearch === 'function'
              ? <>No results for “{query}”.</>
              : <>Connect <code>onSearch</code> to enable results.</>}
          </div>
        )}

        {/* RESULTS */}
        {rows.length > 0 && (
          <ul className="max-h-80 space-y-2 overflow-auto">
            {rows.map((u) => (
              <li
                key={u.id}
                className="w-full flex cursor-pointer items-center gap-3
                           rounded-2xl border border-purple-900/40
                           p-3
                           bg-[#1d1d1d] hover:bg-[#242424]
                           shadow-[0_0_12px_-4px_rgba(128,0,255,0.4)]"
                onClick={() => handlePickRow(u)}
              >
                <img
                  src={u.photo_url || '/avatar.jpg'}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover shadow-lg border border-purple-800/30"
                />

                <div className="min-w-0 text-white">
                  <div className="truncate font-medium text-purple-300">
                    {u.display_name || u.username}
                  </div>
                  {u.username && (
                    <div className="text-xs text-gray-400">@{u.username}</div>
                  )}
                </div>

                <span
                  className="ml-auto rounded-full border border-purple-700/40
                             px-2 py-1 text-xs text-purple-300 bg-purple-900/40
                             capitalize"
                >
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
