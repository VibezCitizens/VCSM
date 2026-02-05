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
}) {
  const navigate = useNavigate();

  // keep consistent with AppRoutes (PUBLIC realm)
  const resolvedBaseUrl = useMemo(() => {
    if (baseUrl) return baseUrl;
    try {
      if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
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

  const cardLink = share?.url || "";
  const shareText = share?.shareText || "";

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  // ✅ same dynamic behavior: goes back to create card with realmId/baseUrl
  const handleSendAnother = () => {
    navigate("/wanders/create", { state: { realmId, baseUrl: resolvedBaseUrl } });
  };

  const openExternal = (url) => {
    if (!url) return;
    try {
      window.location.assign(url);
    } catch {}
  };

  return (
    <div className={["grid gap-4 md:grid-cols-2", className].join(" ")}>
      {/* PREVIEW */}
      <div className="rounded-2xl border border-white/10 bg-white/95 p-4 text-black shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900">Preview</div>
        <WandersCardPreview card={card} draftPayload={card} />
      </div>

      {/* SHARE */}
      <div className="rounded-2xl border border-white/10 bg-white/95 p-4 text-black shadow-sm">
        <div className="text-sm font-semibold">Share</div>
        <div className="mt-1 text-sm text-gray-700">
          Copy the link, or share via email, SMS, or WhatsApp.
        </div>

        {/* Card link */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-700">Card link</div>
          <div className="mt-2 grid gap-2 sm:flex sm:items-center">
            <input
              readOnly
              value={cardLink}
              onFocus={(e) => e.target.select()}
              className="w-full flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
            />
            <button
              type="button"
              onClick={() => handleCopy(cardLink)}
              className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 active:scale-[0.99]"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => navigate(`/wanders/c/${cardPublicId}`)}
              className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 active:scale-[0.99]"
            >
              View
            </button>
          </div>
        </div>

        {/* Share text */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-700">Share text</div>
          <div className="mt-2 grid gap-2">
            <textarea
              readOnly
              value={shareText}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 min-h-[90px]"
            />
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => handleCopy(shareText)}
                className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 active:scale-[0.99]"
              >
                Copy text
              </button>

              <button
                type="button"
                onClick={() => openExternal(share?.mailtoUrl)}
                className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 active:scale-[0.99]"
              >
                Email
              </button>

              <button
                type="button"
                onClick={() => openExternal(share?.smsUrl || share?.smsAltUrl)}
                className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 active:scale-[0.99]"
              >
                SMS
              </button>

              <button
                type="button"
                onClick={() => openExternal(share?.whatsappUrl)}
                className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 active:scale-[0.99]"
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={handleSendAnother}
            className="w-full sm:w-auto rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 active:scale-[0.99]"
          >
            Send another
          </button>
        </div>
      </div>
    </div>
  );
}
