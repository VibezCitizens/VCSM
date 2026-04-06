import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";

export function VportPublicMenuQrView({ actorId }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const menuUrl = useMemo(() => {
    if (!actorId) return "";
    return `${window.location.origin}/m/${actorId}`;
  }, [actorId]);

  if (!actorId) return null;

  const onClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(`/actor/${actorId}/menu`, { replace: true });
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
            X
          </button>

          <div style={{ marginTop: 8, textAlign: "center" }}>
            <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: 1.2, textTransform: "uppercase" }}>
              Scan to Open Menu
            </div>
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.55)" }}>
              Public access link optimized for mobile browsers.
            </div>
          </div>

          <div style={{ marginTop: 26, display: "flex", justifyContent: "center" }}>
            <div style={{ borderRadius: 19, background: "#fff", padding: 18 }}>
              <QRCode value={menuUrl} size={220} />
            </div>
          </div>

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
        </div>
      </div>
    </div>
  );
}

export default VportPublicMenuQrView;
