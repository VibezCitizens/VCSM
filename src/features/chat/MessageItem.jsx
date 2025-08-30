// C:\Users\vibez\OneDrive\Desktop\VCSM\src\features\chat\MessageItem.jsx
import { useAuth } from '@/hooks/useAuth';

export default function MessageItem({ message }) {
  const { user } = useAuth();
  const isMine = message.sender_id === user?.id;

  const timeText = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // media (image/video/file preview baseline)
  if (message.media_url) {
    const isImage = message.media_type === 'image';
    const isVideo = message.media_type === 'video';

    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-4 py-2`}>
        <div className="relative max-w-[70%]">
          {isImage && (
            <img
              src={message.media_url}
              alt=""
              className={`w-auto max-w-full h-auto rounded-2xl border ${
                isMine ? 'border-purple-400' : 'border-neutral-600'
              } shadow-md object-contain`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          {isVideo && (
            <video
              src={message.media_url}
              controls
              className={`w-full rounded-2xl border ${
                isMine ? 'border-purple-400' : 'border-neutral-600'
              } shadow-md`}
            />
          )}

          {!isImage && !isVideo && (
            <a
              href={message.media_url}
              target="_blank"
              rel="noreferrer"
              className="underline text-sm text-blue-300"
            >
              Open attachment
            </a>
          )}

          <div
            className={`absolute right-2 bottom-2 text-[10px] px-2 py-0.5 rounded-full ${
              isMine ? 'bg-black/60 text-white' : 'bg-black/40 text-white'
            }`}
          >
            {timeText}
          </div>
        </div>
      </div>
    );
  }

  // text message
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-4 py-2`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isMine ? 'bg-purple-600 text-white' : 'bg-neutral-700 text-white'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
        <div className="text-[10px] text-gray-300 mt-1 text-right">{timeText}</div>
      </div>
    </div>
  );
}
