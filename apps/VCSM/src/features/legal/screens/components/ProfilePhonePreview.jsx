import { ARCHITECT } from "./howToProfileContent";

function ProfilePhoneContent() {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0a0a14", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: 36, flexShrink: 0 }} />

      <div style={{ flexShrink: 0, height: 24, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "0 10px" }}>
        <span style={{ position: "absolute", left: 10, fontSize: 12, color: "rgba(255,255,255,0.38)" }}>←</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", color: "rgba(255,255,255,0.82)", textTransform: "uppercase" }}>CITIZENS</span>
        <span style={{ position: "absolute", right: 10, width: 20, height: 20, borderRadius: 5, border: "1px solid rgba(255,255,255,0.20)", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgba(255,255,255,0.48)" }}>⊞</span>
      </div>

      <div style={{ flexShrink: 0, height: 84, overflow: "hidden", position: "relative", background: "linear-gradient(135deg, rgba(109,40,217,0.55), rgba(59,130,246,0.35))" }}>
        <img src={ARCHITECT.bannerUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(10,10,20,0.45) 100%)", pointerEvents: "none" }} />
      </div>

      <div style={{ flexShrink: 0, margin: "-16px 8px 0", borderRadius: 11, background: "rgba(14,11,28,0.94)", border: "1px solid rgba(139,92,246,0.36)", boxShadow: "0 4px 18px rgba(0,0,0,0.58), 0 0 0 0.5px rgba(139,92,246,0.10)", backdropFilter: "blur(14px)", padding: "9px", display: "flex", gap: 9, alignItems: "center", position: "relative", zIndex: 2 }}>
        <div style={{ flexShrink: 0, width: 62, height: 62, borderRadius: 9, overflow: "hidden", border: "1.5px solid rgba(139,92,246,0.40)", background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
          <img src={ARCHITECT.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.01em" }}>{ARCHITECT.displayName}</div>
          <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>@{ARCHITECT.username}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.52)", marginTop: 4, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ARCHITECT.bio}</div>
          <div style={{ marginTop: 5, display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{ARCHITECT.subscribers}</span>
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.34)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Subscribers</span>
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 8px", marginTop: 10 }}>
        {["Photos", "Videos", "Vibes", "Tags", "Friends"].map((tab) => (
          <div key={tab} style={{ flex: 1, textAlign: "center", fontSize: 8, fontWeight: tab === "Vibes" ? 700 : 400, color: tab === "Vibes" ? "#c4b5fd" : "rgba(255,255,255,0.30)", padding: "6px 0 5px", borderBottom: tab === "Vibes" ? "1.5px solid #8b5cf6" : "1.5px solid transparent", marginBottom: -1 }}>{tab}</div>
        ))}
      </div>

      <div style={{ flexShrink: 0, padding: "8px 8px 0" }}>
        <div style={{ borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", padding: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
              <img src={ARCHITECT.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>{ARCHITECT.displayName}</div>
              <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.36)", lineHeight: 1.3 }}>@{ARCHITECT.username} · Apr 25</div>
            </div>
          </div>
          <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.55 }}>
            We don&apos;t just design spaces — we shape experiences.{" "}Precision, creativity, and vision in every project.
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhoneShell({ children }) {
  return (
    <div style={{ width: 250, height: 525, borderRadius: 58, background: "linear-gradient(175deg, #1e1e2e 0%, #0d0d18 100%)", border: "1.5px solid rgba(255,255,255,0.24)", boxShadow: "0 56px 110px rgba(0,0,0,0.92), 0 0 0 0.5px rgba(255,255,255,0.04)", padding: 10, position: "relative" }}>
      <div style={{ position: "absolute", left: -3, top: 115, width: 3, height: 32, borderRadius: "2px 0 0 2px", background: "rgba(255,255,255,0.18)" }} />
      <div style={{ position: "absolute", left: -3, top: 162, width: 3, height: 57, borderRadius: "2px 0 0 2px", background: "rgba(255,255,255,0.18)" }} />
      <div style={{ position: "absolute", left: -3, top: 230, width: 3, height: 57, borderRadius: "2px 0 0 2px", background: "rgba(255,255,255,0.18)" }} />
      <div style={{ position: "absolute", right: -3, top: 188, width: 3, height: 82, borderRadius: "0 2px 2px 0", background: "rgba(255,255,255,0.18)" }} />

      <div style={{ width: "100%", height: "100%", borderRadius: 50, overflow: "hidden", background: "#000", position: "relative" }}>
        <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: 84, height: 24, borderRadius: 12, background: "#000", zIndex: 10, boxShadow: "0 0 0 1.5px rgba(255,255,255,0.07)" }} />
        {children}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, transparent 42%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 54, background: "linear-gradient(transparent, rgba(0,0,0,0.55))", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: 94, height: 5, borderRadius: 2.5, background: "rgba(255,255,255,0.42)", zIndex: 10 }} />
      </div>
    </div>
  );
}

export default function ProfilePhonePreview() {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: "6%", left: "50%", transform: "translateX(-50%)", width: 360, height: 480, background: "radial-gradient(ellipse, rgba(139,92,246,0.34) 0%, transparent 68%)", filter: "blur(50px)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <PhoneShell>
            <ProfilePhoneContent />
          </PhoneShell>
        </div>
      </div>
    </div>
  );
}
