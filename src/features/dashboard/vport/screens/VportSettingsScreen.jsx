// src/features/dashboard/vport/screens/VportSettingsScreen.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";

import Card from "@/features/settings/ui/Card";
import VportAboutDetailsView from "@/features/settings/profile/ui/VportAboutDetails.view";

import { useIdentity } from "@/state/identity/identityContext";
import { fetchVportPublicDetailsByActorId } from "@/features/profiles/dal/vportPublicDetails.read.dal";

async function saveVportPublicDetailsByActorId(actorId, payload) {
  const res = await fetch(`/api/vport/${actorId}/public-details`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) {
    let msg = "Failed to save VPORT details.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
      if (data?.message) msg = data.message;
    } catch {}
    throw new Error(msg);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

function mapPublicDetailsToDraft(d) {
  const src = d || {};
  return {
    locationText: src.location_text ?? src.locationText ?? "",
    websiteUrl: src.website_url ?? src.websiteUrl ?? "",
    bookingUrl: src.booking_url ?? src.bookingUrl ?? "",
    emailPublic: src.email_public ?? src.emailPublic ?? "",
    phonePublic: src.phone_public ?? src.phonePublic ?? "",
    address: src.address ?? {},
    hours: src.hours ?? {},
    highlights: Array.isArray(src.highlights) ? src.highlights : [],
    languages: Array.isArray(src.languages) ? src.languages : [],
    paymentMethods: Array.isArray(src.payment_methods)
      ? src.payment_methods
      : Array.isArray(src.paymentMethods)
      ? src.paymentMethods
      : [],
  };
}

export default function VportSettingsScreen() {
  const navigate = useNavigate();
  const { actorId } = useParams();
  const { identity } = useIdentity();

  const [draft, setDraft] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // ✅ reactive desktop detection (same as dashboard)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(min-width: 821px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(min-width: 821px)");
    const onChange = () => setIsDesktop(mq.matches);

    onChange();

    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // ✅ FORCE SCROLL TO TOP ON MOUNT
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!actorId) return;

    let alive = true;

    (async () => {
      setLoadingData(true);
      try {
        const d = await fetchVportPublicDetailsByActorId(actorId);
        if (!alive) return;
        setDraft(mapPublicDetailsToDraft(d || null));
      } catch (e) {
        if (!alive) return;
        setDraft(mapPublicDetailsToDraft(null));
      } finally {
        if (!alive) return;
        setLoadingData(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [actorId]);

  const onChange = useCallback((patch) => {
    setSaved(false);
    setError("");
    setDraft((prev) => ({ ...(prev || {}), ...(patch || {}) }));
  }, []);

  const onSave = useCallback(async () => {
    if (!actorId) return;

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await saveVportPublicDetailsByActorId(actorId, draft || {});
      setSaved(true);
    } catch (e) {
      setError(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [actorId, draft]);

  if (!actorId) return null;

  const page = {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
    color: "#fff",
    padding: 18,
  };

  const container = {
    width: "100%",
    maxWidth: isDesktop ? 1100 : 900,
    margin: "0 auto",
    paddingBottom: 56,
  };

  const headerWrap = {
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(12,14,24,0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
  };

  const topBar = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
  };

  const btn = (variant = "soft") => ({
    padding: "10px 12px",
    borderRadius: 14,
    border:
      variant === "soft"
        ? "1px solid rgba(255,255,255,0.12)"
        : "1px solid rgba(0,255,240,0.22)",
    background:
      variant === "soft"
        ? "rgba(255,255,255,0.06)"
        : "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.14), rgba(0,153,255,0.14))",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: 0.3,
  });

  const title = useMemo(() => "VPORT SETTINGS", []);

  const content = (
    <div style={page}>
      <div style={container}>
        <div style={headerWrap}>
          <div style={topBar}>
            <button
              type="button"
              onClick={() => navigate(`/actor/${actorId}/dashboard`)}
              style={btn("soft")}
            >
              ← Back
            </button>

            <div style={{ fontWeight: 950, letterSpacing: 1.2 }}>{title}</div>

            <div style={{ width: 110 }} />
          </div>

          <div style={{ padding: 16 }}>
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