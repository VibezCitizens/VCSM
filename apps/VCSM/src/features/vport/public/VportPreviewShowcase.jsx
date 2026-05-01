// Carousel showcase — reused on /how-to/create-vport and /vport/:type pages
import { useCallback, useEffect, useRef, useState } from 'react'
import { VPORT_PREVIEWS, getPreviewIndex } from './vportPreviewData'
import { VportPhonePreview } from './VportPhonePreview'
import './vportCarousel.css'

// When no type is specified (e.g. /how-to/create-vport), open on the middle item
const CAROUSEL_DEFAULT = Math.floor(VPORT_PREVIEWS.length / 2)

function resolveIndex(type) {
  if (!type) return CAROUSEL_DEFAULT
  const idx = getPreviewIndex(type)
  return idx >= 0 ? idx : CAROUSEL_DEFAULT
}

export default function VportPreviewShowcase({ activeType, single }) {
  const [activeIndex, setActiveIndex] = useState(() => resolveIndex(activeType))
  const scrollRef = useRef(null)
  const slideRefs = useRef([])
  const rafRef = useRef(null)

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current
      if (!el) return
      const center = el.scrollLeft + el.clientWidth / 2
      let closest = 0
      let minDist = Infinity
      slideRefs.current.forEach((slide, i) => {
        if (!slide) return
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2
        const dist = Math.abs(center - slideCenter)
        if (dist < minDist) { minDist = dist; closest = i }
      })
      setActiveIndex(closest)
    })
  }, [])

  const scrollToIndex = useCallback((idx) => {
    const el = scrollRef.current
    const slide = slideRefs.current[idx]
    if (!el || !slide) return
    el.scrollTo({ left: slide.offsetLeft + slide.offsetWidth / 2 - el.clientWidth / 2, behavior: 'smooth' })
  }, [])

  // Sync when activeType prop changes (same component instance reused across route navigations)
  useEffect(() => {
    setActiveIndex(resolveIndex(activeType))
  }, [activeType])

  // On mount: always center the resolved initial item
  useEffect(() => {
    const idx = resolveIndex(activeType)
    const id = setTimeout(() => {
      const el = scrollRef.current
      const slide = slideRefs.current[idx]
      if (!el || !slide) return
      el.scrollTo({ left: slide.offsetLeft + slide.offsetWidth / 2 - el.clientWidth / 2, behavior: 'instant' })
      setActiveIndex(idx)
    }, 60)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activePreview = VPORT_PREVIEWS[activeIndex]

  if (single) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 20px 48px', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 420, height: 420,
          background: `radial-gradient(ellipse, ${activePreview.accent}18 0%, transparent 70%)`,
          filter: 'blur(64px)', pointerEvents: 'none',
        }} />
        <VportPhonePreview preview={activePreview} active={true} />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', paddingBottom: 52, overflow: 'hidden' }}>
      {/* Dynamic ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 420, height: 420,
        background: `radial-gradient(ellipse, ${activePreview.accent}16 0%, transparent 70%)`,
        filter: 'blur(64px)', pointerEvents: 'none',
        transition: 'background 0.9s ease', zIndex: 0,
      }} />

      {/* Phone carousel */}
      <div
        ref={scrollRef}
        className="vport-carousel"
        style={{
          display: 'flex',
          scrollSnapType: 'x mandatory',
          gap: 20,
          paddingLeft: 'calc(50vw - 100px)',
          paddingRight: 'calc(50vw - 100px)',
          paddingBottom: 12,
          position: 'relative',
          zIndex: 1,
        }}
        onScroll={handleScroll}
      >
        {VPORT_PREVIEWS.map((preview, i) => (
          <div
            key={preview.type}
            ref={(el) => { slideRefs.current[i] = el }}
            style={{
              flexShrink: 0,
              scrollSnapAlign: 'center',
              width: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.45s ease',
              transform: i === activeIndex ? 'scale(1)' : 'scale(0.78)',
              opacity: i === activeIndex ? 1 : 0.35,
              cursor: i !== activeIndex ? 'pointer' : 'default',
            }}
            onClick={() => { if (i !== activeIndex) scrollToIndex(i) }}
          >
            <VportPhonePreview preview={preview} active={i === activeIndex} />
          </div>
        ))}
      </div>

      {/* Dot / pill indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 32, position: 'relative', zIndex: 1 }}>
        {VPORT_PREVIEWS.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            aria-label={`View ${VPORT_PREVIEWS[i].title}`}
            style={{
              width: i === activeIndex ? 22 : 6,
              height: 6,
              borderRadius: 3,
              border: 'none',
              padding: 0,
              background: i === activeIndex ? activePreview.accent : 'rgba(255,255,255,0.16)',
              cursor: 'pointer',
              transition: 'all 0.35s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
