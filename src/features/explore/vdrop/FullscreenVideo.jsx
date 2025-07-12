// src/features/explore/vdrop/FullscreenVideo.jsx
import { forwardRef } from 'react';

const FullscreenVideo = forwardRef(({ src }, ref) => {
  return (
    <div className="relative w-[100vw] h-[100dvh] bg-black overflow-hidden">
      <video
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
    </div>
  );
});

export default FullscreenVideo;
