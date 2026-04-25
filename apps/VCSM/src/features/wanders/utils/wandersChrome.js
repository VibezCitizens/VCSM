// src/features/wanders/utils/wandersChrome.js
// ============================================================================
// WANDERS UI CHROME — GLOBAL THEME TOKENS
// UI-only shared styling primitives (Tailwind class strings).
// Safe to import from Views/Components.
// ============================================================================

export const WANDERS_INPUT_BAR_CLASS = `
w-full px-4 py-2 pr-10
rounded-2xl bg-[var(--vc-surface-input)] text-[var(--vc-text)]
border border-[var(--vc-border-strong)]
focus:ring-2 focus:ring-[rgba(139,92,246,0.35)]
`.trim();

export const WANDERS_CHROME = {
  // Page shell
  shell: "relative h-screen w-full overflow-y-auto touch-pan-y bg-[var(--vc-bg-0)] text-[var(--vc-text)]",

  // Background glow
  bgGlow:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(139,92,246,0.15),transparent)]",

  // Header
  header: "sticky top-0 z-20 border-b border-[var(--vc-border)] bg-[var(--vc-surface)] backdrop-blur",
  container: "mx-auto w-full max-w-2xl px-4",
  headerPad: "py-3",
  headerTitle: "text-lg font-bold tracking-wide",
  headerSub: "mt-1 text-sm text-[var(--vc-text-soft)]",

  // Main content
  main: "relative mx-auto w-full max-w-2xl px-4 pb-24 pt-5",

  // Glass dashboard box
  dashBox:
    "relative overflow-hidden rounded-2xl border border-[var(--vc-border)] bg-[var(--vc-surface)] p-4 text-[var(--vc-text)] backdrop-blur-xl " +
    "shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_36px_rgba(139,92,246,0.10)]",

  glowTL: "pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-[rgba(139,92,246,0.10)] blur-3xl",
  glowBR: "pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[rgba(255,105,198,0.08)] blur-3xl",

  // Lift button
  btnLift: [
    "relative overflow-hidden",
    "rounded-xl",
    "bg-[var(--vc-surface-strong)]",
    "border border-[var(--vc-border)]",
    "px-4 py-3",
    "text-sm font-semibold text-[var(--vc-text)]",
    "shadow-[0_10px_26px_rgba(0,0,0,0.75)]",
    "transition",
    "hover:bg-[var(--vc-surface-strong)] hover:border-[var(--vc-border-strong)]",
    "hover:shadow-[0_14px_34px_rgba(0,0,0,0.78),0_0_26px_rgba(139,92,246,0.22)]",
    "active:scale-[0.99]",
    "focus:outline-none focus:ring-2 focus:ring-[rgba(139,92,246,0.35)] focus:ring-offset-0",
  ].join(" "),

  btnSheen:
    "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_55%)]",
  btnInnerRing: "pointer-events-none absolute inset-0 rounded-xl ring-1 ring-[var(--vc-border)]",

  // Helpers
  pill:
    "inline-flex items-center gap-1.5 rounded-full border border-[var(--vc-border)] bg-[var(--vc-surface)] px-2.5 py-1 text-xs text-[var(--vc-text-soft)]",
  muted: "text-sm text-[var(--vc-text-soft)]",
  tip: "pt-1 text-xs text-[var(--vc-text-muted)]",
};
