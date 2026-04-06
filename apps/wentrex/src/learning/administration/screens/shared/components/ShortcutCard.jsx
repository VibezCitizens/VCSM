export default function ShortcutCard({ icon: Icon, title, description, actionLabel, onOpen }) {
  return (
    <div
      className="learning-card"
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: "rgba(15, 74, 114, 0.08)",
          color: "var(--learning-primary)",
        }}
      >
        <Icon size={20} />
      </div>
      <div>
        <h3 style={{ margin: "0 0 8px" }}>{title}</h3>
        <p style={{ margin: 0, color: "var(--learning-muted-text)", lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
      <button
        type="button"
        className="learning-button learning-button-secondary"
        onClick={onOpen}
        style={{ marginTop: "auto" }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
