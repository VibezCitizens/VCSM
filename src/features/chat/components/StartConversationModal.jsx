import React, { useEffect, useMemo, useState } from 'react'

/**
 * StartConversationModal
 * VERSION: 2025-11-11 (preserve _kind; no forced user kind; safe free-text)
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onPick: (picked: {
 *     id: string,                     // profileId or vportId or free-text
 *     kind?: 'user'|'vport',          // optional; we prefer _kind
 *     _kind?: 'user'|'vport',         // authoritative kind from search adapter
 *     display_name?: string,
 *     username?: string,
 *     photo_url?: string
 *   }) => void
 * - onSearch?: (query: string) => Promise<Array<{
 *     id: string,
 *     display_name?: string,
 *     username?: string,
 *     photo_url?: string,
 *     _kind: 'user'|'vport'
 *   }>>
 */
export default function StartConversationModal({ open, onClose, onPick, onSearch }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  const query = useMemo(() => q.trim(), [q])

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

  // Free-text start: DO NOT set kind; resolver will probe both sides
  const pickDirect = () => {
    if (!query) return
    onPick?.({
      id: query, // pass-through for resolver
      // no kind/_kind here on purpose
      display_name: query,
      username: query.startsWith('@') ? query.slice(1) : query.replace(/\s+/g, ''),
      photo_url: undefined,
    })
    onClose?.()
  }

  // Preserve the row’s authoritative _kind; never coerce to 'user'
  const handlePickRow = (u) => {
    onPick?.({
      id: u.id,
      _kind: u._kind,                       // <-- keep authoritative kind
      kind: u.kind ?? u._kind,              // optional duplicate for legacy
      display_name: u.display_name ?? u.username ?? (u._kind === 'vport' ? 'VPort' : 'User'),
      username: u.username ?? undefined,
      photo_url: u.photo_url ?? undefined,
    })
    onClose?.()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Conversation</h2>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm hover:bg-gray-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or @username"
            className="mb-3 w-full rounded-xl border px-3 py-2"
          />
          <button
            type="button"
            disabled={!query}
            onClick={pickDirect}
            className="mb-3 shrink-0 rounded-xl border px-3 py-2 disabled:opacity-50"
            title="Start with this name"
          >
            Start
          </button>
        </div>

        {loading && <div className="py-2 text-sm text-gray-500">Searching…</div>}

        {!loading && query && rows.length === 0 && (
          <div className="py-2 text-sm text-gray-500">
            {typeof onSearch === 'function'
              ? <>No results for “{query}”.</>
              : <>Connect <code>onSearch</code> prop to enable results.</>}
          </div>
        )}

        {rows.length > 0 && (
          <ul className="max-h-80 space-y-2 overflow-auto">
            {rows.map((u) => (
              <li
                key={u.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border p-2 hover:bg-gray-50"
                onClick={() => handlePickRow(u)}
                title={u._kind === 'vport' ? 'VPort' : 'User'}
              >
                <img
                  src={u.photo_url || '/avatar.jpg'}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {u.display_name || u.username || (u._kind === 'vport' ? 'VPort' : 'User')}
                  </div>
                  {u.username && (
                    <div className="text-xs text-gray-500">@{u.username}</div>
                  )}
                </div>
                <span className="ml-auto rounded-full border px-2 py-0.5 text-xs text-gray-500">
                  {u._kind === 'vport' ? 'vport' : 'user'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
