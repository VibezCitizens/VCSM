import React, { useState, useMemo } from 'react'; // Added useMemo for optimization

const MessageItem = React.memo(({ msg, isMe, sender }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Memoize avatarSrc to avoid unnecessary re-renders of the image source
  const avatarSrc = useMemo(() => {
    return sender.photo_url
      ? `${sender.photo_url}?v=${new Date().getTime()}`
      : '/default-avatar.png';
  }, [sender.photo_url]); // Only recompute if sender.photo_url changes

  const handleImageClick = () => {
    if (msg.media_url) setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  // Determine the bubble's background color
  const bubbleBgClass = isMe ? 'bg-purple-600' : 'bg-gray-800';
  // Determine bubble's text color
  const bubbleTextColorClass = 'text-white'; // Consistent text color

  // Conditionally apply padding based on message type
  // Image messages will have 'p-0' (no padding directly around the image)
  // Text messages will have 'px-4 py-2' (standard padding)
  const bubblePaddingClass = msg.media_url ? 'p-0' : 'px-4 py-2';

  // Determine border-radius for the bubble based on sender
  // This gives a nice "chat bubble" effect where the corner near the avatar is less rounded
  const bubbleRoundedClass = isMe
    ? 'rounded-bl-xl rounded-tl-xl rounded-tr-xl' // My messages
    : 'rounded-br-xl rounded-tr-xl rounded-tl-xl'; // Other's messages

  return (
    <>
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}> {/* Added mb-4 for vertical spacing between messages */}
        <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} max-w-[75%] md:max-w-[55%]`}> {/* Align items-end for better vertical alignment, and added md:max-w for larger screens */}

          {/* Sender Avatar (Conditional based on isMe) */}
          {(!isMe || (isMe && !sender.photo_url)) && ( // Only show avatar for others, or if it's me and I don't have a photo (fallback)
             <img
              src={avatarSrc}
              alt={sender.display_name || 'User'}
              className="w-8 h-8 object-cover rounded-full shadow-sm shrink-0" // Changed to rounded-full for typical avatar look
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
              }}
            />
          )}

          <div className={`
              ${bubbleBgClass}
              ${bubbleTextColorClass}
              ${bubbleRoundedClass}
              ${bubblePaddingClass}
              text-sm
              relative
              flex flex-col
              overflow-hidden
              shadow-md
          `}>
            {/* Sender Name for others (if not me) */}
            {!isMe && sender.display_name && (
              <div className="text-xs text-gray-300 font-medium mb-1 px-4 pt-2"> {/* Added px-4 pt-2 for name if bubble padding is p-0 */}
                {sender.display_name}
              </div>
            )}

            {/* Text Content - Only display if msg.content exists AND no media_url (or if media_url and content can coexist) */}
            {msg.content && !msg.media_url && ( // Adjusted to prevent displaying text content if it's purely an image message
              <div className="whitespace-pre-wrap">{msg.content}</div>
            )}
             {/* If you want captions with images, you might need a different structure:
                 {msg.media_url && msg.content && <div className="text-xs text-gray-200 p-2">{msg.content}</div>}
             */}

            {/* Image Preview */}
            {msg.media_url && (
              <img
                src={msg.media_url}
                alt="Sent media"
                className="
                  rounded-xl     /* Applied to the image */
                  object-cover   /* To cover the space */
                  cursor-pointer
                  max-h-[300px]  /* Max height */
                  max-w-full     /* IMPORTANT: Ensures image doesn't overflow its parent width */
                  w-full         /* Makes image take full width of its container */
                  block          /* Helps with layout, removes extra space below image */
                  shadow-sm      /* Subtle shadow for depth */
                "
                onClick={handleImageClick}
                onError={(e) => { // Added onError for image previews too
                  e.target.onerror = null;
                  e.target.src = '/image-load-error.png'; // Fallback image
                }}
              />
            )}

            {/* Timestamp */}
            <div className={`text-xs text-gray-400 mt-1 ${msg.media_url ? 'px-2 pb-1' : 'text-right'}`}> {/* Conditional padding for timestamp if image */}
              {new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen image modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" /* Added p-4 for mobile spacing */
          onClick={handleCloseModal}
        >
          <img
            src={msg.media_url}
            alt="Fullscreen preview"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
});

export default MessageItem;
