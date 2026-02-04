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
    case 'classic':
    default:
      return {
        wrapper: 'bg-white border-gray-200',
        title: 'text-gray-900',
        accent: 'text-gray-600',
      }
  }
}

/**
 * LovedropCardPreview
 * UI-only preview component for the create flow.
 *
 * Accepts either:
 * - a "draft payload" from LovedropCreateForm
 * OR
 * - a domain card shape from lovedropCardFromRow
 *
 * @param {{
 *   payload?: any,
 *   card?: any,
 *   className?: string
 * }} props
 */
export function LovedropCardPreview({ payload, card, className = '' }) {
  const view = useMemo(() => {
    // Prefer payload (create form) when available; fall back to card (domain model)
    const templateKey = payload?.templateKey ?? card?.templateKey ?? 'classic'
    const isAnonymous = payload?.isAnonymous ?? card?.isAnonymous ?? true

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
  const displayFrom = view.isAnonymous
    ? 'Secret admirer 💌'
    : ((view.fromName || '').trim() || 'Someone 💌')
  const displayMsg = (view.messageText || '').trim()

  return (
    <div
      className={[
        'rounded-xl border p-4 shadow-sm',
        styles.wrapper,
        className,
      ].join(' ')}
    >
      {/* HEADER ROW: To (left) + templateKey (right), baseline-aligned */}
      <div className="flex items-baseline justify-between gap-3">
        <div className={['text-sm', styles.accent].join(' ')}>
          {displayTo ? `To: ${displayTo}` : 'To: (someone special)'}
        </div>

        <div className={['text-xs', styles.accent].join(' ')}>
          {view.templateKey}
        </div>
      </div>

      {/* TITLE */}
      <div className={['mt-2 text-lg font-semibold leading-tight', styles.title].join(' ')}>
        LoveDrop
      </div>

      {/* MESSAGE */}
      <div className="mt-4 whitespace-pre-wrap text-base">
        {displayMsg ? displayMsg : 'Write your message…'}
      </div>

      {/* FROM */}
      <div className={['mt-4 text-sm', styles.accent].join(' ')}>
        From: {displayFrom}
      </div>

      {/* Optional: show tiny customization debug safely (dev only) */}
      {view.customization && Object.keys(view.customization).length > 0 ? (
        <div className="mt-3 text-xs opacity-70">
          {/* Keep it minimal; customization rendering later */}
        </div>
      ) : null}
    </div>
  )
}

export default LovedropCardPreview
