import { Link } from 'react-router-dom'
import { Users, Store, Zap, ArrowRight } from 'lucide-react'
import { authTheme } from '@/features/auth/styles/authTheme'

function Card({ children, style, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 p-6 ${className}`}
      style={{ background: authTheme.cardBackground, ...style }}
    >
      {children}
    </div>
  )
}

function SectionIcon({ icon: Icon, color }) {
  return (
    <div
      className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
      style={{ background: `${color}22`, border: `1px solid ${color}44` }}
    >
      <Icon size={18} style={{ color }} />
    </div>
  )
}

function BulletList({ items }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'var(--vc-text-muted)' }}>
          <span className="mt-0.5 text-purple-400 shrink-0">·</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function AboutView() {
  return (
    <div
      className="min-h-screen px-4 py-10 text-white"
      style={{ background: authTheme.pageBackground }}
    >
      <div className="mx-auto w-full max-w-2xl space-y-5">

        {/* Back link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'var(--vc-text-muted)' }}
          >
            ← Back to home
          </Link>
        </div>

        {/* Hero */}
        <div
          className="rounded-2xl border border-white/10 px-6 py-8 text-center"
          style={{
            background: authTheme.cardBackground,
            boxShadow: authTheme.cardShadow,
          }}
        >
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(139,92,246,0.20)',
              border: '1px solid rgba(139,92,246,0.35)',
            }}
          >
            <Zap size={22} className="text-purple-300" />
          </div>

          <h1 className="text-2xl font-bold text-white sm:text-3xl">Vibez Citizens</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: 'var(--vc-text-muted)' }}>
            A platform for people, businesses, and local experiences to connect through
            profiles, messaging, and shareable VPORT business cards.
          </p>
        </div>

        {/* What it is */}
        <Card style={{ boxShadow: authTheme.cardShadow }}>
          <h2 className="text-base font-semibold text-white">What Vibez Citizens is</h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--vc-text-muted)' }}>
            Vibez Citizens helps people discover, connect, and interact with local profiles
            and businesses in one place. Whether you are a creator, a service provider, or
            just exploring what is nearby, everything starts with a single platform and a
            single identity.
          </p>
        </Card>

        {/* For People + For Businesses — 2-column on sm+ */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Card className="flex flex-col h-full">
            <SectionIcon icon={Users} color="#8b5cf6" />
            <h2 className="text-base font-semibold text-white">For People</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--vc-text-muted)' }}>
              Your personal identity on Vibez Citizens.
            </p>
            <BulletList items={[
              'Create a profile and represent yourself',
              'Discover other citizens and businesses nearby',
              'Connect through posts, messages, and communities',
              'Explore local services and find what you need',
            ]} />
            <Link
              to="/how-to/create-profile"
              className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-purple-300"
              style={{ color: '#a78bfa' }}
            >
              How to create your profile
              <ArrowRight size={12} />
            </Link>
          </Card>

          <Card className="flex flex-col h-full">
            <SectionIcon icon={Store} color="#8b5cf6" />
            <h2 className="text-base font-semibold text-white">For Businesses</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--vc-text-muted)' }}>
              Your business identity on Vibez Citizens.
            </p>
            <BulletList items={[
              'Create a shareable business card with a single link',
              'Receive leads from visitors — no account required from them',
              'Share a public profile customers can find and trust',
              'Stay reachable without fragmented social profiles',
            ]} />
            <Link
              to="/how-to/create-vport"
              className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-purple-300"
              style={{ color: '#a78bfa' }}
            >
              How to create your VPORT
              <ArrowRight size={12} />
            </Link>
          </Card>
        </div>

        {/* Why it exists */}
        <Card style={{ boxShadow: authTheme.cardShadow }}>
          <h2 className="text-base font-semibold text-white">Why it exists</h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--vc-text-muted)' }}>
            Vibez Citizens is built to make local discovery and communication simpler,
            more direct, and more useful than scattered links or disconnected social profiles.
            One place to be found, one place to connect, one place to grow.
          </p>
        </Card>

        {/* CTA */}
        <div
          className="rounded-2xl border border-purple-500/20 p-6 text-center"
          style={{
            background: 'rgba(139,92,246,0.08)',
            boxShadow: authTheme.cardShadow,
          }}
        >
          <p className="mb-4 text-sm font-medium text-white/80">Ready to get started?</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85"
              style={{
                background: 'rgba(139,92,246,0.70)',
                border: '1px solid rgba(139,92,246,0.50)',
                color: '#fff',
              }}
            >
              Join Vibez Citizens
              <ArrowRight size={14} />
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Contact us
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Explore
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
