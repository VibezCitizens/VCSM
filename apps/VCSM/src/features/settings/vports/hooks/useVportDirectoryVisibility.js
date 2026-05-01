import { useCallback, useEffect, useState } from "react";
import { ctrlResolveVportIdByActorId } from "@/features/settings/profile/controller/resolveVportIdByActorId.controller";
import {
  ctrlGetVportDirectoryState,
  ctrlSetVportDirectoryVisible,
} from "@/features/settings/vports/controller/vportDirectoryVisibility.controller";

/**
 * Loads and manages directory_visible / directory_status for a vport by actorId.
 * Only the owner can read or update — enforced at the DAL layer.
 */
export function useVportDirectoryVisibility(actorId) {
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
      await ctrlSetVportDirectoryVisible({ vportId, visible });
      setDirectoryVisible(visible);
    } catch (e) {
      setError(e?.message || "Failed to update directory visibility.");
    } finally {
      setIsSaving(false);
    }
  }, [vportId, isSaving]);

  return { directoryVisible, directoryStatus, isLoading, isSaving, error, toggle };
}
