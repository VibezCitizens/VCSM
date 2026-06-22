import { useEffect } from "react";
import { Link } from "react-router-dom";
import { setFunnelSource } from '@/shared/lib/funnelSource'
import PublicNavbar, { PUBLIC_NAV_HEIGHT } from "@/shared/components/PublicNavbar";
import ProfilePhonePreview from "./components/ProfilePhonePreview";
import {
  PAGE_TITLE, PAGE_DESCRIPTION, PAGE_URL, CTA_HREF,
  VALUE_CARDS, STEPS, TRUST_CARDS,
} from "./components/howToProfileContent";

function setMeta(property, content, isName = false) {
  const attr = isName ? "name" : "property";
  let el = document.head.querySelector(`meta[${attr}="${property}"]`);
  const created = !el;
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, property); document.head.appendChild(el); }
  const prev = el.getAttribute("content");
  el.setAttribute("content", content);
  return () => { if (created) el.remove(); else el.setAttribute("content", prev || ""); };
}

export default function HowToCreateProfileScreen() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = PAGE_TITLE;
    const cleanups = [
      setMeta("description", PAGE_DESCRIPTION, true),
      setMeta("og:title", PAGE_TITLE),
      setMeta("og:description", PAGE_DESCRIPTION),
      setMeta("og:url", PAGE_URL),
    ];
    setFunnelSource('how_to_profile')
    return () => { document.title = prevTitle; cleanups.forEach((fn) => fn()); };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#060609", color: "#fff", paddingTop: `calc(${PUBLIC_NAV_HEIGHT}px + env(safe-area-inset-top))` }}>
      <PublicNavbar />

      {/* ── HERO ── */}
      <div style={{ position: "relative", padding: "48px 20px 60px", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)", width: 700, height: 500, background: "radial-gradient(ellipse, rgba(139,92,246,0.26) 0%, rgba(59,130,246,0.08) 45%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "inline-block", marginBottom: 20, padding: "5px 14px", borderRadius: 9999, border: "1px solid rgba(139,92,246,0.38)", background: "rgba(139,92,246,0.10)", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c4b5fd" }}>
            Vibez Citizens
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(34px, 9vw, 52px)", fontWeight: 800, letterSpacing: "-0.028em", lineHeight: 1.08, background: "linear-gradient(140deg, #fff 30%, rgba(196,181,253,0.85) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Your identity on Vibez Citizens
          </h1>
          <p style={{ margin: "18px auto 0", maxWidth: 380, fontSize: 16, lineHeight: 1.65, color: "rgba(255,255,255,0.50)" }}>
            One profile that connects everything — your Vibes, Vox threads, VPORTs, and presence across the platform.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 32 }}>
            <Link to={CTA_HREF} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", borderRadius: 14, background: "linear-gradient(135deg, #6d28d9, #8b5cf6)", boxShadow: "0 14px 36px rgba(139,92,246,0.38)", fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none" }}>
              Create your profile
            </Link>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "14px 22px", borderRadius: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>
              Explore profiles
            </Link>
          </div>
        </div>
      </div>

      {/* ── LIVE PREVIEW ── */}
      <div style={{ padding: "0 20px 72px", textAlign: "center" }}>
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>Live preview</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Your citizen profile, instantly live</div>
          <p style={{ marginTop: 10, fontSize: 14, color: "rgba(255,255,255,0.40)", maxWidth: 360, marginLeft: "auto", marginRight: "auto", lineHeight: 1.65 }}>
            Show who you are, connect with people, and carry your identity across Vibez Citizens.
          </p>
        </div>
        <ProfilePhonePreview />
      </div>

      {/* ── VALUE CARDS ── */}
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 20px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>Why create a profile</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Everything in one place</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {VALUE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} style={{ borderRadius: 16, border: `1px solid ${card.accent}22`, background: `${card.accent}0d`, padding: "22px 18px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${card.accent}20`, border: `1px solid ${card.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={17} style={{ color: card.accent }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 7 }}>{card.label}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.50)", lineHeight: 1.65 }}>{card.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 20px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>How it works</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Get started in minutes</div>
        </div>
        <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)", padding: "32px 28px" }}>
          <div className="hidden sm:flex items-start justify-between gap-2" style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: 12, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.38) 20%, rgba(139,92,246,0.38) 80%, transparent)" }} />
            {STEPS.map((step) => (
              <div key={step.num} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1, padding: "0 4px" }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.30)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#c4b5fd", letterSpacing: "0.02em", marginBottom: 12 }}>{step.num}</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{step.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.55 }}>{step.desc}</div>
              </div>
            ))}
          </div>
          <div className="flex sm:hidden flex-col" style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 12, top: 26, bottom: 0, width: 1, background: "linear-gradient(to bottom, rgba(139,92,246,0.38) 0%, rgba(139,92,246,0.04) 100%)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {STEPS.map((step) => (
                <div key={step.num} style={{ display: "flex", gap: 18, alignItems: "flex-start", position: "relative" }}>
                  <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#c4b5fd", letterSpacing: "0.02em", position: "relative", zIndex: 1 }}>{step.num}</span>
                  <div style={{ paddingTop: 3 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{step.label}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.46)", lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TRUST SECTION ── */}
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 20px 64px" }}>
        <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)", padding: "40px 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", marginBottom: 12 }}>Built for real connections</div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.46)", lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
              Profiles are the foundation of Vibez Citizens. They help people show who they are, connect with others, and build presence across the platform.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TRUST_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} style={{ borderRadius: 14, border: "1px solid rgba(139,92,246,0.14)", background: "rgba(139,92,246,0.07)", padding: "20px 16px" }}>
                  <Icon size={16} style={{ color: "#a78bfa", marginBottom: 10, display: "block" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{card.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.46)", lineHeight: 1.6 }}>{card.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 20px 72px" }}>
        <div style={{ borderRadius: 20, border: "1px solid rgba(139,92,246,0.18)", background: "rgba(139,92,246,0.055)", padding: "52px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 420, height: 220, background: "radial-gradient(ellipse, rgba(139,92,246,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff" }}>Start your identity today</h2>
            <p style={{ margin: "12px 0 0", fontSize: 15, color: "rgba(255,255,255,0.42)" }}>Free forever. No friction. Just you.</p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 32 }}>
              <Link to={CTA_HREF} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 14, background: "linear-gradient(135deg, #6d28d9, #8b5cf6)", boxShadow: "0 12px 28px rgba(139,92,246,0.36)", fontSize: 15, fontWeight: 700, color: "#fff", textDecoration: "none" }}>
                Create your profile
              </Link>
              <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "14px 24px", borderRadius: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
