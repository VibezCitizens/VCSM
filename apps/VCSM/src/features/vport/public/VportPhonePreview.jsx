// Reusable VPORT phone mockup — static marketing previews, no DB
import { PreviewScreen } from '@/features/vport/public/vportPhonePreviewScreens'

export function PhoneFrame({ preview, isActive, children }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
        width: 240, height: 320,
        background: `radial-gradient(ellipse, ${preview.accent}${isActive ? '40' : '00'} 0%, transparent 70%)`,
        filter: 'blur(36px)', pointerEvents: 'none',
        transition: 'background 0.5s ease', zIndex: 0,
      }} />

      {/* Phone body */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 200, height: 420, borderRadius: 46,
        background: 'linear-gradient(175deg, #1e1e2e 0%, #0d0d18 100%)',
        border: isActive ? '1.5px solid rgba(255,255,255,0.28)' : '1.5px solid rgba(255,255,255,0.09)',
        boxShadow: isActive
          ? '0 56px 110px rgba(0,0,0,0.92), 0 0 0 0.5px rgba(255,255,255,0.04)'
          : '0 18px 44px rgba(0,0,0,0.65)',
        padding: 9,
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}>
        {/* Side buttons */}
        <div style={{ position: 'absolute', left: -3, top: 92,  width: 3, height: 26, borderRadius: '2px 0 0 2px', background: 'rgba(255,255,255,0.18)' }} />
        <div style={{ position: 'absolute', left: -3, top: 130, width: 3, height: 46, borderRadius: '2px 0 0 2px', background: 'rgba(255,255,255,0.18)' }} />
        <div style={{ position: 'absolute', left: -3, top: 186, width: 3, height: 46, borderRadius: '2px 0 0 2px', background: 'rgba(255,255,255,0.18)' }} />
        <div style={{ position: 'absolute', right: -3, top: 150, width: 3, height: 66, borderRadius: '0 2px 2px 0', background: 'rgba(255,255,255,0.18)' }} />

        {/* Screen */}
        <div style={{ width: '100%', height: '100%', borderRadius: 38, overflow: 'hidden', background: '#000', position: 'relative' }}>
          {/* Dynamic island */}
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            width: 68, height: 20, borderRadius: 10, background: '#000', zIndex: 10,
            boxShadow: '0 0 0 1.5px rgba(255,255,255,0.07)',
          }} />

          {children ?? (
            <img
              src={preview.imageUrl}
              alt={preview.title}
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
            />
          )}

          {/* Screen glare */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 42%)', pointerEvents: 'none' }} />
          {/* Bottom fade */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, background: 'linear-gradient(transparent, rgba(0,0,0,0.55))', pointerEvents: 'none' }} />
          {/* Home indicator */}
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 76, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.42)', zIndex: 10 }} />
        </div>
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center', transition: 'opacity 0.4s ease', opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{preview.title}</div>
        <div style={{ marginTop: 5, fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>{preview.tagline}</div>
      </div>
    </div>
  )
}

export function VportPhonePreview({ preview, active = false }) {
  return (
    <PhoneFrame preview={preview} isActive={active}>
      <PreviewScreen preview={preview} />
    </PhoneFrame>
  )
}
