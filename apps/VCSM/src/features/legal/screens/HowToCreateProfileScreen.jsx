import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Eye, MessageCircle, FileText, Globe, Zap, Store, Users } from 'lucide-react'
import PublicTopNav from '../components/PublicTopNav'

const PAGE_TITLE = 'How to Create Your Profile | Vibez Citizens'
const PAGE_DESCRIPTION =
  'Learn how to create your Vibez Citizens profile and start connecting with people and businesses in your area.'
const PAGE_URL = 'https://vibezcitizens.com/how-to/create-profile'
const CTA_HREF = '/register?intent=profile'

const ARCHITECT = {
  displayName: 'Architect',
  username: 'architect1',
  bio: 'The founder',
  photoUrl:
    'https://cdn.vibezcitizens.com/avatar-photos/15f5c5c5-d5e5-44a1-ba3a-469a86e1cfea/2026/04/25/2dd74bd0-e587-48ab-859a-a5da223785e3.jpeg',
  bannerUrl:
    'https://cdn.vibezcitizens.com/avatar-banners/15f5c5c5-d5e5-44a1-ba3a-469a86e1cfea/2026/04/26/896b2f8c-4ba8-4f37-b5c9-24793db513f5.png',
  subscribers: 0,
}

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

const VALUE_CARDS = [
  {
    icon: User,
    label: 'Identity',
    accent: '#8b5cf6',
    desc: 'One profile for your entire presence — no fragmentation.',
  },
  {
    icon: Eye,
    label: 'Visibility',
    accent: '#3b82f6',
    desc: 'Get discovered by people nearby and across the platform.',
  },
  {
    icon: MessageCircle,
    label: 'Connection',
    accent: '#ec4899',
    desc: 'Send a Vox, follow, and engage with people and businesses.',
  },
  {
    icon: FileText,
    label: 'Content',
    accent: '#06b6d4',
    desc: 'Share Vibes, build your presence, and express your identity.',
  },
]

const STEPS = [
  { num: '01', label: 'Create account', desc: 'Sign up with your email and password.' },
  { num: '02', label: 'Set username', desc: 'Pick your unique handle on the platform.' },
  { num: '03', label: 'Add photo & bio', desc: 'Put a face and voice to your identity.' },
  { num: '04', label: 'Customize profile', desc: 'Add your vibes, interests, and links.' },
  { num: '05', label: 'Go live', desc: 'Your profile is instantly live and shareable.' },
]

const TRUST_CARDS = [
  {
    icon: Globe,
    label: 'Public identity',
    desc: 'Your profile is visible to the entire platform.',
  },
  {
    icon: Zap,
    label: 'Discoverable presence',
    desc: 'Show up in local and interest-based discovery.',
  },
  {
    icon: Store,
    label: 'Connected to VPORTs',
    desc: 'Linked to every business and service you own.',
  },
  {
    icon: Users,
    label: 'Built for community',
    desc: 'Follow, be followed, join Districts, and engage.',
  },
]

// ── Profile phone screen content ─────────────────────────────
function ProfilePhonePreview() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#0a0a14',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Dynamic island clearance */}
      <div style={{ height: 36, flexShrink: 0 }} />

      {/* App header */}
      <div style={{
        flexShrink: 0,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0 10px',
      }}>
        <span style={{ position: 'absolute', left: 10, fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>←</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>
          CITIZENS
        </span>
        <span style={{
          position: 'absolute', right: 10,
          width: 20, height: 20,
          borderRadius: 5,
          border: '1px solid rgba(255,255,255,0.20)',
          background: 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: 'rgba(255,255,255,0.48)',
        }}>
          ⊞
        </span>
      </div>

      {/* Banner — full width */}
      <div style={{
        flexShrink: 0,
        height: 84,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(109,40,217,0.55), rgba(59,130,246,0.35))',
      }}>
        <img
          src={ARCHITECT.bannerUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 50%, rgba(10,10,20,0.45) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Profile card — overlaps banner, avatar left, info right */}
      <div style={{
        flexShrink: 0,
        margin: '-16px 8px 0',
        borderRadius: 11,
        background: 'rgba(14,11,28,0.94)',
        border: '1px solid rgba(139,92,246,0.36)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.58), 0 0 0 0.5px rgba(139,92,246,0.10)',
        backdropFilter: 'blur(14px)',
        padding: '9px',
        display: 'flex',
        gap: 9,
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Avatar */}
        <div style={{
          flexShrink: 0,
          width: 62,
          height: 62,
          borderRadius: 9,
          overflow: 'hidden',
          border: '1.5px solid rgba(139,92,246,0.40)',
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        }}>
          <img
            src={ARCHITECT.photoUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        {/* Info stack */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            {ARCHITECT.displayName}
          </div>
          <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
            @{ARCHITECT.username}
          </div>
          <div style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.52)',
            marginTop: 4,
            lineHeight: 1.35,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {ARCHITECT.bio}
          </div>
          <div style={{ marginTop: 5, display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{ARCHITECT.subscribers}</span>
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.34)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Subscribers
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 8px',
        marginTop: 10,
      }}>
        {['Photos', 'Videos', 'Vibes', 'Tags', 'Friends'].map((tab) => (
          <div key={tab} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 8,
            fontWeight: tab === 'Vibes' ? 700 : 400,
            color: tab === 'Vibes' ? '#c4b5fd' : 'rgba(255,255,255,0.30)',
            padding: '6px 0 5px',
            borderBottom: tab === 'Vibes' ? '1.5px solid #8b5cf6' : '1.5px solid transparent',
            marginBottom: -1,
          }}>
            {tab}
          </div>
        ))}
      </div>

      {/* Feed card */}
      <div style={{ flexShrink: 0, padding: '8px 8px 0' }}>
        <div style={{
          borderRadius: 8,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.09)',
          padding: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
            <div style={{
              width: 20, height: 20, borderRadius: 5, overflow: 'hidden',
              flexShrink: 0, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            }}>
              <img
                src={ARCHITECT.photoUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{ARCHITECT.displayName}</div>
              <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.36)', lineHeight: 1.3 }}>@{ARCHITECT.username} · Apr 25</div>
            </div>
          </div>
          <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55 }}>
            We don&apos;t just design spaces — we shape experiences.
            {' '}Precision, creativity, and vision in every project.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Phone shell — 250×525 (25% larger than VPORT carousel) ───
