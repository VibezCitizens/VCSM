import React, { useEffect, useState } from 'react';

/**
 * StoryProgressBar
 * - Shows N progress bars (count)
 * - Fills the current one over `duration` ms
 * - Fills previous instantly, future are empty
 */
export default function StoryProgressBar({ count, activeIndex, duration = 4000 }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame;
    let start = null;

    // Animate current bar
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const percentage = Math.min((elapsed / duration) * 100, 100);
      setProgress(percentage);

      if (percentage < 100) {
        frame = requestAnimationFrame(animate);
      }
    };

    setProgress(0); // Reset on index change
    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [activeIndex, duration]);

  return (
    <div className="flex w-full gap-1 px-4 absolute top-2 left-0 right-0 z-40">
      {Array.from({ length: count }).map((_, idx) => {
        const isActive = idx === activeIndex;
        const isCompleted = idx < activeIndex;

        return (
          <div
            key={idx}
            className="flex-1 h-1 rounded bg-zinc-700 overflow-hidden"
          >
            <div
              className="h-full bg-purple-500 transition-[width] duration-200 linear"
              style={{
                width: isCompleted ? '100%' : isActive ? `${progress}%` : '0%',
                transition: isCompleted ? 'none' : undefined,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
