import { Link } from 'react-router-dom'

export function PublicNavbarMobileMenu({ isWide, menuOpen, closeMenu, pathname, navLinks, navHeight }) {
  if (isWide) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeMenu}
        style={{
          position: 'fixed', inset: 0, zIndex: 8998,
          background: 'rgba(0,0,0,0.54)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 0.22s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: `calc(${navHeight}px + env(safe-area-inset-top))`,
          left: 0, right: 0,
          zIndex: 8999,
          background: 'rgba(8,8,13,0.97)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          transform: menuOpen ? 'translateY(0)' : 'translateY(-8px)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'transform 0.24s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div style={{ padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navLinks.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMenu}
              style={{
                display: 'block', padding: '13px 14px', borderRadius: 10,
                fontSize: 15, fontWeight: pathname === to ? 600 : 400,
                color: pathname === to ? '#c4b5fd' : 'rgba(255,255,255,0.72)',
                background: pathname === to ? 'rgba(139,92,246,0.10)' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {label}
            </Link>
          ))}

          <div style={{ margin: '10px 0 2px', height: 1, background: 'rgba(255,255,255,0.06)' }} />

          <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
            <Link
              to="/login"
              onClick={closeMenu}
              style={{
                flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 10,
                fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.70)',
                border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)',
                textDecoration: 'none',
              }}
            >
              Log in
            </Link>
            <Link
              to="/register"
              onClick={closeMenu}
              style={{
                flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 10,
                fontSize: 14, fontWeight: 700, color: '#fff',
                background: 'linear-gradient(135deg, #5b21b6, #8b5cf6)',
                boxShadow: '0 4px 14px rgba(109,40,217,0.36)',
                textDecoration: 'none',
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
