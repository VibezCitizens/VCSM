import { useCallback, useEffect, useRef, useState } from "react";
import { DAY_ABBR, MONTH_ABBR } from "@/features/profiles/kinds/vport/screens/booking/view/bookingFlowHelpers";

export function StepDateSelect({ dateStrip, selectedDateKey, onSelect }) {
  const hasAnySlots = dateStrip.some((d) => d.hasSlots);
  const scrollRef = useRef(null);
  const dragRef = useRef({ active: false, x: 0, scrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 20);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    updateEdges();
    return () => el.removeEventListener("scroll", updateEdges);
  }, [updateEdges]);

  // On initial load, jump to first available date so disabled leading dates don't show
  useEffect(() => {
    if (!scrollRef.current || !dateStrip.length || selectedDateKey) return;
    const firstIdx = dateStrip.findIndex((d) => d.hasSlots);
    if (firstIdx <= 0) return;
    const el = scrollRef.current;
    const card = el.children[firstIdx];
    if (!card) return;
    el.scrollTo({ left: Math.max(0, card.offsetLeft - 8) });
  }, [dateStrip]);

  useEffect(() => {
    if (!selectedDateKey || !scrollRef.current) return;
    const idx = dateStrip.findIndex((d) => d.key === selectedDateKey);
    if (idx < 0) return;
    const el = scrollRef.current;
    const card = el.children[idx];
    if (!card) return;
    const scrollTo = card.offsetLeft - el.clientWidth / 2 + card.offsetWidth / 2;
    el.scrollTo({ left: Math.max(0, scrollTo), behavior: "smooth" });
  }, [selectedDateKey, dateStrip]);

  const handleMouseDown = (e) => {
    dragRef.current = { active: true, x: e.clientX, scrollLeft: scrollRef.current.scrollLeft };
    setIsDragging(true);
  };
  const handleMouseMove = (e) => {
    if (!dragRef.current.active) return;
    e.preventDefault();
    scrollRef.current.scrollLeft = dragRef.current.scrollLeft - (e.clientX - dragRef.current.x);
  };
  const handleMouseUp = () => {
    dragRef.current.active = false;
    setIsDragging(false);
  };

  const arrowScroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  const todayEntry = dateStrip[0];

  if (!hasAnySlots) {
    return (
      <div className="mt-2 rounded-xl border px-4 py-5 space-y-1"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
          No available times
        </div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          This shop has not set their hours yet. Check back soon.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-base font-bold text-white">Pick a date</div>
          <div className="text-xs text-white/40 mt-0.5">Available dates · Swipe to explore</div>
        </div>
        {todayEntry?.hasSlots && (
          <button
            type="button"
            onClick={() => onSelect(todayEntry.key)}
            className="shrink-0 text-[11px] font-semibold text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1.5 transition-all"
          >
            Today
          </button>
        )}
      </div>

      <div className="relative">
        {showLeft && (
          <div
            className="absolute left-0 top-0 bottom-2 w-12 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, rgba(4,4,8,0.9), transparent)" }}
          />
        )}
        {showRight && (
          <div
            className="absolute right-0 top-0 bottom-2 w-12 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, rgba(4,4,8,0.9), transparent)" }}
          />
        )}
        {showLeft && (
          <button
            type="button"
            onClick={() => arrowScroll(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white/80 text-lg font-light transition-all hidden sm:flex"
          >
            ‹
          </button>
        )}
        {showRight && (
          <button
            type="button"
            onClick={() => arrowScroll(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white/80 text-lg font-light transition-all hidden sm:flex"
          >
            ›
          </button>
        )}

        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex gap-2 overflow-x-auto px-1 pb-2 select-none"
          style={{
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          {dateStrip.map(({ key, date, hasSlots }, i) => {
            const isSelected = key === selectedDateKey;
            const isToday = i === 0;
            return (
              <button
                key={key}
                type="button"
                disabled={!hasSlots}
                onClick={() => hasSlots && onSelect(key)}
                className={[
                  "relative shrink-0 w-[68px] rounded-2xl border flex flex-col items-center justify-center gap-0.5",
                  isSelected
                    ? "border-white/30 bg-white/[0.10]"
                    : hasSlots
                    ? "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
                    : "border-white/5 bg-white/[0.01] opacity-20 cursor-not-allowed",
                ].join(" ")}
                style={{
                  scrollSnapAlign: "start",
                  minHeight: "88px",
                  paddingTop: isToday ? "26px" : "16px",
                  paddingBottom: "16px",
                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                  transition: "transform 0.17s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                  boxShadow: isSelected
                    ? "0 0 0 1px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.35), 0 0 20px rgba(255,255,255,0.04)"
                    : undefined,
                }}
              >
                {isToday && (
                  <span
                    className="absolute top-2 left-0 right-0 text-center font-bold uppercase tracking-widest"
                    style={{ fontSize: "7px", color: isSelected ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.32)" }}
                  >
                    Today
                  </span>
                )}
                <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1, color: isSelected ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.35)" }}>
                  {DAY_ABBR[date.getDay()]}
                </span>
                <span style={{ fontSize: "26px", fontWeight: 700, lineHeight: 1, marginTop: "3px", marginBottom: "2px", color: isSelected ? "rgba(255,255,255,1)" : hasSlots ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)" }}>
                  {date.getDate()}
                </span>
                <span style={{ fontSize: "10px", lineHeight: 1, color: isSelected ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.2)" }}>
                  {MONTH_ABBR[date.getMonth()]}
                </span>
                <div
                  className="rounded-full"
                  style={{
                    width: "5px",
                    height: "5px",
                    marginTop: "7px",
                    background: !hasSlots ? "rgba(255,255,255,0.1)" : isSelected ? "rgba(110,231,183,0.95)" : "rgba(110,231,183,0.5)",
                    boxShadow: hasSlots && isSelected ? "0 0 8px rgba(110,231,183,0.7)" : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
