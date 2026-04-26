import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '@/features/legal/styles/legalDocument.css'
import PublicTopNav from '../components/PublicTopNav'

const PAGE_TITLE = 'How to Create a VPORT | Vibez Citizens'
const PAGE_DESCRIPTION =
  'Learn how to create your VPORT on Vibez Citizens and grow your business presence locally.'
const PAGE_URL = 'https://vibezcitizens.com/how-to/create-vport'
const CTA_HREF = '/register?intent=vport'

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

const RESTAURANT_PROFILE = {
  name: 'Restaurant Vport',
  handle: '@restaurant-vport-u2to',
  bio: 'Crafted dishes, elevated atmosphere, and service that makes you stay longer.',
  avatarUrl:
    'https://cdn.vibezcitizens.com/vport-avatar-photos/819c9456-b3b2-4283-b955-100c4a2a9ed9/2026/04/25/eeac8499-4e7b-4a70-8104-d0ed7458d9cc.jpeg',
  bannerUrl:
    'https://cdn.vibezcitizens.com/vport-avatar-banners/819c9456-b3b2-4283-b955-100c4a2a9ed9/2026/04/25/90c362a9-a5a2-485b-ac73-897acd181ddb.jpeg',
}

const RESTAURANT_MENU = [
  { name: 'Cheesecake', price: '$6.99' },
  { name: 'Chocolate Cake', price: '$4.99' },
  { name: 'Strawberry Shortcake', price: '$5.77' },
]

const BARBER_PROFILE = {
  name: 'BAR-BER',
  handle: '@bar-ber-34b1',
  bio: 'Precision cuts, clean fades, and sharp style. Keeping you looking your best every time.',
  avatarUrl:
    'https://cdn.vibezcitizens.com/vport-avatar-photos/2d73e1f2-d716-49e4-9017-ee25fea9abcd/2026/04/25/d9e85678-a2ee-4478-b392-98d8a851a9d2.webp',
  bannerUrl:
    'https://cdn.vibezcitizens.com/vport-avatar-banners/2d73e1f2-d716-49e4-9017-ee25fea9abcd/2026/04/25/9502cfd2-4a21-4ac3-aa15-b572930e5dc8.jpeg',
}

const BARBER_PORTFOLIO = ['Clean Beard Lineup', 'Fresh Taper Fade', 'Classic Skin Fade']

const BARBER_TAGS = ['fade', 'beard', 'lineup', 'grooming']

const LOCKSMITH_PROFILE = {
  name: 'Smart LockSmith',
  handle: '@smart-locksmith-1fvd',
  bio: 'Reliable locksmith services you can trust. From lockouts to security upgrades, we keep your home, business, and vehicle safe—fast and hassle-free.',
  avatarUrl: 'https://cdn.vibezcitizens.com/default/a2071aed-162c-41b0-bbe7-0de5994bca63.jpeg',
  bannerUrl:
    'https://cdn.vibezcitizens.com/vport-avatar-banners/f33d3add-b01a-4d95-be6d-9be81964bd8d/2026/04/26/bf847bc4-7919-4eb9-9221-f18843c73279.jpeg',
}

const LOCKSMITH_SERVICES = [
  'Residential Lockout',
  'Car Lockout',
  'Rekey',
  'Lock Installation',
  'Smart Lock Install',
  'Key Duplication',
]

const LOCKSMITH_TAGS = ['emergency', 'lockout', 'rekey', 'security']

const GAS_PROFILE = {
  name: 'Gas Station Vport',
  handle: '@gas-station-vport-tr75',
  bio: 'Fuel, convenience, and everyday essentials in one trusted stop.',
  avatarUrl: 'https://cdn.vibezcitizens.com/default/3111244d-cbdb-4ff6-ba6b-66f95998c3ed.jpeg',
  bannerUrl:
    'https://cdn.vibezcitizens.com/vport-avatar-banners/5fcc63bd-2cc1-4401-accc-a123c1f02b2a/2026/04/25/d7d10b6b-8da4-4139-b66a-c308b59faf44.webp',
}

