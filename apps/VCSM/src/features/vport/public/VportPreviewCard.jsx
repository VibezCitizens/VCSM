// Static VPORT preview card — renders real profile data in a mobile phone frame.
// Accepts pre-fetched domain data (no DB calls). Safe for static / SEO / marketing pages.
import { Link } from 'react-router-dom'
import { PhoneFrame } from './VportPhonePreview'
import { generateVportPreview } from './vportPreviewModel'

// ── Section content renderers ─────────────────────────────────────────────────

function MenuContent({ items }) {
  return (
    <div style={{ padding: '6px 8px 0' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.78)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{item.name}</span>
          {item.priceLabel && <span style={{ fontSize: 8.5, color: '#a78bfa', fontWeight: 700, flexShrink: 0 }}>{item.priceLabel}</span>}
        </div>
      ))}
    </div>
  )
}

function ServicesContent({ items }) {
  return (
    <div style={{ padding: '6px 8px 0' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{item.label}</span>
          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.38)', flexShrink: 0 }}>
            {item.priceLabel ?? item.durationLabel ?? ''}
          </span>
        </div>
      ))}
    </div>
  )
}

function PortfolioContent({ items }) {
  return (
    <div style={{ padding: '6px 8px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
      {items.map((item, i) => (
        <div key={item.id ?? i} style={{ borderRadius: 6, overflow: 'hidden', aspectRatio: '1 / 1', background: 'rgba(255,255,255,0.05)' }}>
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'rgba(255,255,255,0.16)' }}>✦</div>
          }
        </div>
      ))}
    </div>
  )
}

function RatesContent({ items }) {
  return (
    <div style={{ padding: '6px 8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.30)', width: 40, textAlign: 'center' }}>Buy</span>
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.30)', width: 40, textAlign: 'center' }}>Sell</span>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <span style={{ flex: 1, fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>{item.pair}</span>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: '#4ade80', width: 40, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{item.buyLabel ?? '—'}</span>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: '#fbbf24', width: 40, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{item.sellLabel ?? '—'}</span>
        </div>
      ))}
    </div>
  )
}

function FuelContent({ items }) {
  return (
    <div style={{ padding: '6px 8px 0' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{item.grade}</span>
          <span style={{ fontSize: 8.5, color: '#4ade80', fontWeight: 700 }}>
            {item.priceLabel}<span style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)' }}>/{item.unit}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function AmenitiesContent({ items }) {
  return (
    <div style={{ padding: '6px 8px 0', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {items.map((item, i) => (
        <span key={i} style={{ fontSize: 7, color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, padding: '2px 5px', fontWeight: 600 }}>
          {item}
        </span>
      ))}
    </div>
  )
}

function renderSection(section) {
  if (!section) return null
  if (section.type === 'menu')      return <MenuContent items={section.items} />
  if (section.type === 'services')  return <ServicesContent items={section.items} />
  if (section.type === 'portfolio') return <PortfolioContent items={section.items} />
  if (section.type === 'rates')     return <RatesContent items={section.items} />
  if (section.type === 'fuel')      return <FuelContent items={section.items} />
  if (section.type === 'amenities') return <AmenitiesContent items={section.items} />
  if (section.type === 'reviews') {
    const stars = section.rating ? Math.round(section.rating) : 0
    return (
      <div style={{ padding: '10px 8px', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{section.rating?.toFixed(1) ?? '—'}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', marginTop: 3 }}>
          {'★'.repeat(stars)}{'☆'.repeat(Math.max(0, 5 - stars))} · {section.count} {section.count === 1 ? 'review' : 'reviews'}
        </div>
      </div>
    )
  }
  if (section.type === 'about') {
    return (
      <div style={{ padding: '6px 8px 0' }}>
        <p style={{ margin: 0, fontSize: 8.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {section.text}
        </p>
      </div>
    )
  }
  return null
}

// ── Phone screen ──────────────────────────────────────────────────────────────

function VportCardScreen({ model }) {
  const { header, tabs, activeTab, sections, cta, accent } = model

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a14', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: 32, flexShrink: 0 }} />

      {/* App header */}
      <div style={{ flexShrink: 0, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 8px' }}>
        <span style={{ position: 'absolute', left: 8, fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>←</span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.80)', textTransform: 'uppercase' }}>VPORT</span>
      </div>

      {/* Banner + avatar */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <div style={{ height: 64, overflow: 'hidden', position: 'relative' }}>
          {header.bannerUrl
            ? <img src={header.bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accent}33 0%, ${accent}0a 100%)` }} />
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 45%, rgba(10,10,20,0.62) 100%)' }} />
        </div>
        <div style={{ position: 'absolute', bottom: -16, left: 8, width: 34, height: 34, borderRadius: 8, overflow: 'hidden', border: '2px solid #0a0a14', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}>
          {header.avatarUrl
            ? <img src={header.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
                {(header.name || '?')[0].toUpperCase()}
              </div>
          }
        </div>
      </div>

      {/* Profile info */}
      <div style={{ flexShrink: 0, padding: '20px 8px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{header.name}</div>
        {header.handle && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{header.handle}</div>}
        {header.bio && (
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.46)', lineHeight: 1.5, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {header.bio}
          </div>
        )}
        {header.rating != null && (
          <div style={{ fontSize: 8, color: accent, marginTop: 3, fontWeight: 700 }}>
            ★ {header.rating.toFixed(1)} · {header.reviewCount} {header.reviewCount === 1 ? 'review' : 'reviews'}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '8px 8px 0', marginTop: 6 }}>
        {tabs.map((tab) => (
          <div key={tab} style={{
            flex: 1, textAlign: 'center',
            fontSize: tab.length > 8 ? 7 : 8,
            fontWeight: tab === activeTab ? 700 : 400,
            color: tab === activeTab ? accent : 'rgba(255,255,255,0.28)',
            paddingBottom: 4,
            borderBottom: tab === activeTab ? `1.5px solid ${accent}` : '1.5px solid transparent',
            marginBottom: -1,
          }}>
            {tab}
          </div>
        ))}
      </div>

      {/* Primary section content */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {renderSection(sections[0])}
      </div>

      {/* CTA */}
      <div style={{ flexShrink: 0, padding: '6px 8px 8px' }}>
        <Link
          to={cta.primaryPath}
          style={{ display: 'block', textAlign: 'center', padding: '7px 0', borderRadius: 8, background: `linear-gradient(135deg, #6d28d9, ${accent})`, boxShadow: `0 4px 14px ${accent}44`, fontSize: 8.5, fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '0.01em' }}
        >
          {cta.primary}
        </Link>
      </div>
    </div>
  )
}

// ── Public export ─────────────────────────────────────────────────────────────

export function VportPreviewCard({ data }) {
  const model = generateVportPreview(data ?? {})
  return (
    <PhoneFrame
      preview={{ accent: model.accent, title: model.header.name, tagline: model.vportType }}
      isActive
    >
      <VportCardScreen model={model} />
    </PhoneFrame>
  )
}
