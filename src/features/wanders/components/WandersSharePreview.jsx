// src/features/wanders/components/WandersSharePreview.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import WandersCardPreview from "./WandersCardPreview";
import { resolveRealm } from "@/features/upload/model/resolveRealm";
import { buildWandersShareLinks } from "../utils/wandersShareLinks";

export default function WandersSharePreview({
  cardPublicId,
  card,
  baseUrl,
  className = "",
  ui,
}) {
  const navigate = useNavigate();

  const label = ui?.labelBase || "block text-sm font-medium text-white/80 mb-1.5";

  const input =
    ui?.inputBase ||
    "w-full rounded-xl border bg-black/30 px-3.5 py-2.5 text-[15px] leading-6 shadow-sm border-white/10 text-white placeholder:text-white/40 transition duration-150 focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/20";

  const textarea = ui?.textareaBase || `${input} resize-none`;

  // ✅ Match the new "more visual" button style (same vibe as Sent screen)
  const button =
    ui?.buttonBase ||
    [
      "relative overflow-hidden",
      "w-full sm:w-auto",
      "rounded-xl",
      "bg-zinc-900/90",
      "border border-white/15",
      "px-4 py-2.5",
      "text-sm font-semibold text-white",
      "shadow-[0_10px_26px_rgba(0,0,0,0.75)]",
      "transition",
      "hover:bg-zinc-900 hover:border-white/25",
      "hover:shadow-[0_14px_34px_rgba(0,0,0,0.78),0_0_26px_rgba(124,58,237,0.22)]",
      "active:scale-[0.99]",
      "focus:outline-none focus:ring-2 focus:ring-violet-500/35 focus:ring-offset-0",
    ].join(" ");

  // ✅ Same sheen/inner ring layers used in Sent screen buttons
  const btnSheen =
    "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_55%)]";
  const btnInnerRing =
    "pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10";

  const resolvedBaseUrl = useMemo(() => {
    if (baseUrl) return baseUrl;
    try {
      if (typeof window !== "undefined" && window.location?.origin)
        return window.location.origin;
    } catch {}
    return "";
  }, [baseUrl]);

  const realmId = resolveRealm(false);

  const share = useMemo(() => {
    if (!cardPublicId) return null;
    return buildWandersShareLinks({
      publicId: cardPublicId,
      baseUrl: resolvedBaseUrl,
    });
  }, [cardPublicId, resolvedBaseUrl]);

  const shareText = share?.shareText || "";

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const handleSendAnother = () => {
    navigate("/wanders/create", {
      state: { realmId, baseUrl: resolvedBaseUrl },
    });
  };

  const openExternal = (url) => {
    if (!url) return;
    try {
      window.location.assign(url);
    } catch {}
  };

  const draftPayload = useMemo(() => {
    if (!card) return null;

    const customization =
      card?.customization ?? card?.payload?.customization ?? card?.meta?.customization ?? {};

    const templateKey =
      card?.template_key ??
      card?.templateKey ??
      card?.payload?.template_key ??
      card?.payload?.templateKey ??
      customization?.template_key ??
      customization?.templateKey ??
      null;

    const imageUrl =
      card?.imageUrl ??
      card?.image_url ??
      card?.payload?.imageUrl ??
      card?.payload?.image_url ??
      customization?.imageUrl ??
      customization?.image_url ??
      "";

    const imageDataUrl =
      card?.imageDataUrl ??
      card?.image_data_url ??
      card?.payload?.imageDataUrl ??
      card?.payload?.image_data_url ??
      customization?.imageDataUrl ??
      customization?.image_data_url ??
      "";

    const title = card?.title ?? card?.payload?.title ?? customization?.title ?? "";

    const message =
      card?.message ??
      card?.message_text ??
      card?.payload?.message ??
      card?.payload?.messageText ??
      card?.payload?.message_text ??
      customization?.message ??
      "";

    return {
      ...card,
      templateKey: templateKey || "",
      template_key: templateKey || "",
      title,
      message,
      imageUrl,
      imageDataUrl,
      customization: {
        ...(customization || {}),
        imageUrl,
        imageDataUrl,
        title,
        message,
      },
    };
  }, [card]);

  const boxBase =
    "relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-4 text-white backdrop-blur-xl " +
    "shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_36px_rgba(124,58,237,0.10)]";

  const glowTL =
    "pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl";
  const glowBR =
    "pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/08 blur-3xl";

  return (
    <div className={["grid gap-4 md:grid-cols-2", className].join(" ")}>
      {/* PREVIEW */}
      <div className={boxBase}>
        <div aria-hidden="true" className={glowTL} />
        <div aria-hidden="true" className={glowBR} />
        <div className="relative">
          <div className="mb-3 text-sm font-semibold text-white/90">Preview</div>
          <WandersCardPreview card={card} draftPayload={draftPayload} />
        </div>
      </div>

      {/* SHARE */}
      <div className={boxBase}>
        <div aria-hidden="true" className={glowTL} />
        <div aria-hidden="true" className={glowBR} />
        <div className="relative">
          <div className="text-sm font-semibold text-white/90">Share</div>
          <div className="mt-1 text-sm text-white/60">
            Copy the message or share via email or SMS.
          </div>

          <div className="mt-4">
            <label className={label}>Share text</label>

            <div className="grid gap-2">
              <textarea
                readOnly
                value={shareText}
                onFocus={(e) => e.target.select()}
                className={`${textarea} min-h-[120px]`}
              />

              <div className="grid gap-2 sm:flex sm:flex-wrap">
                <button type="button" onClick={() => handleCopy(shareText)} className={button}>
                  <span aria-hidden className={btnSheen} />
                  <span aria-hidden className={btnInnerRing} />
                  <span className="relative">Copy text</span>
                </button>

                <button type="button" onClick={() => openExternal(share?.mailtoUrl)} className={button}>
                  <span aria-hidden className={btnSheen} />
                  <span aria-hidden className={btnInnerRing} />
                  <span className="relative">Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => openExternal(share?.smsUrl || share?.smsAltUrl)}
                  className={button}
                >
                  <span aria-hidden className={btnSheen} />
                  <span aria-hidden className={btnInnerRing} />
                  <span className="relative">SMS</span>
                </button>
              </div>
            </div>
          </div>

          {/* BIG VALENTINE CTA */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSendAnother}
              className={[
                "relative overflow-hidden",
                "w-full",
                "rounded-2xl",
                "bg-gradient-to-r from-pink-600 via-rose-500 to-red-500",
                "px-6 py-3",
                "text-base font-extrabold uppercase tracking-wide text-white",
                "shadow-[0_14px_34px_rgba(0,0,0,0.8),0_0_40px_rgba(244,63,94,0.35)]",
                "transition",
                "hover:scale-[1.02]",
                "hover:shadow-[0_18px_44px_rgba(0,0,0,0.85),0_0_55px_rgba(244,63,94,0.55)]",
                "active:scale-[0.99]",
                "focus:outline-none focus:ring-2 focus:ring-pink-400/50",
              ].join(" ")}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.20),transparent_60%)]"
              />
              <span className="relative">💖 SHOW LOVE TO 3 MORE PEOPLE 💖</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
