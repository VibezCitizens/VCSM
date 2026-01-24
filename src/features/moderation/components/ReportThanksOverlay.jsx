import React from "react";

function CheckIcon({ className = "w-9 h-9" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
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
 * variant:
 * - "post": full overlay (default) for PostCard
 * - "comment": compact overlay sized for CommentCard height
 */
export default function ReportedPostCover({
  title = "Reported",
  subtitle = "Thanks — we’ll review it. This post is hidden for you.",
  onClose,
  variant = "post",
}) {
  const isComment = variant === "comment";

  return (
    <>
      {/* dark veil */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[8px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.10] [background:radial-gradient(1200px_600px_at_50%_30%,rgba(255,255,255,0.18),transparent_60%)]" />

      {/* center card */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div
          className={[
            "relative w-full border border-white/10 bg-neutral-950/70 shadow-2xl backdrop-blur-[10px] text-center",
            isComment
              ? "max-w-xs rounded-2xl px-4 py-3"
              : "max-w-sm rounded-3xl px-5 py-5",
          ].join(" ")}
        >
          {/* purple ambient glow (smaller for comment) */}
          <div
            className={[
              "pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full blur-2xl opacity-45",
              isComment
                ? "-top-6 h-14 w-[72%] [background:radial-gradient(circle,rgba(168,85,247,0.45),transparent_70%)]"
                : "-top-10 h-24 w-[70%] [background:radial-gradient(circle,rgba(168,85,247,0.55),transparent_70%)]",
            ].join(" ")}
          />

          {/* optional close */}
          {typeof onClose === "function" ? (
            <button
              type="button"
              onClick={onClose}
              className={[
                "absolute right-2 top-2 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition",
                isComment ? "px-2 py-1 text-xs" : "px-2.5 py-1.5",
              ].join(" ")}
              aria-label="Close"
            >
              ✕
            </button>
          ) : null}

          {/* icon */}
          <div className="flex justify-center">
            <div className="text-violet-400 drop-shadow-[0_0_18px_rgba(168,85,247,0.45)]">
              <CheckIcon className={isComment ? "w-8 h-8" : "w-10 h-10"} />
            </div>
          </div>

          {/* copy */}
          <div
            className={[
              "font-semibold tracking-tight text-white",
              isComment ? "mt-2 text-sm" : "mt-3 text-base",
            ].join(" ")}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              className={[
                "text-white/70",
                isComment ? "mt-0.5 text-xs leading-4" : "mt-1 text-sm leading-5",
              ].join(" ")}
            >
              {subtitle}
            </div>
          ) : null}

          {/* hint (keep, but compact so it doesn't clip) */}
          <div
            className={[
              "text-white/45",
              isComment ? "mt-2 text-[10px]" : "mt-4 text-[11px]",
            ].join(" ")}
          >
            You can change this anytime in your safety settings.
          </div>
        </div>
      </div>
    </>
  );
}
