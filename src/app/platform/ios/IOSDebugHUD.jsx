import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { isIOS } from './ios.env'

function readCssVar(name) {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export default function IOSDebugHUD() {
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)

  if (!isIOS()) return null
  if (typeof document === 'undefined') return null

  const mountNode = useMemo(() => {
    const el = document.createElement('div')
    el.setAttribute('data-ios-debug-hud', 'true')
    // ✅ ensure it always sits above your app
    el.style.position = 'fixed'
    el.style.inset = '0'
    el.style.pointerEvents = 'none'
    el.style.zIndex = '2147483647'
    return el
  }, [])

  useEffect(() => {
    document.body.appendChild(mountNode)
    return () => {
      mountNode.remove()
    }
  }, [mountNode])

  useEffect(() => {
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
  }, [open])

  const vvTop = window.visualViewport?.offsetTop ?? null
  const vvHeight = window.visualViewport?.height ?? null
  const innerH = window.innerHeight

  const cssVvTop = readCssVar('--vv-top')
  const cssVvHeight = readCssVar('--vv-height')
  const cssKb = readCssVar('--ios-kb-offset')

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
          <br />
          --vv-top: {cssVvTop || '(unset)'}
          <br />
          --vv-height: {cssVvHeight || '(unset)'}
          <br />
          --ios-kb-offset: {cssKb || '(unset)'}
        </div>
      )}
    </>
  )

  return createPortal(ui, mountNode)
}
