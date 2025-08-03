import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';

import { supabase } from '@/lib/supabaseClient';
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
    if (containerRef.current?.children[index]) {
      containerRef.current.children[index].scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // 👁️ Log the view into story_views
  const logView = useCallback(async (storyId) => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('Auth error while logging view:', error.message);
      return;
    }

    const { error: insertError } = await supabase.from('story_views').upsert(
      {
        story_id: storyId,
        user_id: user.id,
      },
      { onConflict: 'user_id, story_id' }
    );

    if (insertError) {
      console.error('View log insert error:', insertError.message);
    } else {
      console.log('✅ Logged view for story:', storyId);
    }
  }, []);

  // 🕒 Auto-advance every 15 seconds
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex((i) => i + 1);
        scrollToIndex(currentIndex + 1);
      } else {
        onClose?.();
      }
    }, 15000);

    return () => clearTimeout(timeoutRef.current);
  }, [currentIndex, stories.length, scrollToIndex]);

  // 👁️ Log a view whenever active story changes
  useEffect(() => {
    const currentStory = stories[currentIndex];
    if (currentStory?.id) {
      logView(currentStory.id);
    }
  }, [currentIndex, logView, stories]);

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
    const scrollY = containerRef.current.scrollTop;
    const height = window.innerHeight;
    const newIndex = Math.round(scrollY / height);

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Progress bar */}
      <StoryProgressBar
        count={stories.length}
        activeIndex={currentIndex}
        duration={15000}
      />

      {/* Story container */}
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

            {/* 👁️ View & Reaction Tracker */}
            {index === currentIndex && (
              <Viewby key={`${story.id}-${currentIndex}`} storyId={story.id} />
            )}
          </div>
        ))}
      </div>

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
