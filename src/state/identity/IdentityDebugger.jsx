import { useState } from 'react'
import { useIdentity } from './identityContext'

export default function IdentityDebugger() {
  const isDev = import.meta.env.DEV
  const { identity, loading } = useIdentity()
  const [open, setOpen] = useState(false)
  if (!isDev) return null

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            top: '50%',
            left: 8,
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
          ID
        </button>
      )}

      {open && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: 8,
            transform: 'translateY(-50%)',
            maxWidth: 380,
            background: '#000',
            color: '#0f0',
            fontSize: 12,
            padding: 10,
            zIndex: 9999,
            borderRadius: 6,
            border: '1px solid #0f0',
            boxShadow: '0 0 6px #0f0',
            fontFamily: 'monospace',
            opacity: 0.9,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>IDENTITY DEBUG</strong>
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
            <div>Loading: {String(loading)}</div>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>
              {JSON.stringify(identity, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}
