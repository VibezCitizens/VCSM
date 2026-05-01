export const SC = {
  card: {
    borderRadius: 20,
    border: "1px solid rgba(124,92,255,0.14)",
    background: "linear-gradient(160deg, rgba(20,16,38,0.98) 0%, rgba(12,10,20,0.98) 100%)",
    boxShadow: "0 12px 32px rgba(0,0,0,0.42)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 18px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  headerIcon: {
    color: "#a78bfa",
    display: "flex",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.7px",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
  },
};

export function SectionCard({ icon: Icon, title, children }) {
  return (
    <section style={SC.card}>
      <div style={SC.header}>
        {Icon ? <span style={SC.headerIcon}><Icon size={14} /></span> : null}
        <span style={SC.headerTitle}>{title}</span>
      </div>
      {children}
    </section>
  );
}
