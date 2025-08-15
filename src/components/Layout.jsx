// src/components/Layout.jsx
import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from './BottomNavBar';
import TopNav from './TopNav';

export default function Layout({ children, actions }) {
  const navigate = useNavigate();

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => navigate('/chat'),
    onSwipedRight: () => navigate('/'),
    trackTouch: true,
    trackMouse: false,
    // Keep vertical scrolling fluid; only act on clear horizontal swipes
    delta: 20,                    // require a bit more intent
    preventScrollOnSwipe: false,  // DO NOT block native scroll
    touchEventOptions: { passive: true },
  });

  return (
    <div
      {...swipeHandlers}
      // Allow native vertical scrolling even with swipe listeners
      className="min-h-[100dvh] flex flex-col w-full max-w-[600px] mx-auto bg-black text-white"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Sticky top navigation */}
      <div className="sticky top-0 z-20 bg-black">
        <TopNav actions={actions} />
      </div>

      {/* 
        Main content area:
        - flex-1 to fill between top & bottom nav
        - overflow-y-auto is the ONE scroll container
        - scroll-y-touch enables iOS momentum
        - pb-16 ensures content doesn't hide under fixed bottom nav
      */}
      <main className="relative flex-1 overflow-y-auto scroll-y-touch pb-16">
        {children}
      </main>

      {/* Fixed bottom nav bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <BottomNavBar />
      </div>
    </div>
  );
}
