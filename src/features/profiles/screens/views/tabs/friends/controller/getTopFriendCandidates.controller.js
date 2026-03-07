import { fetchFollowGraph } from '@/features/profiles/screens/views/tabs/friends/dal/friends.read.dal'
import { filterBlockedActors } from '@/features/block'

export async function getTopFriendCandidatesController({
  ownerActorId,
  existingIds = [],
  maxRanks = 10,
} = {}) {
  if (!ownerActorId) {
    return {
      ok: false,
      error: { message: 'Missing ownerActorId' },
      data: { candidateIds: [] },
    }
  }

  const safeMax = Math.max(1, Math.min(10, Number(maxRanks || 10)))
  const existing = new Set((Array.isArray(existingIds) ? existingIds : []).filter(Boolean))

  try {
    const { following } = await fetchFollowGraph(ownerActorId)
    const followingIds = [...(following ?? new Set())].filter(Boolean)

    if (!followingIds.length) {
      return {
        ok: true,
        error: null,
        data: { candidateIds: [] },
      }
    }

    const unranked = followingIds.filter((id) => !existing.has(id))
    if (!unranked.length) {
      return {
        ok: true,
        error: null,
        data: { candidateIds: [] },
      }
    }

    const blockedSet = await filterBlockedActors(ownerActorId, unranked)
    const candidateIds = unranked
      .filter((id) => id && id !== ownerActorId && !blockedSet.has(id))
      .slice(0, safeMax)

    return {
      ok: true,
      error: null,
      data: { candidateIds },
    }
  } catch (error) {
    return {
      ok: false,
      error,
      data: { candidateIds: [] },
    }
  }
}

