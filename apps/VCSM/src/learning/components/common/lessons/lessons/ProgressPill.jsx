export default function ProgressPill({ state = "not_started" }) {
  const labelMap = {
    not_started: "Not started",
    in_progress: "In progress",
    completed: "Completed",
  };

  const styleMap = {
    not_started: {
      background: "#f3f4f6",
      color: "#374151",
      border: "1px solid #e5e7eb",
    },
    in_progress: {
      background: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fcd34d",
    },
    completed: {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    },
  };

  const label = labelMap[state] ?? "Unknown";
  const styles = styleMap[state] ?? styleMap.not_started;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        ...styles,
      }}
    >
      {label}
    </span>
  );
}