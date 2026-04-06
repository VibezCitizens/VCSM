// ============================================================
//  FRIENDS SYSTEM — RANK PICKER MODAL (ACTOR-BASED)
// ============================================================

import { useActorSummary } from '@/state/actors/useActorSummary'
import ActorLink from '@/shared/components/ActorLink'

import { useTopFriendCandidates } from '@/features/profiles/screens/views/tabs/friends/hooks/useTopFriendCandidates'

/**
 * PROPS
 * ownerActorId  uuid
 * existingIds   uuid[]   (already ranked)
 * maxRanks      number   (default 10)
 * onSelect      fn(actorId)
 * onClose       fn()
 */
export default function RankPickerModal({
  ownerActorId,
  existingIds = [],
  maxRanks = 10,
  onSelect,
  onClose,
}) {
  const { loading, candidateIds } = useTopFriendCandidates({
    ownerActorId,
    existingIds,
    maxRanks,
    open: true,
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/68 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="profiles-card profiles-friends-picker w-full max-w-md rounded-xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-3">
          <h3 className="text-lg font-semibold text-slate-100">
            Add Top Friend
          </h3>
          <p className="text-xs text-slate-300/75">
            Pick someone you already follow
          </p>
        </header>

        {loading && (
          <p className="profiles-subcard py-4 px-3 text-sm text-slate-300/75">
            Loading...
          </p>
        )}

        {!loading && candidateIds.length === 0 && (
          <p className="profiles-subcard py-4 px-3 text-sm text-slate-300/75">
            No available friends to add.
          </p>
        )}

        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {candidateIds.map((actorId) => (
            <CandidateRow
              key={actorId}
              actorId={actorId}
              onPick={() => onSelect(actorId)}
            />
          ))}
        </div>

        <footer className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="profiles-pill-btn px-4 py-2 text-sm text-slate-200/90"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  )
}

function CandidateRow({ actorId, onPick }) {
  const actor = useActorSummary(actorId)
  if (!actor?.actorId) return null

  return (
    <button
      onClick={onPick}
      className="profiles-friend-picker-row"
    >
      <ActorLink
        actor={actor}
        avatarSize="w-9 h-9"
        avatarShape="rounded-lg"
        showUsername
      />

      <span className="profiles-friend-picker-cta">
        Add
      </span>
    </button>
  )
}

