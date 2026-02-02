// src/features/chat/components/inbox/InboxEmptyState.jsx
// ============================================================
// InboxEmptyState
// ------------------------------------------------------------
// - Pure UI component
// - Shown when actor inbox has zero Vox
// - Actor-agnostic (no actorId / userId)
// ============================================================

import React from 'react'
import { MessageCircle } from 'lucide-react'

/**
 * Props
 * ------------------------------------------------------------
 * title?: string
 * description?: string
 * action?: ReactNode
 */
export default function InboxEmptyState({
  title = 'No Vox yet',
  description = 'Start a Vox and your Vox will appear here.',
  action = null,
}) {
  return (
    <div
      className="
        flex flex-col items-center justify-center
        h-full
        px-6
        text-center
        text-neutral-400
      "
    >
      <div
        className="
          flex items-center justify-center
          h-12 w-12
          rounded-full
          bg-neutral-800
          mb-4
        "
      >
        <MessageCircle size={22} />
      </div>

      <h3 className="text-sm font-medium text-neutral-200 mb-1">
        {title}
      </h3>

      <p className="text-xs max-w-xs mb-4">
        {description}
      </p>

      {action && (
        <div className="mt-1">
          {action}
        </div>
      )}
    </div>
  )
}
