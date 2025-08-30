import { Link } from 'react-router-dom';

/**
 * UserLink
 * - Public profile link (never edit)
 * - Works with both "user" (profiles) and "vport" shapes
 *
 * Props:
 * - user: record from profiles or vports caches
 * - authorType?: 'user' | 'vport'   // OPTIONAL; inferred if omitted
 * - avatarSize, avatarShape, textSize, showUsername, showTimestamp, timestamp, className, toOverride
 */
export default function UserLink({
  user,
  authorType,               // optional; we will infer if not provided
  avatarSize = 'w-8 h-8',
  avatarShape = 'rounded-none',
  textSize = 'text-sm',
  showUsername = false,
  showTimestamp = false,
  timestamp = '',
  className = '',
  toOverride,
}) {
  if (!user) return null;

  // ---- infer vport vs user if authorType not provided
  // heuristics: vports typically have "name"/"avatar_url" and no "photo_url".
  // If parent passes authorType, that wins.
  const inferredIsVport =
    authorType === 'vport' ||
    (!authorType &&
      (
        has(user, 'name') ||
        (has(user, 'avatar_url') && !has(user, 'photo_url')) ||
        (typeof user?.type === 'string' && user.type.toLowerCase().includes('vport'))
      )
    );

  const isVport = !!inferredIsVport;

  // ---- display name + username
  const displayName = firstNonEmpty(
    isVport
      ? [user?.name, user?.display_name, 'VPort']         // vport order of preference
      : [user?.display_name, user?.username, 'User']      // user order of preference
  );

  const username = isVport ? null : (user?.username ?? null);

  // ---- avatar
  const avatarUrl = firstNonEmpty(
    isVport ? [user?.avatar_url, '/avatar.jpg'] : [user?.photo_url, '/avatar.jpg']
  );

  // ---- destination (public routes only)
  const safe = (s) => encodeURIComponent(String(s));
  let to = '/me';

  if (toOverride) {
    to = toOverride;
  } else if (isVport) {
    const id = user?.id;
    to = id ? `/vport/${safe(id)}` : '/vports';
  } else {
    if (user?.username) to = `/u/${safe(user.username)}`;
    else if (user?.id)  to = `/profile/${safe(user.id)}`;
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 no-underline hover:no-underline ${className}`}
      aria-label={`${displayName} profile`}
    >
      <img
        src={avatarUrl}
        alt={displayName}
        loading="lazy"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatar.jpg'; }}
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

/* ----------------------------- helpers ----------------------------- */

function firstNonEmpty(arr) {
  for (const v of arr) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    return v;
  }
  return undefined;
}

function has(obj, key) {
  return obj && Object.prototype.hasOwnProperty.call(obj, key);
}
