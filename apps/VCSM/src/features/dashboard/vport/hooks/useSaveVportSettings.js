import { useCallback, useEffect, useState } from "react";
import { useSaveVportPublicDetailsByActorId } from "@/features/dashboard/vport/hooks/useSaveVportPublicDetailsByActorId";
import { mapPublicDetailsToDraft } from "@/features/dashboard/vport/model/vportSettingsDraft.model";
import {
  normalizeAddress,
  hasAnyAddressValue,
  hasCompleteAddress,
  getAddressValidationError,
  normalizePhoneDigits,
  US_PHONE_DIGITS,
} from "@/features/dashboard/vport/model/vportSettingsValidation.model";

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
  const { saveByActorId } = useSaveVportPublicDetailsByActorId();

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
    if (!actorId || !isOwner || loadingData || !draft) return;

    const normalizedAddress = normalizeAddress(draft?.address);
    const addressStarted = hasAnyAddressValue(normalizedAddress);
    const addressComplete = hasCompleteAddress(normalizedAddress);
    const phoneDigits = normalizePhoneDigits(draft?.phonePublic);

    const showToast = (msg) => {
      setError("");
      setToastMessage(msg);
      setToastOpen(false);
      setTimeout(() => setToastOpen(true), 0);
    };

    if (addressStarted && !addressComplete) {
      showToast("Please enter full address.");
      return;
    }
    if (addressStarted) {
      const addressError = getAddressValidationError(normalizedAddress);
      if (addressError) { showToast(addressError); return; }
    }
    if (phoneDigits && phoneDigits.length !== US_PHONE_DIGITS) {
      showToast("Enter a valid 10-digit phone number.");
      return;
    }

    const payload = {
      ...draft,
      address: addressStarted ? normalizedAddress : {},
      phonePublic: phoneDigits,
    };

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const result = await saveByActorId(actorId, payload);
      if (result?.cityId !== undefined) {
        setDraft((prev) => ({ ...(prev || {}), cityId: result.cityId ?? null }));
      }
      setSaved(true);
    } catch (e) {
      setError(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [actorId, draft, isOwner, loadingData, saveByActorId]);

  const closeToast = useCallback(() => setToastOpen(false), []);

  return { draft, saving, saved, error, toastOpen, toastMessage, onChange, onSave, closeToast };
}
