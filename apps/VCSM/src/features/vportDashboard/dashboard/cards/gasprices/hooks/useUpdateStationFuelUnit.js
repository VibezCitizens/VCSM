import { useCallback, useState } from "react";
import { updateStationFuelUnitController } from "@/features/vportDashboard/dashboard/cards/gasprices/controller/updateStationFuelUnit.controller";

export function useUpdateStationFuelUnit({ actorId, targetActorId, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const updateUnit = useCallback(
    async (unit) => {
      if (saving) return;
      setSaving(true);
      setError(null);
      try {
        const res = await updateStationFuelUnitController({ actorId, targetActorId, unit });
        if (!res.ok) { setError(res.reason); return res; }
        onSuccess?.();
        return res;
      } catch (err) {
        setError(err?.message ?? "Failed to update unit");
        return { ok: false, reason: err?.message };
      } finally {
        setSaving(false);
      }
    },
    [actorId, targetActorId, saving, onSuccess]
  );

  return { saving, error, updateUnit };
}
