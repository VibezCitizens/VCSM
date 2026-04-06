// ============================================================
//  FRIENDS SYSTEM — TOP FRIENDS RANK EDITOR (ACTOR-BASED)
// ============================================================

import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import '@/features/profiles/styles/profiles-friends-modern.css'

import { useActorSummary } from '@/state/actors/useActorSummary'
import ActorLink from '@/shared/components/ActorLink'

import RankPickerModal from '@/features/profiles/screens/views/tabs/friends/components/RankPickerModal'
import { useTopFriendActorIds } from '@/features/profiles/screens/views/tabs/friends/hooks/useTopFriendActorIds'
import { useSaveTopFriendRanks } from '@/features/profiles/screens/views/tabs/friends/hooks/useSaveTopFriendRanks'

export default function TopFriendsRankEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const ownerActorId = id

  const [showPicker, setShowPicker] = useState(false)
  const [localActorIds, setLocalActorIds] = useState(null)

  const {
    actorIds: loadedActorIds,
    loading,
    refresh,
  } = useTopFriendActorIds({
    ownerActorId,
    limit: 10,
    version: showPicker ? 1 : 0,
    reconcile: true,
    autofill: true,
  })

  const { save, saving } = useSaveTopFriendRanks()

  const actorIds = useMemo(
    () => (Array.isArray(localActorIds) ? localActorIds : loadedActorIds),
    [localActorIds, loadedActorIds]
  )

  const setActorIds = useCallback((updater) => {
    setLocalActorIds((prev) => {
      const base = Array.isArray(prev) ? prev : loadedActorIds
      const next = typeof updater === 'function' ? updater(base) : updater
      return Array.isArray(next) ? next : base
    })
  }, [loadedActorIds])

  const moveUp = useCallback((index) => {
    if (index === 0) return
    setActorIds((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }, [setActorIds])

  const moveDown = useCallback((index) => {
    setActorIds((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }, [setActorIds])

  const removeActor = useCallback((actorId) => {
    setActorIds((prev) => prev.filter((id) => id !== actorId))
  }, [setActorIds])

  const saveRanks = useCallback(async () => {
    if (!ownerActorId) return

    const result = await save({
      ownerActorId,
      actorIds,
      autofill: false,
      maxCount: 10,
    })

    if (!result.ok) {
      console.error('[TopFriendsRankEditor] failed to save top friends', result.error)
      return
    }

    setLocalActorIds(result.actorIds)
    await refresh()
    navigate(-1)
  }, [ownerActorId, actorIds, save, refresh, navigate])

  if (loading) {
    return (
      <p className="profiles-subcard py-6 px-4 text-center text-slate-300/80">
        Loading top friends...
      </p>
    )
  }

  return (
    <div className="profiles-friends-editor space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">
        Edit Top Friends
      </h2>

      <div className="space-y-2">
        {actorIds.map((actorId, index) => (
          <RankRow
            key={actorId}
            actorId={actorId}
            index={index}
            total={actorIds.length}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            onRemove={removeActor}
          />
        ))}
      </div>

      {actorIds.length < 10 && (
        <button
          onClick={() => setShowPicker(true)}
          className="profiles-pill-btn px-3 py-1 text-sm font-medium"
        >
          Add Friend
        </button>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="profiles-pill-btn px-4 py-2 text-sm text-slate-200/90"
        >
          Cancel
        </button>

        <button
          disabled={saving}
          onClick={saveRanks}
          className="rounded-lg bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400 px-4 py-2 text-sm text-white hover:brightness-110 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {showPicker && (
        <RankPickerModal
          ownerActorId={ownerActorId}
          existingIds={actorIds}
          maxRanks={10}
          onSelect={(nextId) => {
            setActorIds((prev) => {
              if (!nextId || prev.includes(nextId)) return prev
              if (prev.length >= 10) return prev
              return [...prev, nextId]
            })
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

function RankRow({ actorId, index, total, onMoveUp, onMoveDown, onRemove }) {
  const actor = useActorSummary(actorId)
  if (!actor?.actorId) return null

  return (
    <div className="profiles-friend-rank-row flex items-center justify-between rounded-lg p-2.5">
      <ActorLink
        actor={actor}
        avatarSize="w-9 h-9"
        avatarShape="rounded-lg"
        showUsername
      />

      <div className="profiles-friend-rank-actions">
        <button
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          className="profiles-friend-rank-action-btn"
          title="Move up"
        >
          ↑
        </button>

        <button
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          className="profiles-friend-rank-action-btn"
          title="Move down"
        >
          ↓
        </button>

        <button
          onClick={() => onRemove(actorId)}
          className="profiles-friend-rank-action-btn is-danger"
          title="Remove from Top Friends"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

