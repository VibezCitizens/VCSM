import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User, Store, Compass, ArrowRight } from 'lucide-react'
import { authTheme } from '@/features/auth/styles/authTheme'

const OPTIONS = [
  {
    key: 'profile',
    icon: User,
    color: '#8b5cf6',
    title: 'Complete your profile',
    body: 'Add your photo, bio, and vibe tags so people can find and connect with you.',
    to: '/settings?tab=profile',
    cta: 'Go to profile settings',
  },
  {
    key: 'vport',
    icon: Store,
    color: '#f59e0b',
    title: 'Create a VPORT',
    body: 'Set up your business page, add services, and share your card with customers.',
    to: '/settings',
    cta: 'Create a VPORT',
  },
  {
    key: 'explore',
    icon: Compass,
    color: '#42d3ff',
    title: 'Explore first',
    body: 'Browse posts, discover local profiles, and see what Vibez Citizens is about.',
    to: '/explore',
    cta: 'Start exploring',
  },
]

export default function WelcomeScreen() {
  const location = useLocation()

  const intent = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const raw = params.get('intent') || ''
    if (raw === 'profile' || raw === 'vport') return raw
    return null
  }, [location.search])

  // Sort so the intent-matched option appears first
  const orderedOptions = useMemo(() => {
    if (!intent) return OPTIONS
    return [
      ...OPTIONS.filter((o) => o.key === intent),
      ...OPTIONS.filter((o) => o.key !== intent),
    ]
  }, [intent])

  return (
    <div
      className="min-h-screen px-4 py-10 text-white"
      style={{ background: authTheme.pageBackground }}
    >
      <div className="mx-auto w-full max-w-[540px] space-y-5">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Welcome to Vibez Citizens 👋
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--vc-text-muted)' }}>
            You&apos;re in. What would you like to do first?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {orderedOptions.map((opt) => {
            const isHighlighted = opt.key === intent
            return (
              <Link
                key={opt.key}
                to={opt.to}
                className="block rounded-2xl border p-4 transition-all hover:-translate-y-px"
                style={{
                  background: isHighlighted
                    ? `${opt.color}14`
                    : authTheme.cardBackground,
                  borderColor: isHighlighted ? `${opt.color}50` : 'rgba(255,255,255,0.10)',
                  boxShadow: isHighlighted
                    ? `0 0 0 1px ${opt.color}30, 0 10px 30px rgba(0,0,0,0.30)`
                    : authTheme.cardShadow,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: `${opt.color}22`,
                      border: `1px solid ${opt.color}44`,
                    }}
                  >
                    <opt.icon size={20} style={{ color: opt.color }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{opt.title}</span>
                      {isHighlighted ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            background: `${opt.color}28`,
                            border: `1px solid ${opt.color}50`,
                            color: opt.color,
                          }}
                        >
                          Recommended
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--vc-text-muted)' }}>
                      {opt.body}
                    </p>
                  </div>

                  <ArrowRight size={16} style={{ color: 'var(--vc-text-muted)', flexShrink: 0 }} />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer nudge */}
        <p className="text-center text-xs" style={{ color: 'var(--vc-text-muted)' }}>
          You can always come back to this from the feed.
        </p>
      </div>
    </div>
  )
}
