import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import "@/features/settings/styles/settings-modern.css";

import Card from "@/features/settings/adapters/ui/Card.adapter";
import VportAboutDetailsView from "@/features/settings/adapters/profile/ui/VportAboutDetails.view.adapter";

import { useIdentity } from "@/state/identity/identityContext";
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
import { useVportPublicDetails } from "@/features/profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter";
import { useProfilesOps } from "@/features/profiles/adapters/profiles.adapter";
import { useSaveVportPublicDetailsByActorId } from "@/features/dashboard/vport/hooks/useSaveVportPublicDetailsByActorId";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { useVportAds } from "@/features/ads/adapters/hooks/useVportAds.adapter";
import { useVportDirectoryVisibility } from "@/features/settings/vports/hooks/useVportDirectoryVisibility";
import { useVportBusinessCardSettings } from "@/features/settings/vports/hooks/useVportBusinessCardSettings";
import { releaseFlags } from "@/shared/config/releaseFlags";
import Toast from "@/shared/components/components/Toast";
import {
  getDashboardViewByVportType,
  normalizeVportType,
} from "@/features/dashboard/vport/screens/model/dashboardViewByVportType.model";
import { normalizeDashboardVportDetails } from "@/features/dashboard/vport/model/dashboardVportDetails.model";
import { mapPublicDetailsToDraft } from "@/features/dashboard/vport/model/vportSettingsDraft.model";
import {
  normalizeAddress,
  hasAnyAddressValue,
  hasCompleteAddress,
  getAddressValidationError,
  normalizePhoneDigits,
  US_PHONE_DIGITS,
} from "./lib/vportSettingsValidation";

import VportBackButton from "./components/VportBackButton";
import VportSettingsAdsPreview from "./components/VportSettingsAdsPreview";
import VportSettingsTrazeCard from "./components/VportSettingsTrazeCard";
import VportSettingsBusinessCard from "./components/VportSettingsBusinessCard";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import { getDashboardCardMetaByKey } from "./model/buildDashboardCards.model";

export default function VportSettingsScreen() {
  const navigate = useNavigate();
  const { actorId } = useParams();
  const { identity, identityLoading } = useIdentity();
  const { loading: loadingData, details: publicDetails } = useVportPublicDetails(actorId);
  const { getVportTabsByType } = useProfilesOps();

  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { saveByActorId } = useSaveVportPublicDetailsByActorId();
  const { ads } = useVportAds(actorId);
  const {
    directoryVisible,
    directoryStatus,
    isLoading: directoryLoading,
    isSaving: directorySaving,
    error: directoryError,
    toggle: toggleDirectoryVisible,
  } = useVportDirectoryVisibility(actorId);

  const dashboardDetails = useMemo(
    () => normalizeDashboardVportDetails(publicDetails),
    [publicDetails]
  );

  const isDesktop = useDesktopBreakpoint();
  const viewerActorId = identity?.actorId ?? null;
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, actorId);

  const vportType = useMemo(
    () => normalizeVportType(identity?.vportType ?? dashboardDetails.vportType ?? null),
    [dashboardDetails.vportType, identity?.vportType]
  );

  const {
    settings: cardSettings,
    isLoading: cardSettingsLoading,
    isSaving: cardSettingsSaving,
    error: cardSettingsError,
    updateSettings: updateCardSettings,
  } = useVportBusinessCardSettings(actorId, vportType);

  const dashboardView = useMemo(
    () => getDashboardViewByVportType(vportType, { getTabsFn: getVportTabsByType }),
    [vportType, getVportTabsByType]
  );
  const dashboardTabs = useMemo(
    () => (dashboardView?.cardKeys ?? []).map((key) => getDashboardCardMetaByKey(key)).filter(Boolean),
    [dashboardView]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    setDraft(mapPublicDetailsToDraft(dashboardDetails));
  }, [dashboardDetails]);

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

  if (!actorId) return null;

  if (identityLoading || ownershipLoading) {
    return <div className="px-4 py-6"><SkeletonCardList count={3} showBody={false} /></div>;
  }

  if (!identity) {
    return <div className="p-10 text-center text-white/50">Sign in required.</div>;
  }

  if (!isOwner) {
    return <div className="p-10 text-center text-white/50">You can only edit settings for your own vport.</div>;
  }

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 1100 });

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={() => navigate(`/actor/${actorId}/dashboard`)} />
            <div style={shell.title}>VPORT SETTINGS</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16 }} className="space-y-4">
            {/* Dashboard Tabs card */}
            <Card>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-zinc-100">Dashboard Tabs</div>
                <div className="text-xs text-zinc-400">
                  View: {dashboardView?.label ?? "Default"} • Type: {vportType}
                </div>
                <div className="flex flex-wrap gap-2">
                  {dashboardTabs.map((tab) => (
                    <span key={tab.key} className="settings-vport-tag px-3 py-1 text-xs">
                      {tab.title}
                    </span>
                  ))}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => navigate(`/actor/${actorId}/dashboard`)}
                    className="settings-btn settings-btn--ghost px-3 py-2 text-xs font-semibold"
                  >
                    Open Dashboard
                  </button>
                </div>
              </div>
            </Card>

            {releaseFlags.vportAdsPipeline && (
              <Card>
                <VportSettingsAdsPreview ads={ads} actorId={actorId} onOpen={(id) => navigate(`/ads/vport/${id}`)} />
              </Card>
            )}

            <VportSettingsTrazeCard
              directoryVisible={directoryVisible}
              directoryStatus={directoryStatus}
              directoryLoading={directoryLoading}
              directorySaving={directorySaving}
              directoryError={directoryError}
              toggleDirectoryVisible={toggleDirectoryVisible}
              draftCityId={draft?.cityId}
              draftAddressCity={draft?.address?.city}
            />

            <VportSettingsBusinessCard
              vportType={vportType}
              cardSettings={cardSettings}
              cardSettingsLoading={cardSettingsLoading}
              cardSettingsSaving={cardSettingsSaving}
              cardSettingsError={cardSettingsError}
              updateCardSettings={updateCardSettings}
            />

            <VportAboutDetailsView
              loading={loadingData}
              saving={saving}
              error={error}
              draft={draft || {}}
              onChange={onChange}
              onSave={onSave}
              saved={saved}
            />
          </div>
        </div>
      </div>
      <Toast open={toastOpen} message={toastMessage} onClose={() => setToastOpen(false)} />
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#000" }}>
        {content}
      </div>,
      document.body
    );
  }

  return content;
}
