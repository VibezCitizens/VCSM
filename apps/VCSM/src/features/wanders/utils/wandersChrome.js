// src/features/wanders/utils/wandersChrome.js
// ============================================================================
// WANDERS UI CHROME — GLOBAL THEME TOKENS
// UI-only shared styling primitives (Tailwind class strings).
// Safe to import from Views/Components.
// ============================================================================

export const WANDERS_INPUT_BAR_CLASS = `
w-full px-4 py-2 pr-10
rounded-2xl bg-neutral-900 text-white
border border-purple-700
focus:ring-2 focus:ring-purple-500
`.trim();

export const WANDERS_CHROME = {
  // Page shell
  shell: "relative h-screen w-full overflow-y-auto touch-pan-y bg-black text-white",

  // Background glow
  bgGlow:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]",

  // Header
  header: "sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur",
  container: "mx-auto w-full max-w-2xl px-4", // ✅ was max-w-4xl
  headerPad: "py-3",
  headerTitle: "text-lg font-bold tracking-wide",
  headerSub: "mt-1 text-sm text-zinc-300",

  // Main content
  main: "relative mx-auto w-full max-w-2xl px-4 pb-24 pt-5", // ✅ was max-w-4xl

  // Glass dashboard box
  dashBox:
    "relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-4 text-white backdrop-blur-xl " +
    "shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_36px_rgba(124,58,237,0.10)]",

  glowTL: "pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl",
  glowBR: "pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/08 blur-3xl",

  // Lift button
  btnLift: [
    "relative overflow-hidden",
    "rounded-xl",
    "bg-zinc-900/90",
    "border border-white/15",
    "px-4 py-3",
    "text-sm font-semibold text-white",
    "shadow-[0_10px_26px_rgba(0,0,0,0.75)]",
    "transition",
    "hover:bg-zinc-900 hover:border-white/25",
    "hover:shadow-[0_14px_34px_rgba(0,0,0,0.78),0_0_26px_rgba(124,58,237,0.22)]",
    "active:scale-[0.99]",
    "focus:outline-none focus:ring-2 focus:ring-violet-500/35 focus:ring-offset-0",
  ].join(" "),

  btnSheen:
    "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_55%)]",
  btnInnerRing: "pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10",

  // Helpers
  pill:
    "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/75",
  muted: "text-sm text-white/60",
  tip: "pt-1 text-xs text-zinc-400",
};
