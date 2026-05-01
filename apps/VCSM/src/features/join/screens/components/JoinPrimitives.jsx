import { s } from "./joinStyles";

export function Page({ children }) {
  return (
    <div style={s.page}>
      <div style={s.card}>{children}</div>
    </div>
  );
}

export function Spinner() {
  return <div style={s.spinner} />;
}

export function InputField({ label, value, onChange, type = "text", placeholder, autoComplete }) {
  return (
    <div style={s.fieldWrap}>
      <label style={s.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={s.input}
      />
    </div>
  );
}

export function CheckRow({ checked, onChange, label, children }) {
  return (
    <label style={s.checkRow}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={s.checkbox}
      />
      <span style={s.checkLabel}>{children || label}</span>
    </label>
  );
}

export function LockedVportTypeRow() {
  return (
    <div style={s.lockedRow}>
      <div style={s.lockedLabel}>VPORT type</div>
      <div style={s.lockedValue}>Barber</div>
      <div style={s.lockedBadge}>Locked</div>
    </div>
  );
}
