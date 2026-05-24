import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import { ctrlResolveVportIdByActorId } from "@/features/settings/profile/controller/resolveVportIdByActorId.controller";
import {
  ctrlGetVportDirectoryState,
  ctrlSetVportDirectoryVisible,
} from "@/features/settings/vports/controller/vportDirectoryVisibility.controller";

/**
 * Loads and manages directory_visible / directory_status for a vport by actorId.
 * VPD-V-026: ownership is now enforced at the controller layer (callerActorId + vportActorId).
 * The DAL retains owner_user_id = auth.uid() as defense-in-depth.
 */
export function useVportDirectoryVisibility(actorId) {
  const { identity } = useIdentity();
  const callerActorId = identity?.actorId ?? null;
  const [vportId, setVportId] = useState(null);
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

    let alive = true;
    setIsLoading(true);

    async function load() {
      try {
        const vid = await ctrlResolveVportIdByActorId(actorId);
        if (!alive) return;
        setVportId(vid);
        if (!vid) { setIsLoading(false); return; }

        const state = await ctrlGetVportDirectoryState({ vportId: vid });
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
  }, [actorId]);

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
  }, [vportId, isSaving]);

  return { directoryVisible, directoryStatus, isLoading, isSaving, error, toggle };
}
