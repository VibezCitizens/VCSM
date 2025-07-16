import React, { useEffect, useState, useRef } from 'react';
import StoryItem from './components/StoryItem';
import StoryProgressBar from './components/StoryProgressBar';

/**
 * Full-screen story/24Drop viewer component
 * - Displays one story at a time with auto-advance
 * - Supports click-to-skip (next/prev)
 * - Custom close button
 */
export default function StoryViewer({ stories, onClose }) {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Guard clause
    if (!stories.length) return;

    // Auto advance to next story every 4s
    timeoutRef.current = setTimeout(() => {
      if (current < stories.length - 1) {
        setCurrent(current + 1);
      } else {
        onClose(); // Exit after last story
      }
    }, 4000);

    return () => clearTimeout(timeoutRef.current);
  }, [current, stories]);

  const handleNext = () => {
    clearTimeout(timeoutRef.current);
    if (current < stories.length - 1) {
      setCurrent((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    clearTimeout(timeoutRef.current);
    if (current > 0) {
      setCurrent((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex justify-center items-center z-50">
      
      {/* Background click area to skip forward */}
      <div className="absolute inset-0" onClick={handleNext} />

      {/* Progress bar at the top */}
      <StoryProgressBar count={stories.length} activeIndex={current} />

      {/* Center story content */}
      <div className="relative z-10 w-full max-w-md">
        <StoryItem story={stories[current]} />
      </div>

      {/* Optional click zones for manual navigation */}
      <div className="absolute left-0 top-0 bottom-0 w-1/2 z-20" onClick={handlePrev} />
      <div className="absolute right-0 top-0 bottom-0 w-1/2 z-20" onClick={handleNext} />

      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-white text-xs bg-zinc-800 px-3 py-1 rounded z-50"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}
