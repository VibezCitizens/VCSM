export default function AdminQuickAction({ icon: Icon, label, onClick, disabled, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 11px",
        borderRadius: 10,
        border: "1px solid var(--learning-border, #dbe3ec)",
        background: disabled ? "var(--learning-muted, #f1f5f9)" : "var(--learning-surface, #ffffff)",
        color: disabled ? "var(--learning-muted-text, #94a3b8)" : "var(--learning-text, #08111b)",
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        textAlign: "left",
        lineHeight: 1.2,
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--learning-muted, #f1f5f9)";
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--learning-surface, #ffffff)";
      }}
    >
      {Icon ? <Icon size={14} aria-hidden="true" /> : null}
      {label}
    </button>
  );
}
