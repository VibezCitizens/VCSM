// src/features/profiles/kinds/vport/ui/tabs/VportProfileTabs.jsx

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

export default function VportProfileTabs({ tab, setTab, tabs }) {
  const list = useMemo(() => (Array.isArray(tabs) ? tabs : []), [tabs]);
  const scrollRef = useRef(null);

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeft(scrollLeft > 5);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateEdges();

    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);

    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  // ✅ Arrow scroll: use remaining distance so you don't need multiple clicks to reach the end
  const scrollByAmount = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    // more aggressive jump
    const baseAmount = Math.max(320, Math.floor(clientWidth * 0.9));

    const maxLeft = scrollWidth - clientWidth;
    const remainingRight = Math.max(0, maxLeft - scrollLeft);
    const remainingLeft = Math.max(0, scrollLeft);

    const amount =
      dir > 0 ? Math.min(baseAmount, remainingRight) : Math.min(baseAmount, remainingLeft);

    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  // ✅ Always bring active tab into view (fixes “need 3 clicks to reach last tab”)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!tab) return;

    const btn = el.querySelector(`[data-tab-key="${tab}"]`);
    if (!btn) return;

    // center the active tab so the user always sees where they landed
    btn.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [tab, list]);

  // ✅ keeps tab labels from sitting underneath the overlay buttons
  const leftPad = showLeft ? 52 : 8;
  const rightPad = showRight ? 52 : 8;

  return (
    <div className="mt-4 px-4 relative z-30">
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative">
          {/* LEFT CLICKABLE OVERLAY */}
          {showLeft && (
            <button
              type="button"
              onClick={() => scrollByAmount(-1)}
              aria-label="Scroll tabs left"
              className="
                absolute left-0 top-0 bottom-0 z-40
                w-12
                bg-gradient-to-r from-black to-transparent
                flex items-center justify-start pl-2
                cursor-pointer
                touch-manipulation
              "
            >
              <span className="text-white/45 text-xl select-none">‹</span>
            </button>
          )}

          {/* RIGHT CLICKABLE OVERLAY */}
          {showRight && (
            <button
              type="button"
              onClick={() => scrollByAmount(1)}
              aria-label="Scroll tabs right"
              className="
                absolute right-0 top-0 bottom-0 z-40
                w-12
                bg-gradient-to-l from-black to-transparent
                flex items-center justify-end pr-2
                cursor-pointer
                touch-manipulation
              "
            >
              <span className="text-white/45 text-xl select-none">›</span>
            </button>
          )}

          {/* TAB ROW */}
          <div
            ref={scrollRef}
            className="
              flex items-center gap-10
              border-b border-white/15
              overflow-x-auto
              flex-nowrap
              whitespace-nowrap
              snap-x snap-mandatory
              scroll-smooth
              [-webkit-overflow-scrolling:touch]
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden

              select-none
              [touch-action:pan-x]
              [overscroll-behavior-x:contain]
              [overscroll-behavior-y:none]
            "
            style={{
              paddingLeft: leftPad,
              paddingRight: rightPad,
              scrollPaddingLeft: leftPad,
              scrollPaddingRight: rightPad,
            }}
          >
            {list.map((t) => {
              const active = tab === t.key;

              return (
                <button
                  key={t.key}
                  data-tab-key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`
                    relative py-3
                    text-[18px] tracking-wide transition-colors
                    snap-center
                    ${
                      active
                        ? "text-white font-semibold"
                        : "text-neutral-400 hover:text-neutral-200"
                    }
                  `}
                  aria-current={active ? "page" : undefined}
                >
                  {t.label}

                  {active && (
                    <span
                      className="
                        absolute left-0 right-0 -bottom-[1px]
                        h-[2px] bg-white/90 rounded-full
                      "
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}