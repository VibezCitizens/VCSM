import React, { useState } from "react";
import { useActorSummary } from "@hydration";

const ROLE_LABELS  = { owner: "Owner", manager: "Manager", staff: "Staff" };
const ROLE_COLORS  = {
  owner:   { text: "rgba(167,139,250,.9)",  bg: "rgba(139,92,246,.15)",  border: "rgba(139,92,246,.25)" },
  manager: { text: "rgba(96,165,250,.9)",   bg: "rgba(59,130,246,.12)",  border: "rgba(59,130,246,.22)" },
  staff:   { text: "rgba(148,163,184,.75)", bg: "rgba(148,163,184,.08)", border: "rgba(148,163,184,.15)" },
};
const VALID_ROLES  = ["owner", "manager", "staff"];

function MemberAvatar({ actorId, name, dimmed }) {
  const summary     = useActorSummary(actorId);
  const displayName = summary.displayName || name || "?";
  const initial     = String(displayName)[0].toUpperCase();
  return (
    <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      {summary.avatar && summary.avatar !== "/avatar.jpg" ? (
        <img
          src={summary.avatar} alt={displayName}
          className="w-full h-full object-cover"
          style={{ opacity: dimmed ? 0.4 : 1 }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-sm font-semibold"
          style={{ color: dimmed ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.6)" }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] ?? ROLE_COLORS.staff;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: ".05em",
      color: c.text, background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 5, padding: "2px 7px",
    }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function StatusDot({ status }) {
  const cfg = {
    active:   { dot: "rgba(134,239,172,.7)", text: "rgba(134,239,172,.8)", label: "Active"   },
    inactive: { dot: "rgba(148,163,184,.3)", text: "rgba(148,163,184,.4)", label: "Inactive" },
    pending:  { dot: "rgba(251,191,36,.6)",  text: "rgba(251,191,36,.7)",  label: "Pending"  },
    declined: { dot: "rgba(252,165,165,.5)", text: "rgba(252,165,165,.6)", label: "Declined" },
  }[status] ?? { dot: "rgba(148,163,184,.3)", text: "rgba(148,163,184,.4)", label: status };

  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: cfg.text, display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export function TeamMemberCard({ member, isOwner, viewerActorId, onUpdateRole, onSetStatus, onRemove }) {
  const summary     = useActorSummary(member.actor_id);
  const displayName = summary.displayName || member.name || member.actor_id;
  const username    = summary.username ? `@${summary.username}` : null;
  const isSelf      = member.actor_id && String(member.actor_id) === String(viewerActorId);
  const isPending   = member.status === "pending";
  const isDeclined  = member.status === "declined";
  const dimmed      = member.status === "inactive" || isDeclined;
  const canEdit     = isOwner && !isSelf && !isPending && !isDeclined;

  const [editing,   setEditing]   = useState(false);
  const [draftRole, setDraftRole] = useState(member.role);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSaveRole() {
    setSaving(true);
    setSaveError("");
    try {
      await onUpdateRole({ resourceId: member.resource_id, role: draftRole });
      setEditing(false);
    } catch (e) {
      setSaveError(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setDraftRole(member.role);
    setSaveError("");
    setEditing(false);
  }

  async function handleToggleStatus() {
    const next = member.status === "active" ? "inactive" : "active";
    setSaving(true);
    setSaveError("");
    try {
      await onSetStatus({ resourceId: member.resource_id, status: next });
      setEditing(false);
    } catch (e) {
      setSaveError(e?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  const borderColor = editing
    ? "rgba(139,92,246,.3)"
    : isDeclined
      ? "rgba(239,68,68,.1)"
      : dimmed
        ? "rgba(255,255,255,.05)"
        : "rgba(148,163,184,.13)";

  return (
    <div style={{
      borderRadius: 14, border: `1px solid ${borderColor}`,
      background: dimmed ? "rgba(15,23,42,.4)" : "rgba(15,23,42,.7)",
      overflow: "hidden", transition: "border-color .15s",
      opacity: dimmed ? 0.7 : 1,
    }}>
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
        <MemberAvatar actorId={member.actor_id} name={displayName} dimmed={dimmed} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: dimmed ? "rgba(255,255,255,.32)" : "rgba(255,255,255,.88)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {displayName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4, flexWrap: "wrap" }}>
            <RoleBadge role={member.role} />
            <StatusDot status={member.status} />
            {username && (
              <span style={{ fontSize: 11, color: "rgba(148,163,184,.35)" }}>{username}</span>
            )}
          </div>
        </div>

        {isOwner && !editing && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {canEdit && (
              <button
                type="button"
                onClick={() => { setDraftRole(member.role); setSaveError(""); setEditing(true); }}
                style={{
                  height: 32, padding: "0 12px", borderRadius: 8,
                  border: "1px solid rgba(148,163,184,.14)",
                  background: "rgba(255,255,255,.04)",
                  color: "rgba(148,163,184,.7)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(member)}
              style={{
                height: 32, width: 32, borderRadius: 8,
                border: "1px solid rgba(239,68,68,.1)",
                background: "none", color: "rgba(252,165,165,.35)",
                fontSize: 17, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Inline edit panel */}
      {editing && (
        <div style={{ padding: "0 14px 14px", display: "grid", gap: 10 }}>
          {saveError && (
            <div style={{ fontSize: 12, color: "#fca5a5" }}>{saveError}</div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(148,163,184,.45)", letterSpacing: ".06em", marginBottom: 6 }}>ROLE</div>
            <div style={{ display: "flex", gap: 6 }}>
              {VALID_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDraftRole(r)}
                  style={{
                    flex: 1, height: 36, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: draftRole === r ? "1px solid rgba(139,92,246,.5)" : "1px solid rgba(255,255,255,.08)",
                    background: draftRole === r ? "rgba(139,92,246,.2)" : "rgba(255,255,255,.03)",
                    color: draftRole === r ? "rgba(167,139,250,.9)" : "rgba(148,163,184,.55)",
                    transition: "all .12s",
                  }}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(148,163,184,.45)", letterSpacing: ".06em" }}>STATUS</div>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={saving}
              style={{
                height: 30, padding: "0 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                border: member.status === "active" ? "1px solid rgba(239,68,68,.2)" : "1px solid rgba(134,239,172,.2)",
                background: member.status === "active" ? "rgba(239,68,68,.08)" : "rgba(34,197,94,.08)",
                color: member.status === "active" ? "rgba(252,165,165,.7)" : "rgba(134,239,172,.7)",
                opacity: saving ? 0.5 : 1,
              }}
            >
              {member.status === "active" ? "Deactivate" : "Reactivate"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saving}
              style={{
                flex: 1, height: 38, borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: "1px solid rgba(255,255,255,.08)", background: "none",
                color: "rgba(148,163,184,.6)", opacity: saving ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRole}
              disabled={saving || draftRole === member.role}
              style={{
                flex: 2, height: 38, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer",
                border: "none",
                background: saving || draftRole === member.role
                  ? "rgba(139,92,246,.22)"
                  : "linear-gradient(135deg,rgba(139,92,246,.9),rgba(109,40,217,.9))",
                color: saving || draftRole === member.role ? "rgba(167,139,250,.4)" : "#fff",
              }}
            >
              {saving ? "Saving…" : "Save Role"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
