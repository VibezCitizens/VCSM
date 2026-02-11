// src/features/wanders/screens/WandersCreate.screen.jsx
import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";

// ✅ NEW: guest auth hook (core)
import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";

import CardBuilder from "@/features/wanders/components/cardstemplates/CardBuilder";

// ✅ NEW: core controller (guest-auth)
import { publishWandersFromBuilder } from "@/features/wanders/core/controllers/publishWandersFromBuilder.controller";

export default function WandersCreateScreen({ realmId: realmIdProp, baseUrl: baseUrlProp }) {
  const navigate = useNavigate();
  const location = useLocation();

  const realmId = realmIdProp || location?.state?.realmId || null;

  const baseUrl = useMemo(() => {
    if (baseUrlProp) return baseUrlProp;
    if (location?.state?.baseUrl) return location.state.baseUrl;
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    } catch {}
    return "";
  }, [baseUrlProp, location?.state?.baseUrl]);

  // ✅ guest user identity (auth.users.id)
  const { ensureUser } = useWandersGuest({ auto: true });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = useCallback(
    async (payload) => {
      if (!realmId) return;

      setSubmitting(true);
      setError(null);

      try {
        // ✅ ensure we have an auth user (anonymous sign-in)
        await Promise.resolve(ensureUser?.());

        // ✅ CORE publish (writes sender_user_id + seeds mailbox owner_user_id)
        const res = await publishWandersFromBuilder({
          realmId,
          baseUrl,
          payload,
        });

        const publicId = res?.publicId || null;
        const url = res?.url || null;

        if (publicId) {
          navigate(`/wanders/sent/${publicId}`);
          return;
        }
        if (url) window.location.assign(url);
      } catch (e) {
        setError(e);
      } finally {
        setSubmitting(false);
      }
    },
    [realmId, ensureUser, baseUrl, navigate]
  );

  if (!realmId) {
    return <WandersEmptyState title="Missing realm" subtitle="Pass realmId into WandersCreateScreen." />;
  }

  return (
    <div className="relative h-screen w-full overflow-y-auto touch-pan-y bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_-80px,rgba(168,85,247,0.15),transparent)]"
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <h1 className="text-lg font-bold tracking-wide">Create a Card</h1>
              <p className="mt-1 text-sm text-zinc-300">Pick a style, write a message, share a link.</p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/wanders")}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-6">
        {submitting ? <WandersLoading /> : null}

        <CardBuilder defaultCardType="generic" loading={submitting} error={error} onSubmit={onSubmit}>
          {({
            CARD_TYPES,
            cardType,
            setCardType,
            showTemplatePicker,
            templateId,
            setTemplateId,
            templateList,
            FormUI,
            PreviewUI,
            formData,
            setFormData,
            submit,
            ui,
          }) => (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Square 1: FORM */}
              <div className="rounded-2xl border border-white/10 bg-white p-4 text-black shadow-sm">
                {/* Card type tiles */}
                <div>
                  <div className="block text-sm font-medium text-gray-800 mb-1.5">Card type</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CARD_TYPES.map((t) => {
                      const active = t.key === cardType;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          disabled={submitting}
                          onClick={() => setCardType(t.key)}
                          className={[
                            "group relative overflow-hidden rounded-2xl border p-3 text-left transition",
                            "bg-white hover:bg-gray-50",
                            active ? "border-black ring-2 ring-black/10" : "border-gray-200",
                            submitting ? "opacity-60 cursor-not-allowed" : "",
                          ].join(" ")}
                        >
                          <div
                            aria-hidden
                            className={[
                              "pointer-events-none absolute inset-0 opacity-0 transition",
                              active ? "opacity-100" : "",
                            ].join(" ")}
                            style={{
                              background: "linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02))",
                            }}
                          />

                          <div className="relative flex items-start gap-3">
                            <div
                              className={[
                                "flex h-10 w-10 items-center justify-center rounded-xl border text-lg",
                                active ? "border-black bg-black text-white" : "border-gray-200 bg-white",
                              ].join(" ")}
                            >
                              {t.icon}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-gray-900">{t.label}</div>
                              <div className="mt-1 truncate text-xs text-gray-600">{t.sub}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 text-xs text-gray-600">This controls templates + required fields.</div>
                </div>

                {/* Template picker (only when needed) */}
                {showTemplatePicker ? (
                  <div className="mt-4">
                    <label className={ui.labelBase}>Template</label>
                    <select
                      className={ui.inputBase}
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      disabled={submitting}
                    >
                      {templateList.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.id}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {/* Template Form */}
                <form onSubmit={submit} className="mt-4">
                  {FormUI ? <FormUI data={formData} setData={setFormData} ui={ui} /> : null}

                  <button type="submit" className={`${ui.primaryBtn} mt-5`} disabled={submitting}>
                    {submitting ? "Creating…" : "Create card"}
                  </button>
                </form>
              </div>

              {/* Square 2: LIVE PREVIEW */}
              <div className="rounded-2xl border border-white/10 bg-white p-4 text-black shadow-sm">
                <div className="text-sm font-semibold text-gray-900">Preview</div>
                <div className="mt-3">{PreviewUI ? <PreviewUI data={formData} /> : null}</div>
              </div>
            </div>
          )}
        </CardBuilder>
      </main>
    </div>
  );
}
