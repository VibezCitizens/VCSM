export function PostModel(postRow, reactions, roseCount) {
  return {
    id: postRow.id,
    actorId: postRow.actor_id,
    text: postRow.text,
    mediaUrl: postRow.media_url,
    mediaType: postRow.media_type,
    createdAt: postRow.created_at,

    reactions: {
      like: reactions.like ?? 0,
      dislike: reactions.dislike ?? 0,
      rose: roseCount ?? 0,
    },
  }
}
