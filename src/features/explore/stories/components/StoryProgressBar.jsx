import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function StoryProgressBar({
  count,
  activeIndex,
  duration = 15000,   // default per-segment duration (ms)
  durations,          // optional: array or (idx)=>ms
  paused = false,     // optional: pause/resume
  onComplete,         // optional: called when active segment reaches 100%
}) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const prevIndexRef = useRef(activeIndex);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Resolve duration for current segment
  const resolvedDuration = useMemo(() => {
    if (Array.isArray(durations)) return durations[activeIndex] ?? duration;
    if (typeof durations === 'function') return durations(activeIndex) ?? duration;
    return duration;
  }, [durations, activeIndex, duration]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(!!mql.matches);
    update();
    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (count <= 0 || activeIndex < 0 || activeIndex >= count) {
      setProgress(0);
      return;
    }

    // Reset progress on segment change
    if (prevIndexRef.current !== activeIndex) {
      setProgress(0);
      prevIndexRef.current = activeIndex;
      startRef.current = null;
    }

    // Reduced motion: snap to 100 and notify
    if (reducedMotion) {
      setProgress(100);
      onComplete?.(activeIndex);
      return;
    }

    // Paused: stop animating but keep progress
    if (paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const animate = (ts) => {
      if (startRef.current == null) {
        const elapsedAlready = (progress / 100) * resolvedDuration;
        startRef.current = ts - elapsedAlready;
      }
      const elapsed = ts - startRef.current;
      const pct = Math.max(0, Math.min((elapsed / resolvedDuration) * 100, 100));
      setProgress(pct);

      if (pct >= 100) {
        startRef.current = null;
        rafRef.current = null;
        onComplete?.(activeIndex);
        return;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [count, activeIndex, resolvedDuration, paused, reducedMotion, onComplete, progress]);

  if (!count || activeIndex < 0 || activeIndex >= count) return null;

  return (
    <div className="flex w-full gap-1 px-4 absolute top-2 left-0 right-0 z-40">
      {Array.from({ length: count }).map((_, idx) => {
        const isActive = idx === activeIndex;
        const isCompleted = idx < activeIndex;
        const width = isCompleted ? '100%' : isActive ? `${progress}%` : '0%';
        const ariaNow = isCompleted ? 100 : isActive ? Math.round(progress) : 0;

        return (
          <div
            key={idx}
            className="flex-1 h-1 rounded bg-zinc-700 overflow-hidden"
            role={isActive ? 'progressbar' : undefined}
            aria-valuemin={isActive ? 0 : undefined}
            aria-valuemax={isActive ? 100 : undefined}
            aria-valuenow={isActive ? ariaNow : undefined}
          >
            <div
              className="h-full bg-purple-500 transition-[width] duration-200 ease-linear"
              style={{ width }}
            />
          </div>
        );
      })}
    </div>
  );
}
