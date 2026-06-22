import { useCallback, useEffect, useState } from "react";
import { settingsSaveCoordinator } from "@/features/vportDashboard/dashboard/cards/settings/controller/settingsCoordinator.controller";
import { mapPublicDetailsToDraft } from "@/features/vportDashboard/dashboard/cards/settings/model/vportSettingsDraft.model";
import { useVportProfileOps } from "@/features/profiles/kinds/vport/adapters/vportProfiles.adapter";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";

/**
 * Encapsulates all save-path business logic for the VPORT settings form.
 *
 * VPD-V-FIX-007: Extracted from VportSettingsScreen to enforce screen layer
 * role boundaries. The view screen previously embedded draft state management,
 * address/phone validation, save orchestration, and toast lifecycle — all
 * controller/hook responsibilities — directly inside the component body.
 *
 * Owns:
 *   - draft state initialised from dashboardDetails
 *   - field change handler
 *   - address + phone validation
 *   - save orchestration (setSaving → persistence → setSaved)
 *   - toast lifecycle (validation errors + success message)
 *
 * @param {object} params
 * @param {string}  params.actorId          - The VPORT's actorId
 * @param {boolean} params.isOwner          - Caller is the verified owner
 * @param {boolean} params.loadingData      - Public details still loading
 * @param {object}  params.dashboardDetails - Normalised public details object
 *
 * @returns {{
 *   draft: object|null,
 *   saving: boolean,
 *   saved: boolean,
 *   error: string,
 *   toastOpen: boolean,
 *   toastMessage: string,
 *   onChange: (patch: object) => void,
 *   onSave: () => Promise<void>,
 *   closeToast: () => void,
 * }}
 */
export function useSaveVportSettings({ actorId, isOwner, loadingData, dashboardDetails }) {
  const { invalidateVportPublicDetails } = useVportProfileOps();
  const { identity } = useIdentity();

  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Reinitialise draft whenever the source data changes.
  useEffect(() => {
    setDraft(mapPublicDetailsToDraft(dashboardDetails));
  }, [dashboardDetails]);

  // Show "Saved" toast once a save completes.
  useEffect(() => {
    if (!saved || saving) return;
    setToastMessage("Saved");
    setToastOpen(false);
    setTimeout(() => setToastOpen(true), 0);
  }, [saved, saving]);

  const onChange = useCallback((patch) => {
    setSaved(false);
    setError("");
    setDraft((prev) => ({ ...(prev || {}), ...(patch || {}) }));
  }, []);

  const onSave = useCallback(async () => {
    if (saving || !actorId || !isOwner || loadingData || !draft) return;

    const showToast = (msg) => {
      setError("");
      setToastMessage(msg);
      setToastOpen(false);
      setTimeout(() => setToastOpen(true), 0);
    };

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const outcome = await settingsSaveCoordinator({
        actorId,
        callerActorId: identity?.actorId ?? null,
        draft,
        invalidateVportPublicDetails,
      });

      if (!outcome.ok) {
        showToast(outcome.error || "Failed to save.");
        return;
      }

      if (outcome.result?.cityId !== undefined) {
        setDraft((prev) => ({ ...(prev || {}), cityId: outcome.result.cityId ?? null }));
      }
      setSaved(true);
    } catch (e) {
      setError(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [actorId, draft, identity?.actorId, invalidateVportPublicDetails, isOwner, loadingData]);

  const closeToast = useCallback(() => setToastOpen(false), []);

  return { draft, saving, saved, error, toastOpen, toastMessage, onChange, onSave, closeToast };
}
