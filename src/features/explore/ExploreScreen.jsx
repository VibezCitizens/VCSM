// src/features/explore/ExploreScreen.jsx
import React, { useState, lazy, Suspense, useCallback } from 'react';
import { Search, BookOpen, Video } from 'lucide-react';

// Lazy-load to keep initial bundle light
const SearchScreen  = lazy(() => import('./search/SearchScreen'));
const StoriesScreen = lazy(() => import('./stories/StoriesScreen'));
const VDropScreen   = lazy(() => import('./vdrop/VDropScreen'));

export default function ExploreScreen() {
  const [tab, setTab] = useState('search'); // 'search' | 'stories' | 'vdrop'

  const renderTab = useCallback(() => {
    switch (tab) {
      case 'stories': return <StoriesScreen />;
      case 'vdrop':   return <VDropScreen />;
      case 'search':
      default:        return <SearchScreen />;
    }
  }, [tab]);

  return (
    <div className="h-full w-full flex flex-col bg-black">
      {/* Top tabs (safe-area aware) */}
      <div
        role="tablist"
        aria-label="Explore sections"
        className="flex justify-around border-b border-gray-700 text-white bg-black"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {[
          { key: 'search',  icon: <Search className="w-6 h-6" /> },
          { key: 'stories', icon: <BookOpen className="w-6 h-6" /> },
          { key: 'vdrop',   icon: <Video className="w-6 h-6" /> },
        ].map(({ key, icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 flex justify-center ${
              tab === key ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-400'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              Loading…
            </div>
          }
        >
          {renderTab()}
        </Suspense>
      </div>
    </div>
  );
}
