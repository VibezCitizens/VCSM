// src/features/vport/config/variants.js
const lower = (s) => (s || 'other').trim().toLowerCase();

export function variantForType(type) {
  const t = lower(type);

  const BUSINESS = new Set(['business', 'organization', 'restaurant', 'bar', 'shop', 'company']);
  const CREATOR  = new Set(['creator', 'artist', 'public figure', 'athlete', 'driver']);

  if (BUSINESS.has(t)) {
    return {
      key: 'business',
      showAbout: true,
      showContact: true,     // businesses keep contact
      showLocation: true,
      showReviews: true,
      tabs: ['POST', 'PHOTOS', 'VIDEOS', 'FRIENDS'],
    };
  }

  if (CREATOR.has(t)) {
    return {
      key: 'creator',
      showAbout: true,
      showContact: false,    // <- hide Contact for artists/creators
      showLocation: false,   // and keep Location hidden
      showReviews: false,
      tabs: ['POST', 'PHOTOS', 'VIDEOS', 'FRIENDS'],
    };
  }

  return {
    key: 'other',
    showAbout: true,
    showContact: false,
    showLocation: false,
    showReviews: false,
    tabs: ['POST', 'PHOTOS', 'VIDEOS', 'FRIENDS'],
  };
}
