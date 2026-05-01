// src/features/block/adapters/ui/ActorActionsMenu.jsx
// Block-feature actor actions menu. Owned here — not in shared/.

import { useState } from 'react'
import { DotsThreeVertical } from 'phosphor-react'

import BlockConfirmModal from '@/features/block/ui/BlockConfirmModal'
import { useBlockStatus } from '@/features/block/hooks/useBlockStatus'
import { useBlockActions } from '@/features/block/hooks/useBlockActions'

export default function ActorActionsMenu({
  viewerActorId,
  targetActorId,
  align = 'right',
  onBlocked,
}) {
  const [open, setOpen] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)

  const { isBlocked, blockedMe } = useBlockStatus(viewerActorId, targetActorId)
  const { block, unblock, working } = useBlockActions(viewerActorId, targetActorId)

  if (!viewerActorId || !targetActorId || viewerActorId === targetActorId) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-full hover:bg-white/6 transition-colors"
      >
        <DotsThreeVertical size={18} className="text-white/50" />
      </button>

      {open && (
        <div
          className={`
            absolute top-10 z-40 w-44 rounded-xl
            bg-white/4 border border-neutral-800 shadow-xl
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
                ? 'text-white/30 cursor-not-allowed'
                : 'text-red-400 hover:bg-white/6'}
            `}
          >
            {isBlocked ? 'Unblock Citizen' : 'Block Citizen'}
          </button>
        </div>
      )}

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
