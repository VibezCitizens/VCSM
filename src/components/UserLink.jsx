import { Link } from 'react-router-dom';

export default function UserLink({
  user = {},
  avatarSize = 'w-8 h-8',
  textSize = 'text-sm',
  withUsername = false,
}) {
  const displayName = user.display_name || 'Unnamed';
  const username = user.username;
  const userId = user.id;
  const photoUrl = user.photo_url || '/default-avatar.png';

  // Safe routing: prefer username, fallback to userId
  const profileUrl = username
    ? `/u/${username}`
    : userId
    ? `/profile/${userId}`
    : '/me';

  return (
    <Link to={profileUrl} className="flex items-center gap-2">
      <img
        src={photoUrl}
        alt={displayName}
        className={`${avatarSize} rounded-xl object-cover border border-neutral-700`}
      />
      <div className="flex flex-col leading-tight">
        <span className={`${textSize} text-white font-medium`}>{displayName}</span>
        {withUsername && username && (
          <span className="text-xs text-gray-400">@{username}</span>
        )}
      </div>
    </Link>
  );
}
