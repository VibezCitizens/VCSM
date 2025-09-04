// src/features/posts/ui/PostMedia.jsx
/**
 * Media block for a post. Handles image/video. No external side effects.
 */
import { memo } from 'react';

function PostMedia({ mediaType, mediaUrl, alt = 'post media' }) {
  if (!mediaUrl) return null;

  if (mediaType === 'image') {
    return (
      <div className="w-full rounded-xl overflow-hidden mb-3">
        <img src={mediaUrl} alt={alt} className="w-full max-h-80 object-cover" />
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <video src={mediaUrl} controls className="w-full max-h-80 rounded-xl mb-3" />
    );
  }

  return null;
}

export default memo(PostMedia);
