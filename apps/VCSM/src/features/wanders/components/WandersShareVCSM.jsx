// src/features/wanders/components/WandersShareVCSM.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveSeasonTheme } from "@/season";

export default function WandersShareVCSM({
  cardPublicId,
  fromPath = "/wanders/sent",
  className = "",
  title = "Save your WVOX forever",
  subtitle = "Create an account to keep your mailbox across devices and never lose access.",
  useSeasonFrame = false,
}) {
  const navigate = useNavigate();
  const season = getActiveSeasonTheme("topRight");

  const navState = useMemo(() => {
    return {
      from: fromPath,
      card: (cardPublicId || "").trim() || null,
      // ✅ Explicitly mark this as a Wanders upgrade flow
      wandersFlow: true,
      // ✅ no wandersClientKey in Option A
    };
  }, [fromPath, cardPublicId]);

  // ✅ Register should UPGRADE current (anon) session (updateUser)
  const goRegister = () => navigate("/register", { state: navState });

  // Login is still allowed, but it switches identity (won’t “merge” anon mailbox)
  const goLogin = () => navigate("/login", { state: navState });

  const Card = (
    <div
      className={[
        "relative overflow-hidden rounded-2xl",
        "border border-white/10 bg-black/55 text-white backdrop-blur-xl",
        "shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_36px_rgba(124,58,237,0.12)]",
        "p-4",
        className,
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-violet-500/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-wide text-white/95">{title}</div>
          <div className="mt-1 text-sm leading-relaxed text-white/70">{subtitle}</div>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-200">
            Free
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={goRegister}
          className={[
            "relative sm:flex-1 rounded-xl px-4 py-3 text-sm font-semibold",
            "bg-violet-600 text-white shadow-[0_10px_24px_rgba(124,58,237,0.20)]",
            "transition hover:bg-violet-500 active:scale-[0.99]",
            "focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-0",
          ].join(" ")}
        >
          <span className="absolute -top-2 -right-2 rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
            Beta
          </span>
          Create account
        </button>

        <button
          type="button"
          onClick={goLogin}
          className={[
            "sm:flex-1 rounded-xl px-4 py-3 text-sm font-semibold",
            "border border-white/15 bg-white/5 text-white/90",
            "transition hover:bg-white/10 active:scale-[0.99]",
            "focus:outline-none focus:ring-2 focus:ring-white/25 focus:ring-offset-0",
          ].join(" ")}
        >
          Log in
        </button>
      </div>

      <div className="relative mt-3 text-xs leading-relaxed text-white/45">
        Tip: Create account upgrades your current guest session so you keep everything.
      </div>
    </div>
  );

  if (!useSeasonFrame) return Card;

  return (
    <div className={`${season.wrapper} relative`}>
      {season.fog1 && <div className={season.fog1} />}
      {season.fog2 && <div className={season.fog2} />}
      <div className="relative">{Card}</div>
    </div>
  );
}
