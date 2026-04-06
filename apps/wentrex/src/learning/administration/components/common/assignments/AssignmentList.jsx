function AssignmentRow({ assignment, onOpen }) {
  const isOverdue = assignment.dueAt && new Date(assignment.dueAt) < new Date();

  return (
    <button
      type="button"
      onClick={() => onOpen?.(assignment)}
      style={{
        width: "100%",
        textAlign: "left",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid var(--learning-border)",
        background: "var(--learning-surface)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--learning-text)" }}>
          {assignment.title ?? "Untitled Assignment"}
        </span>
        {assignment.dueAt ? (
          <span style={{ fontSize: 12, color: isOverdue ? "#dc2626" : "var(--learning-muted-text)" }}>
            Due {new Date(assignment.dueAt).toLocaleDateString()}
          </span>
        ) : null}
      </div>
      {assignment.pointsPossible != null ? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--learning-primary)",
            whiteSpace: "nowrap",
          }}
        >
          {assignment.pointsPossible} pts
        </span>
      ) : null}
    </button>
  );
}

export default function AssignmentList({ assignments = [], onOpenAssignment }) {
  if (!assignments.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {assignments.map((assignment) => (
        <AssignmentRow key={assignment.id} assignment={assignment} onOpen={onOpenAssignment} />
      ))}
    </div>
  );
}
