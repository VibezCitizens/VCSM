// src/components/ConversationListItem.jsx
import React from 'react';
import { MoreVertical, Trash2, BellOff } from 'lucide-react'; // Icons are used here

const ConversationListItem = React.memo(({
  conv,
  user,
  navigate,
  menuOpenId,
  setMenuOpenId,
  handleMute,
  handleDelete
}) => {
  const members = conv.conversation_members;
  const isGroup = members.length > 2;

  const otherMember = members.find((m) => m.user_id !== user.id);

  const currentMember = members.find((m) => m.user_id === user.id);
  const isMuted = currentMember?.muted;

  const profile = otherMember?.profile;
  const displayName = isGroup
    ? `Group (${members.length} users)`
    : profile?.display_name || 'Waiting for user...';

  // **OPTIMIZATION 1 APPLIED HERE: Removed `?v=${new Date().getTime()}`**
  const avatar = profile?.photo_url
    ? profile.photo_url
    : '/default-avatar.png';

  return (
    <div
      key={conv.id}
      className={`relative flex items-center justify-between gap-3 p-4 hover:bg-neutral-800 border-b border-neutral-700 ${
        isMuted ? 'opacity-50' : ''
      }`}
    >
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate(`/chat/${conv.id}`)}
      >
        <img
          src={avatar}
          alt={displayName}
          className="w-10 h-12 rounded-md object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-avatar.png';
          }}
        />
        <div className="flex flex-col">
          <span className="text-white font-semibold text-sm">{displayName}</span>
          <span className="text-gray-400 text-xs truncate max-w-[200px]">
            {conv.last_message || 'No messages yet.'}
          </span>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpenId(menuOpenId === conv.id ? null : conv.id)}
          className="p-1 hover:bg-neutral-700 rounded"
        >
          <MoreVertical size={18} />
        </button>

        {menuOpenId === conv.id && (
          <div className="absolute right-0 top-6 bg-neutral-900 rounded shadow-md z-50 w-32 border border-neutral-700">
            <button
              onClick={() => handleMute(conv.id)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-800"
            >
              <BellOff size={14} className="inline mr-2" />
              Mute
            </button>
            <button
              onClick={() => handleDelete(conv.id)}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-neutral-800"
            >
              <Trash2 size={14} className="inline mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ConversationListItem;