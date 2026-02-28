import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { isIOS } from './ios.env'

function readCssVar(name) {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function readDisplayMode() {
  if (typeof window === 'undefined') return 'unknown'
  const standaloneMedia = window.matchMedia?.('(display-mode: standalone)').matches
  const iosStandalone = window.navigator?.standalone === true
  if (standaloneMedia || iosStandalone) return 'standalone'
  return 'browser'
}

function readBottomNavMetrics() {
  if (typeof document === 'undefined') return null
  const nav = document.querySelector('nav[aria-label="Primary"]')
  if (!nav) return null
  const rect = nav.getBoundingClientRect()
  return {
    height: Math.round(rect.height),
    bottomGap: Math.round(window.innerHeight - rect.bottom),
    top: Math.round(rect.top),
  }
}

export default function IOSDebugHUD() {
  const isDev = import.meta.env.DEV
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const ios = isIOS()
  const isBrowser = typeof document !== 'undefined'

  const mountNode = useMemo(() => {
    if (!isDev || !ios || !isBrowser) return null
    const el = document.createElement('div')
    el.setAttribute('data-ios-debug-hud', 'true')
    // ✅ ensure it always sits above your app
    el.style.position = 'fixed'
    el.style.inset = '0'
    el.style.pointerEvents = 'none'
    el.style.zIndex = '2147483647'
    return el
  }, [isDev, ios, isBrowser])

  useEffect(() => {
    if (!mountNode) return undefined
    document.body.appendChild(mountNode)
    return () => {
      mountNode.remove()
    }
  }, [mountNode])

  useEffect(() => {
    if (!isDev || !ios || !isBrowser) return undefined
    if (!open) return

    const vv = window.visualViewport
    let raf = 0

    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setTick((t) => (t + 1) % 1000000)
      })
    }

    schedule()

    vv?.addEventListener('resize', schedule)
    vv?.addEventListener('scroll', schedule)
    window.addEventListener('focusin', schedule)
    window.addEventListener('focusout', schedule)
    window.addEventListener('orientationchange', schedule)

    return () => {
      vv?.removeEventListener('resize', schedule)
      vv?.removeEventListener('scroll', schedule)
      window.removeEventListener('focusin', schedule)
      window.removeEventListener('focusout', schedule)
      window.removeEventListener('orientationchange', schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [open, isDev, ios, isBrowser])

  if (!isDev || !ios || !isBrowser || !mountNode) return null

  const vvTop = window.visualViewport?.offsetTop ?? null
  const vvHeight = window.visualViewport?.height ?? null
  const innerH = window.innerHeight

  const cssVvTop = readCssVar('--vv-top')
  const cssVvHeight = readCssVar('--vv-height')
  const cssKb = readCssVar('--kb-inset')
  const safeTop = readCssVar('--vc-safe-area-top')
  const safeRight = readCssVar('--vc-safe-area-right')
  const safeBottom = readCssVar('--vc-safe-area-bottom')
  const safeLeft = readCssVar('--vc-safe-area-left')
  const displayMode = readDisplayMode()
  const nav = readBottomNavMetrics()

  const ui = (
    <>
      {/* ✅ the button must be clickable => pointerEvents:auto */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          right: `calc(8px + env(safe-area-inset-right))`,
          top: '50%',
          transform: 'translateY(-50%)',

          zIndex: 2147483647,
          background: '#000',
          color: '#0f0',
          border: '1px solid #0f0',
          padding: '6px 8px',
          fontSize: 11,
          borderRadius: 6,
          opacity: open ? 1 : 0.75,

          pointerEvents: 'auto',
        }}
      >
        iOS
        <br />
        DBG
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            right: `calc(56px + env(safe-area-inset-right))`,
            top: '50%',
            transform: 'translateY(-50%)',

            zIndex: 2147483647,
            background: '#000',
            color: '#0f0',
            fontSize: 11,
            padding: 8,
            fontFamily: 'monospace',
            minWidth: 220,
            pointerEvents: 'none',
            border: '1px solid #0f0',
            borderRadius: 6,
          }}
        >
          tick: {tick}
          <br />
          vv.offsetTop: {vvTop}
          <br />
          vv.height: {vvHeight}
          <br />
          innerHeight: {innerH}
          <br />
          displayMode: {displayMode}
          <br />
          <br />
          --vv-top: {cssVvTop || '(unset)'}
          <br />
          --vv-height: {cssVvHeight || '(unset)'}
          <br />
          --kb-inset: {cssKb || '(unset)'}
          <br />
          <br />
          --vc-safe-area-top: {safeTop || '(unset)'}
          <br />
          --vc-safe-area-right: {safeRight || '(unset)'}
          <br />
          --vc-safe-area-bottom: {safeBottom || '(unset)'}
          <br />
          --vc-safe-area-left: {safeLeft || '(unset)'}
          <br />
          <br />
          nav.height: {nav ? nav.height : '(no nav)'}
          <br />
          nav.bottomGap: {nav ? nav.bottomGap : '(no nav)'}
          <br />
          nav.top: {nav ? nav.top : '(no nav)'}
        </div>
      )}
    </>
  )

  return createPortal(ui, mountNode)
}
