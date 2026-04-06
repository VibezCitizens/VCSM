// src/features/identity/wentrexAccess.js
// ============================================================
// Wentrex — Role-Based Access Helpers
// ------------------------------------------------------------
// These functions interpret Wentrex role keys for route guards
// and destination routing. They are app-specific and do not
// belong in the shared identity engine.
// ============================================================

/**
 * Compute the primary Wentrex dashboard destination from a resolved role key list.
 *
 * Priority: admin/owner → /dashboard → teacher/staff → /teacher → parent → /parent → student → /student
 *
 * @param {string[]} roleKeys
 * @returns {string|null}
 */
export function wentrexDestinationFromRoleKeys(roleKeys) {
  if (!roleKeys?.length) return null

  const has = (k) => roleKeys.includes(k)

  if (has('owner') || has('admin'))   return '/dashboard'
  if (has('teacher') || has('staff')) return '/teacher'
  if (has('parent'))                  return '/parent'
  if (has('student'))                 return '/student'

  return null
}

/**
 * Check whether a Wentrex role key list grants access to a given guard type.
 *
 * @param {'admin'|'teacher'|'parent'|'student'} allow
 * @param {string[]} roleKeys
 * @returns {boolean}
 */
export function wentrexCanAccess(allow, roleKeys = []) {
  const has = (k) => roleKeys.includes(k)

  if (allow === 'admin')   return has('admin') || has('owner')
  if (allow === 'teacher') return has('teacher') || has('staff') || has('admin') || has('owner')
  if (allow === 'parent')  return has('parent')
  if (allow === 'student') return has('student')

  return false
}
