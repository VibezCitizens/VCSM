// src/features/settings/ui/Row.jsx
// ============================================================
// SETTINGS — ROW (UI)
// ------------------------------------------------------------
// Reusable row layout for Settings screens
// - Optional navigation or click action
// - Optional right-side control (button, toggle, etc.)
// - Pure UI (no state, no data)
// ============================================================

import { Link } from 'react-router-dom'
import { cx } from '../constants'

export default function Row({
  to,
  onClick,
  title,
  subtitle,
  left,        // optional custom left node (overrides title/subtitle)
  right,       // optional right-side control
  className = '',
}) {
  const isInteractive = !!(to || onClick)
  const Wrapper = to ? Link : 'div'

  const wrapperProps = to
    ? { to }
    : onClick
    ? { onClick, role: 'button', tabIndex: 0 }
    : {}

  return (
    <section
      className={cx(
        'rounded-2xl bg-zinc-900/80 border border-zinc-800 p-3',
        isInteractive && 'hover:bg-zinc-900 transition-colors',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 w-full">
        {/* LEFT */}
        <div className="min-w-0 flex-1">
          {left ? (
            left
          ) : (
            <Wrapper
              {...wrapperProps}
              className={cx(
                'block text-left no-underline',
                isInteractive && 'cursor-pointer focus:outline-none'
              )}
            >
              <div className="text-sm font-semibold text-white truncate">
                {title}
              </div>
              {subtitle && (
                <div className="text-xs text-zinc-400 truncate">
                  {subtitle}
                </div>
              )}
            </Wrapper>
          )}
        </div>

        {/* RIGHT */}
        {right && (
          <div className="shrink-0">
            {right}
          </div>
        )}
      </div>
    </section>
  )
}
