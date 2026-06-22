export function enrichMentionRows(rawEdges, presentations) {
  const byActorId = new Map(
    (presentations ?? [])
      .filter((r) => r?.actor_id)
      .map((r) => [r.actor_id, r])
  );

  return rawEdges.map((e) => {
    const p = byActorId.get(e.mentioned_actor_id);
    return {
      ...e,
      kind: p?.kind ?? null,
      profile_id: null,
      vport_id: null,
      username: p?.username ?? null,
      display_name: p?.display_name ?? null,
      photo_url: p?.photo_url ?? null,
      slug: p?.vport_slug ?? null,
      vport_name: p?.vport_name ?? null,
      avatar_url: p?.vport_avatar_url ?? null,
    };
  });
}
