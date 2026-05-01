import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { NavLink, HamburgerIcon } from '@/shared/components/publicNavbarComponents'
import { PublicNavbarMobileMenu } from '@/shared/components/PublicNavbarMobileMenu'

export const PUBLIC_NAV_HEIGHT = 64

const NAV_LINKS = [
  { label: 'About',  to: '/about' },
  { label: 'VPORT',  to: '/how-to/create-vport' },
  { label: 'How-To', to: '/how-to/create-profile' },
  { label: 'Contact', to: '/contact' },
]

export default function PublicNavbar() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled]       = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [loginHovered, setLoginHovered] = useState(false)
  const [ctaHovered, setCtaHovered]   = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)
  const [isWide, setIsWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  )
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 480px)').matches : false
  )

  const { identity, identityLoading } = useIdentity()
  const isLoggedIn = !identityLoading && !!identity?.actorId

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    if (isWide) setMenuOpen(false)
  }, [isWide])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = (e) => setIsWide(e.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)')
    const update = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 9000,
          paddingTop: 'env(safe-area-inset-top)',
          background: scrolled ? 'rgba(7,7,11,0.90)' : 'rgba(10,10,15,0.62)',
          backdropFilter: scrolled ? 'blur(20px)' : 'blur(14px)',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          boxShadow: scrolled
            ? '0 1px 0 0 rgba(139,92,246,0.10), 0 4px 24px rgba(0,0,0,0.28)'
            : '0 1px 0 0 rgba(139,92,246,0.07)',
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: isMobile ? '0 16px' : '0 24px',
            height: PUBLIC_NAV_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* ── Logo ── */}
          <Link
            to="/"
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            style={{
              textDecoration: 'none', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 8,
              opacity: logoHovered ? 0.78 : 1,
              transition: 'opacity 0.18s ease',
            }}
          >
            <img
              src="/pwa-192x192.png"
              alt="Vibez Citizens"
              style={{
                width: 28, height: 28, borderRadius: 7,
                objectFit: 'cover', flexShrink: 0,
                boxShadow: logoHovered
                  ? '0 0 14px rgba(139,92,246,0.50)'
                  : '0 0 6px rgba(139,92,246,0.20)',
                transition: 'box-shadow 0.22s ease',
              }}
            />
            <span
              style={{
                fontSize: 15, fontWeight: 700, letterSpacing: '-0.025em',
                background: 'linear-gradient(125deg, #fff 35%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                whiteSpace: 'nowrap',
              }}
            >
              Vibez Citizens
            </span>
          </Link>

          {/* ── Center links (hidden below 768px) ── */}
          {isWide && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
              {NAV_LINKS.map(({ label, to }) => (
                <NavLink key={to} label={label} to={to} active={pathname === to} />
              ))}
            </div>
          )}

          {/* ── Right actions ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: isWide ? 0 : 'auto' }}>
            {isLoggedIn ? (
              <Link
                to="/feed"
                style={{
                  fontSize: 13, fontWeight: 600, color: '#c4b5fd',
                  textDecoration: 'none', padding: '8px 18px',
                  borderRadius: 9999, background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.30)', whiteSpace: 'nowrap', cursor: 'pointer',
                }}
              >
                Go to app
              </Link>
            ) : (
              <>
                {!isMobile && (
                  <Link
                    to="/login"
                    onMouseEnter={() => setLoginHovered(true)}
                    onMouseLeave={() => setLoginHovered(false)}
                    style={{
                      fontSize: 13, fontWeight: 500,
                      color: loginHovered ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.44)',
                      textDecoration: 'none', padding: '7px 14px', borderRadius: 9,
                      background: loginHovered ? 'rgba(255,255,255,0.055)' : 'transparent',
                      transform: loginHovered ? 'translateY(-1px)' : 'translateY(0)',
                      transition: 'color 0.18s ease, background 0.18s ease, transform 0.18s ease',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Log in
                  </Link>
                )}
                {isWide && (
                  <Link
                    to="/register"
                    onMouseEnter={() => setCtaHovered(true)}
                    onMouseLeave={() => setCtaHovered(false)}
                    style={{
                      fontSize: 13, fontWeight: 700, color: '#fff',
                      textDecoration: 'none', padding: '8px 18px', borderRadius: 9999,
                      background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #8b5cf6 100%)',
                      boxShadow: ctaHovered
                        ? '0 0 0 1px rgba(139,92,246,0.40), 0 8px 24px rgba(109,40,217,0.50)'
                        : '0 0 0 1px rgba(139,92,246,0.22), 0 4px 14px rgba(109,40,217,0.32)',
                      transform: ctaHovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                      transition: 'box-shadow 0.22s ease, transform 0.22s ease',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Get started
                  </Link>
                )}
              </>
            )}

            {/* ── Hamburger (mobile only) ── */}
            {!isWide && (
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 8, border: 'none',
                  background: menuOpen ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer', flexShrink: 0,
                  transition: 'background 0.18s ease',
                }}
              >
                <HamburgerIcon open={menuOpen} />
              </button>
            )}
          </div>
        </div>
      </nav>

      <PublicNavbarMobileMenu
        isWide={isWide}
        menuOpen={menuOpen}
        closeMenu={closeMenu}
        pathname={pathname}
        navLinks={NAV_LINKS}
        navHeight={PUBLIC_NAV_HEIGHT}
      />
    </>
  )
}
