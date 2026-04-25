import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Star, Users, MapPin, ArrowRight } from 'lucide-react'
import { authTheme } from '@/features/auth/styles/authTheme'

const PAGE_TITLE = 'How to Create Your Profile | Vibez Citizens'
const PAGE_DESCRIPTION =
  'Learn how to create your Vibez Citizens profile and start connecting with people and businesses in your area.'
const PAGE_URL = 'https://vibezcitizens.com/how-to/create-profile'
const CTA_HREF = '/register?intent=profile'

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
    icon: User,
    color: '#8b5cf6',
    title: 'Your digital identity',
    body: 'One profile for every corner of the platform — posts, messages, bookings.',
  },
  {
    icon: Star,
    color: '#f59e0b',
    title: 'Share posts and vibes',
    body: 'Post content, tag your vibes, and get seen by people who share your interests.',
  },
  {
    icon: Users,
    color: '#ff69c6',
    title: 'Connect with people',
    body: 'Follow citizens, spark conversations, and grow your network organically.',
  },
  {
    icon: MapPin,
    color: '#42d3ff',
    title: 'Get discovered locally',
    body: 'Show up in local Explore results and connect with people near you.',
  },
]

const STEPS = [
  'Create your account with email and password.',
  'Add your display name and pick a username.',
  'Fill in your birthdate — required for your citizen card.',
  'Upload a photo and write a short bio.',
  "You're live — share your profile link.",
]

export default function HowToCreateProfileScreen() {
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
      sessionStorage.setItem('vcsm_funnel_source', 'how_to_profile')
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
              background: 'rgba(139,92,246,0.18)',
              border: '1px solid rgba(139,92,246,0.35)',
            }}
          >
            <User size={22} className="text-purple-300" />
          </div>

          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Create Your Vibez Citizens Profile
          </h1>
          <p
            className="mx-auto mt-3 max-w-sm text-sm leading-relaxed"
            style={{ color: 'var(--vc-text-muted)' }}
          >
            Your free digital identity. Connect, be discovered, and share your story — no matter
            where you are.
          </p>

          <Link
            to={CTA_HREF}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-px"
            style={{
              background: '#6C4DF6',
              boxShadow: '0 10px 30px rgba(108,77,246,0.35)',
            }}
          >
            Create your profile
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* ── SECTION 2: Why ─────────────────────────────── */}
        <div
          className="rounded-2xl border border-white/10 p-5"
          style={{ background: authTheme.cardBackground }}
        >
          <h2 className="mb-4 text-base font-semibold text-white">Why create a profile?</h2>
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
                  style={{ background: 'rgba(139,92,246,0.35)', border: '1px solid rgba(139,92,246,0.50)' }}
                >
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm leading-relaxed" style={{ color: 'var(--vc-text-soft)' }}>
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
          <p className="text-base font-semibold text-white">Ready to get started?</p>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--vc-text-muted)' }}>
            Free forever. No credit card required.
          </p>
          <Link
            to={CTA_HREF}
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-px"
            style={{
              background: 'linear-gradient(135deg, #6C4DF6, #8b5cf6)',
              boxShadow: '0 10px 30px rgba(108,77,246,0.35)',
            }}
          >
            Create your profile
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
