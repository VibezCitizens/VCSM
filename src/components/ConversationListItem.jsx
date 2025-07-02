import { formatDistanceToNow } from 'date-fns';
import UserLink from './UserLink';

export default function ConversationListItem({
  conv,
  user,
  navigate,
  menuOpenId,
  setMenuOpenId,
  handleMute,
  handleDelete,
}) {
  if (!conv || !conv.conversation_members) return null;

  const otherMember = conv.conversation_members.find((m) => m.user_id !== user.id);

  // LOG FOR DEBUGGING: Add this to see what otherMember and its profiles contain
  // console.log("ConversationListItem - otherMember:", otherMember);
  // console.log("ConversationListItem - otherMember.profiles:", otherMember?.profiles);

  const lastMessage = conv.last_message || 'No messages yet.';
  const timeAgo = conv.last_sent_at
    ? formatDistanceToNow(new Date(conv.last_sent_at), { addSuffix: true })
    : '';

  return (
    <div
      className="flex items-center justify-between p-4 border-b border-neutral-800 hover:bg-neutral-900 cursor-pointer"
      onClick={() => navigate(`/chat/${conv.id}`)}
    >
      <div className="flex items-center gap-4">
        {/* CORRECTED LINE HERE: use otherMember?.profiles instead of otherMember?.profile */}
        <UserLink user={otherMember?.profiles} avatarSize="w-10 h-10" textSize="text-sm" />
        <div className="flex flex-col">
          <p className="text-white text-sm truncate max-w-[200px]">
            {lastMessage}
          </p>
          <span className="text-xs text-neutral-400">{timeAgo}</span>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
          }}
          className="text-white text-lg"
        >
          ⋮
        </button>

        {menuOpenId === conv.id && (
          <div className="absolute right-0 mt-2 w-32 bg-neutral-800 border border-neutral-700 rounded shadow-lg z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMute(conv.id);
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-700"
            >
              Mute
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(conv.id);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-neutral-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}