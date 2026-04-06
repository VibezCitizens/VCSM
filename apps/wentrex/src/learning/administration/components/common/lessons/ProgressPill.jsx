const STATES = {
  completed: { label: "Completed", bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
  in_progress: { label: "In Progress", bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  not_started: { label: "Not Started", bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" },
};

export default function ProgressPill({ state }) {
  const config = STATES[state] ?? STATES.not_started;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </span>
  );
}
