import { Link } from 'react-router-dom'

function AppHeader() {
  return (
    <div style={{ flexShrink: 0, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 8px' }}>
      <span style={{ position: 'absolute', left: 8, fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>←</span>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.80)', textTransform: 'uppercase' }}>VPORT</span>
    </div>
  )
}

function BannerAvatar({ profile, bannerHeight }) {
  return (
    <div style={{ flexShrink: 0, position: 'relative' }}>
      <div style={{ height: bannerHeight, overflow: 'hidden', position: 'relative' }}>
        <img src={profile.bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 45%, rgba(10,10,20,0.62) 100%)' }} />
      </div>
      <img
        src={profile.avatarUrl}
        alt=""
        style={{ position: 'absolute', bottom: -16, left: 8, width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: '2px solid #0a0a14' }}
      />
    </div>
  )
}

function ProfileInfo({ profile, padding, bioMarginBottom }) {
  return (
    <div style={{ flexShrink: 0, padding }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{profile.name}</div>
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 2, marginBottom: 6 }}>{profile.handle}</div>
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.46)', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: bioMarginBottom }}>
        {profile.bio}
      </div>
    </div>
  )
}

function TabBar({ tabs, activeTab, activeColor, activeBorder }) {
  return (
    <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 8px' }}>
      {tabs.map((tab) => (
        <div key={tab} style={{
          flex: 1, textAlign: 'center',
          fontSize: tab.length > 8 ? 7 : 8,
          fontWeight: tab === activeTab ? 700 : 400,
          color: tab === activeTab ? activeColor : 'rgba(255,255,255,0.28)',
          padding: '5px 0 4px',
          borderBottom: tab === activeTab ? `1.5px solid ${activeBorder}` : '1.5px solid transparent',
          marginBottom: -1,
        }}>
          {tab}
        </div>
      ))}
    </div>
  )
}

function CtaButton({ ctaPath, ctaLabel, padding = '10px 8px 0', marginTop = 8 }) {
  return (
    <div style={{ padding, marginTop }}>
      <Link
        to={ctaPath}
        style={{ display: 'block', textAlign: 'center', padding: '8px 0', borderRadius: 8, background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)', boxShadow: '0 4px 16px rgba(139,92,246,0.38)', fontSize: 9, fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '0.01em' }}
      >
        {ctaLabel}
      </Link>
    </div>
  )
}

function RestaurantScreen({ preview }) {
  return (
    <>
      <AppHeader />
      <BannerAvatar profile={preview.profile} bannerHeight={70} />
      <ProfileInfo profile={preview.profile} padding="22px 8px 0" bioMarginBottom={10} />
      <TabBar tabs={preview.tabs} activeTab={preview.activeTab} activeColor="#c4b5fd" activeBorder="#8b5cf6" />
      <div style={{ flexShrink: 0, padding: '4px 8px 0' }}>
        {preview.menuItems.map((item, i) => (
          <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < preview.menuItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{item.name}</span>
            <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700 }}>{item.price}</span>
          </div>
        ))}
      </div>
      <CtaButton ctaPath={preview.ctaPath} ctaLabel={preview.ctaLabel} padding="10px 8px 0" marginTop={8} />
    </>
  )
}

