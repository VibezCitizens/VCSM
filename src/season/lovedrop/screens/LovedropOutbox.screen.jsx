// src/season/lovedrop/screens/LovedropOutbox.screen.jsx

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LovedropLoading from '@/season/lovedrop/components/LovedropLoading'
import { ensureLovedropAnonIdentity } from '@/season/lovedrop/controllers/ensureLovedropAnon.controller'
import { listMyLovedrops } from '@/season/lovedrop/controllers/listMyLovedrops.controller'

export function LovedropOutboxScreen({ clientKey = null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    let alive = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const anon = await ensureLovedropAnonIdentity({ clientKey })
        const anonId = anon?.id ?? null
        if (!anonId) throw new Error('Missing anon identity')

        const list = await listMyLovedrops({ ownerAnonId: anonId, limit: 200 })
        if (alive) setItems(list)
      } catch (e) {
        if (alive) setError(e)
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => { alive = false }
  }, [clientKey])

  return (
    <div className="relative h-screen w-full overflow-y-auto touch-pan-y bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]"
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-wide">My LoveDrops</h1>
            <Link
              to="/lovedrop"
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Create new
            </Link>
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            All your cards live here. Each recipient link is still private + unique.
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-6">
        {loading ? <LovedropLoading label="Loading your LoveDrops…" /> : null}

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error?.message ? String(error.message) : 'Something went wrong.'}
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white p-4 text-black">
            <div className="text-sm font-semibold">No LoveDrops yet</div>
            <div className="mt-1 text-sm text-gray-700">
              Create your first LoveDrop, then you’ll see them listed here.
            </div>
            <div className="mt-3">
              <Link
                to="/lovedrop"
                className="inline-flex rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
              >
                Create a LoveDrop
              </Link>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3">
          {items.map(({ outboxId, outboxCreatedAt, card }) => {
            const toName = card?.customization?.toName ?? card?.customization?.to_name ?? null
            return (
              <div key={outboxId} className="rounded-xl border border-white/10 bg-white p-4 text-black">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {toName ? `To: ${toName}` : 'To: (someone special)'}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      opens: {card.openCount ?? 0} • status: {card.status} • {String(outboxCreatedAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/lovedrop/created/${card.publicId}`}
                      className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                    >
                      Share
                    </Link>

                    <Link
                      to={`/lovedrop/v/${card.publicId}`}
                      className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                    >
                      Recipient view
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default LovedropOutboxScreen
