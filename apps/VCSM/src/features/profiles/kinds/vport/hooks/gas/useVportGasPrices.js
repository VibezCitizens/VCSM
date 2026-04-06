// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\hooks\gas\useVportGasPrices.js

import { useCallback, useEffect, useMemo, useState } from "react";

import { getVportGasPricesController } from "@/features/profiles/kinds/vport/controller/gas/getVportGasPrices.controller";

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

  return {
    loading,
    error,

    settings,
    official,
    officialByFuelKey,
    communitySuggestionByFuelKey,

    refresh,
  };
}