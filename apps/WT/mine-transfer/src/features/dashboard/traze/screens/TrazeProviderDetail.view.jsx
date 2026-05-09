import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, Globe, Instagram, Mail, MapPin,
  Phone, XCircle,
} from "lucide-react";
import { useTrazeProviderDetail } from "@/features/dashboard/traze/hooks/useTrazeProviderDetail";
import { Panel } from "@/features/dashboard/components/dashboardPrimitives";
import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";

const ROW = { display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.875rem", color: "var(--dash-text)", padding: "0.4rem 0", borderBottom: "1px solid var(--dash-line)" };
const MUTED = { color: "var(--dash-muted)", fontSize: "0.75rem", minWidth: 120, paddingTop: "0.1rem" };
const FLAG_ON  = { color: "var(--dash-green)", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 600 };
const FLAG_OFF = { color: "var(--dash-rose)",  display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 600 };

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={ROW}>
      <span style={MUTED}>{label}</span>
      <span style={{ flex: 1, wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function LinkRow({ label, url, icon: Icon }) {
  if (!url) return null;
  return (
    <div style={ROW}>
      <span style={MUTED}>{label}</span>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--dash-blue)", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.875rem" }}>
        <Icon size={14} />{url}
      </a>
    </div>
  );
}

export default function TrazeProviderDetail() {
  const { providerId } = useParams();
  const { status, provider, error } = useTrazeProviderDetail(providerId);

  if (status === "loading") {
    return (
      <DashboardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--dash-muted)" }}>
          Loading provider…
        </div>
      </DashboardShell>
    );
  }

  if (status === "error") {
    return (
      <DashboardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--dash-rose)" }}>
          {error?.message ?? "Failed to load provider"}
        </div>
      </DashboardShell>
    );
  }

  const { displayName, slug, businessType, shortBio, phone, email, websiteUrl,
          addressText, lat, lng, avatarUrl, googleMapsUrl, instagramUrl, facebookUrl,
          priceNotes, claimStatus, isActive, isIndexable, createdAt } = provider;

  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Traze · Providers</span>
          <h1>{displayName}</h1>
          <p>/{slug} · {businessType || "no type"}</p>
        </div>
        <div className="topbar-actions">
          <Link to="/dashboard/traze/providers" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", color: "var(--dash-muted)", textDecoration: "none" }}>
            <ArrowLeft size={16} /> Back to providers
          </Link>
        </div>
      </header>

      <section className="quick-glance" aria-label="Provider detail">
        {/* Status flags */}
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <span style={isActive    ? FLAG_ON : FLAG_OFF}>{isActive    ? <CheckCircle size={16} /> : <XCircle size={16} />}Active</span>
          <span style={isIndexable ? FLAG_ON : FLAG_OFF}>{isIndexable ? <CheckCircle size={16} /> : <XCircle size={16} />}Indexable</span>
          <span style={{ fontSize: "0.82rem", color: "var(--dash-muted)" }}>Claim: <strong>{claimStatus}</strong></span>
        </div>

        <div className="dashboard-grid dashboard-grid--primary">
          <Panel eyebrow="Profile" title="Business Info" className="panel-wide">
            {avatarUrl && (
              <img src={avatarUrl} alt={displayName} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "0.5rem", marginBottom: "1rem", border: "1px solid var(--dash-line)" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            )}
            {shortBio && <p style={{ fontSize: "0.875rem", color: "var(--dash-muted)", marginBottom: "1rem", lineHeight: 1.6 }}>{shortBio}</p>}
            <InfoRow label="Business type" value={businessType} />
            <InfoRow label="Created"       value={createdAt ? new Date(createdAt).toLocaleDateString("en", { dateStyle: "medium" }) : null} />
            <InfoRow label="Address"       value={addressText} />
            <InfoRow label="Coordinates"   value={lat && lng ? `${lat}, ${lng}` : null} />
            <InfoRow label="Price notes"   value={priceNotes} />
          </Panel>

          <Panel eyebrow="Contact" title="Contact & Links">
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              <LinkRow label="Phone"      url={phone ? `tel:${phone}` : null}  icon={Phone}   />
              <LinkRow label="Email"      url={email ? `mailto:${email}` : null} icon={Mail} />
              <LinkRow label="Website"    url={websiteUrl}    icon={Globe}      />
              <LinkRow label="Google Maps" url={googleMapsUrl} icon={MapPin}   />
              <LinkRow label="Instagram"  url={instagramUrl}  icon={Instagram}  />
              <LinkRow label="Facebook"   url={facebookUrl}   icon={Globe}      />
            </div>
          </Panel>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <Link to="/dashboard/traze/intake" style={{ fontSize: "0.875rem", color: "var(--dash-muted)" }}>
            ← Back to intake queue
          </Link>
        </div>
      </section>
    </DashboardShell>
  );
}
