// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersCardDetail.jsx
// ============================================================================
// WANDERS COMPONENT — CARD DETAIL
// UI-only card detail renderer + replies slot.
// No DAL, no controllers, no business rules.
// ============================================================================

import React, { useMemo } from 'react'
import WandersCardPreview from '@/features/wanders/components/WandersCardPreview'

/**
 * @param {{
 *   card: any,
 *   replies?: React.ReactNode,
 *   actions?: React.ReactNode,
 *   className?: string,
 * }} props
 */
export function WandersCardDetail({
  card,
  replies = null,
  actions = null,
  className = '',
}) {
  const meta = useMemo(() => {
    if (!card) return null

    const sentAt = card?.sentAt ?? card?.sent_at ?? null
    const createdAt = card?.createdAt ?? card?.created_at ?? null

    // ✅ Prefer last_opened_at when present (your DB uses it)
    const openedAt =
      card?.lastOpenedAt ??
      card?.last_opened_at ??
      card?.openedAt ??
      card?.opened_at ??
      null

    // ✅ open_count sometimes arrives as string from PostgREST — normalize
    const rawOpenCount = card?.openCount ?? card?.open_count ?? 0
    const openCount = Number.isFinite(Number(rawOpenCount))
      ? Number(rawOpenCount)
      : 0

    const status = card?.status ?? 'draft'

    const formatDate = (v) => {
      if (!v) return null
      try {
        return new Date(v).toLocaleString()
      } catch {
        return null
      }
    }

    return {
      status,
      createdAtLabel: formatDate(createdAt),
      sentAtLabel: formatDate(sentAt),
      openedAtLabel: formatDate(openedAt),
      openCount,
    }
  }, [card])

  const normalizedCard = useMemo(() => {
    if (!card) return card

    // Parse customization if it arrived as JSON string
    let customization = card?.customization ?? null
    if (typeof customization === 'string') {
      try {
        customization = JSON.parse(customization)
      } catch {
        customization = null
      }
    }

    return {
      ...card,

      // Keep both shapes to make all components happy
      templateKey: card?.templateKey ?? card?.template_key,
      template_key: card?.template_key ?? card?.templateKey,

      messageText: card?.messageText ?? card?.message_text,
      message_text: card?.message_text ?? card?.messageText,

      // If you ever store these later, keep both
      toName: card?.toName ?? customization?.toName ?? customization?.to_name,
      fromName: card?.fromName ?? customization?.fromName ?? customization?.from_name,

      customization: customization ?? {},
    }
  }, [card])

  if (!card) {
    return (
      <div
        className={[
          'flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500',
          className,
        ].join(' ')}
      >
        No card selected.
      </div>
    )
  }

  return (
    <div
      className={[
        'w-full space-y-4 rounded-2xl border border-gray-200 bg-white p-4 md:p-5',
        className,
      ].join(' ')}
    >
      {/* CARD PREVIEW */}
      <WandersCardPreview card={normalizedCard} />

      {/* META */}
      {meta && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-500 sm:grid-cols-4">
          <div>
            <div className="opacity-60">Status</div>
            <div className="font-semibold text-gray-800">{meta.status}</div>
          </div>

          {meta.createdAtLabel && (
            <div>
              <div className="opacity-60">Created</div>
              <div className="font-medium text-gray-800">{meta.createdAtLabel}</div>
            </div>
          )}

          {meta.sentAtLabel && (
            <div>
              <div className="opacity-60">Sent</div>
              <div className="font-medium text-gray-800">{meta.sentAtLabel}</div>
            </div>
          )}

          {meta.openedAtLabel && (
            <div>
              <div className="opacity-60">Last opened</div>
              <div className="font-medium text-gray-800">{meta.openedAtLabel}</div>
            </div>
          )}

          <div>
            <div className="opacity-60">Opens</div>
            <div className="font-medium text-gray-800">{meta.openCount}</div>
          </div>
        </div>
      )}

      {/* ACTION SLOT */}
      {actions ? <div className="pt-2">{actions}</div> : null}

      {/* REPLIES SLOT */}
      {replies ? <div className="pt-2 border-t border-gray-100">{replies}</div> : null}
    </div>
  )
}

export default WandersCardDetail
