import { useState } from 'react'
import { commandNodeTypeConfig, commandDetails } from '../data/commandGraph'
import { nodeTypeConfig as feedNodeTypeConfig, reviewConfig, confidenceConfig, runtimeStatusConfig } from '../data/graph'

const PANEL_WIDTH = 340

const allConfigs = { ...feedNodeTypeConfig, ...commandNodeTypeConfig }

const riskColors   = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' }
const riskBg       = { low: '#071a0f', medium: '#1c1208', high: '#1c0909', critical: '#260606' }
const authorityBg  = { low: '#071a0f', medium: '#1c1208', high: '#1c0909', critical: '#260606' }

export default function InspectorPanel({ node }) {
  const [collapsed, setCollapsed] = useState(false)

  const isCommand = Boolean(node?.authorityLevel)
  const typeColor = node ? (allConfigs[node.nodeType]?.color || '#475569') : '#1e293b'

  return (
    <aside
      style={{
        width: collapsed ? 40 : PANEL_WIDTH,
        flexShrink: 0,
        background: '#0f172a',
        borderLeft: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'width 0.18s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Collapsed strip */}
      {collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', paddingTop: 12 }}>
          <div style={{ width: 3, height: 40, background: typeColor, borderRadius: 2, marginBottom: 12 }} />
          <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', fontSize: 8, letterSpacing: '0.14em', color: '#1e293b', textTransform: 'uppercase', fontWeight: 600, flex: 1, display: 'flex', alignItems: 'center' }}>
            INSPECTOR
          </span>
          <button onClick={() => setCollapsed(false)} style={collapseBtn}><Chevron open={false} /></button>
        </div>
      )}

      {/* Expanded */}
      {!collapsed && (
        <>
          {/* Header */}
          <div style={{ flexShrink: 0, background: '#111827', borderBottom: '1px solid #1e293b' }}>
            <div style={{ height: 3, background: typeColor }} />

            {node ? (
              <div style={{ padding: '10px 14px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 8, color: typeColor, background: typeColor + '18', border: `1px solid ${typeColor}30`, borderRadius: 3, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                    {allConfigs[node.nodeType]?.label || node.nodeType}
                  </span>
                  {!isCommand && node.confidence && <ConfidenceBadge value={node.confidence} />}
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setCollapsed(true)} style={collapseBtn}><Chevron open={true} /></button>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3, wordBreak: 'break-word' }}>
                  {isCommand ? `/${node.label}` : node.label}
                </div>
              </div>
            ) : (
              <div style={{ padding: '10px 14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: '#1e293b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Inspector</span>
                <button onClick={() => setCollapsed(true)} style={collapseBtn}><Chevron open={true} /></button>
              </div>
            )}
          </div>

          {/* Body */}
          {!node ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ fontSize: 20, color: '#1e293b' }}>◈</div>
              <div style={{ fontSize: 11, color: '#1e293b' }}>Select a node to inspect</div>
            </div>
          ) : isCommand ? (
            <CommandBody node={node} typeColor={typeColor} />
          ) : (
            <FeedBody node={node} />
          )}
        </>
      )}
    </aside>
  )
}

// ─── Command node body ────────────────────────────────────────────────────────

function CommandBody({ node, typeColor }) {
  const authority = node.riskLevel || 'medium'
  const detail = commandDetails[node.id] || null

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0 24px' }}>
      <div style={{ padding: '0 14px 10px' }}>
        <div style={{ padding: '6px 10px', background: authorityBg[authority], border: `1px solid ${riskColors[authority]}20`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: riskColors[authority], flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: riskColors[authority], fontWeight: 600 }}>
            {node.authorityLevel}
          </span>
        </div>
      </div>

      {detail?.purpose && (
        <SectionBlock label="PURPOSE">
          <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.7, padding: '8px 10px', background: '#0d1117', borderRadius: 6, border: '1px solid #1e293b' }}>
            {detail.purpose}
          </div>
        </SectionBlock>
      )}

      {detail?.keyRules?.length > 0 && (
        <SectionBlock label={`KEY RULES (${detail.keyRules.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {detail.keyRules.map((rule, i) => (
              <div key={i} style={{ fontSize: 10, color: '#64748b', padding: '5px 10px', background: '#0d1117', borderRadius: 5, border: '1px solid #1e293b', lineHeight: 1.5, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ color: typeColor, flexShrink: 0, marginTop: 1 }}>›</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {detail?.canonicalRunOrder != null && (
        <SectionBlock label="CANONICAL RUN ORDER">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: '#0d1117', borderRadius: 6, border: '1px solid #1e293b' }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: typeColor + '20', border: `1px solid ${typeColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: typeColor, fontWeight: 700 }}>{detail.canonicalRunOrder}</span>
            </div>
            <span style={{ fontSize: 10, color: '#475569' }}>
              {detail.canonicalRunOrder === 'Final'
                ? 'Final gate — runs after AvengersAssemble'
                : `Step ${detail.canonicalRunOrder} in AvengersAssemble run order`}
            </span>
          </div>
        </SectionBlock>
      )}

      <SectionBlock label="STRUCTURE">
        <FieldLabel>COMMAND FILE</FieldLabel>
        <MonoBlock>{node.filePath}</MonoBlock>
      </SectionBlock>

      {!detail?.purpose && node.notes && (
        <SectionBlock label="DESCRIPTION">
          <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.7, padding: '8px 10px', background: '#0d1117', borderRadius: 6, border: '1px solid #1e293b' }}>
            {node.notes}
          </div>
        </SectionBlock>
      )}

      {node.meta && Object.keys(node.meta).length > 0 && (
        <SectionBlock label="METADATA">
          <MetaTable entries={node.meta} />
        </SectionBlock>
      )}
    </div>
  )
}

