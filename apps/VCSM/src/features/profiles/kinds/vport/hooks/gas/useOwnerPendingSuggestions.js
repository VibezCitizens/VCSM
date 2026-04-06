// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\hooks\gas\useOwnerPendingSuggestions.js

import { useCallback, useEffect, useMemo, useState } from "react";

import { getVportGasPricesController } from "@/features/profiles/kinds/vport/controller/gas/getVportGasPrices.controller";
import { reviewFuelPriceSuggestionController } from "@/features/profiles/kinds/vport/controller/gas/reviewFuelPriceSuggestion.controller";

export function useOwnerPendingSuggestions({ actorId, identity, fuelKey = null }) {
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState(null);

  const [settings, setSettings] = useState(null);
  const [official, setOfficial] = useState([]);
  const [communitySuggestionByFuelKey, setCommunitySuggestionByFuelKey] =
    useState({});

  const [officialByFuelKey, setOfficialByFuelKey] = useState({});

  // ✅ pending submissions list
  const [pendingSubmissions, setPendingSubmissions] = useState([]);

  const refresh = useCallback(async () => {
    if (!actorId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await getVportGasPricesController({ actorId, fuelKey });

      setSettings(res.settings ?? null);
      setOfficial(res.official ?? []);
      setCommunitySuggestionByFuelKey(res.communitySuggestionByFuelKey ?? {});
      setOfficialByFuelKey(res.officialByFuelKey ?? {});

      // ✅ expected field name from controller:
      // keep this tolerant because we haven't seen your controller file yet
      const pending =
        res.pendingSubmissions ??
        res.pending ??
        res.pendingSuggestions ??
        res.submissionsPending ??
        [];

      setPendingSubmissions(Array.isArray(pending) ? pending : []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [actorId, fuelKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const derivedOfficialByFuelKey = useMemo(() => {
    if (officialByFuelKey && Object.keys(officialByFuelKey).length) return officialByFuelKey;

    const m = {};
    for (const row of Array.isArray(official) ? official : []) {
      if (row?.fuelKey) m[row.fuelKey] = row;
    }
    return m;
  }, [official, officialByFuelKey]);

  const reviewSuggestion = useCallback(
    async ({ submissionId, decision, reason, applyToOfficialOnApprove }) => {
      if (!identity?.actorId) {
        return { ok: false, reason: "no_identity" };
      }

      setReviewing(true);
      setError(null);

      try {
        const res = await reviewFuelPriceSuggestionController({
          submissionId,
          decision,
          decidedByActorId: identity.actorId,
          reason,
          applyToOfficialOnApprove,
        });

        if (res?.ok) {
          await refresh();
        }

        return res;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setReviewing(false);
      }
    },
    [identity, refresh]
  );

  return {
    loading,
    reviewing,
    error,

    settings,
    official,
    officialByFuelKey: derivedOfficialByFuelKey,
    communitySuggestionByFuelKey,

    // ✅ owner list
    pendingSubmissions,

    refresh,
    reviewSuggestion,
  };
}