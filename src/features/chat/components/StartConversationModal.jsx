import React, { useEffect, useMemo, useState } from 'react'

/**
 * StartConversationModal
 * VISUAL UPDATE – TELEGRAM STYLE + PURPLE THEME
 * NO LOGIC CHANGED
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
    <div className="fixed inset-0 z-50 flex items-center justify-center 
                    bg-black/70 backdrop-blur-md">
      <div className="w-full sm:sm:max-w-lg rounded-3xl 
                bg-[#181818] border border-purple-800/30 
                shadow-[0_0_40px_-10px_rgba(128,0,255,0.6)] p-6">


        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New Conversation</h2>

          <button
            type="button"
            className="rounded-lg px-3 py-1 text-sm text-purple-300 
                       hover:bg-purple-900/40"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* INPUT + BUTTON */}
        <div className="flex gap-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or @username"
            className="mb-3 w-full rounded-xl border border-purple-700/40 
                       bg-[#101010] px-3 py-2 text-white shadow-inner 
                       placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
          />

          <button
            type="button"
            disabled={!query}
            onClick={pickDirect}
            className="mb-3 shrink-0 rounded-xl bg-purple-600 
                       px-4 py-2 text-white shadow-md 
                       hover:bg-purple-700 disabled:bg-gray-700"
          >
            Start
          </button>
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
          <ul className="max-h-80 space-y-2 overflow-auto pr-1">
            {rows.map((u) => (
              <li
                key={u.id}
                className="flex cursor-pointer items-center gap-3 
                           rounded-2xl border border-purple-900/40 
                           p-3 bg-[#1d1d1d] hover:bg-[#242424]
                           shadow-[0_0_12px_-4px_rgba(128,0,255,0.4)]"
                onClick={() => handlePickRow(u)}
              >
                <img
                  src={u.photo_url || '/avatar.jpg'}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover 
                             shadow-lg border border-purple-800/30"
                />

                <div className="min-w-0 text-white">
                  <div className="truncate font-medium text-purple-300">
                    {u.display_name || u.username}
                  </div>
                  {u.username && (
                    <div className="text-xs text-gray-400">@{u.username}</div>
                  )}
                </div>

                <span className="ml-auto rounded-full border border-purple-700/40 
                                 px-2 py-1 text-xs text-purple-300 bg-purple-900/40 
                                 capitalize">
                  {u._kind}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
