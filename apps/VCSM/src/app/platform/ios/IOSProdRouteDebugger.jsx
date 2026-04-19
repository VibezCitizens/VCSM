import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { isIOS } from './ios.env'
import {
  IOS_PROD_DEBUG_EVENTS,
  appendIOSProdDebugLog,
  clearIOSProdDebugLogs,
  getIOSProdDebugLogs,
  getIOSProdDebugMeta,
  isIOSProdDebuggerEnabled,
  setIOSProdDebuggerEnabled,
} from '@/shared/lib/iosProdDebugger'

function pretty(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default function IOSProdRouteDebugger() {
  const location = useLocation()
  const [enabled, setEnabled] = useState(() => isIOSProdDebuggerEnabled())
  const [open, setOpen] = useState(true)
  const [logs, setLogs] = useState(() => getIOSProdDebugLogs())
  const [meta, setMeta] = useState(() => getIOSProdDebugMeta())
  const [regCount, setRegCount] = useState(null)

  const mountNode = useMemo(() => {
    if (typeof document === 'undefined') return null
    const el = document.createElement('div')
    el.setAttribute('data-ios-prod-route-debugger', 'true')
    el.style.position = 'fixed'
    el.style.inset = '0'
    el.style.zIndex = '2147483647'
    el.style.pointerEvents = 'none'
    return el
  }, [])

  useEffect(() => {
    if (!mountNode) return undefined
    document.body.appendChild(mountNode)
    return () => mountNode.remove()
  }, [mountNode])

  useEffect(() => {
    const refresh = () => {
      setEnabled(isIOSProdDebuggerEnabled())
      setLogs(getIOSProdDebugLogs())
      setMeta(getIOSProdDebugMeta())
    }

    const onEntry = (event) => {
      const next = event?.detail
      setLogs((prev) => {
        if (!next) return getIOSProdDebugLogs()
        const merged = [...prev, next]
        return merged.slice(-500)
      })
      setMeta(getIOSProdDebugMeta())
    }

    refresh()
    const timer = window.setInterval(refresh, 1000)
    window.addEventListener('storage', refresh)
    window.addEventListener('online', refresh)
    window.addEventListener('offline', refresh)
    window.addEventListener(IOS_PROD_DEBUG_EVENTS.toggle, refresh)
    window.addEventListener(IOS_PROD_DEBUG_EVENTS.clear, refresh)
    window.addEventListener(IOS_PROD_DEBUG_EVENTS.entry, onEntry)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('online', refresh)
      window.removeEventListener('offline', refresh)
      window.removeEventListener(IOS_PROD_DEBUG_EVENTS.toggle, refresh)
      window.removeEventListener(IOS_PROD_DEBUG_EVENTS.clear, refresh)
      window.removeEventListener(IOS_PROD_DEBUG_EVENTS.entry, onEntry)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    appendIOSProdDebugLog('router_location', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      source: 'IOSProdRouteDebugger',
    })
  }, [enabled, location.pathname, location.search, location.hash])

  useEffect(() => {
    if (!enabled) return undefined

    const onError = (event) => {
      appendIOSProdDebugLog('window_error', {
        message: event?.message ?? null,
        filename: event?.filename ?? null,
        lineno: event?.lineno ?? null,
        colno: event?.colno ?? null,
      })
    }

    const onRejection = (event) => {
      appendIOSProdDebugLog('window_unhandledrejection', {
        reason: event?.reason ?? null,
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    appendIOSProdDebugLog('debug_panel_enabled', {
      source: 'IOSProdRouteDebugger',
      isIOS: isIOS(),
    })

    if (!('serviceWorker' in navigator)) {
      setRegCount(0)
      return
    }

    navigator.serviceWorker.getRegistrations()
      .then((regs) => setRegCount(regs.length))
      .catch(() => setRegCount(null))
  }, [enabled, meta?.swController, location.pathname])

  if (!mountNode || !enabled) return null

  const newestFirst = [...logs].reverse()
  const platformLabel = isIOS() ? 'ios' : 'non-ios'
  const headerText = `VCSM PROD ROUTE DEBUG (${platformLabel})`

  return createPortal(
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          pointerEvents: 'auto',
          position: 'fixed',
          right: `calc(8px + env(safe-area-inset-right))`,
          bottom: `calc(8px + env(safe-area-inset-bottom))`,
          zIndex: 2147483647,
          background: '#05050d',
          color: '#7dd3fc',
          border: '1px solid #0369a1',
          borderRadius: 999,
          padding: '8px 12px',
          fontSize: 11,
          fontFamily: 'monospace',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}
      >
        {open ? 'Hide Debug' : 'Show Debug'}
      </button>

      {open && (
        <div
          style={{
            pointerEvents: 'auto',
            position: 'fixed',
            left: `calc(8px + env(safe-area-inset-left))`,
            right: `calc(8px + env(safe-area-inset-right))`,
            top: `calc(8px + env(safe-area-inset-top))`,
            bottom: `calc(52px + env(safe-area-inset-bottom))`,
            zIndex: 2147483647,
            background: '#06060f',
            color: '#d1d5db',
            border: '1px solid #334155',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #1f2937' }}>
            <div style={{ color: '#7dd3fc', fontSize: 12, fontWeight: 700 }}>{headerText}</div>
            <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>
              disable with `localStorage.removeItem('__vcsm_ios_dbg')`
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderBottom: '1px solid #1f2937', fontSize: 11, lineHeight: 1.45 }}>
            <div>path: {meta?.path}</div>
            <div>displayMode: {meta?.displayMode}</div>
            <div>visibility: {meta?.visible}</div>
            <div>online: {String(meta?.online)}</div>
            <div>swController: {meta?.swController ? 'yes' : 'no'}</div>
            <div>swRegistrations: {regCount == null ? 'unknown' : regCount}</div>
            <div>logs: {logs.length}</div>
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderBottom: '1px solid #1f2937' }}>
            <button
              onClick={() => {
                clearIOSProdDebugLogs()
                appendIOSProdDebugLog('debug_panel_clear_clicked', { source: 'panel' })
              }}
              style={{
                background: '#111827',
                color: '#f9fafb',
                border: '1px solid #374151',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 11,
              }}
            >
              Clear
            </button>
            <button
              onClick={() => {
                const data = pretty(getIOSProdDebugLogs())
                navigator.clipboard?.writeText(data).catch(() => {})
                appendIOSProdDebugLog('debug_panel_copy_clicked', { length: data.length })
              }}
              style={{
                background: '#111827',
                color: '#f9fafb',
                border: '1px solid #374151',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 11,
              }}
            >
              Copy Logs
            </button>
            <button
              onClick={() => {
                appendIOSProdDebugLog('debug_panel_disable_clicked', { source: 'panel' })
                setIOSProdDebuggerEnabled(false)
                setEnabled(false)
              }}
              style={{
                marginLeft: 'auto',
                background: '#2b1111',
                color: '#fecaca',
                border: '1px solid #7f1d1d',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 11,
              }}
            >
              Disable
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
            {newestFirst.length === 0 && (
              <div style={{ color: '#9ca3af', fontSize: 11 }}>
                waiting for debug events...
              </div>
            )}

            {newestFirst.map((entry) => (
              <div
                key={entry.id}
                style={{
                  border: '1px solid #1f2937',
                  borderRadius: 8,
                  padding: 8,
                  marginBottom: 8,
                  background: '#030712',
                }}
              >
                <div style={{ color: '#93c5fd', fontSize: 11, marginBottom: 6 }}>
                  #{entry.id} · {entry.at} · {entry.event}
                </div>
                <div style={{ color: '#e5e7eb', fontSize: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {pretty(entry.payload)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>,
    mountNode
  )
}
