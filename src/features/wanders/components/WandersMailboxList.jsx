// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersMailboxList.jsx
// ============================================================================
// WANDERS COMPONENT — MAILBOX LIST
// UI-only: renders a list of mailbox items.
// No DAL, no controllers.
// ============================================================================

import React from 'react'
import WandersMailboxItemRow from '@/features/wanders/components/WandersMailboxItemRow'

/**
 * @param {{
 *  items: Array<any>,
 *  loading?: boolean,
 *  empty?: React.ReactNode,
 *  onItemClick?: (item: any) => void,
 *  selectedItemId?: string|null,
 *  className?: string,
 * }} props
 */
export function WandersMailboxList({
  items,
  loading = false,
  empty = null,
  onItemClick,
  selectedItemId = null,
  className = '',
}) {
  if (loading) {
    return (
      <div className={['w-full rounded-2xl border border-gray-200 bg-white p-4', className].join(' ')}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-16 w-full rounded bg-gray-200" />
          <div className="h-16 w-full rounded bg-gray-200" />
          <div className="h-16 w-full rounded bg-gray-200" />
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return <div className={className}>{empty}</div>
  }

  return (
    <div className={['w-full overflow-hidden rounded-2xl border border-gray-200 bg-white', className].join(' ')}>
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <WandersMailboxItemRow
            key={item.id}
            item={item}
            onClick={onItemClick}
            isSelected={selectedItemId ? selectedItemId === item.id : false}
          />
        ))}
      </div>
    </div>
  )
}

export default WandersMailboxList