function PhoneShell({ children }) {
  return (
    <div style={{
      width: 250,
      height: 525,
      borderRadius: 58,
      background: 'linear-gradient(175deg, #1e1e2e 0%, #0d0d18 100%)',
      border: '1.5px solid rgba(255,255,255,0.24)',
      boxShadow: '0 56px 110px rgba(0,0,0,0.92), 0 0 0 0.5px rgba(255,255,255,0.04)',
      padding: 10,
      position: 'relative',
    }}>
      {/* Side buttons */}
      <div style={{ position: 'absolute', left: -3, top: 115, width: 3, height: 32, borderRadius: '2px 0 0 2px', background: 'rgba(255,255,255,0.18)' }} />
      <div style={{ position: 'absolute', left: -3, top: 162, width: 3, height: 57, borderRadius: '2px 0 0 2px', background: 'rgba(255,255,255,0.18)' }} />
      <div style={{ position: 'absolute', left: -3, top: 230, width: 3, height: 57, borderRadius: '2px 0 0 2px', background: 'rgba(255,255,255,0.18)' }} />
      <div style={{ position: 'absolute', right: -3, top: 188, width: 3, height: 82, borderRadius: '0 2px 2px 0', background: 'rgba(255,255,255,0.18)' }} />

      <div style={{ width: '100%', height: '100%', borderRadius: 50, overflow: 'hidden', background: '#000', position: 'relative' }}>
        {/* Dynamic island */}
        <div style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
          width: 84, height: 24, borderRadius: 12, background: '#000', zIndex: 10,
          boxShadow: '0 0 0 1.5px rgba(255,255,255,0.07)',
        }} />

        {children}

        {/* Screen glare */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, transparent 42%)',
          pointerEvents: 'none',
        }} />
        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 54,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
          pointerEvents: 'none',
        }} />
        {/* Home indicator */}
        <div style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          width: 94, height: 5, borderRadius: 2.5, background: 'rgba(255,255,255,0.42)', zIndex: 10,
        }} />
      </div>
    </div>
  )
}

