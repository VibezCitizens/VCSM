// src/lib/sanitizeProfileUpdate.js

// Allow only fields you actually intend to write
const ALLOWED = new Set([
  'display_name',
  'username',
  'bio',
  'photo_url',
  'private',
  'age',
  'sex',
  'birthdate',
  'email', // if you truly mirror email in profiles; otherwise remove
  // add more explicit fields here if your UI edits them
]);

// Never accept these from the client
const BLOCKED = new Set([
  'id',
  'created_at',
  'updated_at',
  'password', // do not PATCH secrets
  'is_adult', // controlled by birthdate/age or server logic
]);

// Known types for coercion
const TYPE = {
  age: 'number',
  private: 'boolean',
  birthdate: 'date', // expects YYYY-MM-DD
};

function toNullIfEmpty(v) {
  return v === '' || v === undefined ? null : v;
}

function coerce(value, type) {
  if (value === '' || value === undefined) return null;
  switch (type) {
    case 'number': {
      if (value === null) return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    case 'boolean': {
      if (value === null) return null;
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === '1' || value === 1) return true;
      if (value === 'false' || value === '0' || value === 0) return false;
      return null;
    }
    case 'date': {
      const v = toNullIfEmpty(value);
      if (v === null) return null;
      return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
    }
    default:
      return value; // text
  }
}

/**
 * Sanitize arbitrary form input for PATCH /profiles.
 * - strips unknown/blocked fields
 * - converts ""/undefined to null
 * - coerces numbers/bools/dates
 * - prunes unchanged keys vs. original (optional perf)
 */
export function sanitizeProfileUpdate(input, original = null) {
  const clean = {};
  for (const [key, raw] of Object.entries(input || {})) {
    if (BLOCKED.has(key)) continue;
    if (!ALLOWED.has(key)) continue;
    const type = TYPE[key];
    const coerced = type ? coerce(raw, type) : toNullIfEmpty(raw);

    // prune no-op updates if original provided
    if (original && original[key] === coerced) continue;

    clean[key] = coerced;
  }
  return { clean, isEmpty: Object.keys(clean).length === 0 };
}
