export const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export const TYPE_OPTIONS = [
  'creator',
  'artist',
  'public figure',
  'athlete',
  'driver',
  'business',
  'organization',
  'other',
];

// tiny classnames helper
export const cx = (...xs) => xs.filter(Boolean).join(' ');
