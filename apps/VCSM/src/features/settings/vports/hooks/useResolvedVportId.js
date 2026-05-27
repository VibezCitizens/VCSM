import { useEffect, useState } from "react";
import { ctrlResolveVportIdByActorId } from "@/features/settings/profile/controller/resolveVportIdByActorId.controller";

/**
 * Resolves a vportId from an actorId exactly once per actorId change.
 *
 * VPD-V-FIX-003: Centralises vportId resolution so multiple hooks mounted
 * on the same screen share a single DB read rather than each firing their own.
 * Parent passes resolvedVportId to child hooks via props.
 *
 * Returns:
 *   vportId  — resolved profile ID (null if not found or actorId missing)
 *   isLoading — true while the resolution is in flight
 *   error     — error message string if resolution failed
 */
export function useResolvedVportId(actorId) {
  const [vportId, setVportId] = useState(null);
  const [isLoading, setIsLoading] = useState(!!actorId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!actorId) {
      setVportId(null);
      setIsLoading(false);
      return;
    }

    let alive = true;
    setIsLoading(true);
    setError("");

    ctrlResolveVportIdByActorId(actorId)
      .then((vid) => {
        if (!alive) return;
        setVportId(vid ?? null);
        setIsLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || "Failed to resolve vport.");
        setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [actorId]);

  return { vportId, isLoading, error };
}
