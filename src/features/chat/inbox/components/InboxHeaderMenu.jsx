// src/features/chat/inbox/components/InboxHeaderMenu.jsx

import { useNavigate } from 'react-router-dom'

export default function InboxHeaderMenu() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/chat/settings')}
      className="
        rounded-full p-2
        border border-white/20
        hover:bg-white/10
        flex items-center justify-center
      "
      aria-label="Vox settings"
      title="Vox settings"
    >
      <span className="text-white text-lg leading-none">⚙️</span>
    </button>
  )
}
