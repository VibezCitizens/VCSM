import { useCallback, useEffect, useState } from "react";
import { ctrlResolveVportIdByActorId } from "@/features/settings/profile/controller/resolveVportIdByActorId.controller";
import {
  ctrlGetVportBusinessCardSettings,
  ctrlSetVportBusinessCardSettings,
} from "@/features/settings/vports/controller/vportBusinessCardSettings.controller";
import { useWandersBusinessCardOps } from "@/features/wanders/core/adapters/wanders.adapter";

export function useVportBusinessCardSettings(actorId, cardType) {
  const { getBusinessCardSettings, deepMergeSettings } = useWandersBusinessCardOps()
  const [vportId, setVportId] = useState(null);
  const [rawSettings, setRawSettings] = useState({});
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

        const row = await ctrlGetVportBusinessCardSettings({ vportId: vid });
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
  }, [actorId]);

  // Effective settings: global defaults → type defaults → saved overrides
  const settings = getBusinessCardSettings(cardType, rawSettings);

  const updateSettings = useCallback(async (patch) => {
    if (!vportId || isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      const nextRaw = deepMergeSettings(rawSettings, patch);
      await ctrlSetVportBusinessCardSettings({ vportId, settings: nextRaw });
      setRawSettings(nextRaw);
    } catch (e) {
      setError(e?.message || "Failed to save card settings.");
    } finally {
      setIsSaving(false);
    }
  }, [vportId, isSaving, rawSettings]);

  return { settings, rawSettings, isLoading, isSaving, error, updateSettings };
}
