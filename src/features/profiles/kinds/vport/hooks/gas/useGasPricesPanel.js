// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\hooks\gas\useGasPricesPanel.js

import { useCallback, useEffect, useMemo, useState } from "react";

import { getVportGasPricesController } from "@/features/profiles/kinds/vport/controller/gas/getVportGasPrices.controller";
import { submitFuelPriceSuggestionController } from "@/features/profiles/kinds/vport/controller/gas/submitFuelPriceSuggestion.controller";
import { reviewFuelPriceSuggestionController } from "@/features/profiles/kinds/vport/controller/gas/reviewFuelPriceSuggestion.controller";

/**
 * Hook — Gas Prices Panel
 *
 * Owns UI timing + UI state.
 * Treats controller results as authoritative.
 *
 * No DAL imports.
 */
export function useGasPricesPanel({ actorId, fuelKey = null, identity }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);

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
      const res = await getVportGasPricesController({ actorId, fuelKey });

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
    const m = {};
    for (const row of official) {
      if (row?.fuelKey) m[row.fuelKey] = row;
    }
    return m;
  }, [official]);

  const submitSuggestion = useCallback(
    async ({ fuelKey: fk, proposedPrice, currencyCode, unit, evidence }) => {
      if (!identity?.actorId) {
        return { ok: false, reason: "no_identity" };
      }

      setSubmitting(true);
      setError(null);

      try {
        const res = await submitFuelPriceSuggestionController({
          targetActorId: actorId,
          fuelKey: fk,
          proposedPrice,
          actorId: identity.actorId,
          currencyCode,
          unit,
          evidence,
        });

        if (res?.ok) {
          await refresh();
        }

        return res;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setSubmitting(false);
      }
    },
    [actorId, identity, refresh]
  );

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
    submitting,
    reviewing,
    error,

    settings,
    official,
    officialByFuelKey,
    communitySuggestionByFuelKey,

    refresh,
    submitSuggestion,
    reviewSuggestion,
  };
}