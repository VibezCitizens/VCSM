// src/features/post/lib/useSwipeToClose.js
import { useRef, useState, useMemo } from 'react';

/**
 * Swipe-down-to-close for fullscreen media/lightboxes.
 * - Triggers onClose when vertical pull exceeds `threshold` px.
 * - Visual feedback: content translates down; backdrop fades slightly.
 */
export default function useSwipeToClose({
  onClose,
  threshold = 90,   // px needed to close
  maxPull = 180,     // clamp the visual pull distance
} = {}) {
  const startYRef = useRef(0);
  const draggingRef = useRef(false);
  const [dy, setDy] = useState(0);

  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    startYRef.current = t.clientY;
    draggingRef.current = true;
    setDy(0);
  };

  const onTouchMove = (e) => {
    if (!draggingRef.current) return;
    const t = e.touches?.[0];
    if (!t) return;
    const delta = Math.max(0, t.clientY - startYRef.current); // only downward movement counts
    setDy(Math.min(delta, maxPull));
  };

  const onTouchEnd = () => {
    const delta = dy;
    draggingRef.current = false;

    if (delta >= threshold) {
      onClose?.();
      setDy(0);
      return;
    }
    // snap back if not enough pull
    setDy(0);
  };

  // Translate content as user pulls
  const contentStyle = useMemo(() => ({
    transform: `translateY(${dy}px)`,
    transition: draggingRef.current ? 'none' : 'transform 180ms ease',
    touchAction: 'pan-y', // keep vertical panning responsive on mobile
  }), [dy]);

  // Fade backdrop slightly as user pulls
  const backdropStyle = useMemo(() => {
    const opacity = Math.max(0.5, 0.9 - dy / 400);
    return {
      backgroundColor: `rgba(0,0,0,${opacity})`,
      transition: draggingRef.current ? 'none' : 'background-color 180ms ease',
    };
  }, [dy]);

  return {
    bind: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    contentStyle,
    backdropStyle,
  };
}
