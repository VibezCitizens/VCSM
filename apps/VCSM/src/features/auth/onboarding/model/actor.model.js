export function ActorModel(row) {
  if (!row) return null

  return {
    id: row.id,
    kind: row.kind,
    isVoid: Boolean(row.is_void),
    // profileId omitted — identity contract: only actorId + kind on public surfaces
  }
}
