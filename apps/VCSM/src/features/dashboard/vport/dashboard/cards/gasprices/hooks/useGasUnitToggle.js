// src/features/dashboard/vport/hooks/gas/useGasUnitToggle.js
//
// Hook: useGasUnitToggle
//
// Manages the fuel unit toggle lifecycle for the owner gas dashboard:
//   - Derives serverUnit from official prices
//   - Maintains localUnit optimistic state
//   - Tracks unitError for failed saves
//   - Syncs localUnit when server data changes
//   - Calls useUpdateStationFuelUnit to persist changes
//
// Responsibility: hook layer — owns unit UI state lifecycle.
// No JSX / no UI concerns.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUpdateStationFuelUnit } from "@/features/dashboard/vport/dashboard/cards/gasprices/hooks/useUpdateStationFuelUnit";

/**
 * @param {{
 *   official: Array<{ unit?: string }> | null,
 *   viewerActorId: string | null,
 *   actorId: string | null,
 *   onSuccess: () => void,
 * }} params
 * @returns {{
 *   localUnit: string,
 *   unitError: string | null,
 *   savingUnit: boolean,
 *   handleUpdateUnit: (unit: string) => Promise<void>,
 * }}
 */
export function useGasUnitToggle({ official, viewerActorId, actorId, onSuccess }) {
  const serverUnit = useMemo(() => official?.[0]?.unit ?? "liter", [official]);
  const [localUnit, setLocalUnit] = useState(serverUnit);
  const [unitError, setUnitError] = useState(null);

  useEffect(() => {
    setLocalUnit(serverUnit);
  }, [serverUnit]);

  const { saving: savingUnit, updateUnit } = useUpdateStationFuelUnit({
    actorId: viewerActorId,
    targetActorId: actorId,
    onSuccess,
  });

  const handleUpdateUnit = useCallback(
    async (u) => {
      const prev = localUnit;
      setLocalUnit(u);
      setUnitError(null);
      const res = await updateUnit(u);
      if (!res?.ok) {
        setLocalUnit(prev);
        setUnitError(res?.reason ?? "Failed to update unit");
      }
    },
    [localUnit, updateUnit]
  );

  return { localUnit, unitError, savingUnit, handleUpdateUnit };
}
