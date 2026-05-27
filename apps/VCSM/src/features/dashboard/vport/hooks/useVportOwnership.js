import { useEffect, useState } from "react";
import { checkVportOwnershipController } from "@/features/dashboard/vport/controller/checkVportOwnership.controller";

/**
 * IMPORTANT:
 * `isOwner` is a UI convenience state only.
 *
 * All privileged mutations MUST independently verify ownership
 * through controller-layer actor_owners checks.
 *
 * This hook improves UX synchronization only.
 * It is NOT the security boundary.
 */
export function useVportOwnership(callerActorId, targetActorId) {
  const [isOwner, setIsOwner] = useState(false);
  const [ownershipLoading, setOwnershipLoading] = useState(true);

  useEffect(() => {
    if (!callerActorId || !targetActorId) {
      setIsOwner(false);
      setOwnershipLoading(false);
      return;
    }

    let cancelled = false;

    async function check(initial = false) {
      if (cancelled) return;
      if (initial) setOwnershipLoading(true);
      try {
        const owned = await checkVportOwnershipController({ callerActorId, targetActorId });
        if (!cancelled) setIsOwner(owned);
      } catch {
        if (!cancelled) setIsOwner(false); // fail closed on any error
      } finally {
        if (initial && !cancelled) setOwnershipLoading(false);
      }
    }

    check(true);

    // Silent re-verify when user returns to the window or this tab.
    // Does not show loading state — ownership is already resolved; this is
    // a background refresh to catch revocation without requiring remount.
    function onFocus() { check(false); }
    function onVisibility() {
      if (document.visibilityState === "visible") check(false);
    }

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [callerActorId, targetActorId]);

  return { isOwner, ownershipLoading };
}
