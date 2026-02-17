// src/features/settings/profile/controller/VportPublicDetails.controller.js

import { useCallback, useEffect, useState } from "react";
import { fetchVportPublicDetails } from "../dal/vportPublicDetails.read.dal";
import { upsertVportPublicDetails } from "../dal/vportPublicDetails.write.dal";
import {
  mapVportPublicDetailsToView,
  mapVportPublicDetailsUpdate,
} from "../model/vportPublicDetails.mapper";

export function useVportPublicDetailsController(vportId) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [details, setDetails] = useState(null);

  // LOAD
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!vportId) {
        setLoading(false);
        setDetails(null);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const row = await fetchVportPublicDetails(vportId);
        if (cancelled) return;

        const view = mapVportPublicDetailsToView(row);

        // Ensure arrays exist (never undefined)
        setDetails({
          ...view,
          highlights: Array.isArray(view?.highlights) ? view.highlights : [],
          languages: Array.isArray(view?.languages) ? view.languages : [],
          paymentMethods: Array.isArray(view?.paymentMethods)
            ? view.paymentMethods
            : [],
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load public details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [vportId]);

  // SAVE
  const saveDetails = useCallback(
    async (uiDraft) => {
      if (!vportId) throw new Error("saveDetails: vportId missing");
      if (!uiDraft) return null;

      try {
        setSaving(true);
        setError("");

        // IMPORTANT: mapper returns json OBJECTS + real arrays
        const payload = mapVportPublicDetailsUpdate(uiDraft);

        // DEBUG (keep until confirmed)
        console.log("[saveDetails] payload arrays", {
          highlights: payload.highlights,
          languages: payload.languages,
          payment_methods: payload.payment_methods,
        });
        console.log("[saveDetails] payload json types", {
          address: typeof payload.address,
          hours: typeof payload.hours,
          social_links: typeof payload.social_links,
        });

        const row = await upsertVportPublicDetails(vportId, payload);

        const view = mapVportPublicDetailsToView(row);
        const normalized = {
          ...view,
          highlights: Array.isArray(view?.highlights) ? view.highlights : [],
          languages: Array.isArray(view?.languages) ? view.languages : [],
          paymentMethods: Array.isArray(view?.paymentMethods)
            ? view.paymentMethods
            : [],
        };

        setDetails(normalized);
        return normalized;
      } catch (e) {
        setError(e?.message || "Failed to save public details.");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [vportId]
  );

  return {
    loading,
    saving,
    error,
    details,
    saveDetails,
  };
}
