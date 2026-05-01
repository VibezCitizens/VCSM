import { Link } from 'react-router-dom'
import PublicNavbar, { PUBLIC_NAV_HEIGHT } from '@/shared/components/PublicNavbar'

const PEOPLE_BULLETS = [
  'Create your citizen profile',
  'Discover nearby businesses and services',
  'Connect through Vibes, Vox, and Districts',
  'Leave reviews and support local places',
]

const BUSINESS_BULLETS = [
  'Create a shareable VPORT',
  'Show services, hours, photos, rates, menus, or portfolio',
  'Receive Vox messages and leads',
  'Build trust through reviews and public profile pages',
]

const PILLARS = [
  {
    label: 'Profiles',
    description: 'One identity for people and businesses.',
  },
  {
    label: 'VPORTs',
    description: 'Digital business cards built for real-world services.',
  },
  {
    label: 'Discovery',
    description: 'Find local services, creators, and communities.',
  },
  {
    label: 'Trust',
    description: 'Reviews, content, and public profiles that help people decide.',
  },
]

// ── Reusable sub-components ──────────────────────────────────

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      borderRadius: 20,
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(255,255,255,0.025)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.28)',
      marginBottom: 14,
      paddingLeft: 2,
    }}>
      {children}
    </div>
  )
}

function BulletItem({ text }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: '#8b5cf6',
        flexShrink: 0,
        marginTop: 7,
      }} />
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 1.65 }}>
        {text}
      </span>
    </li>
  )
}

// ── Main view ────────────────────────────────────────────────

export default function AboutView() {
  return (
    <div style={{ minHeight: '100vh', background: '#060609', color: '#fff', paddingTop: `calc(${PUBLIC_NAV_HEIGHT}px + env(safe-area-inset-top))` }}>

      <PublicNavbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        padding: '52px 20px 72px',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Purple-blue radial glow */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 760,
          height: 560,
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.22) 0%, rgba(59,130,246,0.07) 45%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto' }}>
          {/* Eyebrow pill */}
          <div style={{
            display: 'inline-block',
            marginBottom: 22,
            padding: '5px 14px',
            borderRadius: 9999,
            border: '1px solid rgba(139,92,246,0.38)',
            background: 'rgba(139,92,246,0.10)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#c4b5fd',
          }}>
            Vibez Citizens
          </div>

          {/* Headline */}
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(36px, 9vw, 54px)',
            fontWeight: 800,
            letterSpacing: '-0.028em',
            lineHeight: 1.07,
            background: 'linear-gradient(140deg, #fff 30%, rgba(196,181,253,0.85) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Built for local connection
          </h1>

          {/* Subtitle */}
          <p style={{
            margin: '22px auto 0',
            maxWidth: 420,
            fontSize: 16,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.50)',
          }}>
            Vibez Citizens is where people, businesses, and local experiences become easier
            to discover, trust, and connect with.
          </p>

          {/* CTA row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
            marginTop: 36,
          }}>
            <Link
              to="/register?intent=vport"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 26px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                boxShadow: '0 14px 36px rgba(139,92,246,0.36)',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              Create your VPORT
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 36px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
      </div>

      {/* ── MISSION ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 20px' }}>
        <GlassCard style={{ padding: '36px 32px' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)',
            marginBottom: 18,
          }}>
            What Vibez Citizens is
          </div>
          <p style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.85,
            color: 'rgba(255,255,255,0.62)',
          }}>
            Vibez Citizens brings citizen profiles, business VPORTs, Vox messaging, Vibes,
            reviews, and local discovery into one connected platform. Whether someone is
            finding a service, showcasing their work, or building a business presence,
            everything starts from one identity.
          </p>
        </GlassCard>
      </div>

      {/* ── FOR PEOPLE / FOR BUSINESSES ──────────────────────── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 20px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* For People */}
          <GlassCard style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* Gradient top accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 24,
              right: 24,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.55), transparent)',
            }} />

            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: '#a78bfa',
              marginBottom: 10,
            }}>
              For People
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 18, letterSpacing: '-0.01em' }}>
              Your citizen profile
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {PEOPLE_BULLETS.map((item) => <BulletItem key={item} text={item} />)}
            </ul>

            <Link
              to="/how-to/create-profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 24,
                fontSize: 13,
                fontWeight: 600,
                color: '#a78bfa',
                textDecoration: 'none',
              }}
            >
              How to create your profile
            </Link>
          </GlassCard>

          {/* For Businesses */}
          <GlassCard style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* Gradient top accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 24,
              right: 24,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.55), transparent)',
            }} />

            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: '#a78bfa',
              marginBottom: 10,
            }}>
              For Businesses
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 18, letterSpacing: '-0.01em' }}>
              Your business VPORT
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {BUSINESS_BULLETS.map((item) => <BulletItem key={item} text={item} />)}
            </ul>

            <Link
              to="/how-to/create-vport"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 24,
                fontSize: 13,
                fontWeight: 600,
                color: '#a78bfa',
                textDecoration: 'none',
              }}
            >
              How to create your VPORT
            </Link>
          </GlassCard>

        </div>
      </div>

      {/* ── PLATFORM PILLARS ─────────────────────────────────── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 20px' }}>
        <SectionLabel>Platform</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PILLARS.map((pillar, i) => (
            <div
              key={pillar.label}
              style={{
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.018)',
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {pillar.label}
                </div>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.14)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.02em',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.46)', lineHeight: 1.65 }}>
                {pillar.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHY IT EXISTS ─────────────────────────────────────── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 20px' }}>
        <div style={{
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
          borderLeft: '2px solid rgba(139,92,246,0.38)',
          background: 'rgba(255,255,255,0.025)',
          padding: '36px 32px',
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)',
            marginBottom: 18,
          }}>
            Why it exists
          </div>
          <p style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.85,
            color: 'rgba(255,255,255,0.62)',
          }}>
            Local discovery is scattered across social pages, search results, maps, and
            disconnected links. Vibez Citizens gives people and businesses one place to be
            found, one place to connect, and one place to grow.
          </p>
        </div>
      </div>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 64px' }}>
        <div style={{
          borderRadius: 20,
          border: '1px solid rgba(139,92,246,0.18)',
          background: 'rgba(139,92,246,0.055)',
          padding: '48px 28px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Inner glow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            height: 260,
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.13) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: 'clamp(22px, 5vw, 28px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#fff',
            }}>
              Ready to connect locally?
            </h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 10,
              marginTop: 30,
            }}>
              <Link
                to="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 24px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                  boxShadow: '0 12px 28px rgba(139,92,246,0.32)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                Join Vibez Citizens
              </Link>
              <Link
                to="/register?intent=vport"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '13px 22px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)',
                  textDecoration: 'none',
                }}
              >
                Create your VPORT
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
