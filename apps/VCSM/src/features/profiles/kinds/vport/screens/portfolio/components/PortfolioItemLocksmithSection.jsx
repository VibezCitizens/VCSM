export function PortfolioItemLocksmithSection({ locksmith }) {
  const rows = [
    locksmith.jobType && { label: 'Job Type', value: locksmith.jobType.replace(/_/g, ' ') },
    locksmith.propertyType && { label: 'Property', value: locksmith.propertyType.replace(/_/g, ' ') },
    locksmith.lockType && { label: 'Lock Type', value: locksmith.lockType.replace(/_/g, ' ') },
    locksmith.hardwareBrand && { label: 'Brand', value: locksmith.hardwareBrand },
    locksmith.serviceMode && { label: 'Mode', value: locksmith.serviceMode.replace(/_/g, ' ') },
    locksmith.estimatedDurationMinutes && {
      label: 'Duration',
      value: `${locksmith.estimatedDurationMinutes} min`,
    },
  ].filter(Boolean);

  const hasBadges = locksmith.isEmergencyJob || locksmith.isSecurityUpgrade;
  if (!rows.length && !hasBadges) return null;

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.50)' }}>
        Job Details
      </div>

      {rows.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {rows.map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.50)', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', textTransform: 'capitalize' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {hasBadges ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {locksmith.isEmergencyJob ? (
            <span style={{ borderRadius: 9999, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '5px 12px', fontSize: 12, fontWeight: 600, lineHeight: 1 }}>
              Emergency Job
            </span>
          ) : null}
          {locksmith.isSecurityUpgrade ? (
            <span style={{ borderRadius: 9999, border: '1px solid rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.12)', color: '#6ee7b7', padding: '5px 12px', fontSize: 12, fontWeight: 600, lineHeight: 1 }}>
              Security Upgrade
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
