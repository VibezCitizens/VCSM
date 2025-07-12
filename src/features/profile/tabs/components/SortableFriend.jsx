import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';

export default function SortableFriend({ friend }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: friend.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Link
      to={`/u/${friend.username}`}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="flex items-center gap-3 p-2 rounded bg-neutral-800 hover:bg-neutral-700 cursor-move"
    >
      <img
        src={friend.photo_url || '/default-avatar.png'}
        className="w-10 h-10 object-cover rounded"
        alt={friend.username}
      />
      <div>
        <p className="text-white font-semibold text-sm">{friend.display_name || friend.username}</p>
        <p className="text-xs text-neutral-400">@{friend.username}</p>
      </div>
    </Link>
  );
}
