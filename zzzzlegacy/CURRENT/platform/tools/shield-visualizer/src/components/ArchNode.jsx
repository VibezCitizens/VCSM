import { Handle, Position } from 'reactflow'
import { commandNodeTypeConfig } from '../data/commandGraph'
import { nodeTypeConfig as feedNodeTypeConfig, runtimeStatusConfig } from '../data/graph'

const allConfigs = { ...feedNodeTypeConfig, ...commandNodeTypeConfig }

const riskColors = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#ef4444',
  critical: '#dc2626',
}

export default function ArchNode({ data, selected }) {
  const config = allConfigs[data.nodeType] || commandNodeTypeConfig.analysis
  const isCommand = Boolean(data.authorityLevel)
  const reviewCount = data.pendingReviews?.length ?? 0
  const rtStatus = runtimeStatusConfig[data.runtimeStatus] || runtimeStatusConfig.UNVERIFIED

  return (
    <div
      style={{
        position: 'relative',
        background: config.bg,
        border: `1px solid ${selected ? config.color + '90' : config.border}`,
        borderRadius: 8,
        width: 200,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: selected
          ? `0 0 0 2px ${config.color}35, 0 4px 20px rgba(0,0,0,0.6)`
          : '0 2px 10px rgba(0,0,0,0.45)',
        cursor: 'pointer',
        transition: 'box-shadow 0.12s ease, border-color 0.12s ease',
      }}
    >
      {/* Pending review badge (feed nodes only) */}
      {!isCommand && reviewCount > 0 && (
        <div
          title={`${reviewCount} pending review${reviewCount > 1 ? 's' : ''}: ${data.pendingReviews.join(', ')}`}
          style={{
            position: 'absolute',
            top: -6, right: -6,
            minWidth: 16, height: 16,
            borderRadius: 8,
            background: '#f59e0b',
            border: '2px solid #09090b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8, fontWeight: 700, color: '#0d0d0d',
            zIndex: 10, padding: '0 3px',
          }}
        >
          {reviewCount}
        </div>
      )}

      {/* Color bar */}
      <div style={{ background: config.color, height: 3, borderRadius: '7px 7px 0 0' }} />

      <div style={{ padding: '8px 11px 10px' }}>
        {/* Category / layer label */}
        <div style={{ fontSize: 9, color: config.color, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>
          {config.label}
        </div>

        {/* Node label */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.35, marginBottom: 5, wordBreak: 'break-word' }}>
          {isCommand ? `/${data.label}` : data.label}
        </div>

        {/* File path */}
        <div
          style={{ fontSize: 9, color: '#374151', fontFamily: 'ui-monospace, Consolas, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 7 }}
          title={data.filePath}
        >
          {data.filePath}
        </div>

        {/* Bottom indicator row */}
        {isCommand ? (
          /* Authority indicator for command nodes */
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: riskColors[data.riskLevel] || riskColors.medium, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: riskColors[data.riskLevel] || riskColors.medium, letterSpacing: '0.03em' }}>
              {data.authorityLevel}
            </span>
          </div>
        ) : (
          /* Risk + runtime status for feed nodes */
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: riskColors[data.riskLevel] || riskColors.low, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: riskColors[data.riskLevel] || riskColors.low, textTransform: 'capitalize' }}>
                {data.riskLevel}
              </span>
            </div>
            {data.runtimeStatus && (
              <>
                <span style={{ fontSize: 9, color: '#1e293b' }}>·</span>
                <span style={{ fontSize: 9, color: rtStatus.color }}>{rtStatus.label}</span>
              </>
            )}
          </div>
        )}

        {/* Pending review chips */}
        {!isCommand && reviewCount > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 6 }}>
            {data.pendingReviews.map((review) => (
              <span
                key={review}
                style={{ fontSize: 8, color: '#f59e0b', background: '#1c1208', border: '1px solid #f59e0b25', borderRadius: 3, padding: '1px 5px', fontWeight: 600, letterSpacing: '0.04em' }}
              >
                ⚠ {review}
              </span>
            ))}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} style={{ background: config.color, width: 8, height: 8, border: `2px solid ${config.bg}` }} />
      <Handle type="source" position={Position.Bottom} style={{ background: config.color, width: 8, height: 8, border: `2px solid ${config.bg}` }} />
    </div>
  )
}
