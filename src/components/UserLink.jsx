// src/components/UserLink.jsx
import { Link } from 'react-router-dom';

/**
 * UserLink
 * - Public profile link
 * - Works with both "user" (profiles) and "vport" shapes
 *
 * Props:
 * - user: record from profiles or vports caches
 * - authorType?: 'user' | 'vport'   // OPTIONAL; if provided, we treat it as authoritative
 * - avatarSize, avatarShape, textSize, showUsername, showTimestamp, timestamp, className, toOverride
 */
export default function UserLink({
  user,
  authorType,               // optional; if provided, overrides inference
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

  // ---------- helpers ----------
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

  // ---------- infer or trust authorType ----------
  // If caller passes authorType, treat as authoritative to avoid misclassification.
  const isVport =
    authorType === 'vport'
      ? true
      : authorType === 'user'
      ? false
      : (
          has(user, 'name') ||                                 // typical vport shape
          has(user, 'slug') || has(user, 'vport_slug') ||      // vport has slug
          (typeof user?.type === 'string' && user.type.toLowerCase().includes('vport'))
        );

  // ---------- normalize shape ----------
  const norm = isVport
    ? {
        id: firstNonEmpty([user?.id]),
        displayName: firstNonEmpty([user?.name, user?.display_name, 'VPORT']),
        username: null,
        avatarUrl: firstNonEmpty([user?.avatar_url, user?.photo_url, '/avatar.jpg']),
        slug: firstNonEmpty([user?.slug, user?.vport_slug]),
      }
    : {
        id: firstNonEmpty([user?.id, user?.user_id]),
        displayName: firstNonEmpty([user?.display_name, user?.full_name, user?.username, 'User']),
        username: firstNonEmpty([user?.username]),
        avatarUrl: firstNonEmpty([user?.photo_url, user?.avatar_url, '/avatar.jpg']),
      };

  // ---------- destination (public routes only) ----------
  let to = '/me';

  if (toOverride) {
    to = toOverride;
  } else if (isVport) {
    // If your app prefers /v/:slug, change the first branch below to `/v/${safe(norm.slug)}`
    to = norm?.slug
      ? `/vport/slug/${safe(norm.slug)}`
      : (norm.id ? `/vport/${safe(norm.id)}` : '/vports');
  } else {
    if (norm.username)      to = `/u/${safe(norm.username)}`;
    else if (norm.id)       to = `/profile/${safe(norm.id)}`;
  }

  // ---------- render ----------
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
