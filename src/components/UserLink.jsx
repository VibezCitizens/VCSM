import { Link } from 'react-router-dom';

export default function UserLink({ user = {}, avatarSize = 'w-8 h-8', textSize = 'text-sm' }) {
  const displayName = user.display_name || 'User';
  const username = user.username;
 const profileUrl = username ? `/u/${username}` : `/me`;


  const basePhotoUrl = user.photo_url || '/avatar.jpg';
  const cacheBustedUrl = `${basePhotoUrl}?t=${user.updated_at || Date.now()}`; // Prevent stale image

  return (
    <Link to={profileUrl} className="flex items-center gap-2">
      <img
        src={cacheBustedUrl}
        alt={displayName}
        className={`${avatarSize} rounded-full object-cover border border-neutral-600`}
      />
      <span className={`${textSize} text-white font-medium`}>{displayName}</span>
    </Link>
  );
}
