import React from 'react'
import { MessageCircle } from 'lucide-react'
import { useTranslation } from '@i18n'

export default function InboxEmptyState({ title, description, action = null }) {
  const { t } = useTranslation()
  const displayTitle = title ?? t('vox.inbox.noVoxYet')
  const displayDescription = description ?? t('vox.inbox.noVoxDesc')

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white/50">
      <div className="chat-modern-empty-icon mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-slate-300/15">
        <MessageCircle size={22} />
      </div>

      <h3 className="mb-1 text-sm font-medium text-white/90">{displayTitle}</h3>
      <p className="mb-4 max-w-xs text-xs text-white/50">{displayDescription}</p>

      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
