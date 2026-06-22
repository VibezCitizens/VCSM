import { useEffect, useState } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { checkVportOwnershipController } from "@/features/vportDashboard/controller/checkVportOwnership.controller";
import { isActiveVportActor } from "@/features/vportDashboard/model/vportAccess.model";

/**
 * IMPORTANT:
 * `isOwner` is a UI convenience state only.
 *
 * All privileged mutations MUST independently verify ownership
 * through controller-layer actor_owners checks.
 *
 * This hook improves UX synchronization only.
 * It is NOT the security boundary.
 *
 * Fast path: when the active actor IS the target VPORT (identity.kind === "vport"
 * and identity.actorId === targetActorId), ownership resolves synchronously without
 * a DB round-trip. switchActiveActor verified the actor link before identity was committed.
 *
 * Citizen-owner path: when a user-kind actor manages a VPORT via actor_owners,
 * the async checkVportOwnershipController path runs as before.
 */
export function useVportOwnership(callerActorId, targetActorId) {
  const { identity } = useIdentity();
  const [isOwner, setIsOwner] = useState(false);
  const [ownershipLoading, setOwnershipLoading] = useState(true);

  useEffect(() => {
    if (!callerActorId || !targetActorId) {
      setIsOwner(false);
      setOwnershipLoading(false);
      return;
    }

    // Fast path: active VPORT actor accessing its own screen.
    // No DB round-trip needed — actor link was DB-verified by switchActor.
    // Revocation is handled by the blocked-VPORT auto-switch in identityContext.
    if (isActiveVportActor(identity, targetActorId)) {
      setIsOwner(true);
      setOwnershipLoading(false);
      return;
    }

    // Citizen-owner path: user-kind actor managing a VPORT via actor_owners.
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
  }, [callerActorId, targetActorId, identity?.kind, identity?.actorId]);

  return { isOwner, ownershipLoading };
}
