// src/features/explore/stories/StoryViewer.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
// ❌ remove: import { supabase } from '@/lib/supabaseClient';
import StoryItem from './components/StoryItem';
import StoryProgressBar from './components/StoryProgressBar';
import Viewby from './components/Viewby';

export default function StoryViewer({ stories, onClose }) {
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const scrollToIndex = useCallback((index) => {
    const el = containerRef.current?.children?.[index];
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 🕒 Auto-advance every 15 seconds
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < stories.length) {
        setCurrentIndex(nextIndex);
        scrollToIndex(nextIndex);
      } else {
        onClose?.();
      }
    }, 15000);

    return () => clearTimeout(timeoutRef.current);
  }, [currentIndex, stories.length, scrollToIndex, onClose]);

  // Handle vertical swipe gestures
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    touchEndY.current = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY.current;

    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0 && currentIndex < stories.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (deltaY < 0 && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    }
  };

  const handleScroll = () => {
    const wrap = containerRef.current;
    if (!wrap) return;
    const scrollY = wrap.scrollTop;
    const height = window.innerHeight || 1;
    const newIndex = Math.round(scrollY / height);
    if (Number.isFinite(newIndex) && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMuteToggle = () => setIsMuted((prev) => !prev);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      <StoryProgressBar count={stories.length} activeIndex={currentIndex} duration={15000} />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
      >
        {stories.map((story, index) => (
          <div
            key={story.id}
            className="relative snap-start h-screen w-full flex flex-col items-center justify-center"
          >
            <StoryItem
              story={story}
              isMuted={isMuted}
              isActive={index === currentIndex}
              onMuteToggle={handleMuteToggle}
            />

            {index === currentIndex && (
              <Viewby key={`${story.id}-${currentIndex}`} storyId={story.id} />
            )}
          </div>
        ))}
      </div>

      <button
        className="absolute top-4 right-4 text-white text-xs bg-zinc-800 px-3 py-1 rounded z-50"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}
