// debuggers/dev-monitor/DevMonitorOverlay.jsx
// DEV-ONLY. Floating terminal overlay — streams authorized commands from dev-monitor-server.
// Requires: npm run monitor:dev (apps/VCSM/) running alongside vite dev.
// Position: fixed, bottom-left. Does not portal into debug rail (needs larger canvas).

import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const SERVER = 'http://127.0.0.1:7867'
const MAX_LINES = 600
const AUTO_DEBOUNCE_MS = 900

export default function DevMonitorOverlay() {
  // All hooks before any conditional return (React rules of hooks)
  const location = useLocation()
  const [connected, setConnected] = useState(false)
  const [commands, setCommands] = useState({})
  const [selectedCmd, setSelectedCmd] = useState('')
  const [running, setRunning] = useState(false)
  const [lines, setLines] = useState([])
  const [minimized, setMinimized] = useState(true)
  const [hidden, setHidden] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [lastAutoFeature, setLastAutoFeature] = useState(null)

  const commandsRef = useRef({})
  const termRef = useRef(null)
  const autoTimerRef = useRef(null)

  if (!import.meta.env.DEV) return null
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') return null

  // Load command registry once
  useEffect(() => {
    fetch(`${SERVER}/commands`)
      .then((r) => r.json())
      .then((cmds) => {
        commandsRef.current = cmds
        setCommands(cmds)
        const first = Object.keys(cmds)[0]
        if (first) setSelectedCmd(first)
      })
      .catch(() => {})
  }, [])

  // SSE connection — reconnects automatically on disconnect
  useEffect(() => {
    let es
    let destroyed = false

    function connect() {
      if (destroyed) return
      es = new EventSource(`${SERVER}/events`)

      es.onopen = () => setConnected(true)
      es.onerror = () => { setConnected(false); setRunning(false) }

      es.onmessage = (e) => {
        let event
        try { event = JSON.parse(e.data) } catch { return }

        if (event.type === 'ready') {
          setConnected(true)
        } else if (event.type === 'resume') {
          setRunning(true)
          appendLine('info', `↺ Reconnected — still running: ${event.commandId}\n`)
        } else if (event.type === 'start') {
          setRunning(true)
          const label = commandsRef.current[event.commandId]?.label ?? event.commandId
          setLines([{ stream: 'info', text: `$ ${label}\n` }])
        } else if (event.type === 'line') {
          appendLine(event.stream, event.text)
        } else if (event.type === 'exit') {
          setRunning(false)
          const label = event.status ?? `exit ${event.code}`
          const isCaught = event.matchCount > 0
          const reportNote = event.reportPath ? `\n→ ${event.reportPath}` : ''
          appendLine(isCaught ? 'stderr' : 'info', `\n[${label}]${reportNote}\n`)
        } else if (event.type === 'error') {
          appendLine('stderr', `ERROR: ${event.message}\n`)
          setRunning(false)
        } else if (event.type === 'timeout') {
          appendLine('stderr', `TIMEOUT: ${event.message}\n`)
        }
      }
    }

    connect()
    return () => { destroyed = true; es?.close() }
  }, [])

  // Auto-scroll terminal
  useEffect(() => {
    const el = termRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  // Auto-scan on route change — debounced, skips if server busy or feature unknown
  useEffect(() => {
    if (!autoMode || !connected) return
    clearTimeout(autoTimerRef.current)

    const feature = location.pathname.split('/').filter(Boolean)[0]?.toLowerCase() ?? ''
    if (!feature) return

    autoTimerRef.current = setTimeout(async () => {
      if (running) return
      setLastAutoFeature(feature)
      await fetch(`${SERVER}/auto-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature }),
      }).catch(() => {})
    }, AUTO_DEBOUNCE_MS)

    return () => clearTimeout(autoTimerRef.current)
  }, [location.pathname, autoMode, connected, running])

  function appendLine(stream, text) {
    setLines((prev) => {
      const next = [...prev, { stream, text }]
      return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next
    })
  }

  // Expose a hook for monitoring clients to surface ingest errors here instead of console
  useEffect(() => {
    window.__devMonitorLog = (msg) => appendLine('stderr', `${msg}\n`)
    return () => { delete window.__devMonitorLog }
  }, [])

  async function handleRun() {
    if (!selectedCmd || running || !connected) return
    await fetch(`${SERVER}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commandId: selectedCmd }),
    }).catch(() => {})
  }

  async function handleKill() {
    await fetch(`${SERVER}/kill`, { method: 'POST' }).catch(() => {})
  }

  function handleExport() {
    if (lines.length === 0) return
    const text = lines.map((l) => l.text).join('')
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monitor-session-${ts}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (hidden) return null

  const statusColor = running ? '#f59e0b' : connected ? '#10b981' : '#ef4444'
  const statusLabel = running
    ? (autoMode && lastAutoFeature ? `scanning ${lastAutoFeature}` : 'running')
    : connected ? 'ready' : 'offline'

  // Group commands by category for the dropdown
  const byCategory = Object.entries(commands).reduce((acc, [id, def]) => {
    const cat = def.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push({ id, label: def.label })
    return acc
  }, {})

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 70,
        left: 8,
        zIndex: 99998,
        fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
        fontSize: 11,
        userSelect: 'none',
        pointerEvents: 'all',
        width: minimized ? 'auto' : 'calc(100vw - 20px)',
        maxWidth: minimized ? undefined : 440,
      }}
    >
      {/* Header */}
      <div
        onClick={() => setMinimized((m) => !m)}
        style={{
          background: '#12122a',
          border: '1px solid #2d2d5a',
          borderRadius: minimized ? 6 : '6px 6px 0 0',
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
        <span style={{ color: '#a78bfa', fontWeight: 700, letterSpacing: '0.05em' }}>DEV MONITOR</span>
        <span style={{ color: '#555', fontSize: 10, marginLeft: 2 }}>{statusLabel}</span>
        {autoMode && (
          <span style={{ color: '#4ade80', fontSize: 9, marginLeft: 2 }}>AUTO</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span style={{ color: '#555' }}>{minimized ? '[+]' : '[−]'}</span>
          <span
            style={{ color: '#555' }}
            onClick={(e) => { e.stopPropagation(); setHidden(true) }}
          >
            [×]
          </span>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div
          style={{
            background: '#0b0b1f',
            border: '1px solid #2d2d5a',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            overflow: 'hidden',
          }}
        >
          {/* Controls */}
          <div
            style={{
              padding: '6px 8px',
              display: 'flex',
              gap: 6,
              borderBottom: '1px solid #1a1a3a',
              alignItems: 'center',
            }}
          >
            <select
              value={selectedCmd}
              onChange={(e) => setSelectedCmd(e.target.value)}
              disabled={running}
              style={{
                flex: 1,
                minWidth: 0,
                background: '#0d0d20',
                color: '#c4b5fd',
                border: '1px solid #3d3d70',
                borderRadius: 4,
                padding: '3px 6px',
                fontSize: 11,
                fontFamily: 'inherit',
                cursor: running ? 'not-allowed' : 'pointer',
              }}
            >
              {Object.entries(byCategory).map(([cat, items]) => (
                <optgroup key={cat} label={cat.toUpperCase()}>
                  {items.map(({ id, label }) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* AUTO toggle */}
            <button
              onClick={() => setAutoMode((m) => !m)}
              title={autoMode ? 'Auto-scan ON — scans feature on navigation' : 'Auto-scan OFF'}
              style={btn(
                autoMode ? '#0f2f1a' : '#0d0d20',
                autoMode ? '#4ade80' : '#3d3d70',
                autoMode ? '#166534' : '#2d2d5a',
              )}
            >
              AUTO
            </button>

            {running ? (
              <button onClick={handleKill} style={btn('#3b0a0a', '#fca5a5', '#7f1d1d')}>
                KILL
              </button>
            ) : (
              <button
                onClick={handleRun}
                disabled={!connected || !selectedCmd}
                style={btn(
                  connected && selectedCmd ? '#1e1b4b' : '#111',
                  connected && selectedCmd ? '#818cf8' : '#444',
                  connected && selectedCmd ? '#3730a3' : '#333',
                )}
              >
                RUN
              </button>
            )}
          </div>

          {/* Auto mode hint */}
          {autoMode && (
            <div style={{ padding: '3px 8px', background: '#0a1a0a', borderBottom: '1px solid #1a1a3a', color: '#4ade80', fontSize: 9 }}>
              scanning /{location.pathname.split('/').filter(Boolean)[0] ?? '…'} on nav
            </div>
          )}

          {/* Terminal */}
          <div
            ref={termRef}
            style={{
              height: 240,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '6px 8px',
              background: '#08080f',
              boxSizing: 'border-box',
            }}
          >
            {lines.length === 0 ? (
              <span style={{ color: '#333' }}>
                {connected
                  ? autoMode
                    ? 'Auto mode ON — navigate to a screen to trigger scan.'
                    : 'Select a command and press RUN.'
                  : 'Server offline — run: npm run monitor:dev'}
              </span>
            ) : (
              lines.map((line, i) => (
                <span
                  key={i}
                  style={{
                    display: 'block',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: 1.45,
                    color:
                      line.stream === 'stderr'
                        ? '#f87171'
                        : line.stream === 'info'
                        ? '#818cf8'
                        : '#9ca3af',
                  }}
                >
                  {line.text}
                </span>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '3px 8px',
              borderTop: '1px solid #1a1a3a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#3d3d70',
              fontSize: 10,
            }}
          >
            <span>127.0.0.1:{7867}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleExport}
                disabled={lines.length === 0}
                title="Download current session as .txt"
                style={{
                  background: 'none',
                  border: 'none',
                  color: lines.length > 0 ? '#6366f1' : '#2d2d5a',
                  cursor: lines.length > 0 ? 'pointer' : 'default',
                  fontSize: 10,
                  fontFamily: 'inherit',
                  padding: '1px 4px',
                }}
              >
                export
              </button>
              <button
                onClick={() => setLines([])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3d3d70',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontFamily: 'inherit',
                  padding: '1px 4px',
                }}
              >
                clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function btn(bg, color, borderColor) {
  return {
    background: bg,
    color,
    border: `1px solid ${borderColor}`,
    borderRadius: 4,
    padding: '3px 8px',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }
}
