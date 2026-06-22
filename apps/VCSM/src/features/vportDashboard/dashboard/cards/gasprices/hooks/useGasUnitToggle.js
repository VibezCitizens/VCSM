// src/features/vportDashboard/dashboard/cards/gasprices/hooks/useGasUnitToggle.js
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
import { useUpdateStationFuelUnit } from "@/features/vportDashboard/dashboard/cards/gasprices/hooks/useUpdateStationFuelUnit";

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
  // TICKET-FUEL-UNIT-002: display-only mapping for the toggle.
  // DB persists 'gal' (TICKET-FUEL-UNIT-001), but GasUnitToggleBar options are
  // keyed 'liter' | 'gallon'. Map 'gal' -> 'gallon' so the toggle highlights the
  // owner's choice. This is a read/display concern ONLY — persistence still
  // normalizes via normalizeFuelUnitForDb, and the /gal price chips are untouched.
  const serverUnit = useMemo(() => {
    const u = official?.[0]?.unit ?? "liter";
    return u === "gal" ? "gallon" : u;
  }, [official]);
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
