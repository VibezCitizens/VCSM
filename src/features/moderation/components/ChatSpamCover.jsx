import React from "react";

function CheckIcon({ className = "w-9 h-9" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="3" />
      <path
        d="M16.5 24.5L21.5 29.5L32 19"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ChatSpamCover
 * - Fullscreen overlay for chat screens
 * - Use when a conversation is marked as spam
 */
export default function ChatSpamCover({
  title = "Marked as spam",
  subtitle = "Thanks — we’ll review it. This conversation has been reported as spam.",
  hint = "You can change this anytime in your safety settings.",
  onClose,
  primaryLabel = "Back to inbox",
  onPrimary,
  secondaryLabel = "Not spam",
  onSecondary,
}) {
  return (
    <div className="fixed inset-0 z-[99999]" role="dialog" aria-modal="true">
      {/* dark veil */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[8px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.10] [background:radial-gradient(1200px_600px_at_50%_30%,rgba(255,255,255,0.18),transparent_60%)]" />

      {/* center card */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-neutral-950/70 shadow-2xl backdrop-blur-[10px] text-center px-5 py-5">
          {/* purple ambient glow */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-10 h-24 w-[70%] rounded-full blur-2xl opacity-45 [background:radial-gradient(circle,rgba(168,85,247,0.55),transparent_70%)]" />

          {/* optional close */}
          {typeof onClose === "function" ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-2 top-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              ✕
            </button>
          ) : null}

          {/* icon */}
          <div className="flex justify-center">
            <div className="text-violet-400 drop-shadow-[0_0_18px_rgba(168,85,247,0.45)]">
              <CheckIcon className="w-10 h-10" />
            </div>
          </div>

          {/* copy */}
          <div className="mt-3 text-base font-semibold tracking-tight text-white">
            {title}
          </div>

          {subtitle ? (
            <div className="mt-1 text-sm leading-5 text-white/70">
              {subtitle}
            </div>
          ) : null}

          {hint ? (
            <div className="mt-4 text-[11px] text-white/45">
              {hint}
            </div>
          ) : null}

          {/* actions */}
          {(typeof onPrimary === "function" || typeof onSecondary === "function") && (
            <div className="mt-5 flex items-center justify-center gap-2">
              {typeof onSecondary === "function" ? (
                <button
                  type="button"
                  onClick={onSecondary}
                  className="px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition"
                >
                  {secondaryLabel}
                </button>
              ) : null}

              {typeof onPrimary === "function" ? (
                <button
                  type="button"
                  onClick={onPrimary}
                  className="px-4 py-2 rounded-2xl bg-violet-500/20 text-violet-200 border border-violet-400/20 hover:bg-violet-500/30 transition"
                >
                  {primaryLabel}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
