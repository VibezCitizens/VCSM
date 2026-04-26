import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Create Profile', to: '/how-to/create-profile' },
  { label: 'Create VPORT', to: '/how-to/create-vport' },
  { label: 'Contact', to: '/contact' },
  { label: 'Privacy', to: '/legal/privacy-policy' },
  { label: 'Terms', to: '/legal/terms-of-service' },
]

// ── Individual nav link with hover ───────────────────────────
function NavLink({ label, to, active }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 13px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        letterSpacing: active ? '-0.01em' : '0',
        color: active ? '#c4b5fd' : hovered ? 'rgba(255,255,255,0.86)' : 'rgba(255,255,255,0.44)',
        textDecoration: 'none',
        background: active
          ? 'rgba(139,92,246,0.11)'
          : hovered
          ? 'rgba(255,255,255,0.04)'
          : 'transparent',
        transform: hovered && !active ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'color 0.18s ease, background 0.18s ease, transform 0.18s ease',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
    >
      {label}
    </Link>
  )
}

// ── Main nav ─────────────────────────────────────────────────
export default function PublicTopNav() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [loginHovered, setLoginHovered] = useState(false)
  const [ctaHovered, setCtaHovered] = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9000,
      height: 64,
      background: scrolled ? 'rgba(7,7,11,0.90)' : 'rgba(10,10,15,0.62)',
      backdropFilter: scrolled ? 'blur(20px)' : 'blur(14px)',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(14px)',
      borderBottom: '1px solid rgba(255,255,255,0.055)',
      boxShadow: scrolled
        ? '0 1px 0 0 rgba(139,92,246,0.10), 0 4px 24px rgba(0,0,0,0.28)'
        : '0 1px 0 0 rgba(139,92,246,0.07)',
      transition: 'background 0.3s ease, box-shadow 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 28px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>

        {/* ── Logo ─────────────────────────────────── */}
        <Link
          to="/"
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
          style={{
            textDecoration: 'none',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: logoHovered ? 0.78 : 1,
            transition: 'opacity 0.18s ease',
          }}
        >
          <img
            src="/pwa-192x192.png"
            alt="Vibez Citizens"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: logoHovered
                ? '0 0 14px rgba(139,92,246,0.50)'
                : '0 0 6px rgba(139,92,246,0.20)',
              transition: 'box-shadow 0.22s ease',
            }}
          />
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            background: 'linear-gradient(125deg, #fff 35%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Vibez Citizens
          </span>
        </Link>

        {/* ── Nav links ────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flex: 1,
          justifyContent: 'center',
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}>
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink key={to} label={label} to={to} active={pathname === to} />
          ))}
        </div>

        {/* ── Actions ──────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}>
          <Link
            to="/login"
            onMouseEnter={() => setLoginHovered(true)}
            onMouseLeave={() => setLoginHovered(false)}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: loginHovered ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.44)',
              textDecoration: 'none',
              padding: '7px 14px',
              borderRadius: 9,
              background: loginHovered ? 'rgba(255,255,255,0.055)' : 'transparent',
              transform: loginHovered ? 'translateY(-1px)' : 'translateY(0)',
              transition: 'color 0.18s ease, background 0.18s ease, transform 0.18s ease',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Log in
          </Link>
          <Link
            to="/register"
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              textDecoration: 'none',
              padding: '8px 18px',
              borderRadius: 9999,
              background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #8b5cf6 100%)',
              boxShadow: ctaHovered
                ? '0 0 0 1px rgba(139,92,246,0.40), 0 8px 24px rgba(109,40,217,0.50)'
                : '0 0 0 1px rgba(139,92,246,0.22), 0 4px 14px rgba(109,40,217,0.32)',
              transform: ctaHovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
              transition: 'box-shadow 0.22s ease, transform 0.22s ease',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Get started
          </Link>
        </div>

      </div>
    </nav>
  )
}
