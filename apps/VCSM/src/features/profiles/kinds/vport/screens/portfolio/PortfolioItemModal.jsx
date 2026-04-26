import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function PortfolioItemModal({ item, detail, loadingDetail = false, onClose }) {
  const [isOpen, setIsOpen] = useState(false)
  const closeTimerRef = useRef(null)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsOpen(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // iOS Safari scroll freeze
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
    >
      {/* Backdrop — darker for contrast */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)' }}
        onClick={requestClose}
      />

      {/* Close button — always on top */}
      <button
        onClick={requestClose}
        aria-label="Close"
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          right: 'calc(env(safe-area-inset-right, 0px) + 14px)',
          zIndex: 100,
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <X size={20} strokeWidth={2.5} />
      </button>

      {/* Scrollable content area */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
          transition: 'transform 220ms ease',
        }}
        onClick={requestClose}
      >
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 52px)',
            paddingLeft: 16,
            paddingRight: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image — rounded, no text on top */}
          {coverUrl ? (
            <div
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                position: 'relative',
              }}
            >
              <img
                src={coverUrl}
                alt={title || 'Portfolio item'}
                style={{
                  display: 'block',
                  width: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain',
                }}
              />
              {/* Gradient fade at image bottom — softens transition to content */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '30%',
                  background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.55))',
                  pointerEvents: 'none',
                }}
              />
            </div>
          ) : null}

          {/* Content card — elevated, separated from image */}
          {hasContent ? (
            <div
              style={{
                marginTop: coverUrl ? 16 : 0,
                background: 'rgba(10, 10, 20, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              }}
            >
              {title ? (
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                  {title}
                </h2>
              ) : null}

              {description ? (
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.75)' }}>
                  {description}
                </p>
              ) : null}

              {tags.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        borderRadius: 9999,
                        border: '1px solid rgba(255,255,255,0.10)',
                        background: 'rgba(139,92,246,0.12)',
                        color: 'rgba(255,255,255,0.75)',
                        padding: '5px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: 1,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Detail loading shimmer */}
              {loadingDetail && !detail ? (
                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ height: 8, width: 72, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ height: 8, width: 120, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
                </div>
              ) : locksmith ? (
                <LocksmithSection locksmith={locksmith} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function LocksmithSection({ locksmith }) {
  const rows = [
    locksmith.jobType && { label: 'Job Type', value: locksmith.jobType.replace(/_/g, ' ') },
    locksmith.propertyType && { label: 'Property', value: locksmith.propertyType.replace(/_/g, ' ') },
    locksmith.lockType && { label: 'Lock Type', value: locksmith.lockType.replace(/_/g, ' ') },
    locksmith.hardwareBrand && { label: 'Brand', value: locksmith.hardwareBrand },
    locksmith.serviceMode && { label: 'Mode', value: locksmith.serviceMode.replace(/_/g, ' ') },
    locksmith.estimatedDurationMinutes && {
      label: 'Duration',
      value: `${locksmith.estimatedDurationMinutes} min`,
    },
  ].filter(Boolean)

  const hasBadges = locksmith.isEmergencyJob || locksmith.isSecurityUpgrade
  if (!rows.length && !hasBadges) return null

  return (
    <div
      style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.50)',
        }}
      >
        Job Details
      </div>

      {rows.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {rows.map(({ label, value }) => (
            <div key={label}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.50)',
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.85)',
                  textTransform: 'capitalize',
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {hasBadges ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {locksmith.isEmergencyJob ? (
            <span
              style={{
                borderRadius: 9999,
                border: '1px solid rgba(239,68,68,0.35)',
                background: 'rgba(239,68,68,0.12)',
                color: '#fca5a5',
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              Emergency Job
            </span>
          ) : null}
          {locksmith.isSecurityUpgrade ? (
            <span
              style={{
                borderRadius: 9999,
                border: '1px solid rgba(52,211,153,0.35)',
                background: 'rgba(52,211,153,0.12)',
                color: '#6ee7b7',
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              Security Upgrade
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
