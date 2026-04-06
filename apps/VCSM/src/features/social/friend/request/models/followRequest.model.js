export function modelFollowRequest(row) {
  return {
    requesterActorId: row.requester_actor_id,
    targetActorId: row.target_actor_id,
    status: row.status,
    createdAt: row.created_at,
  }
}
