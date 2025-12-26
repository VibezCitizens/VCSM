// src/features/vport/screens/views/VportViewScreen.jsx

import { useState } from 'react'

export default function VportViewScreen({
  viewerActorId,
  vportId,
}) {
  const [tab, setTab] = useState('posts')

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vport Page</h1>
        <p className="text-sm text-neutral-400">
          vportId: {vportId}
        </p>
        <p className="text-sm text-neutral-500">
          viewerActorId: {viewerActorId}
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-neutral-800 mb-6">
        {['posts', 'photos', 'about'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 ${
              tab === t
                ? 'border-b-2 border-white text-white'
                : 'text-neutral-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {tab === 'posts' && (
        <div className="text-neutral-300">
          📌 Vport posts will appear here.
        </div>
      )}

      {tab === 'photos' && (
        <div className="text-neutral-300">
          🖼️ Vport photos will appear here.
        </div>
      )}

      {tab === 'about' && (
        <div className="text-neutral-300">
          ℹ️ About this vport.
        </div>
      )}
    </div>
  )
}