const GAS_FUEL_PRICES = [
  { grade: 'Regular', price: '$2.99' },
  { grade: 'Midgrade', price: '$3.10' },
  { grade: 'Premium', price: '$3.15' },
]

const GAS_SERVICE_CHIPS = ['Air & Tire', 'Car Wash', 'ATM']

const MONEY_PROFILE = {
  name: 'Old Money',
  handle: '@old-money-360u',
  bio: 'Exchange smarter 💱 Real rates, fast service, zero hassle.',
  avatarUrl: 'https://cdn.vibezcitizens.com/default/179d2de8-b501-4327-bd25-062fa41b549a.png',
  bannerUrl:
    'https://cdn.vibezcitizens.com/vport-avatar-banners/858e6824-4d5b-47af-b8c2-a667be92db4c/2026/04/25/0886785e-82d5-46f8-a07e-ea427a694b56.jpeg',
}

const MONEY_RATES = [
  { pair: 'USD / EUR', buy: '1.0850', sell: '0.9250' },
  { pair: 'USD / MXN', buy: '18.86', sell: '19.90' },
]

const MONEY_SERVICE_CHIPS = ['Currency', 'Travel Money', 'Rate Alerts']

const VPORT_TYPES = [
  {
    title: 'Restaurant VPORT',
    tagline: 'Menus • Photos • Reviews',
    accent: '#f59e0b',
    imageUrl: '/Vport/restaurant.png',
  },
  {
    title: 'Barbershop VPORT',
    tagline: 'Portfolio • Booking • Reviews',
    accent: '#8b5cf6',
    imageUrl: '/Vport/Barber.png',
  },
  {
    title: 'Locksmith VPORT',
    tagline: 'Emergency • Services • Areas',
    accent: '#38bdf8',
    imageUrl: '/Vport/locksmith.png',
  },
  {
    title: 'Gas Station VPORT',
    tagline: 'Fuel • Truck Services • Store',
    accent: '#4ade80',
    imageUrl: '/Vport/gas.png',
  },
  {
    title: 'Money Exchange VPORT',
    tagline: 'Rates • Currencies • Transfers',
    accent: '#34d399',
    imageUrl: '/Vport/money.png',
  },
]

const STEPS = [
  'Create your Vibez Citizens account.',
  'Go to Settings and create a VPORT for your business.',
  'Add your business name, logo, and description.',
  'List your services, hours, and location.',
  'Publish and share your VPORT link anywhere.',
]

// ── Restaurant VPORT live preview ────────────────────────────
function RestaurantVportPreviewScreen() {
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
      <div style={{ height: 32, flexShrink: 0 }} />

      {/* App header */}
      <div style={{
        flexShrink: 0,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0 8px',
      }}>
        <span style={{ position: 'absolute', left: 8, fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>←</span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.80)', textTransform: 'uppercase' }}>
          VPORT
        </span>
      </div>

      {/* Banner + avatar zone — avatar anchors to banner bottom-left */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <div style={{ height: 70, overflow: 'hidden', position: 'relative' }}>
          <img
            src={RESTAURANT_PROFILE.bannerUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 45%, rgba(10,10,20,0.62) 100%)',
          }} />
        </div>
        {/* Avatar — classic bottom-left overlap */}
        <img
          src={RESTAURANT_PROFILE.avatarUrl}
          alt=""
          style={{
            position: 'absolute',
            bottom: -16,
            left: 8,
            width: 34,
            height: 34,
            borderRadius: 8,
            objectFit: 'cover',
            border: '2px solid #0a0a14',
          }}
        />
      </div>

      {/* Name + handle — padding-top clears avatar */}
      <div style={{ flexShrink: 0, padding: '22px 8px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
          {RESTAURANT_PROFILE.name}
        </div>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2, marginBottom: 6 }}>
          {RESTAURANT_PROFILE.handle}
        </div>
        {/* Bio — single line with ellipsis */}
        <div style={{
          fontSize: 8,
          color: 'rgba(255,255,255,0.46)',
          lineHeight: 1.5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 10,
        }}>
          {RESTAURANT_PROFILE.bio}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 8px',
      }}>
        {['Menu', 'Reviews', 'Content', 'About'].map((tab) => (
          <div key={tab} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 8,
            fontWeight: tab === 'Menu' ? 700 : 400,
            color: tab === 'Menu' ? '#c4b5fd' : 'rgba(255,255,255,0.28)',
            padding: '5px 0 4px',
            borderBottom: tab === 'Menu' ? '1.5px solid #8b5cf6' : '1.5px solid transparent',
            marginBottom: -1,
          }}>
            {tab}
          </div>
        ))}
      </div>

      {/* Menu items — no redundant section label */}
      <div style={{ flexShrink: 0, padding: '4px 8px 0' }}>
        {RESTAURANT_MENU.map((item, i) => (
          <div key={item.name} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '7px 0',
            borderBottom: i < RESTAURANT_MENU.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{item.name}</span>
            <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700 }}>{item.price}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '10px 8px 0', marginTop: 8 }}>
        <Link
          to="/profile/restaurant-vport-u2to"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '8px 0',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
            boxShadow: '0 4px 16px rgba(139,92,246,0.38)',
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          View Restaurant VPORT
        </Link>
      </div>
    </div>
  )
}

