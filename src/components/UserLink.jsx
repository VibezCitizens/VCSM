// UserLink.jsx
import { Link } from 'react-router-dom';

export default function UserLink({ user = {}, avatarSize = 'w-8 h-8', textSize = 'text-sm' }) {
  const displayName = user.display_name || 'Unnamed';
  const username = user.username;
  const profileUrl = username ? `/u/${username}` : '/me';

  // **OPTIMIZATION APPLIED HERE: Removed the cache-busting timestamp**
  // We directly use the photo_url as it comes from the database (which points to Cloudflare R2).
  // Cloudflare R2 handles its own caching, and a direct URL should be stable.
  const photoUrl = user.photo_url || '/default-avatar.png';

  return (
    <Link to={profileUrl} className="flex items-center gap-2">
      <img
        src={photoUrl} // Using the clean photoUrl
        alt={displayName}
        className={`${avatarSize} rounded-xl object-cover border border-neutral-700`}
      />
      <span className={`${textSize} text-white font-medium`}>
        {displayName}
      </span>
    </Link>
  );
}