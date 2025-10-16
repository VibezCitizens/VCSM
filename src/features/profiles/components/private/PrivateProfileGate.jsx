// src/features/profiles/components/private/PrivateProfileGate.jsx
export default function PrivateProfileGate({
  profile,          // { id, display_name, username, photo_url, private }
  viewerId,         // current user id (or null)
  isFollowing,      // boolean: viewer follows profile (approved)
  followButton,     // <FollowButton userId={profile.id} />
  messageButton,    // <MessageButton toUserId={profile.id} />
  children,         // content to render when allowed
}) {
  const isOwner = viewerId && profile?.id === viewerId;
  const isPrivate = !!profile?.private;

  // Allowed if public OR owner OR follower
  const allowed = !isPrivate || isOwner || !!isFollowing;

  if (allowed) return children;

  // 🚫 Private: show only the locked message
  return (
    <div className="px-4 sm:px-0">
      <div className="rounded-2xl bg-black/60 border border-neutral-800 p-6 text-center">
        <p className="text-sm text-neutral-300">
          This account is <span className="font-medium">private</span>. Only approved followers can
          see their photos, videos, posts, and friends.
        </p>
      </div>
    </div>
  );
}
