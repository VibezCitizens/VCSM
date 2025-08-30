// Minimal, dependency-free permission helpers

export function canDeleteComment({
  viewerId,
  commentUserId,
  postAuthorType,     // 'user' | 'vport'
  postAuthorId,       // user-id for user posts
  postVportId,        // vport-id for vport posts
  identity            // from useIdentity()
}) {
  if (!viewerId) return false;

  // Always: authors can delete their own comment
  if (commentUserId === viewerId) return true;

  // User post: the post owner can moderate/delete
  if (postAuthorType === 'user' && postAuthorId && postAuthorId === viewerId) return true;

  // VPORT post: owner (while acting as that vport) can moderate/delete
  if (
    postAuthorType === 'vport' &&
    identity?.type === 'vport' &&
    identity?.ownerId === viewerId &&
    identity?.vportId === postVportId
  ) {
    return true;
  }

  return false;
}
