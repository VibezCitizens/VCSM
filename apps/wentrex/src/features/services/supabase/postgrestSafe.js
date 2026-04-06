const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value) {
  return UUID_RE.test(String(value ?? '').trim())
}

export function assertUuid(value, label = 'id') {
  if (!isUuid(value)) {
    throw new Error(`Invalid ${label}`)
  }
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

export function normalizeSearchTerm(raw, { max = 64 } = {}) {
  const cleaned = normalizeWhitespace(
    String(raw ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9 _-]/g, ' ')
  )

  if (!cleaned) return ''
  return cleaned.slice(0, max).trim()
}

export function normalizeHandleTerm(raw, { max = 32 } = {}) {
  const cleaned = String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, max)
    .trim()

  return cleaned
}

function collapseToWildcard(term) {
  return term.replace(/\s+/g, '%')
}

export function toContainsPattern(raw, opts) {
  const term = normalizeSearchTerm(raw, opts)
  if (!term) return null
  return `%${collapseToWildcard(term)}%`
}

export function toPrefixPattern(raw, opts) {
  const term = normalizeHandleTerm(raw, opts)
  if (!term) return null
  return `${term}%`
}
