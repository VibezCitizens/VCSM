// src/season/lovedrop/screens/LovedropRecipient.screen.jsx

import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import LovedropCardPreview from '@/season/lovedrop/components/LovedropCardPreview'
import LovedropLoading from '@/season/lovedrop/components/LovedropLoading'
import { useLovedropCard } from '@/season/lovedrop/hooks/useLovedropCard'

/**
 * LovedropRecipientScreen
 * Route: /lovedrop/v/:publicId
 *
 * Responsibilities:
 * - Public recipient view
 * - Counts "open" (through useLovedropCard -> openLovedropCard) when loaded
 * - Shows ONLY the card (no share / analytics UI)
 */
export function LovedropRecipientScreen() {
  const params = useParams()
  const publicId = useMemo(() => (params.publicId ?? '').trim() || null, [params.publicId])

  const { loading, error, card } = useLovedropCard({
    publicId: publicId || '',
    // trackOpen defaults true in your hook, so recipient opens get counted
  })

  if (!publicId) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-lg font-semibold">Missing link</div>
          <div className="mt-1 text-sm text-gray-600">
            This LoveDrop link is missing a public id.
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="rounded-xl border bg-white p-5">
          <LovedropLoading label="Opening LoveDrop…" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-lg font-semibold">Couldn’t open LoveDrop</div>
          <div className="mt-1 text-sm text-gray-600">
            {error?.message ? String(error.message) : 'Something went wrong.'}
          </div>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-lg font-semibold">LoveDrop not found</div>
          <div className="mt-1 text-sm text-gray-600">
            This LoveDrop may have expired or been removed.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="mb-5">
        <div className="text-2xl font-semibold">
          {card?.customization?.toName ? `LoveDrop for ${card.customization.toName} 💌` : 'A LoveDrop for you 💌'}
        </div>
        <div className="mt-1 text-sm text-gray-600">
          Someone sent you a message.
        </div>
      </div>

      <LovedropCardPreview card={card} />

      {/* Optional: tiny footer */}
      <div className="mt-6 text-center text-xs text-gray-500">
        Made with LoveDrop
      </div>
    </div>
  )
}

export default LovedropRecipientScreen
