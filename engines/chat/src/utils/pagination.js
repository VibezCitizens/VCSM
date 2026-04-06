// src/utils/pagination.js
// ============================================================
// Chat Engine — Pagination Helpers
// ------------------------------------------------------------
// Standardizes cursor-based pagination across all list DALs.
//
// Strategy: keyset pagination on (created_at, id) — avoids
// the offset drift problem when rows are inserted mid-page.
//
// Cursors are opaque base64 strings that encode the last seen
// created_at + id, so callers never couple to DB internals.
// ============================================================

/**
 * Default page size used across all list operations.
 */
export const DEFAULT_PAGE_SIZE = 30

/**
 * Maximum page size the engine will honour.
 * Callers requesting more are clamped to this value.
 */
export const MAX_PAGE_SIZE = 100

/**
 * Resolve a safe limit from a caller-supplied value.
 *
 * @param {number|null|undefined} requested
 * @returns {number}
 */
export function resolveLimit(requested) {
  if (!requested || typeof requested !== 'number') return DEFAULT_PAGE_SIZE
  return Math.min(Math.max(1, requested), MAX_PAGE_SIZE)
}

/**
 * Encode a pagination cursor from the last row of a result set.
 *
 * @param {Object} row      - Last row returned by a DAL query
 * @param {string} row.id
 * @param {string} row.created_at
 * @returns {string}        - Opaque base64 cursor
 */
export function encodeCursor(row) {
  if (!row?.id || !row?.created_at) {
    throw new Error('[encodeCursor] row must have id and created_at')
  }
  const payload = JSON.stringify({ id: row.id, createdAt: row.created_at })
  return Buffer.from(payload).toString('base64')
}

/**
 * Decode a pagination cursor back to its components.
 *
 * Returns null if the cursor is missing or malformed —
 * callers treat null as "fetch from the beginning".
 *
 * @param {string|null|undefined} cursor
 * @returns {{ id: string, createdAt: string }|null}
 */
export function decodeCursor(cursor) {
  if (!cursor) return null
  try {
    const payload = Buffer.from(cursor, 'base64').toString('utf8')
    const parsed = JSON.parse(payload)
    if (!parsed.id || !parsed.createdAt) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Build a page info object to append to any paginated result.
 *
 * @param {Object[]} rows     - The rows returned by the current page
 * @param {number}   limit    - The limit that was applied
 * @returns {{ hasMore: boolean, nextCursor: string|null }}
 */
export function buildPageInfo(rows, limit) {
  const hasMore = rows.length === limit
  const nextCursor = hasMore ? encodeCursor(rows[rows.length - 1]) : null
  return { hasMore, nextCursor }
}
