import { useEffect, useState } from "react";

/**
 * Shared platform hook — responds to a CSS media query and returns true when
 * the viewport matches.
 *
 * This is the canonical source. The three prior feature-local copies
 * (features/public/vportMenu, features/dashboard/vport/screens, features/ads)
 * are now thin re-exports of this file. Do not edit those copies — edit here.
 *
 * @param {string} query  — CSS media query string (default: min-width 821px)
 * @returns {boolean}
 */
const DESKTOP_QUERY = "(min-width: 821px)";

export default function useDesktopBreakpoint(query = DESKTOP_QUERY) {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const onChange = () => setIsDesktop(mq.matches);

    onChange();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [query]);

  return isDesktop;
}
