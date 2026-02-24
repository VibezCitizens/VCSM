import React from "react";

const CARD_BASE_STYLE = {
  borderRadius: 20,
  border: "1px solid rgba(148,163,184,0.2)",
  background: "linear-gradient(180deg, rgba(20,25,42,0.82), rgba(9,12,22,0.78))",
  padding: 20,
  minHeight: 138,
  boxShadow: "0 14px 35px rgba(0,0,0,0.42)",
  userSelect: "none",
};

const DESKTOP_ONLY_BADGE_STYLE = {
  marginTop: 10,
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.75)",
  width: "fit-content",
};

export function DashboardCard({ title, body, onClick, locked = false }) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      style={{
        ...CARD_BASE_STYLE,
        width: "100%",
        textAlign: "left",
        color: "#e2e8f0",
        appearance: "none",
        WebkitAppearance: "none",
        cursor: locked ? "not-allowed" : "pointer",
        opacity: locked ? 0.55 : 1,
      }}
      aria-disabled={locked}
    >
      <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: "#f8fafc" }}>
        {title}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: "rgba(203,213,225,0.88)", lineHeight: 1.45 }}>
        {body}
      </div>
      {locked ? <div style={DESKTOP_ONLY_BADGE_STYLE}>Desktop only</div> : null}
    </button>
  );
}

export function VportBannerHeader({ profile, headerLoading }) {
  const bannerImage = profile.bannerUrl?.trim() ? `url(${profile.bannerUrl})` : null;
  const avatarImage = profile.avatarUrl?.trim() ? `url(${profile.avatarUrl})` : null;

  return (
    <>
      <div
        style={{
          height: 170,
          position: "relative",
          backgroundColor: "#070812",
          backgroundImage: bannerImage
            ? bannerImage
            : "radial-gradient(900px 340px at 18% 20%, rgba(0,255,240,0.35), transparent 60%), radial-gradient(900px 340px at 82% 30%, rgba(124,58,237,0.30), transparent 62%), radial-gradient(700px 340px at 55% 90%, rgba(0,153,255,0.22), transparent 60%), linear-gradient(180deg, rgba(10,12,22,0.95), rgba(5,6,11,0.92))",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: bannerImage ? "saturate(1.05) contrast(1.05)" : "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: 18,
          display: "flex",
          gap: 14,
          alignItems: "center",
          marginTop: -34,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: "#0b0b0f",
            backgroundImage: avatarImage ? avatarImage : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.65)",
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            color: "rgba(255,255,255,0.65)",
            fontWeight: 950,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {!avatarImage ? "VC" : null}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: 0.6 }}>
            {headerLoading ? "Loading..." : profile.displayName}
          </div>
          {profile.username?.trim() ? (
            <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.58)", letterSpacing: 1.2 }}>
              @{profile.username}
            </div>
          ) : null}
          {profile.tagline?.trim() ? (
            <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.58)" }}>{profile.tagline}</div>
          ) : null}
        </div>
      </div>
    </>
  );
}