// ── Barber VPORT live preview ────────────────────────────────
function BarberVportPreviewScreen() {
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
      <div style={{ height: 32, flexShrink: 0 }} />

      {/* App header */}
      <div style={{
        flexShrink: 0,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0 8px',
      }}>
        <span style={{ position: 'absolute', left: 8, fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>←</span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.80)', textTransform: 'uppercase' }}>
          VPORT
        </span>
      </div>

      {/* Banner + avatar zone */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <div style={{ height: 70, overflow: 'hidden', position: 'relative' }}>
          <img
            src={BARBER_PROFILE.bannerUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 45%, rgba(10,10,20,0.62) 100%)',
          }} />
        </div>
        <img
          src={BARBER_PROFILE.avatarUrl}
          alt=""
          style={{
            position: 'absolute',
            bottom: -16,
            left: 8,
            width: 34,
            height: 34,
            borderRadius: 8,
            objectFit: 'cover',
            border: '2px solid #0a0a14',
          }}
        />
      </div>

      {/* Name + handle + bio */}
      <div style={{ flexShrink: 0, padding: '20px 8px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
          {BARBER_PROFILE.name}
        </div>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2, marginBottom: 6 }}>
          {BARBER_PROFILE.handle}
        </div>
        <div style={{
          fontSize: 8,
          color: 'rgba(255,255,255,0.46)',
          lineHeight: 1.5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 8,
        }}>
          {BARBER_PROFILE.bio}
        </div>
      </div>

      {/* Tabs — Portfolio active */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 8px',
      }}>
        {['Portfolio', 'Services', 'Calendar', 'Reviews'].map((tab) => (
          <div key={tab} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 7,
            fontWeight: tab === 'Portfolio' ? 700 : 400,
            color: tab === 'Portfolio' ? '#c4b5fd' : 'rgba(255,255,255,0.28)',
            padding: '5px 0 4px',
            borderBottom: tab === 'Portfolio' ? '1.5px solid #8b5cf6' : '1.5px solid transparent',
            marginBottom: -1,
          }}>
            {tab}
          </div>
        ))}
      </div>

      {/* Portfolio items */}
      <div style={{ flexShrink: 0, padding: '4px 8px 0' }}>
        {BARBER_PORTFOLIO.map((item, i) => (
          <div key={item} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 0',
            borderBottom: i < BARBER_PORTFOLIO.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <div style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#8b5cf6',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        padding: '8px 8px 0',
      }}>
        {BARBER_TAGS.map((tag) => (
          <span key={tag} style={{
            fontSize: 7,
            color: '#a78bfa',
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.22)',
            borderRadius: 4,
            padding: '2px 6px',
            fontWeight: 600,
          }}>
            #{tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '10px 8px 0', marginTop: 8 }}>
        <Link
          to="/profile/bar-ber-34b1"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '8px 0',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
            boxShadow: '0 4px 16px rgba(139,92,246,0.38)',
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          View BAR-BER VPORT
        </Link>
      </div>
    </div>
  )
}

// ── Locksmith VPORT live preview ─────────────────────────────
function LocksmithVportPreviewScreen() {
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
      <div style={{ height: 32, flexShrink: 0 }} />

      {/* App header */}
      <div style={{
        flexShrink: 0,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0 8px',
      }}>
        <span style={{ position: 'absolute', left: 8, fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>←</span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.80)', textTransform: 'uppercase' }}>
          VPORT
        </span>
      </div>

      {/* Banner + avatar zone */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <div style={{ height: 64, overflow: 'hidden', position: 'relative' }}>
          <img
            src={LOCKSMITH_PROFILE.bannerUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 45%, rgba(10,10,20,0.62) 100%)',
          }} />
        </div>
        <img
          src={LOCKSMITH_PROFILE.avatarUrl}
          alt=""
          style={{
            position: 'absolute',
            bottom: -16,
            left: 8,
            width: 34,
            height: 34,
            borderRadius: 8,
            objectFit: 'cover',
            border: '2px solid #0a0a14',
          }}
        />
      </div>

      {/* Name + handle + bio */}
      <div style={{ flexShrink: 0, padding: '20px 8px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
          {LOCKSMITH_PROFILE.name}
        </div>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2, marginBottom: 6 }}>
          {LOCKSMITH_PROFILE.handle}
        </div>
        <div style={{
          fontSize: 8,
          color: 'rgba(255,255,255,0.46)',
          lineHeight: 1.5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 8,
        }}>
          {LOCKSMITH_PROFILE.bio}
        </div>
      </div>

      {/* Tabs — Services active, blue accent */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 8px',
      }}>
        {['Services', 'Calendar', 'Reviews', 'About'].map((tab) => (
          <div key={tab} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 7,
            fontWeight: tab === 'Services' ? 700 : 400,
            color: tab === 'Services' ? '#7dd3fc' : 'rgba(255,255,255,0.28)',
            padding: '5px 0 4px',
            borderBottom: tab === 'Services' ? '1.5px solid #38bdf8' : '1.5px solid transparent',
            marginBottom: -1,
          }}>
            {tab}
          </div>
        ))}
      </div>

      {/* Services list — compact to fit all 6 */}
      <div style={{ flexShrink: 0, padding: '4px 8px 0' }}>
        {LOCKSMITH_SERVICES.map((service, i) => (
          <div key={service} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '1px 0',
            borderBottom: i < LOCKSMITH_SERVICES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <div style={{
              width: 4,
              height: 4,
              borderRadius: 1,
              background: '#38bdf8',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{service}</span>
          </div>
        ))}
      </div>

      {/* Tags — blue-tinted */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        padding: '6px 8px 0',
      }}>
        {LOCKSMITH_TAGS.map((tag) => (
          <span key={tag} style={{
            fontSize: 7,
            color: '#7dd3fc',
            background: 'rgba(56,189,248,0.10)',
            border: '1px solid rgba(56,189,248,0.22)',
            borderRadius: 4,
            padding: '2px 6px',
            fontWeight: 600,
          }}>
            #{tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '8px 8px 0', marginTop: 6 }}>
        <Link
          to="/profile/smart-locksmith-1fvd"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '8px 0',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
            boxShadow: '0 4px 16px rgba(139,92,246,0.38)',
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          View Smart LockSmith VPORT
        </Link>
      </div>
    </div>
  )
}

// ── Gas Station VPORT live preview ───────────────────────────
function GasStationVportPreviewScreen() {
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
      <div style={{ height: 32, flexShrink: 0 }} />

      {/* App header */}
      <div style={{
        flexShrink: 0,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0 8px',
      }}>
        <span style={{ position: 'absolute', left: 8, fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>←</span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.80)', textTransform: 'uppercase' }}>
          VPORT
        </span>
      </div>

      {/* Banner + avatar zone */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <div style={{ height: 64, overflow: 'hidden', position: 'relative' }}>
          <img
            src={GAS_PROFILE.bannerUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 45%, rgba(10,10,20,0.62) 100%)',
          }} />
        </div>
        <img
          src={GAS_PROFILE.avatarUrl}
          alt=""
          style={{
            position: 'absolute',
            bottom: -16,
            left: 8,
            width: 34,
            height: 34,
            borderRadius: 8,
            objectFit: 'cover',
            border: '2px solid #0a0a14',
          }}
        />
      </div>

      {/* Name + handle + bio */}
      <div style={{ flexShrink: 0, padding: '20px 8px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
          {GAS_PROFILE.name}
        </div>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2, marginBottom: 6 }}>
          {GAS_PROFILE.handle}
        </div>
        <div style={{
          fontSize: 8,
          color: 'rgba(255,255,255,0.46)',
          lineHeight: 1.5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 8,
        }}>
          {GAS_PROFILE.bio}
        </div>
      </div>

      {/* Tabs — Gas active, green accent */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 8px',
      }}>
        {['Gas', 'Services', 'Content', 'About'].map((tab) => (
          <div key={tab} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 7,
            fontWeight: tab === 'Gas' ? 700 : 400,
            color: tab === 'Gas' ? '#86efac' : 'rgba(255,255,255,0.28)',
            padding: '5px 0 4px',
            borderBottom: tab === 'Gas' ? '1.5px solid #4ade80' : '1.5px solid transparent',
            marginBottom: -1,
          }}>
            {tab}
          </div>
        ))}
      </div>

      {/* Fuel Prices section */}
      <div style={{ flexShrink: 0, padding: '6px 8px 0' }}>
        {/* Header row — label + Official pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
            Fuel Prices
          </span>
          <span style={{
            fontSize: 6.5,
            color: '#4ade80',
            background: 'rgba(74,222,128,0.10)',
            border: '1px solid rgba(74,222,128,0.22)',
            borderRadius: 4,
            padding: '1px 5px',
            fontWeight: 700,
          }}>
            Official
          </span>
        </div>

        {/* Fuel rows */}
        {GAS_FUEL_PRICES.map((fuel, i) => (
          <div key={fuel.grade} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0',
            borderBottom: i < GAS_FUEL_PRICES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{fuel.grade}</span>
            <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 700 }}>{fuel.price}</span>
          </div>
        ))}

        {/* Updated footer */}
        <div style={{ marginTop: 5, fontSize: 7, color: 'rgba(255,255,255,0.25)' }}>
          Updated today
        </div>
      </div>

      {/* Service chips — green tinted, single row */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        gap: 4,
        padding: '8px 8px 0',
      }}>
        {GAS_SERVICE_CHIPS.map((chip) => (
          <span key={chip} style={{
            fontSize: 7,
            color: '#86efac',
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.20)',
            borderRadius: 4,
            padding: '2px 6px',
            fontWeight: 600,
          }}>
            {chip}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '10px 8px 0', marginTop: 8 }}>
        <Link
          to="/profile/gas-station-vport-tr75"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '8px 0',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
            boxShadow: '0 4px 16px rgba(139,92,246,0.38)',
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          View Gas Station VPORT
        </Link>
      </div>
    </div>
  )
}

