import { useState } from 'react'

const IS_DEV = import.meta.env.DEV

export default function SubscribeDebugPanel({ debugInfo }) {
  const [open, setOpen] = useState(true)

  if (!IS_DEV || !debugInfo) return null

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            top: '50%',
            right: 8,
            transform: 'translateY(-50%)',
            zIndex: 9999,
            background: '#000',
            color: '#0f0',
            border: '1px solid #0f0',
            borderRadius: 999,
            padding: '6px 10px',
            fontSize: 11,
            fontFamily: 'monospace',
            boxShadow: '0 0 6px #0f0',
            opacity: 0.75,
            cursor: 'pointer',
          }}
        >
          SUB
        </button>
      )}

      {open && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            right: 8,
            transform: 'translateY(-50%)',
            width: 'min(380px, calc(100vw - 24px))',
            maxHeight: '70vh',
            overflow: 'auto',
            background: '#000',
            color: '#0f0',
            fontSize: 12,
            padding: 10,
            zIndex: 9999,
            borderRadius: 8,
            border: '1px solid #0f0',
            boxShadow: '0 0 8px #0f0',
            fontFamily: 'monospace',
            opacity: 0.92,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>SUBSCRIBE DEBUG</strong>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',
                color: '#0f0',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              x
            </button>
          </div>

          <div style={{ marginTop: 6 }}>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}

