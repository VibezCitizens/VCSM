// src/features/chat/components/conversation/MessageStatus.jsx
// ============================================================
// MessageStatus
// ------------------------------------------------------------
// - Pure UI component
// - Renders delivery / read state for a message
// - Actor-agnostic (no actorId, no userId)
// - Intended for "my messages only"
// ============================================================

import React from 'react'
import { Check, CheckCheck, Clock } from 'lucide-react'
import clsx from 'clsx'

/**
 * Props
 * ------------------------------------------------------------
 * status: 'sending' | 'delivered' | 'read'
 *
 * align?: 'left' | 'right'     // visual alignment
 * muted?: boolean              // softer UI (archived / muted convo)
 */
export default function MessageStatus({
  status = 'delivered',
  align = 'right',
  muted = false,
}) {
  let Icon = Check
  let label = 'Delivered'

  switch (status) {
    case 'sending':
      Icon = Clock
      label = 'Sending'
      break

    case 'read':
      Icon = CheckCheck
      label = 'Read'
      break

    case 'delivered':
    default:
      Icon = Check
      label = 'Delivered'
      break
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1',
        'text-[10px]',
        muted ? 'opacity-40' : 'opacity-70',
        align === 'right' ? 'justify-end' : 'justify-start'
      )}
      aria-label={label}
      title={label}
    >
      <Icon size={12} />
      <span>{label}</span>
    </span>
  )
}
