import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Store, Share2, MessageCircle, Zap, ArrowRight } from 'lucide-react'
import { authTheme } from '@/features/auth/styles/authTheme'

const PAGE_TITLE = 'How to Create a VPORT | Vibez Citizens'
const PAGE_DESCRIPTION =
  'Learn how to create your VPORT on Vibez Citizens and grow your business presence locally.'
const PAGE_URL = 'https://vibezcitizens.com/how-to/create-vport'
const CTA_HREF = '/register?intent=vport'

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

const BENEFITS = [
  {
    icon: Store,
    color: '#f59e0b',
    title: 'Your business presence',
    body: 'A dedicated business page with your name, logo, services, and contact info.',
  },
  {
    icon: Share2,
    color: '#42d3ff',
    title: 'Shareable business card',
    body: 'One link to share everywhere — QR code, social media, or printed materials.',
  },
  {
    icon: MessageCircle,
    color: '#ff69c6',
    title: 'Receive messages and leads',
    body: 'Customers can message you, leave reviews, and book your services directly.',
  },
  {
    icon: Zap,
    color: '#8b5cf6',
    title: 'Promote your services',
    body: 'List services with pricing, showcase your portfolio, and get discovered locally.',
  },
]

const STEPS = [
  'Create your Vibez Citizens account.',
  'Go to Settings and create a VPORT for your business.',
  'Add your business name and a short description.',
  'Upload your logo and a banner photo.',
  'Add location, hours, and contact details.',
  'Publish your VPORT card and share the link.',
]

export default function HowToCreateVportScreen() {
  useEffect(() => {
    const prevTitle = document.title
    document.title = PAGE_TITLE

    const cleanups = [
      setMeta('description', PAGE_DESCRIPTION, true),
      setMeta('og:title', PAGE_TITLE),
      setMeta('og:description', PAGE_DESCRIPTION),
      setMeta('og:url', PAGE_URL),
    ]

    try {
      sessionStorage.setItem('vcsm_funnel_source', 'how_to_vport')
    } catch {
      // ignore
    }

    return () => {
      document.title = prevTitle
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return (
    <div
      className="min-h-screen px-4 py-10 text-white"
      style={{ background: authTheme.pageBackground }}
    >
      <div className="mx-auto w-full max-w-[540px] space-y-5">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--vc-text-muted)' }}
        >
          ← Back
        </Link>

        {/* ── SECTION 1: Hero ─────────────────────────────── */}
        <div
          className="rounded-2xl border border-white/10 px-6 py-8 text-center"
          style={{ background: authTheme.cardBackground, boxShadow: authTheme.cardShadow }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(245,158,11,0.18)',
              border: '1px solid rgba(245,158,11,0.35)',
            }}
          >
            <Store size={22} style={{ color: '#f59e0b' }} />
          </div>

          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Create Your VPORT
          </h1>
          <p
            className="mx-auto mt-3 max-w-sm text-sm leading-relaxed"
            style={{ color: 'var(--vc-text-muted)' }}
          >
            Your business page on Vibez Citizens. Share it anywhere, receive leads, and grow your
            local presence — all from one link.
          </p>

          <Link
            to={CTA_HREF}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-px"
            style={{
              background: 'linear-gradient(135deg, #d97706, #f59e0b)',
              boxShadow: '0 10px 30px rgba(245,158,11,0.30)',
            }}
          >
            Create your VPORT
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* ── SECTION 2: Why ─────────────────────────────── */}
        <div
          className="rounded-2xl border border-white/10 p-5"
          style={{ background: authTheme.cardBackground }}
        >
          <h2 className="mb-4 text-base font-semibold text-white">Why create a VPORT?</h2>
          <div className="grid grid-cols-2 gap-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-xl border p-3"
                style={{
                  borderColor: `${b.color}30`,
                  background: `${b.color}0d`,
                }}
              >
                <div
                  className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `${b.color}22`, border: `1px solid ${b.color}44` }}
                >
                  <b.icon size={15} style={{ color: b.color }} />
                </div>
                <div className="text-xs font-semibold text-white">{b.title}</div>
                <div
                  className="mt-1 text-xs leading-relaxed"
                  style={{ color: 'var(--vc-text-muted)' }}
                >
                  {b.body}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 3: Steps ───────────────────────────── */}
        <div
          className="rounded-2xl border border-white/10 p-5"
          style={{ background: authTheme.cardBackground }}
        >
          <h2 className="mb-4 text-base font-semibold text-white">How it works</h2>
          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    background: 'rgba(245,158,11,0.28)',
                    border: '1px solid rgba(245,158,11,0.45)',
                  }}
                >
                  {i + 1}
                </span>
                <span
                  className="pt-0.5 text-sm leading-relaxed"
                  style={{ color: 'var(--vc-text-soft)' }}
                >
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── SECTION 4: Bottom CTA ──────────────────────── */}
        <div
          className="rounded-2xl border border-white/10 px-6 py-7 text-center"
          style={{ background: authTheme.cardBackground }}
        >
          <p className="text-base font-semibold text-white">Ready to grow your business?</p>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--vc-text-muted)' }}>
            Free to create. No subscription required to get started.
          </p>
          <Link
            to={CTA_HREF}
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-px"
            style={{
              background: 'linear-gradient(135deg, #d97706, #f59e0b)',
              boxShadow: '0 10px 30px rgba(245,158,11,0.30)',
            }}
          >
            Create your VPORT
            <ArrowRight size={15} />
          </Link>
          <div className="mt-4 text-xs" style={{ color: 'var(--vc-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
              Log in
            </Link>
          </div>
        </div>

        {/* Footer spacer */}
        <div className="pb-4" />
      </div>
    </div>
  )
}
