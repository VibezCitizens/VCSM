export default function MetricCard({ label, value, helper }) {
  return (
    <div
      className="learning-card"
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 13, color: "var(--learning-muted-text)" }}>{label}</span>
      <strong style={{ fontSize: 28, lineHeight: 1.05 }}>{value}</strong>
      <span style={{ fontSize: 13, color: "var(--learning-muted-text)" }}>{helper}</span>
    </div>
  );
}
