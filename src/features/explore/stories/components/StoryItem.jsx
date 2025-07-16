import React from 'react';

const StoryItem = ({ story }) => {
  const { media_url, media_type, caption } = story;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4">
      <div className="max-w-sm w-full mx-auto rounded-xl overflow-hidden">
        {media_type === 'video' ? (
          <video
            src={media_url}
            autoPlay
            muted
            playsInline
            controls
            className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
          />
        ) : (
          <img
            src={media_url}
            alt="story"
            className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
          />
        )}
      </div>
      {caption && (
        <p className="text-sm text-center text-zinc-300 px-4">{caption}</p>
      )}
    </div>
  );
};

export default StoryItem;
