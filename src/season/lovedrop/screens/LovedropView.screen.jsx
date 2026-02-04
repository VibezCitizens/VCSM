// src/season/lovedrop/screens/LovedropView.screen.jsx

import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import LovedropLoading from '@/season/lovedrop/components/LovedropLoading'
import LovedropShareButtons from '@/season/lovedrop/components/LovedropShareButtons'
import LovedropCardPreview from '@/season/lovedrop/components/LovedropCardPreview'
import { useLovedropCard } from '@/season/lovedrop/hooks/useLovedropCard'

/**
 * LovedropViewScreen
 * Route: /lovedrop/v/:publicId
 */
export function LovedropViewScreen({ clientKey = null }) {
  const params = useParams()
  const publicId = (params.publicId ?? '').trim()

  const { loading, error, card, didCountOpen, viewerAnonId, refresh } =
    useLovedropCard({
      publicId,
      viewerActorId: null,
      viewerAnonId: null,
      clientKey,
    })

  const title = useMemo(() => {
    if (!card) return 'LoveDrop'
    const toName =
      card?.customization?.toName ??
      card?.customization?.to_name ??
      null
    return toName ? `LoveDrop for ${toName}` : 'LoveDrop'
  }, [card])

  if (!publicId) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-lg font-semibold">Missing publicId</div>
          <div className="mt-1 text-sm text-gray-600">
            This page needs a publicId in the URL.
          </div>
        </div>
      </div>
    )
  }

  if (loading && !card) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <LovedropLoading label="Opening LoveDrop…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-lg font-semibold">Couldn’t open LoveDrop</div>
          <div className="mt-2 text-sm text-gray-700">
            {error?.message ?? 'Unknown error'}
          </div>

          <button
            type="button"
            onClick={refresh}
            className="mt-4 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-lg font-semibold">LoveDrop not found</div>
          <div className="mt-1 text-sm text-gray-600">
            This link may be invalid or the card was removed.
          </div>
        </div>
      </div>
    )
  }

  return (
    /* 🔑 SCROLL OWNER (same pattern as SettingsScreen) */
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
      {/* ✅ SCROLL-SAFE AMBIENT BACKGROUND */}
      <div
        aria-hidden
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]
        "
      />

      {/* HEADER (sticky inside this scroll container) */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-lg font-bold tracking-wide">{title}</h1>

            <span className="text-xs text-zinc-400">
              status: {card.status}
            </span>
          </div>

          <div className="pb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
              opens: {card.openCount ?? 0}
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
              tracked: {didCountOpen ? 'yes' : 'no'}
            </span>

            {viewerAnonId ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                viewer: anon
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white p-4 text-black">
            <LovedropCardPreview card={card} />
          </div>

          <div className="rounded-xl border border-white/10 bg-white p-4 text-black">
            <div className="mb-3 text-sm font-medium text-gray-700">
              Share a LoveDrop
            </div>

            <LovedropShareButtons publicId={card.publicId} />

            <div className="mt-4 rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Want your own? Create one and share it back.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LovedropViewScreen
