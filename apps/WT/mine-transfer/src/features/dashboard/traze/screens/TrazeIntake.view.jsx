import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useIntakeLeads } from "@/features/dashboard/traze/hooks/useIntakeLeads";
import { Panel } from "@/features/dashboard/components/dashboardPrimitives";
import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";

const STATUS_COLOR = {
  draft:        "var(--dash-muted)",
  needs_review: "var(--dash-amber)",
  approved:     "var(--dash-green)",
  rejected:     "var(--dash-rose)",
  imported:     "var(--dash-blue)",
};

const BTN      = { padding: "0.25rem 0.65rem", borderRadius: "0.25rem", border: "1px solid var(--dash-line)", background: "transparent", color: "var(--dash-text)", fontSize: "0.75rem", cursor: "pointer" };
const BTN_GREEN = { ...BTN, background: "var(--dash-green)", color: "#fff", borderColor: "var(--dash-green)" };
const BTN_ROSE  = { ...BTN, color: "var(--dash-rose)" };

const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—";

function leadLocation(lead) {
  const parts = [lead.cityName, lead.stateCode, lead.countryCode].filter((part) => part && part !== "—");
  const location = parts.length ? parts.join(", ") : "No city";
  return lead.zipCode ? `${location} ${lead.zipCode}` : location;
}

function LeadRow({ lead, onApprove, onReject, onConvert, converting }) {
  return (
    <div className="device-row" style={{ alignItems: "flex-start", gap: "0.75rem" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong>{lead.businessName}</strong>
        <span style={{ display: "block", fontSize: "0.8rem", color: "var(--dash-muted)", marginTop: "0.15rem" }}>
          {leadLocation(lead)} · {lead.serviceName} · {lead.phone || "no phone"} · {shortDate(lead.createdAt)}
        </span>
        {!lead.hasLatLng && (
          <span style={{ fontSize: "0.72rem", color: "var(--dash-amber)", display: "block", marginTop: "0.15rem" }}>
            No coordinates
          </span>
        )}
        {!lead.canPublish && (
          <span style={{ fontSize: "0.72rem", color: "var(--dash-rose)", display: "block", marginTop: "0.15rem" }}>
            Missing city/country — cannot publish
          </span>
        )}
      </div>
      <span style={{ color: STATUS_COLOR[lead.status] ?? "var(--dash-muted)", fontWeight: 600, fontSize: "0.78rem", flexShrink: 0 }}>
        {lead.status.replace("_", " ")}
      </span>
      <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0, flexWrap: "wrap" }}>
        {(lead.status === "draft" || lead.status === "needs_review") && (
          <>
            <button style={BTN} onClick={() => onApprove(lead.id)}>Approve</button>
            <button style={BTN_ROSE} onClick={() => onReject(lead.id)}>Reject</button>
          </>
        )}
        {!lead.isImported && (
          <button
            style={BTN_GREEN}
            onClick={() => onConvert(lead.id)}
            disabled={converting === lead.id}
          >
            {converting === lead.id ? "Creating…" : "Create provider"}
          </button>
        )}
        {lead.isImported && lead.importedProviderId && (
          <a
            href={`/dashboard/traze/providers/${lead.importedProviderId}`}
            style={{ ...BTN, color: "var(--dash-blue)", textDecoration: "none" }}
          >
            View provider →
          </a>
        )}
      </div>
    </div>
  );
}

const STATUS_ORDER = ["draft", "needs_review", "approved", "imported", "rejected"];

export default function TrazeIntake() {
  const navigate = useNavigate();
  const { status, leads, error, approve, reject, convert } = useIntakeLeads();
  const [converting, setConverting] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function handleConvert(leadId) {
    setConverting(leadId);
    setActionError(null);
    try {
      const provider = await convert(leadId, { isIndexable: true });
      navigate(`/dashboard/traze/providers/${provider.id}`);
    } catch (err) {
      setActionError(err?.message ?? "Failed to create provider");
      setConverting(null);
    }
  }

  if (status === "loading") {
    return (
      <DashboardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--dash-muted)" }}>
          Loading intake queue…
        </div>
      </DashboardShell>
    );
  }

  if (status === "error") {
    return (
      <DashboardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--dash-rose)" }}>
          {error?.message ?? "Failed to load intake queue"}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Traze · Intake</span>
          <h1>Business Intake Leads</h1>
          <p>{leads.length} lead{leads.length !== 1 ? "s" : ""} in queue</p>
        </div>
        <div className="topbar-actions">
          <button
            onClick={() => navigate("/dashboard/traze/providers/new")}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.1rem", fontSize: "0.875rem", fontWeight: 600, borderRadius: "0.5rem", background: "var(--dash-green)", color: "#fff", border: "none", cursor: "pointer" }}
          >
            <Plus size={16} />
            New business
          </button>
        </div>
      </header>

      {actionError && (
        <div style={{ margin: "0 2rem 1rem", padding: "0.75rem 1rem", background: "rgba(173,63,88,0.1)", borderRadius: "0.5rem", color: "var(--dash-rose)", fontSize: "0.875rem" }}>
          {actionError}
        </div>
      )}

      <section className="quick-glance" aria-label="Intake queue">
        {leads.length === 0 ? (
          <Panel eyebrow="Queue" title="No intake leads yet" className="panel-wide">
            <p style={{ color: "var(--dash-muted)", fontSize: "0.9rem" }}>
              Click <strong>New business</strong> to add the first intake lead.
            </p>
          </Panel>
        ) : (
          STATUS_ORDER.map((s) => {
            const group = leads.filter((l) => l.status === s);
            if (!group.length) return null;
            return (
              <Panel key={s} eyebrow={s.replace("_", " ")} title={`${group.length} ${s.replace("_", " ")}`} className="panel-wide" style={{ marginBottom: "1.25rem" }}>
                <div className="device-matrix">
                  {group.map((lead) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      onApprove={approve}
                      onReject={reject}
                      onConvert={handleConvert}
                      converting={converting}
                    />
                  ))}
                </div>
              </Panel>
            );
          })
        )}
      </section>
    </DashboardShell>
  );
}
