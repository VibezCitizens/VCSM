// src/season/lovedrop/screens/LovedropShare.screen.jsx

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom' // ✅ add Link
import LovedropShareButtons from '@/season/lovedrop/components/LovedropShareButtons'
import LovedropCardPreview from '@/season/lovedrop/components/LovedropCardPreview'
import LovedropLoading from '@/season/lovedrop/components/LovedropLoading'
import { getLovedropCard } from '@/season/lovedrop/controllers/getLovedropCard.controller'
import { ensureLovedropAnonIdentity } from '@/season/lovedrop/controllers/ensureLovedropAnon.controller'

export function LovedropShareScreen({
  publicId,
  card,
  payload,
  baseUrl,
  shareMessage,
  redirectToView = false,
  clientKey = null,
}) {
  const params = useParams()
  const paramsPublicId = (params.publicId ?? '').trim()

  const pid = useMemo(() => {
    return (
      (publicId ?? '').trim() ||
      (card?.publicId ?? card?.public_id ?? '').trim() ||
      paramsPublicId ||
      null
    )
  }, [publicId, card, paramsPublicId])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fetchedCard, setFetchedCard] = useState(null)

  const [viewerAnonId, setViewerAnonId] = useState(null)

  useEffect(() => {
    let alive = true
    const run = async () => {
      if (!pid) return
      setLoading(true)
      setError(null)
      try {
        const c = await getLovedropCard({ publicId: pid })
        if (alive) setFetchedCard(c)
      } catch (e) {
        if (alive) setError(e)
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [pid])

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const anon = await ensureLovedropAnonIdentity({ clientKey })
        if (alive) setViewerAnonId(anon?.id ?? null)
      } catch (e) {}
    }
    run()
    return () => {
      alive = false
    }
  }, [clientKey])

  if (!pid) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-lg font-semibold">Missing publicId</div>
          <div className="mt-1 text-sm text-gray-600">
            This page needs a publicId to show share options.
          </div>
        </div>
      </div>
    )
  }

  const previewCard = fetchedCard || card || null

  const title = useMemo(() => {
    const c = previewCard
    if (!c) return 'LoveDrop'
    const toName = c?.customization?.toName ?? c?.customization?.to_name ?? null
    return toName ? `LoveDrop for ${toName}` : 'LoveDrop'
  }, [previewCard])

  const tracked = 'no'

  return (
    <div
      className="
        relative
        h-screen
        w-full
        overflow-y-auto
        touch-pan-y
        bg-black
        text-white
      "
    >
      <div
        aria-hidden
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]
        "
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-lg font-bold tracking-wide">{title}</h1>
            <span className="text-xs text-zinc-400">status: sent</span>
          </div>

          <div className="pb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
              opens: {previewCard?.openCount ?? previewCard?.open_count ?? 0}
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
              tracked: {tracked}
            </span>

            {viewerAnonId ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                viewer: anon
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error?.message ? String(error.message) : 'Could not load preview.'}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white p-4 text-black">
            <div className="mb-3 text-sm font-medium text-gray-700">Preview</div>

            {loading && !previewCard ? (
              <LovedropLoading label="Loading preview…" />
            ) : (
              // ✅ IMPORTANT: show the saved card, not the draft payload
              <LovedropCardPreview card={previewCard} />
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white p-4 text-black">
            <div className="mb-3 text-sm font-medium text-gray-700">Share</div>

            <LovedropShareButtons publicId={pid} baseUrl={baseUrl} message={shareMessage} />

            <div className="mt-4 rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <div className="font-medium text-gray-900">What happens next</div>
              <div className="mt-1 text-gray-700">
                When they open your link, the open count updates. If they reply, you’ll be able to see replies too.
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {/* ✅ SPA nav (no reload) */}
                <Link
                  to="/lovedrop"
                  className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Share another LoveDrop
                </Link>

                {/* ✅ SPA nav (no reload) */}
                <Link
                  to="/lovedrop/outbox"
                  className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  View this LoveDrop
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LovedropShareScreen
