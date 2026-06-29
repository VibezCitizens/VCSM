// [CITIZEN_ONLY] — user actors only
import { saveFriendRanks } from '@/features/profiles/kinds/citizen/dal/friends/friendRanks.write.dal'
import { assertActorOwnsActorController } from '@/features/authorization/adapters/authorization.adapter'

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

  // V05B-M1: canonical USER-ONLY session bind. The Top-Friends owner is always a
  // citizen (user-kind) actor; the editor previously trusted the route `:id` as the
  // write owner. The self-form (requestActorId === targetActorId) proves the
  // authenticated session owns `ownerActorId` (vc.actors.profile_id === auth.uid())
  // before the write reaches saveFriendRanks → vc.save_friend_ranks. Defense-in-depth
  // over the RPC's own vc.is_actor_owner guard (durable boundary 05B-DB-1).
  try {
    await assertActorOwnsActorController({
      requestActorId: ownerActorId,
      targetActorId: ownerActorId,
    })
  } catch {
    return {
      ok: false,
      error: { message: 'not_owner' },
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
