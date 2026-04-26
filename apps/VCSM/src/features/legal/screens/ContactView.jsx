import { Link } from 'react-router-dom'
import { Globe, MessageCircle, Shield, AlertTriangle, Mail, Briefcase, Flag } from 'lucide-react'
import PublicTopNav from '../components/PublicTopNav'

const CONTACT_CARDS = [
  {
    title: 'General',
    icon: Globe,
    description: 'For partnerships, business questions, and platform inquiries.',
    email: 'contact@vibezcitizens.com',
    accent: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.20)',
    btnBg: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
    btnShadow: '0 10px 28px rgba(139,92,246,0.36)',
  },
  {
    title: 'Support',
    icon: MessageCircle,
    description: 'For account help, bugs, login issues, and technical problems.',
    email: 'support@vibezcitizens.com',
    accent: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.20)',
    btnBg: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    btnShadow: '0 10px 28px rgba(59,130,246,0.32)',
  },
  {
    title: 'Privacy',
    icon: Shield,
    description: 'For data deletion, privacy questions, GDPR/CCPA, and account requests.',
    email: 'privacy@vibezcitizens.com',
    accent: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.20)',
    btnBg: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    btnShadow: '0 10px 28px rgba(167,139,250,0.30)',
  },
  {
    title: 'Report',
    icon: AlertTriangle,
    description: 'For abuse, harassment, copyright, or unsafe content.',
    email: 'report@vibezcitizens.com',
    accent: '#f87171',
    bg: 'rgba(248,113,113,0.07)',
    border: 'rgba(248,113,113,0.18)',
    btnBg: 'linear-gradient(135deg, #b91c1c, #ef4444)',
    btnShadow: '0 10px 28px rgba(239,68,68,0.26)',
  },
]

const GUIDE_CARDS = [
  {
    icon: MessageCircle,
    label: 'Account issue',
    detail: 'Login problems, bans, settings, or tech bugs.',
    target: 'Support',
    color: '#3b82f6',
  },
  {
    icon: Briefcase,
    label: 'Business or VPORT question',
    detail: 'Setup, services, bookings, or platform partnerships.',
    target: 'General',
    color: '#8b5cf6',
  },
  {
    icon: Flag,
    label: 'Safety or abuse concern',
    detail: 'Report content, harassment, or copyright violations.',
    target: 'Report',
    color: '#f87171',
  },
]

export default function ContactView() {
  return (
    <div style={{ minHeight: '100vh', background: '#060609', color: '#fff', paddingTop: 60 }}>

      <PublicTopNav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative', padding: '52px 20px 68px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 700,
          height: 500,
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.24) 0%, rgba(59,130,246,0.07) 45%, transparent 70%)',
          filter: 'blur(44px)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto' }}>
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
            Contact
          </div>

          <h1 style={{
            margin: 0,
            fontSize: 'clamp(34px, 9vw, 54px)',
            fontWeight: 800,
            letterSpacing: '-0.028em',
            lineHeight: 1.06,
            background: 'linear-gradient(140deg, #fff 30%, rgba(196,181,253,0.85) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            How can we help?
          </h1>

          <p style={{
            margin: '20px auto 0',
            maxWidth: 400,
            fontSize: 15.5,
            lineHeight: 1.70,
            color: 'rgba(255,255,255,0.48)',
          }}>
            Reach Vibez Citizens for support, partnerships, privacy requests, or reports.
            Choose the right channel and we'll guide you from there.
          </p>

          <p style={{
            marginTop: 16,
            fontSize: 12,
            color: 'rgba(255,255,255,0.24)',
            letterSpacing: '0.01em',
          }}>
            Typical response time: 24–48 hours.
          </p>
        </div>
      </div>

      {/* ── PRIMARY CONTACT GRID ───────────────────────────────── */}
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 20px 68px' }}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {CONTACT_CARDS.map(({ title, icon: Icon, description, email, accent, bg, border, btnBg, btnShadow }) => (
            <div
              key={email}
              style={{
                borderRadius: 20,
                border: `1px solid ${border}`,
                background: bg,
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${accent}22`,
                border: `1px solid ${accent}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
                flexShrink: 0,
              }}>
                <Icon size={20} style={{ color: accent }} />
              </div>

              {/* Title + description */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 7, letterSpacing: '-0.01em' }}>
                  {title}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', lineHeight: 1.65, margin: 0 }}>
                  {description}
                </p>
              </div>

              {/* Email display */}
              <div style={{
                borderRadius: 10,
                background: 'rgba(0,0,0,0.28)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '10px 12px',
                fontSize: 12,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                color: 'rgba(255,255,255,0.62)',
                wordBreak: 'break-all',
                marginBottom: 16,
              }}>
                {email}
              </div>

              {/* CTA button */}
              <a
                href={`mailto:${email}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '11px 20px',
                  borderRadius: 12,
                  background: btnBg,
                  boxShadow: btnShadow,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#fff',
                  textDecoration: 'none',
                  marginTop: 'auto',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.84' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                <Mail size={14} />
                Send email
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── GUIDANCE SECTION ──────────────────────────────────── */}
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 20px 68px' }}>
        <div style={{
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.025)',
          padding: '40px 28px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.01em',
            }}>
              Not sure where to start?
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {GUIDE_CARDS.map(({ icon: Icon, label, detail, target, color }) => (
              <div
                key={label}
                style={{
                  borderRadius: 14,
                  border: `1px solid ${color}20`,
                  background: `${color}0d`,
                  padding: '20px 16px',
                }}
              >
                <Icon size={16} style={{ color, marginBottom: 10, display: 'block' }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 5, lineHeight: 1.3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.44)', lineHeight: 1.65, marginBottom: 12 }}>
                  {detail}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color }}>
                  Use {target}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 20px 80px' }}>
        <div style={{
          borderRadius: 20,
          border: '1px solid rgba(139,92,246,0.18)',
          background: 'rgba(139,92,246,0.055)',
          padding: '52px 32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 420,
            height: 220,
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.14) 0%, transparent 70%)',
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
              Need help with a VPORT?
            </h2>
            <p style={{
              margin: '12px 0 0',
              fontSize: 14,
              color: 'rgba(255,255,255,0.42)',
              lineHeight: 1.65,
            }}>
              Tell us what you're building and we'll help point you in the right direction.
            </p>

            <a
              href="mailto:support@vibezcitizens.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 30,
                padding: '13px 26px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                boxShadow: '0 12px 28px rgba(139,92,246,0.36)',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.84' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              Contact support
            </a>
          </div>
        </div>
      </div>

    </div>
  )
}
