export function ActorSearchResultModel(row) {
  return {
    actorId: row.actor_id,
    id: row.actor_id,
    kind: row.kind ?? null,
    displayName: row.display_name ?? null,
    display_name: row.display_name ?? null,
    username: row.username ?? null,
    photoUrl: row.photo_url ?? null,
    photo_url: row.photo_url ?? null,
  }
}

export function DirectorySearchResultModel(rows = []) {
  return rows.map(ActorSearchResultModel).filter(Boolean)
}
