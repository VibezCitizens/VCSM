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

  const scrollByAmount = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const baseAmount = Math.max(320, Math.floor(clientWidth * 0.9));

    const maxLeft = scrollWidth - clientWidth;
    const remainingRight = Math.max(0, maxLeft - scrollLeft);
    const remainingLeft = Math.max(0, scrollLeft);

    const amount =
      dir > 0 ? Math.min(baseAmount, remainingRight) : Math.min(baseAmount, remainingLeft);

    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !tab) return;

    const btn = el.querySelector(`[data-tab-key="${tab}"]`);
    if (!btn) return;

    btn.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [tab, list]);

  const leftPad = showLeft ? 52 : 8;
  const rightPad = showRight ? 52 : 8;

  return (
    <div className="mt-4 px-4 relative z-30">
      <div className="profiles-shell w-full">
        <div className="relative">
          {showLeft && (
            <button
              type="button"
              onClick={() => scrollByAmount(-1)}
              aria-label="Scroll tabs left"
              className="
                absolute left-0 top-0 bottom-0 z-40
                w-12
                bg-gradient-to-r from-[#060b14] to-transparent
                flex items-center justify-start pl-2
                cursor-pointer
                touch-manipulation
              "
            >
              <span className="text-white/60 text-xl select-none">&lsaquo;</span>
            </button>
          )}

          {showRight && (
            <button
              type="button"
              onClick={() => scrollByAmount(1)}
              aria-label="Scroll tabs right"
              className="
                absolute right-0 top-0 bottom-0 z-40
                w-12
                bg-gradient-to-l from-[#060b14] to-transparent
                flex items-center justify-end pr-2
                cursor-pointer
                touch-manipulation
              "
            >
              <span className="text-white/60 text-xl select-none">&rsaquo;</span>
            </button>
          )}

          <div
            ref={scrollRef}
            className="
              profiles-tabbar
              flex items-center gap-10
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
                    profiles-tab-btn
                    relative py-3
                    text-[18px] tracking-wide transition-colors
                    snap-center
                    ${active ? "is-active" : ""}
                  `}
                  aria-current={active ? "page" : undefined}
                >
                  {t.label}

                  {active && (
                    <span
                      className="
                        profiles-tab-indicator
                        absolute left-0 right-0 -bottom-[1px]
                        h-[2px] rounded-full
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
