// src/features/wanders/core/hooks/useIsWide.hook.js
// ============================================================================
// GENERIC HOOK — IS WIDE
// UI timing only. Pure React state. No domain logic.
// ============================================================================

import { useEffect, useState } from "react";

/**
 * @param {{ breakpoint?: number }} params
 */
export default function useIsWide({ breakpoint = 980 } = {}) {
  const [isWide, setIsWide] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => setIsWide(window.innerWidth >= breakpoint);
    onResize();

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isWide;
}
