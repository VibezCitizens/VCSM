// src/shared/components/components/ActorActionsMenu.jsx
// ============================================================
//  ActorActionsMenu
// ------------------------------------------------------------
//  UI-only reusable actor actions menu
// ============================================================

import { useState } from 'react'
import { DotsThreeVertical } from 'phosphor-react'

import BlockConfirmModal from '@/features/block/ui/BlockConfirmModal'
import { useBlockStatus } from '@/features/block/hooks/useBlockStatus'
import { useBlockActions } from '@/features/block/hooks/useBlockActions'

export default function ActorActionsMenu({
  viewerActorId,
  targetActorId,
  align = 'right', // 'left' | 'right'
  onBlocked,        // ✅ NEW
}) {
  const [open, setOpen] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)

  const {
    isBlocked,
    blockedMe,
  } = useBlockStatus(viewerActorId, targetActorId)

  const {
    block,
    unblock,
    working,
  } = useBlockActions(viewerActorId, targetActorId)

  // Guards
  if (
    !viewerActorId ||
    !targetActorId ||
    viewerActorId === targetActorId
  ) {
    return null
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
      >
        <DotsThreeVertical size={18} className="text-neutral-400" />
      </button>

      {/* Menu */}
      {open && (
        <div
          className={`
            absolute top-10 z-40 w-44 rounded-xl
            bg-neutral-900 border border-neutral-800 shadow-xl
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          <button
            disabled={blockedMe}
            onClick={() => {
              setOpen(false)
              setShowBlockConfirm(true)
            }}
            className={`
              w-full px-4 py-2 text-left text-sm rounded-xl
              ${blockedMe
                ? 'text-neutral-600 cursor-not-allowed'
                : 'text-red-400 hover:bg-neutral-800'}
            `}
          >
            {isBlocked ? 'Unblock user' : 'Block user'}
          </button>
        </div>
      )}

      {/* Confirm modal */}
      <BlockConfirmModal
        open={showBlockConfirm}
        mode={isBlocked ? 'unblock' : 'block'}
        targetActorId={targetActorId}
        loading={working}
        onCancel={() => setShowBlockConfirm(false)}
        onConfirm={async () => {
          try {
            if (isBlocked) {
              await unblock()
            } else {
              await block()

              // 🚀 NOTIFY PARENT AFTER BLOCK
              onBlocked?.()
            }
          } finally {
            setShowBlockConfirm(false)
          }
        }}
      />
    </div>
  )
}