// ── Money Exchange VPORT live preview ────────────────────────
function MoneyExchangeVportPreviewScreen() {
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
      <div style={{ height: 32, flexShrink: 0 }} />

      {/* App header */}
      <div style={{
        flexShrink: 0,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '0 8px',
      }}>
        <span style={{ position: 'absolute', left: 8, fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>←</span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.80)', textTransform: 'uppercase' }}>
          VPORT
        </span>
      </div>

      {/* Banner + avatar zone */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <div style={{ height: 64, overflow: 'hidden', position: 'relative' }}>
          <img
            src={MONEY_PROFILE.bannerUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 45%, rgba(10,10,20,0.62) 100%)',
          }} />
        </div>
        <img
          src={MONEY_PROFILE.avatarUrl}
          alt=""
          style={{
            position: 'absolute',
            bottom: -16,
            left: 8,
            width: 34,
            height: 34,
            borderRadius: 8,
            objectFit: 'cover',
            border: '2px solid #0a0a14',
          }}
        />
      </div>

      {/* Name + handle + bio */}
      <div style={{ flexShrink: 0, padding: '20px 8px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
          {MONEY_PROFILE.name}
        </div>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2, marginBottom: 6 }}>
          {MONEY_PROFILE.handle}
        </div>
        <div style={{
          fontSize: 8,
          color: 'rgba(255,255,255,0.46)',
          lineHeight: 1.5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 8,
        }}>
          {MONEY_PROFILE.bio}
        </div>
      </div>

      {/* Tabs — Rates active, emerald accent */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 8px',
      }}>
        {['Rates', 'Services', 'Content', 'Reviews'].map((tab) => (
          <div key={tab} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 7,
            fontWeight: tab === 'Rates' ? 700 : 400,
            color: tab === 'Rates' ? '#6ee7b7' : 'rgba(255,255,255,0.28)',
            padding: '5px 0 4px',
            borderBottom: tab === 'Rates' ? '1.5px solid #34d399' : '1.5px solid transparent',
            marginBottom: -1,
          }}>
            {tab}
          </div>
        ))}
      </div>

      {/* Exchange Rates section */}
      <div style={{ flexShrink: 0, padding: '6px 8px 0' }}>
        {/* Header — label + Live pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
            Exchange Rates
          </span>
          <span style={{
            fontSize: 6.5,
            color: '#34d399',
            background: 'rgba(52,211,153,0.10)',
            border: '1px solid rgba(52,211,153,0.22)',
            borderRadius: 4,
            padding: '1px 5px',
            fontWeight: 700,
          }}>
            Live
          </span>
        </div>

        {/* Rate pairs — pair left, stacked Buy/Sell columns right */}
        {MONEY_RATES.map((rate, i) => (
          <div key={rate.pair} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '3px 0',
            borderBottom: i < MONEY_RATES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            marginBottom: i < MONEY_RATES.length - 1 ? 4 : 0,
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
              {rate.pair}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.28)', marginBottom: 1 }}>Buy</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>
                  {rate.buy}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.28)', marginBottom: 1 }}>Sell</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>
                  {rate.sell}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{ marginTop: 4, fontSize: 7, color: 'rgba(255,255,255,0.22)' }}>
          Rates updated in real time.
        </div>
      </div>

      {/* Service chips — emerald tinted, single row */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        gap: 4,
        padding: '8px 8px 0',
      }}>
        {MONEY_SERVICE_CHIPS.map((chip) => (
          <span key={chip} style={{
            fontSize: 7,
            color: '#6ee7b7',
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.20)',
            borderRadius: 4,
            padding: '2px 6px',
            fontWeight: 600,
          }}>
            {chip}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '10px 8px 0', marginTop: 6 }}>
        <Link
          to="/profile/old-money-360u"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '8px 0',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
            boxShadow: '0 4px 16px rgba(139,92,246,0.38)',
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          View Old Money VPORT
        </Link>
      </div>
    </div>
  )
}

