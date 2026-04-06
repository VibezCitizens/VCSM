import React from "react";
import { useAdminDiagnostics } from "@/learning/administration/hooks/admin/useAdminEntry";

function DiagRow({ label, value, tone = "neutral" }) {
  const colors = {
    ok: { bg: "#f0fdf4", border: "#bbf7d0", text: "#14532d" },
    warn: { bg: "#fffbeb", border: "#fde68a", text: "#78350f" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#7f1d1d" },
    neutral: { bg: "#f8fafc", border: "#e2e8f0", text: "#1e293b" },
  };
  const c = colors[tone] ?? colors.neutral;

  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${c.border}`,
        background: c.bg,
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </span>
      <pre
        style={{
          margin: 0,
          fontSize: 12,
          color: c.text,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          fontFamily: "monospace",
        }}
      >
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function DiagnosticsResults({ diag, actorId, onRerun }) {
  const raw = diag.memberships_raw?.data ?? [];
  const activeOnly = diag.memberships_active_only?.data ?? [];
  const adminRoles = diag.memberships_admin_roles?.data ?? [];
  const orgsVisible = diag.organizations_visible?.data ?? [];
  const realmsVisible = diag.realms_visible?.data ?? [];

  const membershipTone = raw.length > 0 ? "ok" : "error";
  const activeOnlyTone =
    activeOnly.length > 0 ? "ok" : raw.length > 0 ? "warn" : "error";
  const adminRoleTone =
    adminRoles.length > 0 ? "ok" : raw.length > 0 ? "warn" : "error";

  return (
    <div
      style={{
        marginTop: 20,
        border: "1px solid #dbe3ec",
        borderRadius: 16,
        padding: 18,
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong style={{ fontSize: 13, color: "#334155" }}>
          Diagnostics — actor: {actorId}
        </strong>
        <button
          type="button"
          onClick={onRerun}
          style={{
            padding: "4px 10px",
            borderRadius: 7,
            border: "1px solid #c8d5e5",
            background: "#fff",
            color: "#0f4a72",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Re-run
        </button>
      </div>

      <DiagRow
        label="organization_memberships — raw (no filters)"
        tone={membershipTone}
        value={
          raw.length > 0
            ? raw
            : diag.memberships_raw?.error
              ? `ERROR: ${diag.memberships_raw.error}`
              : "[] — RLS is filtering all rows for this actor_id"
        }
      />

      <DiagRow
        label="organization_memberships — status = 'active' only"
        tone={activeOnlyTone}
        value={
          activeOnly.length > 0
            ? activeOnly
            : raw.length > 0
              ? `[] — rows exist but none have status='active'. Actual statuses: ${[...new Set(raw.map((r) => r.status))].join(", ")}`
              : "[] — no rows to filter"
        }
      />

      <DiagRow
        label="organization_memberships — role in [admin, staff, owner]"
        tone={adminRoleTone}
        value={
          adminRoles.length > 0
            ? adminRoles
            : raw.length > 0
              ? `[] — rows exist but none match admin/staff/owner. Actual roles: ${[...new Set(raw.map((r) => r.role))].join(", ")}`
              : "[] — no rows to filter"
        }
      />

      <DiagRow
        label="organizations — all visible to this session"
        tone={orgsVisible.length > 0 ? "ok" : "error"}
        value={
          orgsVisible.length > 0
            ? orgsVisible
            : diag.organizations_visible?.error
              ? `ERROR: ${diag.organizations_visible.error}`
              : "[] — RLS is hiding all organizations from this session"
        }
      />

      <DiagRow
        label="realms — all visible to this session"
        tone={realmsVisible.length > 0 ? "ok" : "error"}
        value={
          realmsVisible.length > 0
            ? realmsVisible
            : diag.realms_visible?.error
              ? `ERROR: ${diag.realms_visible.error}`
              : "[] — RLS is hiding all realms from this session"
        }
      />

      <DiagRow
        label="learning.actors for current auth.uid()"
        tone={
          (diag.learning_actors_for_user?.data ?? []).length > 0
            ? "ok"
            : "error"
        }
        value={diag.learning_actors_for_user}
      />

      <DiagRow
        label="actor_access row"
        tone={diag.actor_access?.data ? "ok" : "warn"}
        value={diag.actor_access}
      />

      <DiagRow
        label="Interpretation"
        tone={
          raw.length === 0
            ? "error"
            : activeOnly.length === 0
              ? "warn"
              : adminRoles.length === 0
                ? "warn"
                : "ok"
        }
        value={
          raw.length === 0
            ? "BLOCKER: organization_memberships returns [] with no filter — RLS policy current_actor_id() is not resolving to this actor, or there is no membership row at all."
            : activeOnly.length === 0
              ? `BLOCKER: membership rows exist but status is not 'active'. Fix: update status to 'active' for actor ${actorId}.`
              : adminRoles.length === 0
                ? `BLOCKER: membership rows exist and status is active but role is not in [admin, staff, owner]. Actual roles: ${[...new Set(raw.map((r) => r.role))].join(", ")}.`
                : "Data is present and should route correctly — check realm slug resolution."
        }
      />
    </div>
  );
}

export function DiagnosticsPanel({ actorId }) {
  const { diag, loading, run } = useAdminDiagnostics({ actorId });

  if (!diag && !loading) {
    return (
      <button
        type="button"
        onClick={run}
        style={{
          marginTop: 16,
          padding: "10px 16px",
          borderRadius: 10,
          border: "1px solid #c8d5e5",
          background: "#f8fafc",
          color: "#0f4a72",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Run diagnostics
      </button>
    );
  }

  if (loading) {
    return (
      <div style={{ marginTop: 16, color: "#64748b", fontSize: 14 }}>
        Running diagnostics...
      </div>
    );
  }

  return <DiagnosticsResults diag={diag} actorId={actorId} onRerun={run} />;
}

export default DiagnosticsPanel;
