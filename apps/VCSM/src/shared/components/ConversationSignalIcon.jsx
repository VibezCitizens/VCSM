// src/shared/components/ConversationSignalIcon.jsx
// ============================================================
// ConversationSignalIcon
// ------------------------------------------------------------
// - Pure UI
// - Square + plus (start / create / initiate)
// - White by default (inherits via currentColor)
// - Size + className compatible
// ============================================================

export default function ConversationSignalIcon({
  size = 18,
  className = '',
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* square container */}
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="3"
        ry="3"
      />

      {/* plus vertical */}
      <line x1="12" y1="8" x2="12" y2="16" />

      {/* plus horizontal */}
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}