// ─── Feed node body ───────────────────────────────────────────────────────────

function FeedBody({ node }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0 24px' }}>
      <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6 }}>
        <RiskBadge risk={node.riskLevel} />
        {node.runtimeStatus && <RuntimeBadge status={node.runtimeStatus} />}
      </div>

      {(node.pendingReviews?.length > 0 || node.ownership) && (
        <SectionBlock label="GOVERNANCE">
          {node.pendingReviews?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: node.ownership ? 8 : 0 }}>
              {node.pendingReviews.map((rev) => {
                const rc = reviewConfig[rev] || { color: '#f59e0b', bg: '#1c1208', desc: '' }
                return (
                  <div key={rev} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: rc.bg, border: `1px solid ${rc.color}20`, borderRadius: 6 }}>
                    <span style={{ fontSize: 11, color: rc.color, fontWeight: 700 }}>⚠</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: rc.color, fontWeight: 700 }}>{rev}</div>
                      {rc.desc && <div style={{ fontSize: 9, color: rc.color + '80', marginTop: 1 }}>{rc.desc}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {node.ownership && <KeyValue label="owner" value={node.ownership} />}
        </SectionBlock>
      )}

      <SectionBlock label="STRUCTURE">
        <div style={{ marginBottom: 6 }}>
          <FieldLabel>FILE PATH</FieldLabel>
          <MonoBlock>{node.filePath}</MonoBlock>
        </div>
        {node.tablesTouched?.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            <FieldLabel>TABLES TOUCHED ({node.tablesTouched.length})</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {node.tablesTouched.map((t) => <MonoBlock key={t}>{t}</MonoBlock>)}
            </div>
          </div>
        )}
        {node.dependencies?.length > 0 && (
          <div>
            <FieldLabel>DEPENDENCIES ({node.dependencies.length})</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {node.dependencies.map((dep) => <MonoBlock key={dep}>{dep}</MonoBlock>)}
            </div>
          </div>
        )}
      </SectionBlock>

      {(node.notes || (node.meta && Object.keys(node.meta).length > 0)) && (
        <SectionBlock label="CONTEXT">
          {node.notes && (
            <div style={{ marginBottom: node.meta ? 8 : 0 }}>
              <FieldLabel>NOTES</FieldLabel>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.7, padding: '8px 10px', background: '#0d1117', borderRadius: 6, border: '1px solid #1e293b' }}>
                {node.notes}
              </div>
            </div>
          )}
          {node.meta && Object.keys(node.meta).length > 0 && (
            <div>
              <FieldLabel>METADATA</FieldLabel>
              <MetaTable entries={node.meta} />
            </div>
          )}
        </SectionBlock>
      )}
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionBlock({ label, children }) {
  return (
    <div style={{ padding: '0 14px 12px', borderTop: '1px solid #0f1a2e', paddingTop: 10 }}>
      <div style={{ fontSize: 8, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>
      {children}
    </div>
  )
}

function MonoBlock({ children }) {
  return (
    <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'ui-monospace, Consolas, monospace', padding: '4px 9px', background: '#0d1117', borderRadius: 5, border: '1px solid #1e293b', wordBreak: 'break-all', lineHeight: 1.5 }}>
      {children}
    </div>
  )
}

function MetaTable({ entries }) {
  return (
    <div style={{ background: '#0d1117', borderRadius: 6, border: '1px solid #1e293b', overflow: 'hidden' }}>
      {Object.entries(entries).map(([k, v], i, arr) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, padding: '5px 10px', borderBottom: i < arr.length - 1 ? '1px solid #1e293b' : undefined }}>
          <span style={{ fontSize: 10, color: '#475569', flexShrink: 0 }}>{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'ui-monospace, Consolas, monospace', textAlign: 'right', wordBreak: 'break-word' }}>{String(v)}</span>
        </div>
      ))}
    </div>
  )
}

function KeyValue({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 10, color: '#334155', textTransform: 'capitalize' }}>{label}</span>
      <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'ui-monospace, Consolas, monospace' }}>{value}</span>
    </div>
  )
}

function RiskBadge({ risk }) {
  const color = riskColors[risk] || riskColors.low
  const bg    = riskBg[risk]    || riskBg.low
  return (
    <div style={{ flex: 1, padding: '6px 10px', background: bg, border: `1px solid ${color}20`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color, textTransform: 'capitalize', fontWeight: 600 }}>{risk} risk</span>
    </div>
  )
}

function RuntimeBadge({ status }) {
  const sc = runtimeStatusConfig[status] || runtimeStatusConfig.UNVERIFIED
  return (
    <div style={{ flex: 1, padding: '6px 10px', background: sc.bg, border: `1px solid ${sc.color}20`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
    </div>
  )
}

function ConfidenceBadge({ value }) {
  const cc = confidenceConfig[value] || confidenceConfig.INFERRED
  return (
    <span title={cc.label} style={{ fontSize: 8, color: cc.color, background: cc.color + '15', border: `1px solid ${cc.color}30`, borderRadius: 3, padding: '1px 6px', fontWeight: 700, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 3 }}>
      <span>{cc.symbol}</span>
      <span style={{ textTransform: 'uppercase' }}>{cc.label}</span>
    </span>
  )
}

function Chevron({ open }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d={open ? 'M7 2 L3 5 L7 8' : 'M3 2 L7 5 L3 8'} stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const collapseBtn = {
  background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, flexShrink: 0,
}
