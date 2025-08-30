// src/components/Layout.jsx
import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavBar from '@/ui/components/BottomNavBar';
import TopNav from './TopNav';

export default function Layout({ children, actions }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Hide chrome only on an open conversation: /chat/:id or /vchat/:id
  const inChatThread = /^\/(chat|vchat)\/[^/]+$/.test(pathname);

  // Keep your swipe nav everywhere EXCEPT inside a thread
  const swipeHandlers = useSwipeable(
    inChatThread
      ? {}
      : {
          onSwipedLeft:  () => navigate('/chat'),
          onSwipedRight: () => navigate('/'),
          trackTouch:    true,
        }
  );

  return (
    <div
      {...swipeHandlers}
      className="min-h-[100dvh] flex flex-col w-full max-w-[600px] mx-auto bg-black text-white"
    >
      {!inChatThread && <TopNav actions={actions} />}

      {/* Add bottom padding only when bottom nav is visible */}
      <main className={`relative flex-1 overflow-hidden ${!inChatThread ? 'pb-14' : ''}`}>
        {children}
      </main>

      {!inChatThread && (
        <div
          className="fixed bottom-0 left-0 right-0 z-10"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <BottomNavBar />
        </div>
      )}
    </div>
  );
}
