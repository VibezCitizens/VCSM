import React, { Suspense } from 'react';
import SearchScreen from './search/SearchScreen';

export default function ExploreScreen() {
  return (
    <div className="min-h-[100dvh] w-full p-0 sm:p-4">
      <main className="w-full max-w-none sm:max-w-xl sm:mx-auto">
        <Suspense fallback={<div className="p-4 text-center text-white">Loading…</div>}>
          <SearchScreen />
        </Suspense>
      </main>
    </div>
  );
}
