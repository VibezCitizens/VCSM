// src/features/wanders/components/WandersShowLoveCTA.jsx
import React, { useMemo } from "react";

/**
 * Reusable gradient CTA button used across Wanders screens.
 *
 * Supports:
 * - Tailwind usage via `className`
 * - Inline-style usage via `style` (for screens using style objects)
 */
export default function WandersShowLoveCTA({
  onClick,
  label = "💖 SHOW LOVE TO MORE PEOPLE 💖",
  className = "",
  style,
  sheenStyle,
  innerRingStyle,
  sheenClassName,
  innerRingClassName,
  textStyle,
  disabled = false,
  type = "button",
}) {
  const usingInline = Boolean(style);

  const baseClassName = useMemo(() => {
    if (usingInline) return "";
    return [
      "relative overflow-hidden",
      "w-full",
      "rounded-2xl",
      "bg-gradient-to-r from-pink-600 via-rose-500 to-red-500",
      "px-6 py-3",
      "text-base font-extrabold uppercase tracking-wide text-white",
      "shadow-[0_14px_34px_rgba(0,0,0,0.8),0_0_40px_rgba(244,63,94,0.35)]",
      "transition",
      "hover:scale-[1.02]",
      "hover:shadow-[0_18px_44px_rgba(0,0,0,0.85),0_0_55px_rgba(244,63,94,0.55)]",
      "active:scale-[0.99]",
      "focus:outline-none focus:ring-2 focus:ring-pink-400/50",
      disabled ? "opacity-60 cursor-not-allowed" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");
  }, [usingInline, className, disabled]);

  const defaultSheenClass =
    "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.20),transparent_60%)]";

  const defaultInnerRingClass = "pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/20";

  if (usingInline) {
    return (
      <button type={type} onClick={onClick} style={style} disabled={disabled}>
        <span
          aria-hidden
          style={
            sheenStyle || {
              pointerEvents: "none",
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(255,255,255,0.18), transparent 55%)",
            }
          }
        />
        <span
          aria-hidden
          style={
            innerRingStyle || {
              pointerEvents: "none",
              position: "absolute",
              inset: 0,
              borderRadius: 12,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)",
            }
          }
        />
        <span style={textStyle || { position: "relative", zIndex: 1 }}>{label}</span>
      </button>
    );
  }

  return (
    <button type={type} onClick={onClick} className={baseClassName} disabled={disabled}>
      <span aria-hidden className={sheenClassName || defaultSheenClass} />
      <span aria-hidden className={innerRingClassName || defaultInnerRingClass} />
      <span className="relative">{label}</span>
    </button>
  );
}
