// src/app/platform/ios/IOSDebugHUD.jsx
import { useState } from 'react'
import { isIOS } from './ios.env'

export default function IOSDebugHUD() {
  const [open, setOpen] = useState(false)
  if (!isIOS()) return null

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: 8,
          right: 8,
          zIndex: 99999,
          background: '#000',
          color: '#0f0',
          border: '1px solid #0f0',
          padding: '4px 6px',
          fontSize: 11,
        }}
      >
        iOS DBG
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 40,
            right: 8,
            zIndex: 99999,
            background: '#000',
            color: '#0f0',
            fontSize: 11,
            padding: 8,
            fontFamily: 'monospace',
          }}
        >
          vv.offsetTop: {window.visualViewport?.offsetTop}
          <br />
          vv.height: {window.visualViewport?.height}
          <br />
          innerHeight: {window.innerHeight}
        </div>
      )}
    </>
  )
}
