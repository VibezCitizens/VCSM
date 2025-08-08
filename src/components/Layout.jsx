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
    trackTouch:    true,
  });

  return (
    <div
      {...swipeHandlers}
      className="min-h-[100dvh] flex flex-col w-full max-w-[600px] mx-auto bg-black text-white"
    >
      {/* Top navigation always on top */}
      <TopNav actions={actions} />

      {/* 
        Main content area:
        - flex-1 to fill the space between top & bottom nav
        - pb-14 adds bottom padding so content never hides under the fixed nav 
      */}
      <main className="relative flex-1 overflow-hidden pb-14">
        {children}
      </main>

      {/* 
        Fixed bottom nav bar:
        - fixed positioning so it always sits above the map/content
        - z-10 to ensure it overlaps any absolute children in <main>
      */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <BottomNavBar />
      </div>
    </div>
  );
}
