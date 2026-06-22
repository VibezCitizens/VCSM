import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import VportBackButton from "@/shared/ui/dashboard/BackButton";
import { createVportDashboardShellStyles } from "@/features/vportDashboard/screens/styles/vportDashboardShellStyles";
import { useVportLeads } from "@/features/vportDashboard/dashboard/cards/leads/hooks/useVportLeads";
import {
  formatLeadDate,
  formatSourceLabel,
  previewMessage,
} from "@/features/vportDashboard/dashboard/cards/leads/model/vportLead.display.model";

export default function VportDashboardLeadsView({ actorId }) {
  const navigate = useNavigate();
  const isDesktop = useDesktopBreakpoint();
  const shell = createVportDashboardShellStyles({
    isDesktop,
    maxWidthDesktop: 1100,
  });

  const {
    activeLeads,
    loading,
    error,
    contactedCount,
    contactedLeads,
    contactedLoading,
    contactedLoadedOnce,
    actionError,
    busyLeadId,
    loadContacted,
    markContacted,
    deleteLead,
  } = useVportLeads(actorId);

  // Contacted section always starts collapsed (even when active count is 0).
  // Contacted rows are not fetched or rendered until the user opens it.
  const [contactedExpanded, setContactedExpanded] = useState(false);

  const onToggleContacted = () => {
    const opening = !contactedExpanded;
    setContactedExpanded(opening);
    if (opening && !contactedLoadedOnce) void loadContacted();
  };

  const totalCount = activeLeads.length + contactedCount;

  const renderLeadCard = (lead) => {
    const isBusy = busyLeadId === lead.id;
    const contactLine = [lead.phone, lead.email].filter(Boolean).join(" • ");
    const sourceLabel = formatSourceLabel(lead.source);
    const muted = lead.isContacted;

    return (
      <article
        key={lead.id}
        style={{
          border: muted
            ? "1px solid rgba(148,163,184,0.1)"
            : "1px solid rgba(148,163,184,0.2)",
          borderRadius: 16,
          padding: "14px 14px 12px",
          background: muted
            ? "rgba(15,23,42,0.4)"
            : "linear-gradient(180deg, rgba(20,25,42,0.78), rgba(9,12,22,0.74))",
          opacity: muted ? 0.72 : 1,
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
              {lead.name}
            </div>
            <div style={{ marginTop: 3, color: "rgba(203,213,225,0.78)", fontSize: 12 }}>
              {contactLine || "No phone or email"}
            </div>
          </div>
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: lead.isContacted ? "#86efac" : "#c4b5fd",
              border: lead.isContacted
                ? "1px solid rgba(74,222,128,0.35)"
                : "1px solid rgba(167,139,250,0.35)",
              background: lead.isContacted
                ? "rgba(22,101,52,0.35)"
                : "rgba(76,29,149,0.28)",
            }}
          >
            {lead.isContacted ? "Contacted" : "New"}
          </span>
        </div>

        <p style={{ margin: 0, color: "rgba(226,232,240,0.88)", fontSize: 13, lineHeight: 1.5 }}>
          {previewMessage(lead.message)}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            color: "rgba(148,163,184,0.9)",
            fontSize: 11,
          }}
        >
          <span>{formatLeadDate(lead.createdAt)}</span>
          <span>Source: {sourceLabel}</span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => markContacted(lead)}
            disabled={isBusy || lead.isContacted}
            style={{
              borderRadius: 10,
              border: "1px solid rgba(167,139,250,0.45)",
              background: "rgba(91,33,182,0.3)",
              color: "#ede9fe",
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 600,
              opacity: isBusy || lead.isContacted ? 0.5 : 1,
              cursor: isBusy || lead.isContacted ? "not-allowed" : "pointer",
            }}
          >
            {lead.isContacted ? "Marked contacted" : isBusy ? "Updating..." : "Mark as contacted"}
          </button>

          <button
            type="button"
            onClick={() => deleteLead(lead.id)}
            disabled={isBusy}
            style={{
              borderRadius: 10,
              border: "1px solid rgba(248,113,113,0.4)",
              background: "rgba(127,29,29,0.28)",
              color: "#fecaca",
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 600,
              opacity: isBusy ? 0.5 : 1,
              cursor: isBusy ? "not-allowed" : "pointer",
            }}
          >
            {isBusy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </article>
    );
  };

  const sectionLabelStyle = {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(203,213,225,0.7)",
    fontWeight: 700,
  };

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton
              isDesktop={isDesktop}
              onClick={() => navigate(`/actor/${actorId}/dashboard`)}
            />
            <div style={shell.title}>LEADS</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16, display: "grid", gap: 12 }}>
            <div
              style={{
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 16,
                padding: "14px 16px",
                background: "rgba(15,23,42,0.5)",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {[
                { label: "Total", value: totalCount, color: "#f8fafc" },
                { label: "Active", value: activeLeads.length, color: "#c4b5fd" },
                { label: "Contacted", value: contactedCount, color: "#86efac" },
              ].map((stat, idx) => (
                <div
                  key={stat.label}
                  style={{
                    display: "grid",
                    gap: 4,
                    paddingLeft: idx === 0 ? 0 : 12,
                    borderLeft: idx === 0 ? "none" : "1px solid rgba(148,163,184,0.16)",
                  }}
                >
                  <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(203,213,225,0.7)" }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>
                    {loading ? "..." : stat.value}
                  </div>
                </div>
              ))}
            </div>

            {error ? (
              <div
                style={{
                  border: "1px solid rgba(248,113,113,0.35)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  color: "#fecaca",
                  background: "rgba(127,29,29,0.22)",
                  fontSize: 13,
                }}
              >
                {import.meta.env.DEV ? error : "Unable to load leads right now."}
              </div>
            ) : null}

            {actionError ? (
              <div
                style={{
                  border: "1px solid rgba(248,113,113,0.35)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  color: "#fecaca",
                  background: "rgba(127,29,29,0.22)",
                  fontSize: 13,
                }}
              >
                {actionError}
              </div>
            ) : null}

            {loading ? (
              <SkeletonCardList count={3} showBody />
            ) : totalCount === 0 ? (
              <div
                style={{
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: 16,
                  padding: "16px 14px",
                  background: "rgba(15,23,42,0.4)",
                  color: "rgba(226,232,240,0.75)",
                  fontSize: 14,
                }}
              >
                No leads yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 20 }}>
                <section style={{ display: "grid", gap: 12 }}>
                  <div style={sectionLabelStyle}>
                    Active Leads ({activeLeads.length})
                  </div>
                  {activeLeads.length === 0 ? (
                    <div
                      style={{
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: 16,
                        padding: "22px 16px",
                        background: "rgba(15,23,42,0.4)",
                        textAlign: "center",
                        display: "grid",
                        gap: 4,
                      }}
                    >
                      <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 15 }}>
                        You’re all caught up.
                      </div>
                      <div style={{ color: "rgba(203,213,225,0.7)", fontSize: 13 }}>
                        No leads need follow-up right now.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {activeLeads.map(renderLeadCard)}
                    </div>
                  )}
                </section>

                {contactedCount > 0 ? (
                  <section style={{ display: "grid", gap: 12 }}>
                    <button
                      type="button"
                      onClick={onToggleContacted}
                      aria-expanded={contactedExpanded}
                      style={{
                        ...sectionLabelStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        color: "rgba(148,163,184,0.85)",
                      }}
                    >
                      <span>Contacted Leads ({contactedCount})</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(148,163,184,0.7)" }}>
                        {contactedExpanded ? "Hide" : "Show"}
                      </span>
                    </button>
                    {contactedExpanded ? (
                      contactedLoading && !contactedLoadedOnce ? (
                        <div
                          style={{
                            border: "1px solid rgba(148,163,184,0.12)",
                            borderRadius: 16,
                            padding: "16px 14px",
                            background: "rgba(15,23,42,0.35)",
                            color: "rgba(203,213,225,0.7)",
                            fontSize: 13,
                          }}
                        >
                          Loading contacted leads…
                        </div>
                      ) : contactedLoadedOnce && contactedLeads.length === 0 ? (
                        <div
                          style={{
                            border: "1px solid rgba(148,163,184,0.12)",
                            borderRadius: 16,
                            padding: "16px 14px",
                            background: "rgba(15,23,42,0.35)",
                            color: "rgba(203,213,225,0.7)",
                            fontSize: 13,
                          }}
                        >
                          No contacted leads yet.
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: 12 }}>
                          {contactedLeads.map(renderLeadCard)}
                        </div>
                      )
                    ) : null}
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          overflow: "auto",
          background: "#000",
        }}
      >
        {content}
      </div>,
      document.body
    );
  }

  return content;
}
