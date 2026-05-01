import { useEffect, useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import PublicNavbar, { PUBLIC_NAV_HEIGHT } from '@/shared/components/PublicNavbar'
import { VportPreviewShowcase } from '@/features/vport/adapters/vport.public.adapter'
import { VPORT_LANDING_TYPES, getVportLandingContent } from '@/features/legal/config/vportLandingContent'

const BASE_URL = 'https://vibezcitizens.com'
const CTA_HREF = '/register?intent=vport'
const WHY_VPORT_BODY =
  'A VPORT gives customers one place to discover your services, understand what you offer, and reach out when they\'re ready. Instead of relying on scattered links, calls, or social messages, your VPORT brings everything into a single, mobile-ready page that builds trust and drives real requests.'

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
  return () => { if (created) el.remove(); else el.setAttribute('content', prev || '') }
}

function titleizeType(slug) {
  return String(slug || '').split('-').map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(' ')
}

function SectionHeading({ title, subtitle }) {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto 32px' }}>
      <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 500, letterSpacing: '-0.01em', color: '#fff', lineHeight: 1.2 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: '12px 0 0', fontFamily: SANS, fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.52)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default function VportCategoryLandingScreen() {
  const { type } = useParams()
  const content = useMemo(() => getVportLandingContent(type), [type])

  useEffect(() => {
    if (!content) return undefined
    const prevTitle = document.title
    const pageUrl = `${BASE_URL}/vport/${content.type}`
    document.title = content.seo.title
    const cleanups = [
      setMeta('description', content.seo.description, true),
      setMeta('keywords', content.seo.keywords.join(', '), true),
      setMeta('og:title', content.seo.title),
      setMeta('og:description', content.seo.description),
      setMeta('og:url', pageUrl),
      setMeta('twitter:title', content.seo.title, true),
      setMeta('twitter:description', content.seo.description, true),
    ]
    try { sessionStorage.setItem('vcsm_funnel_source', `vport_${content.type}`) } catch { /* ignore */ }
    return () => { document.title = prevTitle; cleanups.forEach((fn) => fn()) }
  }, [content])

  if (!content) return <Navigate to="/how-to/create-vport" replace />

  const relatedTypes = VPORT_LANDING_TYPES.filter((entry) => entry !== content.type)

  return (
    <div style={{ minHeight: '100vh', background: '#060609', color: '#fff', fontFamily: SANS, paddingTop: `calc(${PUBLIC_NAV_HEIGHT}px + env(safe-area-inset-top))` }}>
      <PublicNavbar />

      {/* ── Hero ── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '80px 24px 72px' }}>
        <div style={{
          position: 'absolute', top: '-28%', left: '50%', transform: 'translateX(-50%)',
          width: 860, height: 560, pointerEvents: 'none',
          background: `radial-gradient(ellipse, ${content.preview.accent}3a 0%, rgba(59,130,246,0.06) 45%, transparent 72%)`,
          filter: 'blur(56px)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
            padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(139,92,246,0.38)',
            background: 'rgba(139,92,246,0.10)', fontFamily: SANS, fontSize: 11, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c4b5fd',
          }}>
            VPORT for {titleizeType(content.type)}
          </div>
          <h1 style={{
            margin: 0, fontFamily: SERIF, fontSize: 'clamp(40px, 6vw, 58px)', lineHeight: 1.06,
            letterSpacing: '-0.02em', fontWeight: 500,
            background: 'linear-gradient(140deg, #fff 30%, rgba(196,181,253,0.80) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {content.heroHeadline}
          </h1>
          <p style={{ margin: '20px 0 0', maxWidth: 560, fontFamily: SANS, fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.52)' }}>
            {content.heroSubheadline}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 36 }}>
            <Link
              to={CTA_HREF}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 48, padding: '0 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                boxShadow: '0 16px 34px rgba(139,92,246,0.30)',
                fontFamily: SANS, color: '#fff', textDecoration: 'none', fontWeight: 500, fontSize: 14,
              }}
            >
              {content.ctaLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Product preview ── */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingBottom: 8 }}>
        <VportPreviewShowcase activeType={content.type} single />
      </section>

      {/* ── Benefits ── */}
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '96px 24px 0' }}>
        <SectionHeading
          title={`Why ${content.displayName.toLowerCase()} owners choose VPORT`}
          subtitle="Each VPORT is built as a conversion-ready business profile, not just another static listing."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(224px, 1fr))', gap: 20 }}>
          {content.benefits.map((benefit) => (
            <article key={benefit.heading} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.025)', padding: '22px 20px 24px' }}>
              <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.92)', marginBottom: 8, lineHeight: 1.3 }}>
                {benefit.heading}
              </div>
              <p style={{ margin: 0, fontFamily: SANS, fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.54)' }}>
                {benefit.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Who it's built for ── */}
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '96px 24px 0' }}>
        <SectionHeading title="Who it's built for" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(224px, 1fr))', gap: 20 }}>
          {content.useCases.map((useCase) => (
            <article key={useCase} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.018)', padding: '20px 20px 22px' }}>
              <p style={{ margin: 0, fontFamily: SANS, fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.80)' }}>
                {useCase}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Why businesses use VPORT ── */}
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '96px 24px 0' }}>
        <SectionHeading title="Why businesses use VPORT" />
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.018)', padding: '24px 24px' }}>
          <p style={{ margin: 0, fontFamily: SANS, fontSize: 16, lineHeight: 1.80, color: 'rgba(255,255,255,0.60)' }}>
            {WHY_VPORT_BODY}
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '96px 24px 0' }}>
        <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.025)', padding: '56px 24px', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 500, letterSpacing: '-0.01em', color: '#fff' }}>
            Build your {content.typeLabel} VPORT today
          </h2>
          <p style={{ margin: '14px auto 0', maxWidth: 520, fontFamily: SANS, fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.52)' }}>
            Publish once, get discovered consistently, and convert more local demand into real customer actions.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
            <Link
              to={CTA_HREF}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 48, padding: '0 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                boxShadow: '0 14px 28px rgba(139,92,246,0.28)',
                fontFamily: SANS, color: '#fff', textDecoration: 'none', fontWeight: 500, fontSize: 14,
              }}
            >
              {content.ctaLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Explore more VPORT types ── */}
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '64px 24px 80px' }}>
        <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(196,181,253,0.70)', fontWeight: 600, marginBottom: 16 }}>
          Explore more VPORT types
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {relatedTypes.map((entry) => (
            <Link
              key={entry}
              to={`/vport/${entry}`}
              style={{
                padding: '9px 14px', borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.03)',
                fontFamily: SANS, color: 'rgba(255,255,255,0.76)', textDecoration: 'none', fontSize: 13, fontWeight: 500,
              }}
            >
              {titleizeType(entry)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
