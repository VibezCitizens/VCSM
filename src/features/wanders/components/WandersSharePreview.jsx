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

  // ✅ same style contract as templates (fallback defaults match valentinesRomanticTemplate)
  const label =
    ui?.labelBase || "block text-sm font-medium text-gray-800 mb-1.5";
  const input =
    ui?.inputBase ||
    "w-full rounded-xl border bg-gray-100 px-3.5 py-2.5 text-[15px] leading-6 shadow-sm border-gray-300 text-gray-900 placeholder:text-gray-500 transition duration-150 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 focus:bg-gray-100";
  const textarea = ui?.textareaBase || `${input} resize-none`;
  const button =
    ui?.buttonBase ||
    "w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition duration-150 hover:bg-gray-50 active:scale-[0.99]";

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

  // ✅ Normalize whatever the DB card shape is into the preview/draft shape
  const draftPayload = useMemo(() => {
    if (!card) return null;

    const customization =
      card?.customization ??
      card?.payload?.customization ??
      card?.meta?.customization ??
      {};

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

  return (
    <div className={["grid gap-4 md:grid-cols-2", className].join(" ")}>
      {/* PREVIEW */}
      <div className="rounded-2xl border border-white/10 bg-white/95 p-4 text-black shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900">Preview</div>
        <WandersCardPreview card={card} draftPayload={draftPayload} />
      </div>

      {/* SHARE */}
      <div className="rounded-2xl border border-white/10 bg-white/95 p-4 text-black shadow-sm">
        <div className="text-sm font-semibold">Share</div>
        <div className="mt-1 text-sm text-gray-700">
          Copy the message or share via email or SMS.
        </div>

        {/* Share text only */}
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
              <button
                type="button"
                onClick={() => handleCopy(shareText)}
                className={button}
              >
                Copy text
              </button>

              <button
                type="button"
                onClick={() => openExternal(share?.mailtoUrl)}
                className={button}
              >
                Email
              </button>

              <button
                type="button"
                onClick={() => openExternal(share?.smsUrl || share?.smsAltUrl)}
                className={button}
              >
                SMS
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4">
          <button type="button" onClick={handleSendAnother} className={button}>
            Send another
          </button>
        </div>
      </div>
    </div>
  );
}
