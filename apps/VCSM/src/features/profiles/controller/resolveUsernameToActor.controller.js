import { readActorIdByUsername } from '@/features/profiles/dal/readActorIdByUsername.dal'

export async function resolveUsernameToActor(username) {
  const row = await readActorIdByUsername(username)

  if (!row) return null

  return row.actor_id
}
