import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';

export default function SortableFriend({ friend }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: friend.id, // uuid is fine
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none', // better on mobile
  };

  const profileHref = friend?.username
    ? `/u/${encodeURIComponent(friend.username)}`
    : `/user/${friend.id}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-2 rounded bg-neutral-800 hover:bg-neutral-700"
    >
      {/* Drag handle (prevents accidental navigation) */}
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab active:cursor-grabbing text-neutral-400 px-1"
        {...attributes}
        {...listeners}
        onClick={(e) => e.preventDefault()} // don't navigate when clicking the handle
      >
        ⋮⋮
      </button>

      <Link to={profileHref} className="flex items-center gap-3 flex-1 min-w-0" draggable={false}>
        <img
          src={friend.photo_url || '/avatar.jpg'}
          className="w-10 h-10 object-cover rounded flex-shrink-0"
          alt={friend.display_name || friend.username || 'User avatar'}
          loading="lazy"
        />
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {friend.display_name || friend.username || 'Unnamed'}
          </p>
          {friend.username ? (
            <p className="text-xs text-neutral-400 truncate">@{friend.username}</p>
          ) : (
            <p className="text-xs text-neutral-500">View profile</p>
          )}
        </div>
      </Link>
    </div>
  );
}
