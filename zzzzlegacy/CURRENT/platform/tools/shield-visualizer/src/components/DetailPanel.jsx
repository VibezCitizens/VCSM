import { commandNodeTypeConfig, commandDetails } from '../data/commandGraph'

const authorityColors = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#ef4444',
  critical: '#dc2626',
}

const authorityBg = {
  low:      '#071a0f',
  medium:   '#1c1208',
  high:     '#1c0909',
  critical: '#260606',
}

export default function DetailPanel({ node }) {
  if (!node) {
    return (
      <aside style={panelBase}>
        <div style={{ fontSize: 22, color: '#1e293b' }}>◈</div>
        <div style={{ fontSize: 11, color: '#1e293b', marginTop: 6 }}>Select a command to inspect</div>
      </aside>
    )
  }

  const config = commandNodeTypeConfig[node.nodeType] || commandNodeTypeConfig.analysis
  const authority = node.riskLevel || 'medium'
  const detail = commandDetails[node.id] || commandDetails[node.label?.toLowerCase()] || null

  return (
    <aside style={{ ...panelBase, justifyContent: 'flex-start', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ width: '100%', background: '#111827', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
        <div style={{ height: 3, background: config.color }} />
        <div style={{ padding: '12px 16px 14px' }}>
          <div style={{ fontSize: 9, color: config.color, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>
            {config.label}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.35, wordBreak: 'break-word' }}>
            /{node.label}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ width: '100%', padding: '10px 0 20px' }}>

        {/* Authority badge */}
        <div style={{ padding: '0 14px 10px' }}>
          <div
            style={{
              padding: '7px 11px',
              background: authorityBg[authority],
              border: `1px solid ${authorityColors[authority]}20`,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: authorityColors[authority],
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: authorityColors[authority], fontWeight: 600 }}>
              {node.authorityLevel || 'GOVERNANCE_WRITABLE'}
            </span>
          </div>
        </div>

        {/* Command file */}
        <Section label="COMMAND FILE">
          <MonoBlock>{node.filePath}</MonoBlock>
        </Section>

        {/* Purpose */}
        {detail?.purpose && (
          <Section label="PURPOSE">
            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.7, padding: '8px 10px', background: '#0d1117', borderRadius: 6, border: '1px solid #1e293b' }}>
              {detail.purpose}
            </div>
          </Section>
        )}

        {/* Key rules */}
        {detail?.keyRules?.length > 0 && (
          <Section label={`KEY RULES (${detail.keyRules.length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {detail.keyRules.map((rule, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 10,
                    color: '#64748b',
                    padding: '5px 10px',
                    background: '#0d1117',
                    borderRadius: 5,
                    border: '1px solid #1e293b',
                    lineHeight: 1.5,
                    display: 'flex',
                    gap: 6,
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ color: config.color, flexShrink: 0, marginTop: 1 }}>›</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Notes (fallback if no detail.purpose) */}
        {!detail?.purpose && node.notes && (
          <Section label="NOTES">
            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.7, padding: '8px 10px', background: '#0d1117', borderRadius: 6, border: '1px solid #1e293b' }}>
              {node.notes}
            </div>
          </Section>
        )}

        {/* Canonical run order */}
        {detail?.canonicalRunOrder != null && (
          <Section label="CANONICAL RUN ORDER">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#0d1117', borderRadius: 6, border: '1px solid #1e293b' }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: config.color + '20', border: `1px solid ${config.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: config.color, fontWeight: 700 }}>{detail.canonicalRunOrder}</span>
              </div>
              <span style={{ fontSize: 10, color: '#475569' }}>
                {detail.canonicalRunOrder === 'Final'
                  ? 'Final release gate — runs after AvengersAssemble'
                  : `Step ${detail.canonicalRunOrder} in AvengersAssemble run order`}
              </span>
            </div>
          </Section>
        )}

        {/* Metadata */}
        {node.meta && Object.keys(node.meta).length > 0 && (
          <Section label="METADATA">
            <div style={{ background: '#0d1117', borderRadius: 6, border: '1px solid #1e293b', overflow: 'hidden' }}>
              {Object.entries(node.meta).map(([k, v], i, arr) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '5px 10px',
                    borderBottom: i < arr.length - 1 ? '1px solid #1e293b' : undefined,
                  }}
                >
                  <span style={{ fontSize: 10, color: '#475569', flexShrink: 0, paddingTop: 1 }}>
                    {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'ui-monospace, Consolas, monospace', textAlign: 'right', wordBreak: 'break-word' }}>
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </aside>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ padding: '0 14px 10px' }}>
      <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 5 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function MonoBlock({ children }) {
  return (
    <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'ui-monospace, Consolas, monospace', padding: '5px 10px', background: '#0d1117', borderRadius: 5, border: '1px solid #1e293b', wordBreak: 'break-all', lineHeight: 1.5 }}>
      {children}
    </div>
  )
}

const panelBase = {
  width: 300,
  flexShrink: 0,
  background: '#0f172a',
  borderLeft: '1px solid #1e293b',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}