// ── Phone mockup ────────────────────────────────────────────
function PhoneFrame({ type, isActive, screenContent }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* Ambient glow — only active */}
      <div style={{
        position: 'absolute',
        top: '8%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 240,
        height: 320,
        background: `radial-gradient(ellipse, ${type.accent}${isActive ? '40' : '00'} 0%, transparent 70%)`,
        filter: 'blur(36px)',
        pointerEvents: 'none',
        transition: 'background 0.5s ease',
        zIndex: 0,
      }} />

      {/* Phone body — visible dark bezel */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: 200,
        height: 420,
        borderRadius: 46,
        background: 'linear-gradient(175deg, #1e1e2e 0%, #0d0d18 100%)',
        border: isActive
          ? '1.5px solid rgba(255,255,255,0.28)'
          : '1.5px solid rgba(255,255,255,0.09)',
        boxShadow: isActive
          ? '0 56px 110px rgba(0,0,0,0.92), 0 0 0 0.5px rgba(255,255,255,0.04)'
          : '0 18px 44px rgba(0,0,0,0.65)',
        padding: 9,
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}>

        {/* Left side — mute + volume buttons */}
        <div style={{ position: 'absolute', left: -3, top: 92,  width: 3, height: 26, borderRadius: '2px 0 0 2px', background: 'rgba(255,255,255,0.18)' }} />
        <div style={{ position: 'absolute', left: -3, top: 130, width: 3, height: 46, borderRadius: '2px 0 0 2px', background: 'rgba(255,255,255,0.18)' }} />
        <div style={{ position: 'absolute', left: -3, top: 186, width: 3, height: 46, borderRadius: '2px 0 0 2px', background: 'rgba(255,255,255,0.18)' }} />

        {/* Right side — power button */}
        <div style={{ position: 'absolute', right: -3, top: 150, width: 3, height: 66, borderRadius: '0 2px 2px 0', background: 'rgba(255,255,255,0.18)' }} />

        {/* Screen — inset from bezel */}
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: 38,
          overflow: 'hidden',
          background: '#000',
          position: 'relative',
        }}>
          {/* Dynamic island */}
          <div style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 68,
            height: 20,
            borderRadius: 10,
            background: '#000',
            zIndex: 10,
            boxShadow: '0 0 0 1.5px rgba(255,255,255,0.07)',
          }} />

          {/* Screen content — custom preview or static screenshot */}
          {screenContent ?? (
            <img
              src={type.imageUrl}
              alt={type.title}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
              }}
            />
          )}

          {/* Screen glare */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 42%)',
            pointerEvents: 'none',
          }} />

          {/* Bottom fade so home indicator blends naturally */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 44,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
            pointerEvents: 'none',
          }} />

          {/* Home indicator */}
          <div style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 76,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.42)',
            zIndex: 10,
          }} />
        </div>
      </div>

      {/* Label — only visible when active */}
      <div style={{
        textAlign: 'center',
        transition: 'opacity 0.4s ease',
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? 'auto' : 'none',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
          {type.title}
        </div>
        <div style={{ marginTop: 5, fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>
          {type.tagline}
        </div>
      </div>
    </div>
  )
}

// ── Main screen ─────────────────────────────────────────────
export default function HowToCreateVportScreen() {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef(null)
  const slideRefs = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    const prevTitle = document.title
    document.title = PAGE_TITLE
    const cleanups = [
      setMeta('description', PAGE_DESCRIPTION, true),
      setMeta('og:title', PAGE_TITLE),
      setMeta('og:description', PAGE_DESCRIPTION),
      setMeta('og:url', PAGE_URL),
    ]
    try { sessionStorage.setItem('vcsm_funnel_source', 'how_to_vport') } catch { /* ignore */ }
    return () => {
      document.title = prevTitle
      cleanups.forEach((fn) => fn())
    }
  }, [])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current
      if (!el) return
      const center = el.scrollLeft + el.clientWidth / 2
      let closest = 0
      let minDist = Infinity
      slideRefs.current.forEach((slide, i) => {
        if (!slide) return
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2
        const dist = Math.abs(center - slideCenter)
        if (dist < minDist) { minDist = dist; closest = i }
      })
      setActiveIndex(closest)
    })
  }, [])

  const scrollToIndex = useCallback((idx) => {
    const el = scrollRef.current
    const slide = slideRefs.current[idx]
    if (!el || !slide) return
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2
    el.scrollTo({ left: slideCenter - el.clientWidth / 2, behavior: 'smooth' })
  }, [])

  const activeType = VPORT_TYPES[activeIndex]

  return (
    <div style={{ minHeight: '100vh', background: '#060609', color: '#fff', paddingTop: 60 }}>

      <PublicTopNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <div style={{ position: 'relative', padding: '44px 20px 56px', textAlign: 'center', overflow: 'hidden' }}>
        {/* Purple/blue radial glow */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 700,
          height: 500,
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.26) 0%, rgba(59,130,246,0.08) 45%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto' }}>
          {/* Eyebrow badge */}
          <div style={{
            display: 'inline-block',
            marginBottom: 20,
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

          <h1 style={{
            margin: 0,
            fontSize: 'clamp(34px, 9vw, 52px)',
            fontWeight: 800,
            letterSpacing: '-0.028em',
            lineHeight: 1.08,
            background: 'linear-gradient(140deg, #fff 30%, rgba(196,181,253,0.85) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Create Your VPORT
          </h1>

          <p style={{
            margin: '18px auto 0',
            maxWidth: 340,
            fontSize: 16,
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.50)',
          }}>
            Turn any real-world service into a digital experience.
          </p>

          <Link
            to={CTA_HREF}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 32,
              padding: '14px 26px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
              boxShadow: '0 14px 36px rgba(139,92,246,0.38)',
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

      {/* ── SHOWCASE ──────────────────────────────────────── */}
      <div style={{ position: 'relative', paddingBottom: 52, overflow: 'hidden' }}>
        {/* Dynamic ambient glow — shifts with active type */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 420,
          height: 420,
          background: `radial-gradient(ellipse, ${activeType.accent}16 0%, transparent 70%)`,
          filter: 'blur(64px)',
          pointerEvents: 'none',
          transition: 'background 0.9s ease',
          zIndex: 0,
        }} />

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#fff',
          }}>
            What will you build?
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Swipe to explore
          </div>
        </div>

        {/* Phone carousel */}
        <div
          ref={scrollRef}
          className="howto-carousel"
          style={{
            display: 'flex',
            scrollSnapType: 'x mandatory',
            gap: 20,
            paddingLeft: 'calc(50vw - 100px)',
            paddingRight: 'calc(50vw - 100px)',
            paddingBottom: 12,
            position: 'relative',
            zIndex: 1,
          }}
          onScroll={handleScroll}
        >
          {VPORT_TYPES.map((type, i) => (
            <div
              key={type.title}
              ref={(el) => { slideRefs.current[i] = el }}
              style={{
                flexShrink: 0,
                scrollSnapAlign: 'center',
                width: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.45s ease',
                transform: i === activeIndex ? 'scale(1)' : 'scale(0.78)',
                opacity: i === activeIndex ? 1 : 0.35,
                cursor: i !== activeIndex ? 'pointer' : 'default',
              }}
              onClick={() => { if (i !== activeIndex) scrollToIndex(i) }}
            >
              <PhoneFrame
                type={type}
                isActive={i === activeIndex}
                screenContent={
                  i === 0 ? <RestaurantVportPreviewScreen /> :
                  i === 1 ? <BarberVportPreviewScreen /> :
                  i === 2 ? <LocksmithVportPreviewScreen /> :
                  i === 3 ? <GasStationVportPreviewScreen /> :
                  i === 4 ? <MoneyExchangeVportPreviewScreen /> :
                  undefined
                }
              />
            </div>
          ))}
        </div>

        {/* Dot / pill indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          marginTop: 32,
          position: 'relative',
          zIndex: 1,
        }}>
          {VPORT_TYPES.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`View ${VPORT_TYPES[i].title}`}
              style={{
                width: i === activeIndex ? 22 : 6,
                height: 6,
                borderRadius: 3,
                border: 'none',
                padding: 0,
                background: i === activeIndex ? activeType.accent : 'rgba(255,255,255,0.16)',
                cursor: 'pointer',
                transition: 'all 0.35s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.025)',
          padding: '24px 20px',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 22 }}>
            How to get started
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {STEPS.map((step, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#c4b5fd',
                  letterSpacing: '0.02em',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.60)', lineHeight: 1.65, paddingTop: 2 }}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── BOTTOM CTA ──────────────────────────────────── */}
        <div style={{
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.025)',
          padding: '32px 24px',
          textAlign: 'center',
          marginBottom: 48,
        }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            Ready to grow your business?
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.38)' }}>
            Free to create. No subscription required.
          </p>
          <Link
            to={CTA_HREF}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 22,
              padding: '13px 26px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
              boxShadow: '0 12px 28px rgba(139,92,246,0.32)',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            Create your VPORT
          </Link>
          <div style={{ marginTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#c4b5fd', textDecoration: 'none' }}>
              Log in
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
