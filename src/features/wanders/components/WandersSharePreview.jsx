import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import WandersCardPreview from "@/features/wanders/components/WandersCardPreview";
import WandersShowLoveCTA from "@/features/wanders/components/WandersShowLoveCTA";
import { resolveRealm } from "@/features/upload/model/resolveRealm";
import { buildWandersShareLinks } from "@/features/wanders/utils/wandersShareLinks";
import { buildWandersDraftPayload } from "@/features/wanders/model/wandersSharePreview.model";
import Toast from "@/shared/components/components/Toast";

export default function WandersSharePreview({
  cardPublicId,
  card,
  baseUrl,
  className = "",
  ui,
}) {
  const navigate = useNavigate();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = useCallback((msg) => {
    setToastMsg(String(msg || ""));
    setToastOpen(true);
  }, []);

  const button =
    ui?.buttonBase ||
    [
      "relative overflow-hidden",
      "w-full sm:w-auto",
      "rounded-xl",
      "bg-zinc-900/90 border border-white/15",
      "px-4 py-2.5",
      "text-sm font-semibold text-white",
      "shadow-[0_10px_26px_rgba(0,0,0,0.75)]",
      "transition hover:bg-zinc-900 hover:border-white/25",
      "hover:shadow-[0_14px_34px_rgba(0,0,0,0.78),0_0_26px_rgba(124,58,237,0.22)]",
      "active:scale-[0.99]",
      "focus:outline-none focus:ring-2 focus:ring-violet-500/35 focus:ring-offset-0",
    ].join(" ");

  const resolvedBaseUrl = useMemo(() => {
    if (baseUrl) return baseUrl;
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
    } catch {
      // no-op
    }
    return "";
  }, [baseUrl]);

  const realmId = resolveRealm(false);
  const share = useMemo(() => {
    if (!cardPublicId) return null;
    return buildWandersShareLinks({ publicId: cardPublicId, baseUrl: resolvedBaseUrl });
  }, [cardPublicId, resolvedBaseUrl]);

  const draftPayload = useMemo(() => buildWandersDraftPayload(card), [card]);
  const shareText = share?.shareText || "";

  const handleCopy = useCallback(
    async (text) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied");
      } catch (e) {
        console.error("[WandersSharePreview] clipboard copy failed", e);
        showToast("Copy failed");
      }
    },
    [showToast]
  );

  const handleSendAnother = useCallback(() => {
    navigate("/wanders/create", { state: { realmId, baseUrl: resolvedBaseUrl } });
  }, [navigate, realmId, resolvedBaseUrl]);

  const openExternal = useCallback((url) => {
    if (!url) return;
    try {
      window.location.assign(url);
    } catch {
      // no-op
    }
  }, []);

  const boxBase =
    "relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-4 text-white backdrop-blur-xl " +
    "shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_36px_rgba(124,58,237,0.10)]";

  return (
    <>
      <Toast open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />

      <div className={["grid gap-4 md:grid-cols-2", className].join(" ")}>
        <div className={boxBase}>
          <div aria-hidden className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/08 blur-3xl" />
          <div className="relative">
            <div className="mb-3 text-sm font-semibold text-white/90">Preview</div>
            <WandersCardPreview card={card} draftPayload={draftPayload} />
          </div>
        </div>

        <div className={boxBase}>
          <div aria-hidden className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/08 blur-3xl" />
          <div className="relative">
            <div className="text-sm font-semibold text-white/90">Share</div>
            <div className="mt-1 text-sm text-white/60">Copy the link or share via email or SMS.</div>

            <div className="mt-4">
              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <button type="button" onClick={() => handleCopy(shareText)} className={button}>
                  <span className="relative">Link</span>
                </button>
                <button type="button" onClick={() => openExternal(share?.mailtoUrl)} className={button}>
                  <span className="relative">Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => openExternal(share?.smsUrl || share?.smsAltUrl)}
                  className={button}
                >
                  <span className="relative">SMS</span>
                </button>
              </div>
            </div>

            <div className="mt-4">
              <WandersShowLoveCTA onClick={handleSendAnother} label="SHOW LOVE TO MORE PEOPLE" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
