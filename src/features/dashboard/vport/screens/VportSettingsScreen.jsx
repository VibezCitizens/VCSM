// src/features/dashboard/vport/screens/VportSettingsScreen.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import "@/features/settings/styles/settings-modern.css";

import Card from "@/features/settings/adapters/ui/Card.adapter";
import VportAboutDetailsView from "@/features/settings/adapters/profile/ui/VportAboutDetails.view.adapter";

import { useIdentity } from "@/state/identity/identityContext";
import { useVportPublicDetails } from "@/features/profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter";
import { useSaveVportPublicDetailsByActorId } from "@/features/dashboard/vport/hooks/useSaveVportPublicDetailsByActorId";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { useVportAds } from "@/features/ads/adapters/hooks/useVportAds.adapter";
import VportSettingsAdsPreview from "@/features/dashboard/vport/screens/components/VportSettingsAdsPreview";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/model/vportDashboardShellStyles";
import { getDashboardCardMetaByKey } from "@/features/dashboard/vport/screens/model/buildDashboardCards";
import { releaseFlags } from "@/shared/config/releaseFlags";
import Toast from "@/shared/components/components/Toast";
import {
  getDashboardViewByVportType,
  normalizeVportType,
} from "@/features/dashboard/vport/screens/model/dashboardViewByVportType.model";
import { mapPublicDetailsToDraft } from "@/features/dashboard/vport/model/vportSettingsDraft.model";

const REQUIRED_ADDRESS_KEYS = ["line1", "city", "state", "zip", "country"];
const US_PHONE_DIGITS = 10;
const US_STATE_LETTERS = 2;
const US_ZIP_DIGITS = 5;
const CITY_REGEX = /^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/;
const COUNTRY_REGEX = /^[A-Z]{2,}(?: [A-Z]{2,})*$/;

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeCity(value) {
  return normalizeWhitespace(String(value || "").replace(/[^A-Za-z\s.'-]/g, " "));
}

function normalizeState(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
}

function normalizeZip(value) {
  return String(value || "").replace(/\D+/g, "");
}

function normalizeCountry(value) {
  return normalizeWhitespace(
    String(value || "").toUpperCase().replace(/[^A-Z\s]/g, " ")
  );
}

function normalizeAddress(address) {
  const raw = address && typeof address === "object" ? address : {};
  return {
    line1: normalizeWhitespace(raw.line1),
    line2: normalizeWhitespace(raw.line2),
    city: normalizeCity(raw.city),
    state: normalizeState(raw.state),
    zip: normalizeZip(raw.zip),
    country: normalizeCountry(raw.country),
  };
}

function hasAnyAddressValue(address) {
  return Object.values(address).some((value) => String(value || "").trim().length > 0);
}

function hasCompleteAddress(address) {
  return REQUIRED_ADDRESS_KEYS.every(
    (key) => String(address?.[key] || "").trim().length > 0
  );
}

function getAddressValidationError(address) {
  const city = String(address?.city || "").trim();
  const state = String(address?.state || "").trim();
  const zip = String(address?.zip || "").trim();
  const country = String(address?.country || "").trim();

  if (!CITY_REGEX.test(city)) {
    return "Enter a valid city name.";
  }

  if (!new RegExp(`^[A-Z]{${US_STATE_LETTERS}}$`).test(state)) {
    return "State must be a 2-letter code (e.g. TX).";
  }

  if (!new RegExp(`^\\d{${US_ZIP_DIGITS}}$`).test(zip)) {
    return "ZIP must be 5 digits.";
  }

  if (!COUNTRY_REGEX.test(country)) {
    return "Enter a valid country.";
  }

  return "";
}

function normalizePhoneDigits(value) {
  const raw = String(value || "").replace(/\D+/g, "");
  const withoutCountryCode =
    raw.length > US_PHONE_DIGITS && raw.startsWith("1") ? raw.slice(1) : raw;
  return withoutCountryCode.slice(0, US_PHONE_DIGITS);
}

export default function VportSettingsScreen() {
  const navigate = useNavigate();
  const { actorId } = useParams();
  const { identity, identityLoading } = useIdentity();
  const { loading: loadingData, details: publicDetails } = useVportPublicDetails(actorId);

  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
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

    if (addressStarted && !addressComplete) {
      setError("");
      setToastMessage("Please enter full address.");
      setToastOpen(false);
      setTimeout(() => setToastOpen(true), 0);
      return;
    }

    if (addressStarted) {
      const addressError = getAddressValidationError(normalizedAddress);
      if (addressError) {
        setError("");
        setToastMessage(addressError);
        setToastOpen(false);
        setTimeout(() => setToastOpen(true), 0);
        return;
      }
    }

    if (phoneDigits && phoneDigits.length !== US_PHONE_DIGITS) {
      setError("");
      setToastMessage("Enter a valid 10-digit phone number.");
      setToastOpen(false);
      setTimeout(() => setToastOpen(true), 0);
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
      await saveByActorId(actorId, payload);
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

          <div style={{ padding: 16 }} className="space-y-4">
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
                      className="settings-vport-tag px-3 py-1 text-xs"
                    >
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
                <VportSettingsAdsPreview
                  ads={ads}
                  actorId={actorId}
                  onOpen={(id) => navigate(`/ads/vport/${id}`)}
                />
              </Card>
            )}

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
      <Toast
        open={toastOpen}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />
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

