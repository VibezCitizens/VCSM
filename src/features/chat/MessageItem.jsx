// src/features/chat/MessageItem.jsx
export default function MessageItem({ message, currentUserId, onRetry }) {
  const isMine = message.sender_id === currentUserId;

  const timeText = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusText =
    isMine && message._localStatus
      ? message._localStatus === 'sending'
        ? 'Sending…'
        : message._localStatus === 'failed'
          ? 'Failed'
          : ''
      : '';

  // IMAGE MESSAGE
  if (message.media_url && message.media_type === 'image') {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-4 py-2`}>
        <div className="relative">
          <img
            src={message.media_url}
            alt=""
            className={`
              max-w-[60%]
              h-auto
              rounded-2xl
              border
              ${isMine ? 'border-purple-400' : 'border-neutral-600'}
              shadow-md
              object-contain
            `}
            onError={(e) => { e.currentTarget.style.opacity = 0.5; }}
          />
          <div
            className={`
              absolute right-2 bottom-2 text-[10px] px-2 py-0.5 rounded-full
              ${isMine ? 'bg-black/60 text-white' : 'bg-black/40 text-white'}
            `}
          >
            {timeText}
            {statusText ? ` • ${statusText}` : ''}
          </div>

          {isMine && message._localStatus === 'failed' && (
            <div className="mt-1 text-right">
              <button
                onClick={() => onRetry?.(message)}
                className="text-xs text-red-300 hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // TEXT MESSAGE
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-4 py-2`}>
      <div
        className={`
          max-w-[70%]
          px-4 py-2
          rounded-2xl
          ${isMine ? 'bg-purple-600 text-white' : 'bg-neutral-700 text-white'}
        `}
      >
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div className="text-[10px] text-gray-300 mt-1 text-right">
          {timeText}
          {statusText ? ` • ${statusText}` : ''}
        </div>

        {isMine && message._localStatus === 'failed' && (
          <div className="mt-1 text-right">
            <button
              onClick={() => onRetry?.(message)}
              className="text-xs text-red-300 hover:text-red-200 underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
