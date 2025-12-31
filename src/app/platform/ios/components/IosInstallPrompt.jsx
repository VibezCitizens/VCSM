// src/app/platform/ios/components/IosInstallPrompt.jsx

import IosInstallSteps from './IosInstallSteps'

/**
 * iOS Install Prompt (UI ONLY)
 * ------------------------------------------------------------
 * - Controlled by parent via `open`
 * - No user-agent logic
 * - No timers
 * - No localStorage
 * - Safe to render anywhere (Login, Settings, Profile)
 */
export default function IosInstallPrompt({ open, onClose }) {
  if (!open) return null

  return (
    <div
      className="
        fixed inset-0 z-[5000]
        flex items-end sm:items-center justify-center
        bg-black/40 px-4
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <div
        className="
          relative
          w-full max-w-sm
          rounded-2xl
          bg-white
          border shadow-xl
          p-5
        "
      >
        {/* CLOSE */}
        <button
          type="button"
          aria-label="Close"
          className="absolute top-3 right-3 text-neutral-500 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>

        {/* TITLE */}
        <h2 className="text-lg font-semibold mb-1">
          Add Vibez Citizens
        </h2>

        {/* SUBTEXT */}
        <p className="text-sm text-neutral-600 mb-4">
          Install the app for a faster, full-screen experience.
        </p>

        {/* STEPS */}
        <IosInstallSteps onDone={onClose} />
      </div>
    </div>
  )
}
