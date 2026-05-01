import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PortfolioItemLocksmithSection } from '@/features/profiles/kinds/vport/screens/portfolio/components/PortfolioItemLocksmithSection'

export default function PortfolioItemModal({ item, detail, loadingDetail = false, onClose }) {
  const [isOpen, setIsOpen] = useState(false)
  const closeTimerRef = useRef(null)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsOpen(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const scrollY = window.scrollY || 0
    const body = document.body
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    return () => {
      body.style.overflow = prev.overflow
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      window.scrollTo(0, scrollY)
    }
  }, [])

  const requestClose = useCallback(() => {
    setIsOpen(false)
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => onClose?.(), 200)
  }, [onClose])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') requestClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [requestClose])

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  const title = detail?.title || item?.title || ''
  const description = detail?.description || item?.description || ''
  const tags = (detail?.tags?.length ? detail.tags : item?.tags) ?? []
  const locksmith = detail?.locksmithDetails ?? null

  const coverUrl =
    detail?.media?.find((m) => m?.url)?.url ??
    detail?.coverUrl ??
    item?.coverUrl ??
    null

  const hasContent = title || description || tags.length || locksmith || loadingDetail

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, opacity: isOpen ? 1 : 0, transition: 'opacity 200ms ease' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)' }} onClick={requestClose} />

      <button
        onClick={requestClose}
        aria-label="Close"
        style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 'calc(env(safe-area-inset-right, 0px) + 14px)', zIndex: 100, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}
      >
        <X size={20} strokeWidth={2.5} />
      </button>

      <div
        style={{ position: 'relative', zIndex: 10, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', transform: isOpen ? 'translateY(0)' : 'translateY(20px)', transition: 'transform 220ms ease' }}
        onClick={requestClose}
      >
        <div
          style={{ maxWidth: 560, margin: '0 auto', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 52px)', paddingLeft: 16, paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {coverUrl ? (
            <div style={{ borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', position: 'relative' }}>
              <img src={coverUrl} alt={title || 'Portfolio item'} style={{ display: 'block', width: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.55))', pointerEvents: 'none' }} />
            </div>
          ) : null}

          {hasContent ? (
            <div style={{ marginTop: coverUrl ? 16 : 0, background: 'rgba(10, 10, 20, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}>
              {title ? (
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{title}</h2>
              ) : null}

              {description ? (
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)' }}>{description}</p>
              ) : null}

              {tags.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tags.map((tag) => (
                    <span key={tag} style={{ borderRadius: 9999, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(139,92,246,0.12)', color: 'rgba(255,255,255,0.75)', padding: '5px 12px', fontSize: 12, fontWeight: 600, lineHeight: 1 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {loadingDetail && !detail ? (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 8, width: 72, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ height: 8, width: 120, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
                </div>
              ) : locksmith ? (
                <PortfolioItemLocksmithSection locksmith={locksmith} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
