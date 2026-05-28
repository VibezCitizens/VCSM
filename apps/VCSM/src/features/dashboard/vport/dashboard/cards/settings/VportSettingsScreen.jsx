import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "@/features/settings/styles/settings-modern.css";

import Card from "@/features/settings/adapters/ui/Card.adapter";
import VportAboutDetailsView from "@/features/settings/adapters/profile/ui/VportAboutDetails.view.adapter";

import { useVportDashboardDetails } from "@/features/profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter";
import { useProfilesOps } from "@/features/profiles/adapters/profiles.adapter";
import { useSaveVportSettings } from "@/features/dashboard/vport/dashboard/cards/settings/hooks/useSaveVportSettings";
import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import { useVportAds } from "@/features/ads/adapters/hooks/useVportAds.adapter";
import { useVportDirectoryVisibility } from "@/features/settings/vports/hooks/useVportDirectoryVisibility";
import { useVportBusinessCardSettings } from "@/features/settings/vports/hooks/useVportBusinessCardSettings";
import { useResolvedVportId } from "@/features/settings/vports/hooks/useResolvedVportId";
import { releaseFlags } from "@/shared/config/releaseFlags";
import Toast from "@/shared/components/components/Toast";
import {
  getDashboardViewByVportType,
  normalizeVportType,
} from "@/features/dashboard/vport/model/dashboardViewByVportType.model";
import { normalizeDashboardVportDetails } from "@/features/dashboard/vport/model/dashboardVportDetails.model";

import VportBackButton from "@/features/dashboard/shared/components/BackButton";
import VportSettingsAdsPreview from "./components/VportSettingsAdsPreview";
import VportSettingsTrazeCard from "./components/VportSettingsTrazeCard";
import VportSettingsBusinessCard from "./components/VportSettingsBusinessCard";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import { getDashboardCardMetaByKey } from "@/features/dashboard/vport/model/buildDashboardCards.model";

/**
 * VPD-V-FIX-008: View Screen — hook wiring + component composition only.
 *
 * Receives actorId and isOwner from VportSettingsFinalScreen (Final Screen).
 * All identity gating is handled upstream — this screen assumes a verified owner.
 */
export default function VportSettingsScreen({ actorId, isOwner }) {
  const navigate = useNavigate();
  const { loading: loadingData, details: publicDetails } = useVportDashboardDetails(actorId);
  const { getVportTabsByType } = useProfilesOps();

  const { ads } = useVportAds(actorId);

  // VPD-V-FIX-003: Resolve vportId once here and pass to both settings hooks.
  // Eliminates the duplicate DB read that previously fired when each hook
  // independently called ctrlResolveVportIdByActorId on screen mount.
  const { vportId: resolvedVportId } = useResolvedVportId(actorId);

  const {
    directoryVisible,
    directoryStatus,
    isLoading: directoryLoading,
    isSaving: directorySaving,
    error: directoryError,
    toggle: toggleDirectoryVisible,
  } = useVportDirectoryVisibility(actorId, resolvedVportId);

  const dashboardDetails = useMemo(
    () => normalizeDashboardVportDetails(publicDetails),
    [publicDetails]
  );

  const isDesktop = useDesktopBreakpoint();

  const vportType = useMemo(
    () => normalizeVportType(dashboardDetails.vportType ?? null),
    [dashboardDetails.vportType]
  );

  const {
    settings: cardSettings,
    isLoading: cardSettingsLoading,
    isSaving: cardSettingsSaving,
    error: cardSettingsError,
    updateSettings: updateCardSettings,
  } = useVportBusinessCardSettings(actorId, vportType, resolvedVportId);

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

  // VPD-V-FIX-007: Save-path business logic extracted to dedicated hook.
  // Draft state, validation, save orchestration, and toast lifecycle are now
  // owned by useSaveVportSettings — not by this view screen.
  const { draft, saving, saved, error, toastOpen, toastMessage, onChange, onSave, closeToast } =
    useSaveVportSettings({ actorId, isOwner, loadingData, dashboardDetails });

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
      <Toast open={toastOpen} message={toastMessage} onClose={closeToast} />
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
