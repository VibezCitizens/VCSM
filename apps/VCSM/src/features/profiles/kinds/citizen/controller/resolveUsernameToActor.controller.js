// [CITIZEN_ONLY] — user actors only
import { readActorIdByUsername } from '@/features/profiles/kinds/citizen/dal/readActorIdByUsername.dal'

export async function resolveUsernameToActor(username) {
  const row = await readActorIdByUsername(username)

  if (!row) return null

  return row.actor_id
}
