// src/learning/layout/components/LearningShellHeader.jsx
// ============================================================
// Header bar for the LearningLayout shell.
// ============================================================

export default function LearningShellHeader({
  realmName,
  connectionLabel,
  error,
  loggingOut,
  onSignOut,
}) {
  return (
    <header className="learning-shell-header">
      <div className="learning-shell-hero">
        <div className="learning-shell-brand">
          <span className="learning-shell-eyebrow">Learning Management System</span>
          <h1 className="learning-title">
            {realmName ?? "WENTREX"}
          </h1>
        </div>

        <div className="learning-shell-meta">
          <span className="learning-badge">{connectionLabel}</span>
          <button
            type="button"
            className="learning-shell-action"
            onClick={onSignOut}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </div>

      {error ? (
        <div
          className="learning-card"
          style={{
            marginBottom: 18,
            padding: 16,
            borderColor: "#f3d3b0",
            background: "#fffaf3",
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>Workspace Status</strong>
          <div style={{ color: "var(--learning-muted-text)", lineHeight: 1.5 }}>
            {error.message}
          </div>
        </div>
      ) : null}
    </header>
  );
}
