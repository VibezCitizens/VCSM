export function canViewPrivateFeedActorModel({
  isPrivate = false,
  isOwner = false,
  isFollowing = false,
}) {
  if (!isPrivate) return true;
  if (isOwner) return true;
  if (isFollowing) return true;
  return false;
}

