// src/season/lovedrop/screens/LovedropCreate.screen.jsx

import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LovedropCreateForm from '@/season/lovedrop/components/LovedropCreateForm'
import LovedropCardPreview from '@/season/lovedrop/components/LovedropCardPreview'
import LovedropLoading from '@/season/lovedrop/components/LovedropLoading'
import { createLovedropCard } from '@/season/lovedrop/controllers/createLovedropCard.controller'

/**
 * LovedropCreateScreen
 * Route: /lovedrop (or whatever you wire in router)
 */
export function LovedropCreateScreen({
  realmId,
  viewerActorId = null,
  viewerAnonId = null,
  baseUrl,
  onCreatedNavigate,
}) {
  const navigate = useNavigate()

  const [draft, setDraft] = useState({
    toName: null,
    fromName: null,
    messageText: '',
    templateKey: 'classic',
    isAnonymous: true,
    customization: {},
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const canSubmit = useMemo(() => {
    return !!realmId && !!(draft.messageText || '').trim()
  }, [realmId, draft.messageText])

  const handleDraft = useCallback((nextDraft) => {
    setDraft((prev) => ({ ...prev, ...nextDraft }))
  }, [])

  const handleSubmit = useCallback(
    async (payloadFromForm) => {
      // Keep preview in sync
      handleDraft(payloadFromForm)

      if (!realmId) return
      if (!payloadFromForm?.messageText?.trim()) return

      setSubmitting(true)
      setError(null)

      try {
        const res = await createLovedropCard({
          realmId,
          senderActorId: viewerActorId,
          senderAnonId: viewerAnonId,
          templateKey: payloadFromForm.templateKey,
          isAnonymous: !!payloadFromForm.isAnonymous,
          messageText: payloadFromForm.messageText,
          customization: {
            ...(payloadFromForm.customization ?? {}),
            toName: payloadFromForm.toName ?? null,
            fromName: payloadFromForm.fromName ?? null,
          },
          baseUrl,
        })

        const url = res?.url
        const publicId = res?.publicId

        if (typeof onCreatedNavigate === 'function' && url) {
          onCreatedNavigate(url)
          return
        }

        if (publicId) {
          // ✅ SPA navigation (no reload)
          navigate(`/lovedrop/created/${publicId}`)
          return
        }

        if (url) {
          // If url is truly external, keep assign
          window.location.assign(url)
        }
      } catch (e) {
        setError(e)
      } finally {
        setSubmitting(false)
      }
    },
    [realmId, viewerActorId, viewerAnonId, baseUrl, onCreatedNavigate, handleDraft, navigate]
  )

  return (
    /* 🔑 SCROLL OWNER (SettingsScreen pattern, screen-local) */
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
          <div className="py-3">
            <h1 className="text-lg font-bold tracking-wide">Create a LoveDrop 💌</h1>
            <p className="mt-1 text-sm text-zinc-300">
              Write something sweet, funny, or secret — then share a link.
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-6">
        {submitting ? <LovedropLoading label="Creating your LoveDrop…" /> : null}

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error?.message || 'Something went wrong.'}
          </div>
        ) : null}

        {/* ✅ MOBILE: Preview on top */}
        <div className="grid gap-6 md:hidden">
          <div className="rounded-xl border bg-white p-4 text-black">
            <div className="mb-3 text-sm font-medium text-gray-700">
              Preview
            </div>
            <LovedropCardPreview payload={draft} />
          </div>

          <div className="rounded-xl border bg-white p-4 text-black">
            <LovedropCreateForm
              loading={submitting}
              disabled={!canSubmit || submitting}
              onDraftChange={handleDraft}
              onSubmit={handleSubmit}
            />
          </div>
        </div>

        {/* ✅ DESKTOP: Form left, Preview right */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-6">
          <div className="rounded-xl border bg-white p-4 text-black">
            <LovedropCreateForm
              loading={submitting}
              disabled={!canSubmit || submitting}
              onDraftChange={handleDraft}
              onSubmit={handleSubmit}
            />
          </div>

          <div className="rounded-xl border bg-white p-4 text-black">
            <div className="mb-3 text-sm font-medium text-gray-700">
              Preview
            </div>
            <LovedropCardPreview payload={draft} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default LovedropCreateScreen
