// Static marketing preview data for VPORT phone showcases — no DB, no auth

export const VPORT_PREVIEWS = [
  {
    type: 'restaurant',
    slugs: ['restaurant'],
    title: 'Restaurant VPORT',
    tagline: 'Menus • Photos • Reviews',
    accent: '#f59e0b',
    imageUrl: '/Vport/restaurant.png',
    profile: {
      name: 'Restaurant Vport',
      handle: '@restaurant-vport-u2to',
      bio: 'Crafted dishes, elevated atmosphere, and service that makes you stay longer.',
      avatarUrl:
        'https://cdn.vibezcitizens.com/vport-avatar-photos/819c9456-b3b2-4283-b955-100c4a2a9ed9/2026/04/25/eeac8499-4e7b-4a70-8104-d0ed7458d9cc.jpeg',
      bannerUrl:
        'https://cdn.vibezcitizens.com/vport-avatar-banners/819c9456-b3b2-4283-b955-100c4a2a9ed9/2026/04/25/90c362a9-a5a2-485b-ac73-897acd181ddb.jpeg',
    },
    tabs: ['Menu', 'Reviews', 'Content', 'About'],
    activeTab: 'Menu',
    ctaLabel: 'View Restaurant VPORT',
    ctaPath: '/profile/restaurant-vport-u2to',
    menuItems: [
      { name: 'Cheesecake', price: '$6.99' },
      { name: 'Chocolate Cake', price: '$4.99' },
      { name: 'Strawberry Shortcake', price: '$5.77' },
    ],
  },
  {
    type: 'barber',
    slugs: ['barber', 'barbershop'],
    title: 'Barbershop VPORT',
    tagline: 'Portfolio • Booking • Reviews',
    accent: '#8b5cf6',
    imageUrl: '/Vport/Barber.png',
    profile: {
      name: 'BAR-BER',
      handle: '@bar-ber-34b1',
      bio: 'Precision cuts, clean fades, and sharp style. Keeping you looking your best every time.',
      avatarUrl:
        'https://cdn.vibezcitizens.com/vport-avatar-photos/2d73e1f2-d716-49e4-9017-ee25fea9abcd/2026/04/25/d9e85678-a2ee-4478-b392-98d8a851a9d2.webp',
      bannerUrl:
        'https://cdn.vibezcitizens.com/vport-avatar-banners/2d73e1f2-d716-49e4-9017-ee25fea9abcd/2026/04/25/9502cfd2-4a21-4ac3-aa15-b572930e5dc8.jpeg',
    },
    tabs: ['Portfolio', 'Services', 'Calendar', 'Reviews'],
    activeTab: 'Portfolio',
    ctaLabel: 'View BAR-BER VPORT',
    ctaPath: '/profile/bar-ber-34b1',
    portfolioItems: ['Clean Beard Lineup', 'Fresh Taper Fade', 'Classic Skin Fade'],
    chips: ['fade', 'beard', 'lineup', 'grooming'],
    chipColor: '#a78bfa',
    chipBg: 'rgba(139,92,246,0.12)',
    chipBorder: 'rgba(139,92,246,0.22)',
    chipIsTag: true,
  },
  {
    type: 'locksmith',
    slugs: ['locksmith'],
    title: 'Locksmith VPORT',
    tagline: 'Emergency • Services • Areas',
    accent: '#38bdf8',
    imageUrl: '/Vport/locksmith.png',
    profile: {
      name: 'Smart LockSmith',
      handle: '@smart-locksmith-1fvd',
      bio: 'Reliable locksmith services you can trust. From lockouts to security upgrades, we keep your home, business, and vehicle safe—fast and hassle-free.',
      avatarUrl: 'https://cdn.vibezcitizens.com/default/a2071aed-162c-41b0-bbe7-0de5994bca63.jpeg',
      bannerUrl:
        'https://cdn.vibezcitizens.com/vport-avatar-banners/f33d3add-b01a-4d95-be6d-9be81964bd8d/2026/04/26/bf847bc4-7919-4eb9-9221-f18843c73279.jpeg',
    },
    tabs: ['Services', 'Calendar', 'Reviews', 'About'],
    activeTab: 'Services',
    ctaLabel: 'View Smart LockSmith VPORT',
    ctaPath: '/profile/smart-locksmith-1fvd',
    services: [
      'Residential Lockout',
      'Car Lockout',
      'Rekey',
      'Lock Installation',
      'Smart Lock Install',
      'Key Duplication',
    ],
    chips: ['emergency', 'lockout', 'rekey', 'security'],
    chipColor: '#7dd3fc',
    chipBg: 'rgba(56,189,248,0.10)',
    chipBorder: 'rgba(56,189,248,0.22)',
    chipIsTag: true,
  },
  {
    type: 'gas-station',
    slugs: ['gas-station'],
    title: 'Gas Station VPORT',
    tagline: 'Fuel • Truck Services • Store',
    accent: '#4ade80',
    imageUrl: '/Vport/gas.png',
    profile: {
      name: 'Gas Station Vport',
      handle: '@gas-station-vport-tr75',
      bio: 'Fuel, convenience, and everyday essentials in one trusted stop.',
      avatarUrl: 'https://cdn.vibezcitizens.com/default/3111244d-cbdb-4ff6-ba6b-66f95998c3ed.jpeg',
      bannerUrl:
        'https://cdn.vibezcitizens.com/vport-avatar-banners/5fcc63bd-2cc1-4401-accc-a123c1f02b2a/2026/04/25/d7d10b6b-8da4-4139-b66a-c308b59faf44.webp',
    },
    tabs: ['Gas', 'Services', 'Content', 'About'],
    activeTab: 'Gas',
    ctaLabel: 'View Gas Station VPORT',
    ctaPath: '/profile/gas-station-vport-tr75',
    fuelPrices: [
      { grade: 'Regular', price: '$2.99' },
      { grade: 'Midgrade', price: '$3.10' },
      { grade: 'Premium', price: '$3.15' },
    ],
    chips: ['Air & Tire', 'Car Wash', 'ATM'],
    chipColor: '#86efac',
    chipBg: 'rgba(74,222,128,0.08)',
    chipBorder: 'rgba(74,222,128,0.20)',
    chipIsTag: false,
  },
  {
    type: 'money-exchange',
    slugs: ['money-exchange'],
    title: 'Money Exchange VPORT',
    tagline: 'Rates • Currencies • Transfers',
    accent: '#34d399',
    imageUrl: '/Vport/money.png',
    profile: {
      name: 'Old Money',
      handle: '@old-money-360u',
      bio: 'Exchange smarter 💱 Real rates, fast service, zero hassle.',
      avatarUrl: 'https://cdn.vibezcitizens.com/default/179d2de8-b501-4327-bd25-062fa41b549a.png',
      bannerUrl:
        'https://cdn.vibezcitizens.com/vport-avatar-banners/858e6824-4d5b-47af-b8c2-a667be92db4c/2026/04/25/0886785e-82d5-46f8-a07e-ea427a694b56.jpeg',
    },
    tabs: ['Rates', 'Services', 'Content', 'Reviews'],
    activeTab: 'Rates',
    ctaLabel: 'View Old Money VPORT',
    ctaPath: '/profile/old-money-360u',
    rates: [
      { pair: 'USD / EUR', buy: '1.0850', sell: '0.9250' },
      { pair: 'USD / MXN', buy: '18.86', sell: '19.90' },
    ],
    chips: ['Currency', 'Travel Money', 'Rate Alerts'],
    chipColor: '#6ee7b7',
    chipBg: 'rgba(52,211,153,0.08)',
    chipBorder: 'rgba(52,211,153,0.20)',
    chipIsTag: false,
  },
]

export function getPreviewIndex(slug) {
  if (!slug) return 0
  const idx = VPORT_PREVIEWS.findIndex((p) => p.slugs.includes(slug))
  return idx >= 0 ? idx : 0
}
