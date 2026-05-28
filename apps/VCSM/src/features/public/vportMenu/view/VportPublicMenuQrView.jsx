import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActorCanonicalSlug } from "@/features/profiles/adapters/profiles.adapter";
import { QrCode } from "@/features/dashboard/qrcode/adapters/qrcode.adapter";
import { buildMenuQrUrl, isQrSafeSlug as isQrSafe } from "@/shared/lib/qrUrlBuilders";

export function VportPublicMenuQrView({ actorId }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  // loading: true while slug is resolving — QR must not render until false.
  const { canonicalSlug, loading } = useActorCanonicalSlug(actorId);

  // UUID guard: a bare actorId (UUID) must never be encoded in a QR.
  // The hook returns actorId as canonicalSlug in two cases:
  //   1. Error path — catch block fallback (network failure, RPC timeout)
  //   2. No-slug-data path — controller fallback when actor has no name/slug in DB
  // Both cases produce a truthy canonicalSlug that would bypass the loading gate.
  // isQrSafeSlug = true only when the slug is a real human-readable canonical slug.
  const isQrSafeSlug = isQrSafe(canonicalSlug);

  // Only build URL from a QR-safe canonical slug — never from a raw UUID.
  const menuUrl = isQrSafeSlug ? buildMenuQrUrl(canonicalSlug) : "";

  if (!actorId) return null;

  const onClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    // Use isQrSafeSlug — canonicalSlug may be a UUID fallback (truthy but unsafe).
    // When slug is not QR-safe, fall through to the internal /actor/:id route instead
    // of exposing the UUID in the browser address bar via /profile/:uuid/menu.
    if (isQrSafeSlug) {
      navigate(`/profile/${canonicalSlug}/menu`, { replace: true });
    } else {
      navigate(`/actor/${actorId}/menu`, { replace: true });
    }
  };

  const onCopy = async () => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        background:
          "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.10), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.12), transparent 55%), radial-gradient(900px 700px at 55% 85%, rgba(0,153,255,0.08), transparent 60%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 22,
          padding: 1,
          background:
            "linear-gradient(135deg, rgba(0,255,240,0.22), rgba(124,58,237,0.18), rgba(0,153,255,0.16))",
          boxShadow: "0 24px 70px rgba(0,0,0,0.72)",
        }}
      >
        <div
          style={{
            borderRadius: 21,
            padding: 28,
            background: "linear-gradient(180deg, rgba(10,12,22,0.72) 0%, rgba(7,8,16,0.62) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu QR"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          <div style={{ marginTop: 8, textAlign: "center" }}>
            <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: 1.2, textTransform: "uppercase" }}>
              Scan to Open Menu
            </div>
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.55)" }}>
              Public access link optimized for mobile browsers.
            </div>
          </div>

          {/* QR render gated — only when a QR-safe (non-UUID) slug is resolved */}
          <div style={{ marginTop: 26, display: "flex", justifyContent: "center" }}>
            {loading || !isQrSafeSlug ? (
              /* Loading skeleton — never show UUID QR; also shown when profile is incomplete */
              <div
                aria-label="Loading QR code"
                style={{
                  borderRadius: 19,
                  background: "rgba(255,255,255,0.06)",
                  width: 256,
                  height: 256,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "3px solid rgba(255,255,255,0.15)",
                    borderTopColor: "rgba(0,255,240,0.6)",
                    animation: "spin 0.9s linear infinite",
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <div
                role="img"
                aria-label="QR code linking to menu page"
                style={{ borderRadius: 19, background: "#fff", padding: 18 }}
              >
                <QrCode
                  value={menuUrl}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
            )}
          </div>

          {/* URL display and actions — only when QR-safe slug is resolved */}
          {!loading && isQrSafeSlug && (
            <>
              <div
                style={{
                  marginTop: 18,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.55)",
                  wordBreak: "break-all",
                  textAlign: "center",
                }}
              >
                {menuUrl}
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(0,255,240,0.22)",
                    background:
                      "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.14), rgba(0,153,255,0.14))",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 900,
                    textDecoration: "none",
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  Open Menu
                </a>

                <button
                  type="button"
                  onClick={onCopy}
                  aria-label={copied ? "Link copied" : "Copy menu link"}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 850,
                    cursor: "pointer",
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  {copied ? "Copied" : "Copy Link"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VportPublicMenuQrView;
