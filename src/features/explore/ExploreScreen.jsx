// src/features/explore/ExploreScreen.jsx
import { useState } from 'react';
import StoriesScreen from './stories/StoriesScreen';
import SearchScreen from "./search/SearchScreen";

import VDropScreen from './vdrop/VDropScreen'


import { Search, BookOpen, Video } from 'lucide-react'

export default function ExploreScreen() {
  const [tab, setTab] = useState('search')

  const TABS = {
    search: <SearchScreen />,
    stories: <StoriesScreen />,
    vdrop: <VDropScreen />,
  }

  const ICONS = {
    search: <Search className="w-6 h-6" />,
    stories: <BookOpen className="w-6 h-6" />,
    vdrop: <Video className="w-6 h-6" />,
  }

  return (
    <div className="h-full w-full flex flex-col bg-black">
      <div className="flex justify-around border-b border-gray-700 text-white bg-black">
        {Object.keys(TABS).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 flex justify-center ${
              tab === key ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-400'
            }`}
          >
            {ICONS[key]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {TABS[tab]}
      </div>
    </div>
  )
}
