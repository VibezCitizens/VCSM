// src/features/posts/ui/PostMedia.jsx
/**
 * Media block for a post. Image/video renders with object-contain inside the card,
 * and opens a full-screen lightbox on click.
 */
import { memo, useState, useCallback } from 'react';
import MediaLightbox from './MediaLightbox';

function PostMedia({ mediaType, mediaUrl, alt = 'post media' }) {
  const [open, setOpen] = useState(false);
  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  if (!mediaUrl) return null;

  // Card media (no cropping)
  const card = mediaType === 'video' ? (
    <div className="w-full rounded-xl overflow-hidden mb-3 bg-black">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open video"
        className="block w-full focus:outline-none"
      >
        <video
          src={mediaUrl}
          className="w-full max-h-80 object-contain"
          // show controls only in lightbox to keep card compact
          controls={false}
          muted
          playsInline
        />
      </button>
    </div>
  ) : (
    <div className="w-full rounded-xl overflow-hidden mb-3 bg-black flex items-center justify-center">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open image"
        className="block w-full focus:outline-none"
      >
        <img
          src={mediaUrl}
          alt={alt}
          className="max-w-full max-h-80 object-contain mx-auto"
          loading="lazy"
        />
      </button>
    </div>
  );

  return (
    <>
      {card}
      {open && (
        <MediaLightbox
          type={mediaType}
          src={mediaUrl}
          alt={alt}
          onClose={onClose}
        />
      )}
    </>
  );
}

export default memo(PostMedia);
