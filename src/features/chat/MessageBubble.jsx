import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth is correctly providing currentUser

export default function MessageBubble({ message, sender, isOwn }) {
  const { user: currentUser } = useAuth();

  // Determine if the message belongs to the current user
  // `isOwn` prop takes precedence, otherwise check sender_id against current user's ID
  const isMine = isOwn ?? (message?.sender_id === currentUser?.id);

  // Format the message creation timestamp for display
  const createdAt = message?.created_at ? new Date(message.created_at) : null;

  // Determine the sender's photo URL, with a fallback to a default avatar
  const senderPhotoUrl = sender?.photo_url || '/default-avatar.png'; // Use a default image if photo_url is missing

  return (
    // Main container for the message bubble, aligned left or right based on `isMine`
    <div className={`flex items-end mb-4 ${isMine ? 'justify-end' : 'justify-start'} gap-2 px-2`}>

      {/* Sender's avatar (displayed on the left for others' messages) */}
      {!isMine && (
        <img
          src={senderPhotoUrl}
          alt={sender?.display_name || 'User'}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-sm"
          // Add onerror to handle broken image links gracefully
          onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
        />
      )}

      {/* Message content bubble */}
      <div
        className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-lg
                    flex flex-col ${ // Use flex column for stacking name, text, and timestamp
                      isMine
                        ? 'bg-purple-600 text-white rounded-br-none' // Own message style
                        : 'bg-neutral-700 text-white rounded-bl-none' // Other's message style
                    }`}
      >
        {/* Sender's display name (only for others' messages) */}
        {!isMine && (
          <div className="mb-1 font-semibold text-xs text-purple-200">
            {sender?.display_name || 'Unknown User'}
          </div>
        )}

        {/* The actual message text */}
        <div className="text-base break-words">
          {message?.text || '[Empty Message]'}
        </div>

        {/* Timestamp */}
        {createdAt && (
          <div className={`text-[10px] text-neutral-300 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </div>
        )}
      </div>

      {/* Sender's avatar (displayed on the right for own messages) */}
      {isMine && (
        <img
          src={senderPhotoUrl}
          alt={sender?.display_name || 'You'}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-sm"
          // Add onerror to handle broken image links gracefully
          onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
        />
      )}
    </div>
  );
}