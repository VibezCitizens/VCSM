function StatRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        padding: "10px 0",
        borderBottom: "1px solid var(--learning-border)",
        fontSize: 14,
      }}
    >
      <span style={{ color: "var(--learning-muted-text)" }}>{label}</span>
      <strong style={{ color: "var(--learning-text)" }}>{value}</strong>
    </div>
  );
}

export default function CourseSidebar({ course, assignmentCount, moduleCount, progressPercent }) {
  return (
    <div
      className="learning-card"
      style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}
    >
      <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700 }}>Course Info</h3>

      {progressPercent != null ? (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            <span style={{ color: "var(--learning-muted-text)" }}>Progress</span>
            <span style={{ fontWeight: 700, color: "var(--learning-primary)" }}>{progressPercent}%</span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "var(--learning-muted)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: "var(--learning-primary)",
                borderRadius: 999,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      ) : null}

      <StatRow label="Modules" value={moduleCount ?? 0} />
      <StatRow label="Assignments" value={assignmentCount ?? 0} />
      {course.status ? <StatRow label="Status" value={course.status} /> : null}
      {course.visibility ? <StatRow label="Visibility" value={course.visibility} /> : null}
    </div>
  );
}
