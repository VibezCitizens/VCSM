// src/season/lovedrop/components/LovedropCardPreview.jsx

import React, { useMemo } from 'react'

function getTemplateStyles(templateKey) {
  switch (templateKey) {
    case 'cute':
      return {
        wrapper: 'bg-pink-50 border-pink-200',
        title: 'text-pink-700',
        accent: 'text-pink-600',
      }
    case 'spicy':
      return {
        wrapper: 'bg-red-50 border-red-200',
        title: 'text-red-700',
        accent: 'text-red-600',
      }
    case 'mystery':
      return {
        wrapper: 'bg-gray-900 border-gray-700 text-white',
        title: 'text-white',
        accent: 'text-gray-200',
      }
    case 'elegant':
      return {
        wrapper: 'bg-indigo-50 border-indigo-200',
        title: 'text-indigo-900',
        accent: 'text-indigo-700',
      }
    case 'classic':
    default:
      return {
        wrapper: 'bg-rose-50 border-rose-200',
        title: 'text-rose-900',
        accent: 'text-rose-600',
      }
  }
}

export function LovedropCardPreview({ payload, card, className = '' }) {
  const view = useMemo(() => {
    const templateKey = payload?.templateKey ?? card?.templateKey ?? 'classic'
    const isAnonymous = payload?.isAnonymous ?? card?.isAnonymous ?? false

    const toName =
      payload?.toName ??
      card?.customization?.toName ??
      card?.customization?.to_name ??
      null

    const fromName =
      payload?.fromName ??
      card?.customization?.fromName ??
      card?.customization?.from_name ??
      null

    const messageText = payload?.messageText ?? card?.messageText ?? ''
    const customization = payload?.customization ?? card?.customization ?? {}

    return {
      templateKey,
      isAnonymous,
      toName,
      fromName,
      messageText,
      customization,
    }
  }, [payload, card])

  const styles = getTemplateStyles(view.templateKey)

  const displayTo = (view.toName || '').trim()
  const fromTrimmed = (view.fromName || '').trim()
  const displayFrom = view.isAnonymous ? 'Secret admirer 💌' : (fromTrimmed || 'Someone 💌')
  const displayMsg = (view.messageText || '').trim()

  const bgImage = view.customization?.imageDataUrl || null
  const isMystery = view.templateKey === 'mystery'
  const hasImage = !!bgImage

  // ✅ PANEL: glass only if image exists
  // ✅ mystery: always dark panel + light text
  const panelClass = isMystery
    ? [
        'bg-black/55',
        hasImage ? 'backdrop-blur-md' : '',
        'border border-white/15',
        'text-white',
      ].join(' ')
    : [
        hasImage ? 'bg-white/70 backdrop-blur-md border border-white/40' : 'bg-white border border-black/5',
        'text-black',
      ].join(' ')

  const headerTextClass = isMystery ? 'text-gray-200' : 'text-gray-700'
  const messageTextClass = isMystery ? 'text-white' : 'text-gray-900'

  return (
    <div
      className={[
        'relative overflow-hidden rounded-xl border shadow-sm',
        styles.wrapper,
        className,
      ].join(' ')}
    >
      {/* BACKGROUND IMAGE */}
      {bgImage ? (
        <img
          src={bgImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      {/* TINT OVERLAY */}
      {bgImage ? (
        <div className={['absolute inset-0', isMystery ? 'bg-black/35' : 'bg-black/25'].join(' ')} />
      ) : null}

      {/* CONTENT PANEL */}
      <div className={['relative z-10 m-3 rounded-xl p-4', panelClass].join(' ')}>
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <div className={['text-sm', headerTextClass].join(' ')}>
            {displayTo ? `To: ${displayTo}` : 'To: (someone special)'}
          </div>

          <div className="flex items-center gap-3">
            <div className={['text-sm font-semibold opacity-80', styles.title].join(' ')}>
              LoveDrop
            </div>
            {/* removed style label (view.templateKey) */}
          </div>
        </div>

        {/* MESSAGE */}
        <div className={['mt-4 whitespace-pre-wrap text-base leading-relaxed', messageTextClass].join(' ')}>
          {displayMsg ? displayMsg : 'Write your message…'}
        </div>

        {/* FROM */}
        <div className={['mt-4 text-sm', headerTextClass].join(' ')}>
          From: {displayFrom}
        </div>
      </div>
    </div>
  )
}

export default LovedropCardPreview
