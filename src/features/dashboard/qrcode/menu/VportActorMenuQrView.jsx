import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";

export function VportActorMenuQrView({ actorId }) {
  const navigate = useNavigate();

  const menuUrl = useMemo(() => {
    if (!actorId) return "";
    return `${window.location.origin}/m/${actorId}`; // public + printable
  }, [actorId]);

  if (!actorId) return null;

  const onClose = () => {
    // Go back to the owner screen/tabs that opened the QR
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    // Fallback if opened directly (no history)
    navigate(`/profile/${actorId}`, { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.10), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.12), transparent 55%), radial-gradient(900px 700px at 55% 85%, rgba(0,153,255,0.08), transparent 60%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
        color: "#fff",
      }}
    >
      {/* subtle grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(circle at 50% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0) 100%)",
          opacity: 0.9,
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 520,
          position: "relative",
          borderRadius: 22,
          padding: 1,
          background:
            "linear-gradient(135deg, rgba(0,255,240,0.22), rgba(124,58,237,0.18), rgba(0,153,255,0.16))",
          boxShadow:
            "0 24px 70px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.02) inset",
        }}
      >
        <div
          style={{
            borderRadius: 21,
            padding: 28,
            background:
              "linear-gradient(180deg, rgba(10,12,22,0.72) 0%, rgba(7,8,16,0.62) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
          }}
        >
          {/* CLOSE BUTTON */}
          <button
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
            ✕
          </button>

          {/* top accent line */}
          <div
            style={{
              height: 2,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, transparent, rgba(0,255,240,0.7), rgba(124,58,237,0.55), rgba(0,153,255,0.6), transparent)",
              opacity: 0.85,
            }}
          />

          <div style={{ marginTop: 18, textAlign: "center" }}>
            <div
              style={{
                fontWeight: 950,
                fontSize: 18,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Scan to Open Menu
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Secure public access link. Optimized for mobile browsers.
            </div>
          </div>

          <div
            style={{
              marginTop: 26,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                padding: 1,
                borderRadius: 20,
                background:
                  "linear-gradient(135deg, rgba(0,255,240,0.45), rgba(124,58,237,0.35), rgba(0,153,255,0.35))",
                boxShadow:
                  "0 18px 44px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset",
              }}
            >
              <div
                style={{
                  borderRadius: 19,
                  background: "#ffffff",
                  padding: 18,
                }}
              >
                <QRCode value={menuUrl} size={220} />
              </div>
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
              marginTop: 18,
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <a
              href={menuUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "11px 16px",
                borderRadius: 14,
                border: "1px solid rgba(0,255,240,0.22)",
                background:
                  "linear-gradient(135deg, rgba(0,255,240,0.18), rgba(124,58,237,0.14), rgba(0,153,255,0.14))",
                color: "#fff",
                fontSize: 13,
                fontWeight: 900,
                textDecoration: "none",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
              }}
            >
              Open Menu
            </a>

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(menuUrl);
                } catch (_) {}
              }}
              style={{
                padding: "11px 16px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 850,
                cursor: "pointer",
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              Copy Link
            </button>
          </div>

          <div
            style={{
              marginTop: 22,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          />

          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: "rgba(255,255,255,0.42)",
              fontSize: 12,
              letterSpacing: 2.4,
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background:
                  "radial-gradient(circle at 30% 30%, rgba(0,255,240,0.9), rgba(0,255,240,0.15) 60%, transparent 70%)",
                boxShadow: "0 0 20px rgba(0,255,240,0.25)",
              }}
            />
            Powered by Vibez Citizens
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 34,
          fontSize: 11,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)",
          textAlign: "center",
        }}
      >
        Vibez Citizens • Secure Vport Access
      </div>
    </div>
  );
}

export default VportActorMenuQrView;
