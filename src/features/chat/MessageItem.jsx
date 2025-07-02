import React, { useState } from 'react';

const MessageItem = React.memo(({ msg, isMe, sender }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const avatarSrc = sender.photo_url
    ? `${sender.photo_url}?v=${new Date().getTime()}`
    : '/default-avatar.png';

  const handleImageClick = () => {
    if (msg.image_url) setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <>
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

            {/* Text */}
            {msg.content && <div className="whitespace-pre-wrap mb-1">{msg.content}</div>}

            {/* Image preview */}
            {msg.image_url && (
              <img
                src={msg.image_url}
                alt="sent media"
                className="rounded-xl mt-1 object-cover cursor-pointer max-h-[300px]"
                onClick={handleImageClick}
              />
            )}

            <div className="text-xs text-gray-500 text-right mt-1">
              {new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Fullscreen image modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={handleCloseModal}
        >
          <img
            src={msg.image_url}
            alt="fullscreen preview"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
});

export default MessageItem;
