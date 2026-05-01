export function CreateVportDebugPanel({ _bbDebug, _setBbDebug }) {
  if (!import.meta.env.DEV || !_bbDebug) return null;
  return (
    <div style={{ marginTop: 16, border: '1.5px solid #7c3aed', borderRadius: 10, background: '#1e1b4b', padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 6, letterSpacing: 1 }}>
        ◉ BUGSBUNNY — create_vport probe [{_bbDebug.stage}]
      </div>
      {_bbDebug.payload && (
        <>
          <div style={{ fontSize: 10, color: '#818cf8', marginBottom: 2 }}>SENDING →</div>
          <pre style={{ fontSize: 11, color: '#e0e7ff', margin: '0 0 8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(_bbDebug.payload, null, 2)}
          </pre>
        </>
      )}
      {_bbDebug.result && (
        <>
          <div style={{ fontSize: 10, color: '#34d399', marginBottom: 2 }}>RESULT ←</div>
          <pre style={{ fontSize: 11, color: '#d1fae5', margin: '0 0 8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(_bbDebug.result, null, 2)}
          </pre>
        </>
      )}
      {_bbDebug.error && (
        <>
          <div style={{ fontSize: 10, color: '#f87171', marginBottom: 2 }}>ERROR ←</div>
          <pre style={{ fontSize: 11, color: '#fecaca', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(_bbDebug.error, null, 2)}
          </pre>
        </>
      )}
      <button
        type="button"
        onClick={() => _setBbDebug(null)}
        style={{ marginTop: 8, fontSize: 10, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        clear
      </button>
    </div>
  );
}
