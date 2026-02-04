// src/season/lovedrop/screens/LovedropShare.screen.jsx

import React, { useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import LovedropShareButtons from '@/season/lovedrop/components/LovedropShareButtons'
import LovedropCardPreview from '@/season/lovedrop/components/LovedropCardPreview'

/**
 * LovedropShareScreen
 * Route: /lovedrop/created/:publicId
 *
 * Responsibilities:
 * - Show success UI after create
 * - Render share buttons
 * - Optionally render a preview (lightweight) if card was passed in
 *
 * NOTE:
 * This screen does NOT fetch the card again. It can render preview if you pass `card` or `payload`.
 * The share buttons only need publicId.
 *
 * @param {{
 *   publicId?: string,          // optional if you pass explicitly
 *   card?: any,                 // optional domain card
 *   payload?: any,              // optional create payload
 *   baseUrl?: string,           // optional
 *   shareMessage?: string,      // optional
 *   redirectToView?: boolean,   // optional: if true, immediately redirect to /lovedrop/v/:publicId
 * }} props
 */
export function LovedropShareScreen({
  publicId,
  card,
  payload,
  baseUrl,
  shareMessage,
  redirectToView = true,
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

  // ✅ Make this route impossible to "blank": if we have pid, go to view page.
  if (redirectToView && pid) {
    return <Navigate to={`/lovedrop/v/${pid}`} replace />
  }

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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Your LoveDrop is ready 💌</h1>
        <p className="mt-1 text-sm text-gray-600">
          Share it anywhere — SMS/iMessage, WhatsApp, or email.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 text-sm font-medium text-gray-700">Share</div>

          <LovedropShareButtons
            publicId={pid}
            baseUrl={baseUrl}
            message={shareMessage}
          />

          <div className="mt-4 rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Tip: the receiver opening the link is what counts as an “open”.
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 text-sm font-medium text-gray-700">Preview</div>
          <LovedropCardPreview payload={payload} card={card} />
        </div>
      </div>
    </div>
  )
}

export default LovedropShareScreen
