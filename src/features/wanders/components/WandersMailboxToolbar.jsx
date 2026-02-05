// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersMailboxToolbar.jsx
// ============================================================================
// WANDERS COMPONENT — MAILBOX TOOLBAR
// UI-only: folder picker + search box + optional actions slot.
// No DAL, no controllers.
// ============================================================================

import React, { useMemo } from 'react'

/**
 * @param {{
 *  currentFolder: 'inbox'|'outbox',
 *  searchQuery?: string,
 *  onFolderChange: (folder: 'inbox'|'outbox') => void,
 *  onSearchChange: (query: string) => void,
 *  extraActions?: React.ReactNode,
 *  disabled?: boolean,
 *  className?: string,
 * }} props
 */
export function WandersMailboxToolbar({
  currentFolder,
  searchQuery = '',
  onFolderChange,
  onSearchChange,
  extraActions,
  disabled = false,
  className = '',
}) {
  const folders = useMemo(
    () => [
      { key: 'inbox', label: 'Inbox' },
      { key: 'outbox', label: 'Outbox' },
    ],
    []
  )

  return (
    <div className={['w-full space-y-3', className].join(' ')}>
      {/* Folder pills */}
      <div className="flex flex-wrap items-center gap-2">
        {folders.map((f) => {
          const active = currentFolder === f.key
          return (
            <button
              key={f.key}
              type="button"
              disabled={disabled}
              onClick={() => onFolderChange(f.key)}
              className={[
                'rounded-full border px-3 py-1.5 text-sm font-semibold transition',
                active ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50',
                disabled ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {f.label}
            </button>
          )
        })}

        {/* Right-side actions */}
        {extraActions ? (
          <div className="ml-auto flex items-center gap-2">{extraActions}</div>
        ) : null}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            disabled={disabled}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages…"
            className={[
              'w-full rounded-xl border bg-white px-3.5 py-2.5 text-[14px] leading-5 shadow-sm',
              'border-gray-200 text-gray-900 placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400',
              disabled ? 'opacity-60 cursor-not-allowed' : '',
            ].join(' ')}
          />
        </div>

        {searchQuery ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSearchChange('')}
            className={[
              'shrink-0 rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-gray-50',
              'border-gray-200 text-gray-800',
              disabled ? 'opacity-60 cursor-not-allowed' : '',
            ].join(' ')}
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default WandersMailboxToolbar
