function mapSearchActorRow(row) {
  if (!row || !row.actor_id) return null;

  return {
    actorId: row.actor_id,
    kind: row.actor_kind ?? null,
    displayName: row.display_name ?? row.username ?? 'Unknown',
    username: row.username ?? null,
    avatarUrl: row.avatar_url ?? null,
  };
}

export function mapSearchActorsRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(mapSearchActorRow).filter(Boolean);
}
