import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { setFunnelSource } from '@/shared/lib/funnelSource'
import PublicNavbar, { PUBLIC_NAV_HEIGHT } from '@/shared/components/PublicNavbar'
import { VportPreviewShowcase } from '@/features/vport/adapters/vport.public.adapter'

const PAGE_TITLE = 'How to Create a VPORT | Vibez Citizens'
const PAGE_DESCRIPTION =
  'Learn how to create your VPORT on Vibez Citizens and grow your business presence locally.'
const PAGE_URL = 'https://vibezcitizens.com/how-to/create-vport'
const CTA_HREF = '/register?intent=vport'

const SERIF = "'DM Serif Display', serif"
const SANS  = "'Inter', sans-serif"

function setMeta(property, content, isName = false) {
  const attr = isName ? 'name' : 'property'
  let el = document.head.querySelector(`meta[${attr}="${property}"]`)
  const created = !el
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, property)
    document.head.appendChild(el)
  }
  const prev = el.getAttribute('content')
  el.setAttribute('content', content)
  return () => {
    if (created) el.remove()
    else el.setAttribute('content', prev || '')
  }
}

const STEPS = [
  'Create your Vibez Citizens account.',
  'Go to Settings and create a VPORT for your business.',
  'Add your business name, logo, and description.',
  'List your services, hours, and location.',
  'Publish and share your VPORT link anywhere.',
]

const VPORT_CATEGORY_LINKS = [
  { label: 'Barber',         path: '/vport/barber' },
  { label: 'Barbershop',     path: '/vport/barbershop' },
  { label: 'Restaurant',     path: '/vport/restaurant' },
  { label: 'Locksmith',      path: '/vport/locksmith' },
  { label: 'Gas Station',    path: '/vport/gas-station' },
  { label: 'Money Exchange', path: '/vport/money-exchange' },
]

export default function HowToCreateVportScreen() {
  const [hoveredLink, setHoveredLink] = useState(null)

  useEffect(() => {
    const prevTitle = document.title
    document.title = PAGE_TITLE
    const cleanups = [
      setMeta('description', PAGE_DESCRIPTION, true),
      setMeta('og:title', PAGE_TITLE),
      setMeta('og:description', PAGE_DESCRIPTION),
      setMeta('og:url', PAGE_URL),
    ]
    setFunnelSource('how_to_vport')
    return () => {
      document.title = prevTitle
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#060609', color: '#fff', fontFamily: SANS, paddingTop: `calc(${PUBLIC_NAV_HEIGHT}px + env(safe-area-inset-top))` }}>
      <PublicNavbar />

      {/* ── Hero ── */}
      <div style={{ position: 'relative', padding: '80px 24px 72px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 500,
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.22) 0%, rgba(59,130,246,0.06) 45%, transparent 70%)',
          filter: 'blur(48px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', marginBottom: 24,
            padding: '5px 14px', borderRadius: 9999,
            border: '1px solid rgba(139,92,246,0.36)', background: 'rgba(139,92,246,0.10)',
            fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#c4b5fd',
          }}>
            Vibez Citizens
          </div>

          <h1 style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: 'clamp(40px, 8vw, 56px)',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            background: 'linear-gradient(140deg, #fff 30%, rgba(196,181,253,0.80) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Create Your VPORT
          </h1>

          <p style={{ margin: '20px auto 0', maxWidth: 380, fontFamily: SANS, fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.50)' }}>
            Turn any real-world service into a digital experience.
          </p>

          <Link
            to={CTA_HREF}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginTop: 36, height: 48, padding: '0 28px', borderRadius: 12,
              background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
              boxShadow: '0 14px 36px rgba(139,92,246,0.32)',
              fontFamily: SANS, fontSize: 14, fontWeight: 500, color: '#fff', textDecoration: 'none',
            }}
          >
            Create your VPORT
          </Link>
        </div>
      </div>

      {/* ── Showcase ── */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', color: '#fff' }}>
            Built for real-world businesses like yours
          </div>
          <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.32)' }}>
            Swipe to explore
          </div>
        </div>
        <VportPreviewShowcase />
      </div>

      {/* ── How it works ── */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 20px 0' }}>
        <div style={{
          borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.022)', padding: '32px 24px', marginBottom: 16,
        }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', color: '#fff', marginBottom: 28 }}>
            How to get started
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {STEPS.map((step, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <span style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: 8,
                  background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.26)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: SANS, fontSize: 10, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.02em',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 15, color: 'rgba(255,255,255,0.60)', lineHeight: 1.65, paddingTop: 3 }}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div style={{
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.026) 0%, rgba(255,255,255,0.012) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 40px rgba(0,0,0,0.4)',
          padding: '32px 28px',
          marginBottom: 16,
        }}>
          <div style={{ fontFamily: SANS, fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em', color: '#fff', marginBottom: 10 }}>
            Explore category VPORT pages
          </div>
          <p style={{ margin: '0 0 22px', fontFamily: SANS, fontSize: 14, color: 'rgba(255,255,255,0.52)', lineHeight: 1.55 }}>
            Find a page tailored to your business type and see how a VPORT works in practice.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {VPORT_CATEGORY_LINKS.map((entry) => {
              const hovered = hoveredLink === entry.path
              return (
                <Link
                  key={entry.path}
                  to={entry.path}
                  onMouseEnter={() => setHoveredLink(entry.path)}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 9999,
                    border: `1px solid ${hovered ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'}`,
                    background: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                    boxShadow: hovered ? '0 0 0 2px rgba(139,92,246,0.22)' : 'none',
                    fontFamily: SANS, color: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.72)',
                    fontSize: 13, fontWeight: 500, textDecoration: 'none', cursor: 'pointer',
                    transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
                    transition: 'all 180ms ease',
                  }}
                >
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                    background: hovered ? '#8b5cf6' : 'rgba(255,255,255,0.22)',
                    transition: 'background 180ms ease',
                  }} />
                  {entry.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{
          borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.022)', padding: '40px 24px',
          textAlign: 'center', marginBottom: 80,
        }}>
          <p style={{ margin: 0, fontFamily: SERIF, fontSize: 24, fontWeight: 500, letterSpacing: '-0.01em', color: '#fff' }}>
            Ready to grow your business?
          </p>
          <p style={{ margin: '10px 0 0', fontFamily: SANS, fontSize: 14, color: 'rgba(255,255,255,0.38)' }}>
            Free to create. No subscription required.
          </p>
          <Link
            to={CTA_HREF}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginTop: 28, height: 48, padding: '0 28px', borderRadius: 12,
              background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
              boxShadow: '0 12px 28px rgba(139,92,246,0.28)',
              fontFamily: SANS, fontSize: 14, fontWeight: 500, color: '#fff', textDecoration: 'none',
            }}
          >
            Create your VPORT
          </Link>
          <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#c4b5fd', textDecoration: 'none' }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
