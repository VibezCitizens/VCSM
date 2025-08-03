// src/features/chat/MessageItem.jsx
export default function MessageItem({ message, currentUserId }) {
  const isMine = message.sender_id === currentUserId;

  // IMAGE MESSAGE
  if (message.media_url) {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-4 py-2`}>
        <img
          src={message.media_url}
          alt=""
          className={`
            max-w-[60%]      /* never exceed 60% of width */
            h-auto           /* maintain aspect ratio */
            rounded-2xl      /* more pill-shaped corners */
            border           /* subtle 1px border */
            ${isMine ? 'border-purple-400' : 'border-neutral-600'}
            shadow-md        /* gentle drop shadow */
          `}
        />
      </div>
    );
  }

  // TEXT MESSAGE
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-4 py-2`}>
      <div
        className={`
          max-w-[60%]
          px-4 py-2
          rounded-2xl
          ${isMine ? 'bg-purple-600 text-white' : 'bg-neutral-700 text-white'}
        `}
      >
        <div className="text-sm whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="text-xs text-gray-300 mt-1 text-right">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
