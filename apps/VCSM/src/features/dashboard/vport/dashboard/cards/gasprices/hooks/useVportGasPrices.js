import { useCallback, useEffect, useMemo, useState } from "react";

import { getVportGasPricesController } from "@/features/dashboard/vport/dashboard/cards/gasprices/controller/getVportGasPrices.controller";

/**
 * Hook — useVportGasPrices
 *
 * Read-only hook for loading official prices
 * + latest community suggestions.
 *
 * No mutations.
 * No DAL imports.
 */
export function useVportGasPrices({ actorId, fuelKey = null }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [settings, setSettings] = useState(null);
  const [official, setOfficial] = useState([]);
  const [communitySuggestionByFuelKey, setCommunitySuggestionByFuelKey] =
    useState({});
  const [pendingSubmissions, setPendingSubmissions] = useState([]);

  const refresh = useCallback(async () => {
    if (!actorId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await getVportGasPricesController({
        actorId,
        fuelKey,
      });

      setSettings(res.settings);
      setOfficial(res.official);
      setCommunitySuggestionByFuelKey(res.communitySuggestionByFuelKey);
      setPendingSubmissions(res.pendingSubmissions ?? []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [actorId, fuelKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const officialByFuelKey = useMemo(() => {
    const map = {};
    for (const row of official) {
      if (row?.fuelKey) {
        map[row.fuelKey] = row;
      }
    }
    return map;
  }, [official]);

  // Immediately replace a single official row by fuelKey in local state.
  // Used after a successful owner write so the UI reflects the new price
  // before the background refresh completes.
  const patchOfficialRow = useCallback((updatedRow) => {
    if (!updatedRow?.fuelKey) return;
    setOfficial((prev) => {
      const exists = prev.some((r) => r.fuelKey === updatedRow.fuelKey);
      if (exists) {
        return prev.map((r) =>
          r.fuelKey === updatedRow.fuelKey ? updatedRow : r
        );
      }
      return [...prev, updatedRow];
    });
  }, []);

  // Immediately patch a single community suggestion entry.
  // Used after a citizen submit so the "last update" column reflects the
  // new submission before the background refresh completes.
  const patchCommunityRow = useCallback((fuelKey, submission) => {
    if (!fuelKey) return;
    setCommunitySuggestionByFuelKey((prev) => ({
      ...prev,
      [fuelKey]: submission,
    }));
  }, []);

  return {
    loading,
    error,

    settings,
    official,
    officialByFuelKey,
    communitySuggestionByFuelKey,
    pendingSubmissions,

    refresh,
    patchOfficialRow,
    patchCommunityRow,
  };
}