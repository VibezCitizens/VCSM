import { useIdentity } from './identityContext'

export default function IdentityDebugger() {
  const { identity, loading } = useIdentity()

  // ✅ Never show in production build
  if (import.meta.env.PROD) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 8,
        left: 8,
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
      <strong>IDENTITY DEBUG</strong>
      <div>Loading: {String(loading)}</div>
      <pre style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>
        {JSON.stringify(identity, null, 2)}
      </pre>
    </div>
  )
}
