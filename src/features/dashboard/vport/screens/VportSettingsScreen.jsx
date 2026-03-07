// src/features/dashboard/vport/screens/VportSettingsScreen.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import Card from "@/features/settings/ui/Card";
import VportAboutDetailsView from "@/features/settings/profile/ui/VportAboutDetails.view";

import { useIdentity } from "@/state/identity/identityContext";
import { useVportPublicDetails } from "@/features/profiles/kinds/vport/hooks/useVportPublicDetails";
import { useSaveVportPublicDetailsByActorId } from "@/features/dashboard/vport/hooks/useSaveVportPublicDetailsByActorId";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { useVportAds } from "@/features/ads/hooks/useVportAds";
import VportSettingsAdsPreview from "@/features/dashboard/vport/screens/components/VportSettingsAdsPreview";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/model/vportDashboardShellStyles";
import { getDashboardCardMetaByKey } from "@/features/dashboard/vport/screens/model/buildDashboardCards";
import { releaseFlags } from "@/shared/config/releaseFlags";
import {
  getDashboardViewByVportType,
  normalizeVportType,
} from "@/features/dashboard/vport/screens/model/dashboardViewByVportType.model";
import { mapPublicDetailsToDraft } from "@/features/dashboard/vport/model/vportSettingsDraft.model";

export default function VportSettingsScreen() {
  const navigate = useNavigate();
  const { actorId } = useParams();
  const { identity, identityLoading } = useIdentity();
  const { loading: loadingData, details: publicDetails } = useVportPublicDetails(actorId);

  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const { saveByActorId } = useSaveVportPublicDetailsByActorId();
  const { ads } = useVportAds(actorId);

  const isDesktop = useDesktopBreakpoint();
  const viewerActorId = identity?.actorId ?? null;
  const isOwner =
    Boolean(actorId) &&
    Boolean(viewerActorId) &&
    String(viewerActorId) === String(actorId);
  const vportType = useMemo(
    () => normalizeVportType(identity?.vportType ?? null),
    [identity?.vportType]
  );
  const dashboardView = useMemo(
    () => getDashboardViewByVportType(vportType),
    [vportType]
  );
  const dashboardTabs = useMemo(
    () =>
      (dashboardView?.cardKeys ?? [])
        .map((key) => getDashboardCardMetaByKey(key))
        .filter(Boolean),
    [dashboardView]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    setDraft(mapPublicDetailsToDraft(publicDetails || null));
  }, [publicDetails]);

  const onChange = useCallback((patch) => {
    setSaved(false);
    setError("");
    setDraft((prev) => ({ ...(prev || {}), ...(patch || {}) }));
  }, []);

  const onSave = useCallback(async () => {
    if (!actorId || !isOwner || loadingData || !draft) return;

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await saveByActorId(actorId, draft);
      setSaved(true);
    } catch (e) {
      setError(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [actorId, draft, isOwner, loadingData, saveByActorId]);

  if (!actorId) return null;

  if (identityLoading) {
    return <div className="p-10 text-center text-neutral-400">Loading...</div>;
  }

  if (!identity) {
    return (
      <div className="p-10 text-center text-neutral-400">Sign in required.</div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-10 text-center text-neutral-400">
        You can only edit settings for your own vport.
      </div>
    );
  }

  const shell = createVportDashboardShellStyles({
    isDesktop,
    maxWidthDesktop: 1100,
  });

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton
              isDesktop={isDesktop}
              onClick={() => navigate(`/actor/${actorId}/dashboard`)}
              style={shell.btn("soft")}
            />

            <div style={shell.title}>VPORT SETTINGS</div>

            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16 }}>
            <Card>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-zinc-100">
                  Dashboard Tabs
                </div>
                <div className="text-xs text-zinc-400">
                  View: {dashboardView?.label ?? "Default"} • Type: {vportType}
                </div>
                <div className="flex flex-wrap gap-2">
                  {dashboardTabs.map((tab) => (
                    <span
                      key={tab.key}
                      className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200"
                    >
                      {tab.title}
                    </span>
                  ))}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => navigate(`/actor/${actorId}/dashboard`)}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-800"
                  >
                    Open Dashboard
                  </button>
                </div>
              </div>
            </Card>

            {releaseFlags.vportAdsPipeline && (
              <Card>
                <VportSettingsAdsPreview
                  ads={ads}
                  actorId={actorId}
                  onOpen={(id) => navigate(`/ads/vport/${id}`)}
                />
              </Card>
            )}

            <Card>
              <VportAboutDetailsView
                loading={loadingData}
                saving={saving}
                error={error}
                draft={draft || {}}
                onChange={onChange}
                onSave={onSave}
                saved={saved}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          overflow: "auto",
          background: "#000",
        }}
      >
        {content}
      </div>,
      document.body
    );
  }

  return content;
}

