// MessageItem.jsx
import React from 'react';

const MessageItem = React.memo(({ msg, isMe, sender, currentUser, participantProfiles }) => {
  const avatarSrc = sender.photo_url
    ? `${sender.photo_url}?v=${new Date().getTime()}`
    : '/default-avatar.png';

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className="flex items-start gap-2 max-w-[75%]">
        {!isMe && (
          <img
            src={avatarSrc}
            alt={sender.display_name || 'User'}
            className="w-8 h-8 object-cover rounded"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-avatar.png';
            }}
          />
        )}
        <div className={`rounded-2xl px-4 py-2 ${isMe ? 'bg-purple-600' : 'bg-gray-800'} text-sm`}>
          {!isMe && sender.display_name && (
            <div className="text-xs text-gray-400 mb-1">{sender.display_name}</div>
          )}
          <div>{msg.content}</div>
        </div>
      </div>
    </div>
  );
});

export default MessageItem;