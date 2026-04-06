function mapSearchActorRow(row) {
  if (!row) return null;

  return {
    actorId: row.actor_id ?? null,
    kind: row.kind ?? null,
    displayName: row.vport_name ?? row.display_name ?? row.username ?? "Unknown",
    username: row.vport_slug ?? row.username ?? null,
    avatarUrl: row.vport_avatar_url ?? row.photo_url ?? null,
  };
}

export function mapSearchActorsRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(mapSearchActorRow).filter(Boolean);
}
