import React from 'react'
import { MessageCircle } from 'lucide-react'

export default function InboxEmptyState({
  title = 'No Vox yet',
  description = 'Start a Vox and your Vox will appear here.',
  action = null,
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white/50">
      <div className="chat-modern-empty-icon mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-slate-300/15">
        <MessageCircle size={22} />
      </div>

      <h3 className="mb-1 text-sm font-medium text-white/90">{title}</h3>
      <p className="mb-4 max-w-xs text-xs text-white/50">{description}</p>

      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
