import { useCallback } from 'react'
import { Check } from 'lucide-react'

/**
 * Custom styled consent checkbox with premium dark theme.
 *
 * Props:
 * @param {boolean}  checked   - Whether the checkbox is checked
 * @param {Function} onChange  - Toggle callback
 * @param {React.ReactNode} children - Label content (rendered as clickable text)
 */
export default function ConsentCheckbox({ checked, onChange, children }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        onChange()
      }
    },
    [onChange],
  )

  // Click on the outer label toggles — but links inside stop propagation
  const handleLabelClick = useCallback(
    (e) => {
      // Don't toggle if user clicked an <a> or <Link> (rendered as <a>)
      if (e.target.closest('a')) return
      onChange()
    },
    [onChange],
  )

  return (
    <div
      className="flex items-start gap-3 cursor-pointer select-none"
      onClick={handleLabelClick}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Custom checkbox box */}
      <div className="shrink-0 mt-px">
        <div
          className={[
            'relative h-[20px] w-[20px] rounded-[5px] border-2 transition-all duration-150 ease-out',
            checked
              ? 'border-[var(--vc-accent-primary)] bg-gradient-to-br from-[var(--vc-accent-primary)] to-[var(--vc-accent-primary-deep)] shadow-[var(--vc-accent-glow-sm)]'
              : 'border-white/40 bg-white/8 hover:border-white/55 hover:bg-white/12',
          ].join(' ')}
          style={{ willChange: 'transform, box-shadow' }}
        >
          <Check
            size={13}
            strokeWidth={3}
            className={[
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white transition-all duration-150 ease-out',
              checked ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
            ].join(' ')}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Label text */}
      <span className="text-xs leading-relaxed text-[var(--vc-text-soft)]">
        {children}
      </span>
    </div>
  )
}
