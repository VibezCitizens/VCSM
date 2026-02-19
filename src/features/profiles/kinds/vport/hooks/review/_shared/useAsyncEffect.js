// src/features/profiles/kinds/vport/hooks/review/_shared/useAsyncEffect.js
import { useEffect } from "react";

export function useAsyncEffect(effect, deps) {
  useEffect(() => {
    let alive = true;
    const aliveFn = () => alive;

    (async () => {
      try {
        await effect(aliveFn);
      } catch {
        // swallow
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
