export function ActorModel(row) {
  if (!row) return null

  return {
    id: row.id,
    kind: row.kind,
    profileId: row.profile_id,
    isVoid: Boolean(row.is_void),
  }
}
