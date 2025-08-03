import { Link } from 'react-router-dom';

export default function UserLink({
  user,                    // no default here – we want to detect `null`
  avatarSize = 'w-8 h-8',
  avatarShape = 'rounded-none',
  textSize = 'text-sm',
  showUsername = false,
  showTimestamp = false,
  timestamp = '',
  className = '',
}) {
  // early-return on null/undefined user
  if (!user) return null;

  const displayName = user.display_name || 'Unnamed';
  const username    = user.username;
  const userId      = user.id;
  const photoUrl    = user.photo_url || '/avatar.jpg';

  const profileUrl = username
    ? `/u/${username}`
    : userId
      ? `/profile/${userId}`
      : '/me';

  return (
    <Link
      to={profileUrl}
      className={`flex items-center gap-2 no-underline hover:no-underline ${className}`}
    >
      <img
        src={photoUrl}
        alt={displayName}
        className={`${avatarSize} ${avatarShape} object-cover border border-neutral-700`}
      />
      <div className="flex flex-col leading-tight">
        <span className={`${textSize} text-white font-medium`}>
          {displayName}
        </span>
        {showUsername && username && (
          <span className="text-xs text-gray-400">@{username}</span>
        )}
        {showTimestamp && timestamp && (
          <span className="text-[11px] text-neutral-400">{timestamp}</span>
        )}
      </div>
    </Link>
  );
}
