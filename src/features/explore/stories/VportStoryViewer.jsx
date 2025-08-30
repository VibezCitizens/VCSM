// src/features/explore/stories/VportStoryViewer.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/data/data';

import VportStoryItem from './components/VportStoryItem';
import StoryProgressBar from './components/StoryProgressBar';
import VportViewby from './components/VportViewby';

/**
 * VportStoryViewer
 * - Vertical, snap-scrolling viewer for VPORT stories
 * - Auto-advances every 15s
 * - Logs unique views via DAL (db.stories.logVportStoryView)
 * - Shows VPORT-specific “Viewby” panel for reactions & viewers
 *
 * Props:
 *  - stories: Array<{ id, vport_id, created_by, media_url, media_type, caption, created_at }>
 *  - onClose?: () => void
 */
export default function VportStoryViewer({ stories = [], onClose }) {
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const { user } = useAuth();

  const scrollToIndex = useCallback((index) => {
    const el = containerRef.current?.children?.[index];
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-advance every 15s
  useEffect(() => {
    if (!stories.length) return;

    timeoutRef.current = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        const next = currentIndex + 1;
        setCurrentIndex(next);
        scrollToIndex(next);
      } else {
        onClose?.();
      }
    }, 15000);

    return () => clearTimeout(timeoutRef.current);
  }, [currentIndex, stories.length, scrollToIndex, onClose]);

  // Log a view when active story changes (VPORT)
  useEffect(() => {
    const active = stories[currentIndex];
    if (!active?.id || !user?.id) return;

    db.stories
      .logVportStoryView({ storyId: active.id, userId: user.id })
      .catch((e) => console.warn('[VPORT view log error]', e?.message || e));
  }, [currentIndex, stories, user?.id]);

  // Scroll -> update the active index (snap rounding)
  const handleScroll = () => {
    const scrollY = containerRef.current?.scrollTop ?? 0;
    const height = window.innerHeight || 1;
    const newIndex = Math.round(scrollY / height);

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      clearTimeout(timeoutRef.current);
    }
  };

  // Touch swipe up/down to change story
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

  const handleMuteToggle = () => setIsMuted((m) => !m);

  if (!stories.length) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Top progress bar */}
      <StoryProgressBar count={stories.length} activeIndex={currentIndex} duration={15000} />

      {/* Vertical snap container */}
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
            <VportStoryItem
              story={story}
              isMuted={isMuted}
              isActive={index === currentIndex}
              onMuteToggle={handleMuteToggle}
            />

            {/* View & reaction tracker (VPORT variant) */}
            {index === currentIndex && <VportViewby key={`${story.id}-${index}`} storyId={story.id} />}
          </div>
        ))}
      </div>

      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white text-xs bg-zinc-800 px-3 py-1 rounded z-50"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}
