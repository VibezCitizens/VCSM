// src/features/dashboard/vport/screens/VportSettingsScreen.jsx

import React, { useCallback, useEffect, useState } from "react";
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

  // ✅ FORCE SCROLL TO TOP ON MOUNT
  useEffect(() => {
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

  return (
    // ✅ make the page itself scrollable (mobile-safe)
    <div className="min-h-screen bg-black text-white overflow-y-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold tracking-wide uppercase">
              VPORT Settings
            </div>

            {/* ✅ match your actual dashboard route */}
            <button
              onClick={() => navigate(`/vport/${actorId}/dashboard`)}
              className="px-3 py-1.5 text-sm rounded-xl bg-zinc-800 hover:bg-zinc-700"
            >
              ← Back to Dashboard
            </button>
          </div>

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
  );
}