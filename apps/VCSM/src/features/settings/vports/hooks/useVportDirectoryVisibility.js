import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import {
  ctrlGetVportDirectoryState,
  ctrlSetVportDirectoryVisible,
} from "@/features/settings/vports/controller/vportDirectoryVisibility.controller";

/**
 * Loads and manages directory_visible / directory_status for a vport.
 *
 * VPD-V-026: ownership is enforced at the controller layer (callerActorId + vportActorId).
 * The DAL retains owner_user_id = auth.uid() as defense-in-depth.
 *
 * VPD-V-FIX-003: vportId is now pre-resolved by the parent (useResolvedVportId)
 * and passed as the second argument. This eliminates the duplicate DB resolution
 * that previously fired alongside useVportBusinessCardSettings on settings screen
 * mount. If vportId is null the hook stays in loading state until it arrives.
 *
 * @param {string} actorId          - The VPORT's actorId (used as ownership target)
 * @param {string|null} vportId     - Pre-resolved profile ID; if null, stays loading
 */
export function useVportDirectoryVisibility(actorId, vportId = null) {
  const { identity } = useIdentity();
  const callerActorId = identity?.actorId ?? null;
  const [directoryVisible, setDirectoryVisible] = useState(null);
  const [directoryStatus, setDirectoryStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!actorId) {
      setIsLoading(false);
      return;
    }
    if (!vportId) {
      // vportId not yet resolved by parent — stay in loading state
      setIsLoading(true);
      return;
    }

    let alive = true;
    setIsLoading(true);

    async function load() {
      try {
        const state = await ctrlGetVportDirectoryState({ vportId });
        if (!alive) return;
        setDirectoryVisible(state?.directory_visible ?? true);
        setDirectoryStatus(state?.directory_status ?? "pending");
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load directory state.");
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, [actorId, vportId]);

  const toggle = useCallback(async (visible) => {
    if (!vportId || isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      // VPD-V-026: pass callerActorId and vportActorId so the controller can
      // verify ownership via actor_owners before delegating to the DAL.
      await ctrlSetVportDirectoryVisible({ vportId, visible, callerActorId, vportActorId: actorId });
      setDirectoryVisible(visible);
    } catch (e) {
      setError(e?.message || "Failed to update directory visibility.");
    } finally {
      setIsSaving(false);
    }
  }, [vportId, isSaving, callerActorId, actorId]);

  return { directoryVisible, directoryStatus, isLoading, isSaving, error, toggle };
}
