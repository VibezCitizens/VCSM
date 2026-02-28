import React, { Suspense } from 'react'
import SearchScreen from '../ui/SearchScreen.view'
import '@/features/ui/modern/module-modern.css'

export default function ExploreScreen() {
  return (
    <div className="module-modern-page w-full min-h-0 p-0 sm:p-4">
      <div className="w-full max-w-none sm:mx-auto sm:max-w-xl">
        <Suspense fallback={<div className="p-4 text-center text-slate-300">Loading...</div>}>
          <SearchScreen />
        </Suspense>
      </div>
    </div>
  )
}