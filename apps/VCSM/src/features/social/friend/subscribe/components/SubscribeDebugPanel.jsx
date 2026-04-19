import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const IS_DEV = import.meta.env.DEV

export default function SubscribeDebugPanel({ debugInfo }) {
  const [open, setOpen] = useState(false)
  const [railTarget, setRailTarget] = useState(null)

  useEffect(() => {
    setRailTarget(document.getElementById('debug-rail-right'))
  }, [])

  if (!IS_DEV || !debugInfo || !railTarget) return null

  const copy = () => {
    try { navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2)) } catch (_) {}
  }

  return createPortal(
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            background: '#000', color: '#0f0', border: '1px solid #0f0',
            borderRadius: 999, padding: '4px 12px', fontSize: 11,
            fontFamily: 'monospace', boxShadow: '0 0 6px #0f0',
            opacity: 0.85, cursor: 'pointer',
          }}
        >
          SUB
        </button>
      ) : (
        <div
          style={{
            width: 'min(380px, calc(100vw - 24px))', maxHeight: '70vh', overflow: 'auto',
            background: '#000', color: '#0f0', fontSize: 12, padding: 10,
            borderRadius: 8, border: '1px solid #0f0', boxShadow: '0 0 8px #0f0',
            fontFamily: 'monospace', opacity: 0.92,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <strong>SUBSCRIBE DEBUG</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copy} style={{ background: 'transparent', color: '#0f0', border: 'none', cursor: 'pointer', fontSize: 11 }}>copy</button>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', color: '#0f0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>_</button>
            </div>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>,
    railTarget
  )
}
