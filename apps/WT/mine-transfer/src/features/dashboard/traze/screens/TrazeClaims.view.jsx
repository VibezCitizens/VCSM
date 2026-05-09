import { useState } from "react";
import { useClaimRequests } from "@/features/dashboard/traze/hooks/useClaimRequests";
import { Panel } from "@/features/dashboard/components/dashboardPrimitives";
import DashboardShell from "@/features/dashboard/shared/components/DashboardShell";

const CLAIM_STATUS_COLOR = {
  pending:      "var(--dash-amber)",
  needs_review: "var(--dash-amber)",
  approved:     "var(--dash-green)",
  rejected:     "var(--dash-rose)",
  cancelled:    "var(--dash-muted)",
};

const VERIFY_COLOR = {
  unverified:    "var(--dash-muted)",
  otp_sent:      "var(--dash-blue)",
  verified:      "var(--dash-green)",
  failed:        "var(--dash-rose)",
  manual_review: "var(--dash-amber)",
};

const CONFIDENCE_COLOR = {
  low:    "var(--dash-rose)",
  medium: "var(--dash-amber)",
  high:   "var(--dash-green)",
};

const BTN       = { padding: "0.25rem 0.65rem", borderRadius: "0.25rem", border: "1px solid var(--dash-line)", background: "transparent", color: "var(--dash-text)", fontSize: "0.75rem", cursor: "pointer" };
const BTN_GREEN = { ...BTN, background: "var(--dash-green)", color: "#fff", borderColor: "var(--dash-green)" };
const BTN_ROSE  = { ...BTN, color: "var(--dash-rose)" };
const BTN_AMBER = { ...BTN, color: "var(--dash-amber)", borderColor: "var(--dash-amber)" };

const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—";

function ClaimRow({ claim, onApprove, onReject, onFlag, busy }) {
  return (
    <div className="device-row" style={{ alignItems: "flex-start", gap: "0.75rem" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong>{claim.businessName}</strong>
        <span style={{ display: "block", fontSize: "0.8rem", color: "var(--dash-muted)", marginTop: "0.15rem" }}>
          /{claim.providerSlug} · {claim.ownerName} ({claim.role}) · {claim.phone || claim.email || "no contact"} · {shortDate(claim.createdAt)}
        </span>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: VERIFY_COLOR[claim.verificationStatus] ?? "var(--dash-muted)" }}>
            verify: {claim.verificationStatus.replace(/_/g, " ")}
          </span>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: CONFIDENCE_COLOR[claim.claimConfidence] ?? "var(--dash-muted)" }}>
            confidence: {claim.claimConfidence}
          </span>
          {claim.websiteUrl && (
            <a href={claim.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "var(--dash-blue)" }}>website ↗</a>
          )}
          {claim.instagramUrl && (
            <a href={claim.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "var(--dash-blue)" }}>instagram ↗</a>
          )}
        </div>
        {claim.notes && (
          <p style={{ fontSize: "0.78rem", color: "var(--dash-muted)", marginTop: "0.3rem", marginBottom: 0 }}>
            {claim.notes}
          </p>
        )}
      </div>
      <span style={{ color: CLAIM_STATUS_COLOR[claim.claimStatus] ?? "var(--dash-muted)", fontWeight: 600, fontSize: "0.78rem", flexShrink: 0 }}>
        {claim.claimStatus.replace(/_/g, " ")}
      </span>
      <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0, flexWrap: "wrap" }}>
        {claim.claimStatus === "pending" && (
          <>
            <button style={BTN_GREEN} onClick={() => onApprove(claim.id)} disabled={busy}>Approve</button>
            <button style={BTN_AMBER} onClick={() => onFlag(claim.id)}    disabled={busy}>Review</button>
            <button style={BTN_ROSE}  onClick={() => onReject(claim.id)}  disabled={busy}>Reject</button>
          </>
        )}
        {claim.claimStatus === "needs_review" && (
          <>
            <button style={BTN_GREEN} onClick={() => onApprove(claim.id)} disabled={busy}>Approve</button>
            <button style={BTN_ROSE}  onClick={() => onReject(claim.id)}  disabled={busy}>Reject</button>
          </>
        )}
        {claim.providerId && (
          <a href={`/dashboard/traze/providers/${claim.providerId}`} style={{ ...BTN, color: "var(--dash-blue)", textDecoration: "none" }}>
            Provider →
          </a>
        )}
      </div>
    </div>
  );
}

const STATUS_ORDER = ["pending", "needs_review", "approved", "rejected", "cancelled"];

export default function TrazeClaims() {
  const { status, claims, error, approve, reject, flagForReview } = useClaimRequests();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  async function handle(fn, id) {
    setBusy(true);
    setActionError(null);
    try { await fn(id); } catch (err) { setActionError(err?.message ?? "Action failed"); }
    setBusy(false);
  }

  if (status === "loading") {
    return (
      <DashboardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--dash-muted)" }}>
          Loading claim requests…
        </div>
      </DashboardShell>
    );
  }

  if (status === "error") {
    return (
      <DashboardShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--dash-rose)" }}>
          {error?.message ?? "Failed to load claim requests"}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <header className="dashboard-topbar">
        <div className="dashboard-title">
          <span>Traze · Claims</span>
          <h1>Business Claim Requests</h1>
          <p>{claims.length} claim{claims.length !== 1 ? "s" : ""} in queue</p>
        </div>
      </header>

      {actionError && (
        <div style={{ margin: "0 2rem 1rem", padding: "0.75rem 1rem", background: "rgba(173,63,88,0.1)", borderRadius: "0.5rem", color: "var(--dash-rose)", fontSize: "0.875rem" }}>
          {actionError}
        </div>
      )}

      <section className="quick-glance" aria-label="Claim queue">
        {claims.length === 0 ? (
          <Panel eyebrow="Queue" title="No claim requests" className="panel-wide">
            <p style={{ color: "var(--dash-muted)", fontSize: "0.9rem" }}>
              Claim requests from business owners will appear here when submitted via the public claim form.
            </p>
          </Panel>
        ) : (
          STATUS_ORDER.map((s) => {
            const group = claims.filter((c) => c.claimStatus === s);
            if (!group.length) return null;
            return (
              <Panel key={s} eyebrow={s.replace(/_/g, " ")} title={`${group.length} ${s.replace(/_/g, " ")}`} className="panel-wide" style={{ marginBottom: "1.25rem" }}>
                <div className="device-matrix">
                  {group.map((claim) => (
                    <ClaimRow
                      key={claim.id}
                      claim={claim}
                      onApprove={(id) => handle(approve, id)}
                      onReject={(id)  => handle(reject, id)}
                      onFlag={(id)    => handle(flagForReview, id)}
                      busy={busy}
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
