import React, { Suspense } from 'react'
import SearchScreen from '../ui/SearchScreen.view'
import '@/features/ui/modern/module-modern.css'

export default function ExploreScreen() {
  return (
    <div className="module-modern-page h-full min-h-0 w-full">
      <div className="w-full max-w-none sm:mx-auto sm:max-w-2xl">
        <Suspense fallback={<div className="p-4 text-center text-slate-300">Loading...</div>}>
          <SearchScreen />
        </Suspense>
      </div>
    </div>
  )
}
