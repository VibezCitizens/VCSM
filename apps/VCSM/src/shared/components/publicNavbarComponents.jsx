import { useState } from 'react'
import { Link } from 'react-router-dom'

export function NavLink({ label, to, active, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        letterSpacing: active ? '-0.01em' : 0,
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

export function HamburgerIcon({ open }) {
  return (
    <div style={{ width: 20, height: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <span style={{
        display: 'block', height: 1.5, borderRadius: 2,
        background: 'rgba(255,255,255,0.80)',
        transformOrigin: 'left center',
        transform: open ? 'rotate(45deg) translateY(-1px)' : 'none',
        transition: 'transform 0.22s ease, opacity 0.22s ease',
      }} />
      <span style={{
        display: 'block', height: 1.5, borderRadius: 2,
        background: 'rgba(255,255,255,0.80)',
        opacity: open ? 0 : 1,
        transition: 'opacity 0.18s ease',
      }} />
      <span style={{
        display: 'block', height: 1.5, borderRadius: 2,
        background: 'rgba(255,255,255,0.80)',
        transformOrigin: 'left center',
        transform: open ? 'rotate(-45deg) translateY(1px)' : 'none',
        transition: 'transform 0.22s ease',
      }} />
    </div>
  )
}
