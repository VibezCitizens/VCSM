export default function KPIStat({ label, value, detail, tone = "blue", icon: Icon }) {
  return (
    <div className={`mt-kpi mt-kpi--${tone}`}>
      <div className="mt-kpi__label">
        {Icon ? <Icon size={15} strokeWidth={2.1} aria-hidden="true" /> : null}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      {detail ? <p>{detail}</p> : null}
    </div>
  );
}