function BarberScreen({ preview }) {
  return (
    <>
      <AppHeader />
      <BannerAvatar profile={preview.profile} bannerHeight={70} />
      <ProfileInfo profile={preview.profile} padding="20px 8px 0" bioMarginBottom={8} />
      <TabBar tabs={preview.tabs} activeTab={preview.activeTab} activeColor="#c4b5fd" activeBorder="#8b5cf6" />
      <div style={{ flexShrink: 0, padding: '4px 8px 0' }}>
        {preview.portfolioItems.map((item, i) => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0', borderBottom: i < preview.portfolioItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8b5cf6', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{item}</span>
          </div>
        ))}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 8px 0' }}>
        {preview.chips.map((tag) => (
          <span key={tag} style={{ fontSize: 7, color: preview.chipColor, background: preview.chipBg, border: `1px solid ${preview.chipBorder}`, borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
            #{tag}
          </span>
        ))}
      </div>
      <CtaButton ctaPath={preview.ctaPath} ctaLabel={preview.ctaLabel} padding="10px 8px 0" marginTop={8} />
    </>
  )
}

function LocksmithScreen({ preview }) {
  return (
    <>
      <AppHeader />
      <BannerAvatar profile={preview.profile} bannerHeight={64} />
      <ProfileInfo profile={preview.profile} padding="20px 8px 0" bioMarginBottom={8} />
      <TabBar tabs={preview.tabs} activeTab={preview.activeTab} activeColor="#7dd3fc" activeBorder="#38bdf8" />
      <div style={{ flexShrink: 0, padding: '4px 8px 0' }}>
        {preview.services.map((service, i) => (
          <div key={service} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '1px 0', borderBottom: i < preview.services.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ width: 4, height: 4, borderRadius: 1, background: '#38bdf8', flexShrink: 0 }} />
            <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{service}</span>
          </div>
        ))}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px 0' }}>
        {preview.chips.map((tag) => (
          <span key={tag} style={{ fontSize: 7, color: preview.chipColor, background: preview.chipBg, border: `1px solid ${preview.chipBorder}`, borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
            #{tag}
          </span>
        ))}
      </div>
      <CtaButton ctaPath={preview.ctaPath} ctaLabel={preview.ctaLabel} padding="8px 8px 0" marginTop={6} />
    </>
  )
}

function GasStationScreen({ preview }) {
  return (
    <>
      <AppHeader />
      <BannerAvatar profile={preview.profile} bannerHeight={64} />
      <ProfileInfo profile={preview.profile} padding="20px 8px 0" bioMarginBottom={8} />
      <TabBar tabs={preview.tabs} activeTab={preview.activeTab} activeColor="#86efac" activeBorder="#4ade80" />
      <div style={{ flexShrink: 0, padding: '6px 8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>Fuel Prices</span>
          <span style={{ fontSize: 6.5, color: '#4ade80', background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.22)', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>Official</span>
        </div>
        {preview.fuelPrices.map((fuel, i) => (
          <div key={fuel.grade} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < preview.fuelPrices.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{fuel.grade}</span>
            <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 700 }}>{fuel.price}</span>
          </div>
        ))}
        <div style={{ marginTop: 5, fontSize: 7, color: 'rgba(255,255,255,0.25)' }}>Updated today</div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', gap: 4, padding: '8px 8px 0' }}>
        {preview.chips.map((chip) => (
          <span key={chip} style={{ fontSize: 7, color: preview.chipColor, background: preview.chipBg, border: `1px solid ${preview.chipBorder}`, borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
            {chip}
          </span>
        ))}
      </div>
      <CtaButton ctaPath={preview.ctaPath} ctaLabel={preview.ctaLabel} padding="10px 8px 0" marginTop={8} />
    </>
  )
}

function MoneyExchangeScreen({ preview }) {
  return (
    <>
      <AppHeader />
      <BannerAvatar profile={preview.profile} bannerHeight={64} />
      <ProfileInfo profile={preview.profile} padding="20px 8px 0" bioMarginBottom={8} />
      <TabBar tabs={preview.tabs} activeTab={preview.activeTab} activeColor="#6ee7b7" activeBorder="#34d399" />
      <div style={{ flexShrink: 0, padding: '6px 8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>Exchange Rates</span>
          <span style={{ fontSize: 6.5, color: '#34d399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.22)', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>Live</span>
        </div>
        {preview.rates.map((rate, i) => (
          <div key={rate.pair} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0', borderBottom: i < preview.rates.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', marginBottom: i < preview.rates.length - 1 ? 4 : 0 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>{rate.pair}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.28)', marginBottom: 1 }}>Buy</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>{rate.buy}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.28)', marginBottom: 1 }}>Sell</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>{rate.sell}</div>
              </div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 4, fontSize: 7, color: 'rgba(255,255,255,0.22)' }}>Rates updated in real time.</div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', gap: 4, padding: '8px 8px 0' }}>
        {preview.chips.map((chip) => (
          <span key={chip} style={{ fontSize: 7, color: preview.chipColor, background: preview.chipBg, border: `1px solid ${preview.chipBorder}`, borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
            {chip}
          </span>
        ))}
      </div>
      <CtaButton ctaPath={preview.ctaPath} ctaLabel={preview.ctaLabel} padding="10px 8px 0" marginTop={6} />
    </>
  )
}

export function PreviewScreen({ preview }) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a14', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: 32, flexShrink: 0 }} />
      {preview.type === 'restaurant'     && <RestaurantScreen preview={preview} />}
      {preview.type === 'barber'         && <BarberScreen preview={preview} />}
      {preview.type === 'locksmith'      && <LocksmithScreen preview={preview} />}
      {preview.type === 'gas-station'    && <GasStationScreen preview={preview} />}
      {preview.type === 'money-exchange' && <MoneyExchangeScreen preview={preview} />}
    </div>
  )
}
