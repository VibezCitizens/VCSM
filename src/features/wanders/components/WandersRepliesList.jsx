// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersRepliesList.jsx
// ============================================================================
// WANDERS COMPONENT — REPLIES LIST
// UI-only. Displays ordered replies for a card.
// No DAL, no controller logic.
// ============================================================================

import React from 'react'

/**
 * @param {{
 *  replies?: Array<{
 *    id: string,
 *    body?: string | null,
 *    body_ciphertext?: string | null,
 *    created_at?: string,
 *    author_actor_id?: string | null,
 *    author_anon_id?: string | null,
 *    is_deleted?: boolean,
 *  }>,
 *  currentActorId?: string | null,
 *  currentAnonId?: string | null,
 *  emptyComponent?: React.ReactNode,
 *  className?: string,
 * }} props
 */
export function WandersRepliesList({
  replies = [],
  currentActorId = null,
  currentAnonId = null,
  emptyComponent = null,
  className = '',
}) {
  if (!replies?.length) {
    return emptyComponent || (
      <div className="py-6 text-center text-sm text-gray-500">
        No replies yet.
      </div>
    )
  }

  return (
    <div className={['flex flex-col gap-3', className].join(' ')}>
      {replies.map((reply) => {
        const isOwn =
          (reply.author_actor_id &&
            currentActorId &&
            reply.author_actor_id === currentActorId) ||
          (reply.author_anon_id &&
            currentAnonId &&
            reply.author_anon_id === currentAnonId)

        const deleted = reply.is_deleted === true

        const createdAt = reply.created_at
          ? new Date(reply.created_at).toLocaleString()
          : null

        return (
          <div
            key={reply.id}
            className={[
              'max-w-[85%] rounded-xl border px-3.5 py-2.5 text-sm shadow-sm',
              isOwn
                ? 'ml-auto bg-pink-50 border-pink-200 text-gray-900'
                : 'mr-auto bg-white border-gray-200 text-gray-900',
            ].join(' ')}
          >
            {/* BODY */}
            <div className="whitespace-pre-wrap leading-relaxed">
              {deleted
                ? <span className="italic text-gray-400">Message deleted</span>
                : (reply.body || 'Encrypted message')}
            </div>

            {/* META */}
            <div className="mt-1 text-[11px] opacity-60">
              {isOwn ? 'You' : 'Them'}
              {createdAt ? ` • ${createdAt}` : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default WandersRepliesList
