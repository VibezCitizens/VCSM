// src/components/UserLink.jsx
import { Link } from 'react-router-dom';

export default function UserLink({
  user,
  authorType,
  avatarSize = 'w-10 h-10',          // 🔹 bigger square (was w-8 h-8)
  avatarShape = 'rounded-none',       // 🔹 square shape (no rounding)
  textSize = 'text-sm',
  showUsername = false,
  showTimestamp = false,
  timestamp = '',
  className = '',
  toOverride,
}) {
  if (!user) return null;

  const safe = (s) => encodeURIComponent(String(s));
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

  const isVport =
    authorType === 'vport'
      ? true
      : authorType === 'user'
      ? false
      : (
          (typeof user?.kind === 'string' && user.kind.toLowerCase() === 'vport') ||
          (typeof user?.actor_kind === 'string' && user.actor_kind.toLowerCase() === 'vport') ||
          has(user, 'slug') || has(user, 'vport_slug') || has(user, 'name') ||
          (typeof user?.type === 'string' && user.type.toLowerCase().includes('vport'))
        );

  const norm = isVport
    ? {
        id: firstNonEmpty([user?.id]),
        displayName: firstNonEmpty([user?.display_name, user?.name, 'VPORT']),
        username: firstNonEmpty([user?.username, user?.slug, user?.vport_slug]),
        avatarUrl: firstNonEmpty([user?.photo_url, user?.avatar_url, '/avatar.jpg']),
        slug: firstNonEmpty([user?.slug, user?.vport_slug]),
      }
    : {
        id: firstNonEmpty([user?.id, user?.user_id]),
        displayName: firstNonEmpty([user?.display_name, user?.username, 'User']),
        username: firstNonEmpty([user?.username]),
        avatarUrl: firstNonEmpty([user?.photo_url, user?.avatar_url, '/avatar.jpg']),
      };

  let to = '/me';
  if (toOverride) {
    to = toOverride;
  } else if (isVport) {
    to = norm?.slug
      ? `/vport/${safe(norm.slug)}`
      : (norm.id ? `/vport/id/${safe(norm.id)}` : '/vports');
  } else {
    if (norm.username)      to = `/u/${safe(norm.username)}`;
    else if (norm.id)       to = `/profile/${safe(norm.id)}`;
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 no-underline hover:no-underline ${className}`}
      aria-label={`${norm.displayName} profile`}
    >
      <img
        src={norm.avatarUrl}
        alt={norm.displayName}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/avatar.jpg';
        }}
        className={`${avatarSize} ${avatarShape} object-cover border border-neutral-700`}
      />
      <div className="flex flex-col leading-tight">
        <span className={`${textSize} text-white font-medium`}>
          {norm.displayName}
        </span>

        {showUsername && !isVport && norm.username && (
          <span className="text-xs text-gray-400">@{norm.username}</span>
        )}

        {showTimestamp && timestamp && (
          <span className="text-[11px] text-neutral-400">{timestamp}</span>
        )}
      </div>
    </Link>
  );
}
