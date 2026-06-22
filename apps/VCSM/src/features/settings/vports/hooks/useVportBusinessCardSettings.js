import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import {
  ctrlGetVportBusinessCardSettings,
  ctrlSetVportBusinessCardSettings,
} from "@/features/settings/vports/controller/vportBusinessCardSettings.controller";
import {
  getBusinessCardSettings,
  deepMergeSettings,
} from "@/shared/lib/businessCard/businessCardSettings.model";

/**
 * Loads and manages business_card_settings for a vport.
 *
 * VPD-V-FIX-003: vportId is now pre-resolved by the parent (useResolvedVportId)
 * and passed as the third argument. This eliminates the duplicate DB resolution
 * that previously fired when both this hook and useVportDirectoryVisibility
 * independently resolved the same vportId on settings screen mount.
 *
 * VPD-V-FIX-004: Removed dependency on useWandersBusinessCardOps. Pure model
 * helpers (getBusinessCardSettings, deepMergeSettings) are now imported directly
 * from their source: shared/lib/businessCard/businessCardSettings.model.
 *
 * VPD-V-FIX-001: callerActorId is read from identity and forwarded to the
 * controller so ctrlSetVportBusinessCardSettings can enforce actor_owners parity.
 *
 * @param {string} actorId     - The VPORT's actorId (used as ownership target)
 * @param {string} cardType    - The vportType string for settings defaults
 * @param {string|null} vportId - Pre-resolved profile ID; if null, stays loading
 */
export function useVportBusinessCardSettings(actorId, cardType, vportId = null) {
  const { identity } = useIdentity();
  const [rawSettings, setRawSettings] = useState({});
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
        const row = await ctrlGetVportBusinessCardSettings({ vportId, callerActorId: identity?.actorId ?? null, vportActorId: actorId });
        if (!alive) return;
        const raw = row?.business_card_settings;
        setRawSettings(raw && typeof raw === "object" ? raw : {});
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load card settings.");
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, [actorId, vportId]);

  // Effective settings: global defaults → type defaults → saved overrides
  const settings = getBusinessCardSettings(cardType, rawSettings);

  const updateSettings = useCallback(async (patch) => {
    if (!vportId || isSaving) return;
    const callerActorId = identity?.actorId ?? null;
    setIsSaving(true);
    setError("");
    try {
      const nextRaw = deepMergeSettings(rawSettings, patch);
      await ctrlSetVportBusinessCardSettings({
        vportId,
        settings: nextRaw,
        callerActorId,
        vportActorId: actorId,
      });
      setRawSettings(nextRaw);
    } catch (e) {
      setError(e?.message || "Failed to save card settings.");
    } finally {
      setIsSaving(false);
    }
  }, [vportId, isSaving, rawSettings, identity, actorId]);

  return { settings, rawSettings, isLoading, isSaving, error, updateSettings };
}
