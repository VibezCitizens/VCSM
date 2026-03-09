import { saveFriendRanks } from '@/features/profiles/dal/friends/friendRanks.write.dal'

function normalizeIds(friendActorIds = [], maxCount = 10) {
  const safeMaxCount = Math.max(1, Math.min(10, Number(maxCount || 10)))
  const seen = new Set()
  const ids = []

  for (const id of Array.isArray(friendActorIds) ? friendActorIds : []) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
    if (ids.length >= safeMaxCount) break
  }

  return ids
}

export async function saveTopFriendRanksController({
  ownerActorId,
  friendActorIds = [],
  autofill = false,
  maxCount = 10,
} = {}) {
  if (!ownerActorId) {
    return {
      ok: false,
      error: { message: 'Missing ownerActorId' },
      data: { actorIds: [] },
    }
  }

  const normalizedIds = normalizeIds(friendActorIds, maxCount)

  try {
    const rows = await saveFriendRanks(ownerActorId, normalizedIds, {
      autofill,
      maxCount,
    })

    const actorIds = (rows ?? [])
      .slice()
      .sort((a, b) => Number(a?.rank ?? 999) - Number(b?.rank ?? 999))
      .map((row) => row?.friend_actor_id)
      .filter(Boolean)

    return {
      ok: true,
      error: null,
      data: { actorIds },
    }
  } catch (error) {
    return {
      ok: false,
      error,
      data: { actorIds: [] },
    }
  }
}

