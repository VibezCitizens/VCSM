// VERSION: 2025-11-10 (detect supabase fetch aborts)

/**
 * Returns true if the error represents an intentionally aborted request.
 * Catches:
 * - DOM AbortError (e.name === 'AbortError')
 * - Supabase-wrapped aborts (code === '20', message includes 'AbortError')
 * - Errors with cause AbortError
 */
export function isAbortError(err) {
  if (!err) return false

  // Native AbortError or wrapped in `cause`
  if (err.name === 'AbortError') return true
  if (err.cause && (err.cause.name === 'AbortError' || String(err.cause).includes('AbortError'))) return true

  // Supabase @supabase/supabase-js often returns:
  // { message: 'AbortError: The operation was aborted. ', code: '20', details: '...' }
  if (err.code === '20') return true
  if (typeof err.message === 'string' && err.message.includes('AbortError')) return true
  if (typeof err.details === 'string' && err.details.includes('AbortError')) return true

  return false
}
