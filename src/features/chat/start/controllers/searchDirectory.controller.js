import { searchActorsDAL } from '../dal/read/searchActors.dal'

/**
 * Controller: searchDirectory
 * --------------------------------
 * Actor-safe search entrypoint.
 * Returns UI-ready rows WITH actorId.
 */
export async function searchDirectoryController(query, opts = {}) {
  const { limitPerKind = 8 } = opts

  const actors = await searchActorsDAL(query, limitPerKind)

  return actors.map((a) => ({
    actorId: a.actor_id,
    id: a.actor_id, // alias
    kind: a.kind,
    display_name: a.display_name,
    username: a.username ?? a.vport_slug ?? null,
    photo_url: a.photo_url,
  }))
}
