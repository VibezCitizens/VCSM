import { AnimatePresence, motion } from 'framer-motion'
import { Smartphone, Sparkles, X } from 'lucide-react'
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
  const MotionBackdrop = motion.div
  const MotionPanel = motion.div

  return (
    <AnimatePresence>
      {open ? (
        <MotionBackdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
          className="
            fixed inset-0 z-[5000]
            flex items-end sm:items-center justify-center
            bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),rgba(2,6,23,0.9)_44%)]
            backdrop-blur-sm
            px-4 pb-[env(safe-area-inset-bottom)]
          "
        >
          <MotionPanel
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="
              relative w-full max-w-md overflow-hidden
              max-h-[calc(100dvh-12px)] overflow-y-auto
              rounded-3xl border border-white/15
              bg-gradient-to-b from-slate-900 to-[#090d19]
              p-5 pb-[max(16px,env(safe-area-inset-bottom))] sm:p-6 text-white shadow-2xl
            "
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />

            <button
              type="button"
              aria-label="Close"
              className="
                absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full
                border border-white/20 bg-white/8 text-white/80 transition-colors hover:bg-white/15
              "
              onClick={onClose}
            >
              <X size={16} />
            </button>

            <div className="relative mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                <Smartphone size={12} />
                iPhone setup
              </div>
              <h2 className="mt-3 text-xl font-semibold sm:text-2xl">
                Install Vibez Citizens
              </h2>
              <p className="mt-2 text-sm text-slate-200/80">
                Add it to your Home Screen for a faster launch, full-screen feel, and a cleaner app-like experience.
              </p>
            </div>

            <div className="relative mb-4 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-xs text-slate-200/85">
                <Sparkles size={14} className="text-cyan-200" />
                Works best in Safari on iPhone
              </div>
            </div>

            <IosInstallSteps onDone={onClose} />
          </MotionPanel>
        </MotionBackdrop>
      ) : null}
    </AnimatePresence>
  )
}