// ── Main screen ──────────────────────────────────────────────
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
    try { sessionStorage.setItem('vcsm_funnel_source', 'how_to_profile') } catch { /* ignore */ }
    return () => {
      document.title = prevTitle
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#060609', color: '#fff', paddingTop: 60 }}>

      <PublicTopNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <div style={{ position: 'relative', padding: '48px 20px 60px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 500,
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.26) 0%, rgba(59,130,246,0.08) 45%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', marginBottom: 20,
            padding: '5px 14px', borderRadius: 9999,
            border: '1px solid rgba(139,92,246,0.38)',
            background: 'rgba(139,92,246,0.10)',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#c4b5fd',
          }}>
            Vibez Citizens
          </div>

          <h1 style={{
            margin: 0,
            fontSize: 'clamp(34px, 9vw, 52px)',
            fontWeight: 800, letterSpacing: '-0.028em', lineHeight: 1.08,
            background: 'linear-gradient(140deg, #fff 30%, rgba(196,181,253,0.85) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Your identity on Vibez Citizens
          </h1>

          <p style={{
            margin: '18px auto 0', maxWidth: 380,
            fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.50)',
          }}>
            One profile that connects everything — your Vibes, Vox threads, VPORTs, and
            presence across the platform.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 32 }}>
            <Link
              to={CTA_HREF}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 26px', borderRadius: 14,
                background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                boxShadow: '0 14px 36px rgba(139,92,246,0.38)',
                fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none',
              }}
            >
              Create your profile
            </Link>
            <Link
              to="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '14px 22px', borderRadius: 14,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
              }}
            >
              Explore profiles
            </Link>
          </div>
        </div>
      </div>

      {/* ── LIVE PREVIEW ──────────────────────────────────── */}
      <div style={{ padding: '0 20px 72px', textAlign: 'center' }}>

        {/* Section header */}
        <div style={{ marginBottom: 44 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 10,
          }}>
            Live preview
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Your citizen profile, instantly live
          </div>
          <p style={{
            marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.40)',
            maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            Show who you are, connect with people, and carry your identity across Vibez Citizens.
          </p>
        </div>

        {/* Centered phone */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)',
              width: 360, height: 480,
              background: 'radial-gradient(ellipse, rgba(139,92,246,0.34) 0%, transparent 68%)',
              filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <PhoneShell>
                <ProfilePhonePreview />
              </PhoneShell>
            </div>
          </div>
        </div>
      </div>

      {/* ── VALUE CARDS ───────────────────────────────────── */}
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '0 20px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 10,
          }}>
            Why create a profile
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Everything in one place
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {VALUE_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                style={{
                  borderRadius: 16,
                  border: `1px solid ${card.accent}22`,
                  background: `${card.accent}0d`,
                  padding: '22px 18px',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${card.accent}20`, border: `1px solid ${card.accent}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <Icon size={17} style={{ color: card.accent }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 7 }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.50)', lineHeight: 1.65 }}>
                  {card.desc}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '0 20px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 10,
          }}>
            How it works
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Get started in minutes
          </div>
        </div>

        <div style={{
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.025)',
          padding: '32px 28px',
        }}>
          {/* Desktop: horizontal step flow */}
          <div className="hidden sm:flex items-start justify-between gap-2" style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 12, left: '10%', right: '10%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.38) 20%, rgba(139,92,246,0.38) 80%, transparent)',
            }} />
            {STEPS.map((step) => (
              <div key={step.num} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 4px',
              }}>
                <span style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: '#c4b5fd', letterSpacing: '0.02em', marginBottom: 12,
                }}>
                  {step.num}
                </span>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{step.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>{step.desc}</div>
              </div>
            ))}
          </div>

          {/* Mobile: vertical timeline */}
          <div className="flex sm:hidden flex-col" style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 12, top: 26, bottom: 0, width: 1,
              background: 'linear-gradient(to bottom, rgba(139,92,246,0.38) 0%, rgba(139,92,246,0.04) 100%)',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {STEPS.map((step) => (
                <div key={step.num} style={{ display: 'flex', gap: 18, alignItems: 'flex-start', position: 'relative' }}>
                  <span style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: 8,
                    background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: '#c4b5fd', letterSpacing: '0.02em',
                    position: 'relative', zIndex: 1,
                  }}>
                    {step.num}
                  </span>
                  <div style={{ paddingTop: 3 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{step.label}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.46)', lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TRUST SECTION ─────────────────────────────────── */}
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '0 20px 64px' }}>
        <div style={{
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.025)',
          padding: '40px 28px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', marginBottom: 12,
            }}>
              Built for real connections
            </div>
            <p style={{
              fontSize: 14, color: 'rgba(255,255,255,0.46)', lineHeight: 1.7,
              maxWidth: 380, margin: '0 auto',
            }}>
              Profiles are the foundation of Vibez Citizens. They help people show who they are,
              connect with others, and build presence across the platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TRUST_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.label}
                  style={{
                    borderRadius: 14,
                    border: '1px solid rgba(139,92,246,0.14)',
                    background: 'rgba(139,92,246,0.07)',
                    padding: '20px 16px',
                  }}
                >
                  <Icon size={16} style={{ color: '#a78bfa', marginBottom: 10, display: 'block' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 5 }}>{card.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.46)', lineHeight: 1.6 }}>{card.desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '0 20px 72px' }}>
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
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 420, height: 220,
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.14) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              margin: 0, fontSize: 'clamp(22px, 5vw, 30px)',
              fontWeight: 800, letterSpacing: '-0.02em', color: '#fff',
            }}>
              Start your identity today
            </h2>
            <p style={{ margin: '12px 0 0', fontSize: 15, color: 'rgba(255,255,255,0.42)' }}>
              Free forever. No friction. Just you.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 32 }}>
              <Link
                to={CTA_HREF}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 28px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                  boxShadow: '0 12px 28px rgba(139,92,246,0.36)',
                  fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none',
                }}
              >
                Create your profile
              </Link>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '14px 24px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                }}
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
