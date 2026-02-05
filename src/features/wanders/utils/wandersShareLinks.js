// ============================================================================
// WANDERS UTILS — SHARE LINKS
// Contract: pure helpers (no side effects, no DOM).
// Generates share URLs for mailto / sms / WhatsApp and copy text.
// ============================================================================

function safeTrim(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function encode(v) {
  return encodeURIComponent(v)
}

function stripTrailingSlashes(url) {
  return String(url || '').replace(/\/+$/, '')
}

function getDefaultBaseUrl() {
  try {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin
    }
  } catch (e) {}
  return ''
}

/**
 * Build canonical public card URL.
 *
 * @param {{
 *   baseUrl?: string|null,
 *   publicId: string
 * }} input
 */
export function buildWandersCardUrl(input) {
  const publicId = safeTrim(input?.publicId)
  const baseUrl = safeTrim(input?.baseUrl) || getDefaultBaseUrl()

  if (!publicId) return ''

  if (baseUrl) {
    // UPDATED: keep consistent with app route (/wanders/c/:publicId)
    return `${stripTrailingSlashes(baseUrl)}/wanders/c/${publicId}`
  }

  // UPDATED: keep consistent with app route (/wanders/c/:publicId)
  return `/wanders/c/${publicId}`
}

/**
 * Build share text (message + url).
 *
 * @param {{
 *   text?: string|null,
 *   url: string
 * }} input
 */
export function buildWandersShareText(input) {
  const text = safeTrim(input?.text)
  const url = safeTrim(input?.url)

  if (text && url) return `${text} ${url}`
  if (url) return url
  return text
}

/**
 * mailto share link
 */
export function buildMailtoLink(input) {
  const subject = safeTrim(input?.subject) || '💌 Someone sent you a Wanders card'
  const body = safeTrim(input?.body)

  return `mailto:?subject=${encode(subject)}&body=${encode(body)}`
}

/**
 * SMS deep link
 */
export function buildSmsLinks(input) {
  const body = safeTrim(input?.body)

  return {
    smsPrimary: `sms:&body=${encode(body)}`,
    smsAlt: `sms:?&body=${encode(body)}`,
  }
}

/**
 * WhatsApp share link
 */
export function buildWhatsAppLink(input) {
  const text = safeTrim(input?.text)
  return `https://wa.me/?text=${encode(text)}`
}

/**
 * All share links in one call.
 *
 * @param {{
 *   publicId: string,
 *   baseUrl?: string|null,
 *   shareText?: string|null,
 *   message?: string|null,
 *   emailSubject?: string|null
 * }} input
 */
export function buildWandersShareLinks(input) {
  const url = buildWandersCardUrl({
    baseUrl: input?.baseUrl ?? null,
    publicId: input?.publicId,
  })

  const shareText = buildWandersShareText({
    text: input?.shareText ?? input?.message ?? '',
    url,
  })

  const mailto = buildMailtoLink({
    subject: input?.emailSubject ?? '💌 Someone sent you a Wanders card',
    body: shareText,
  })

  const { smsPrimary, smsAlt } = buildSmsLinks({ body: shareText })
  const whatsapp = buildWhatsAppLink({ text: shareText })

  return {
    url,
    shareText,
    copyText: shareText,

    mailtoUrl: mailto,
    smsUrl: smsPrimary,
    smsAltUrl: smsAlt,
    whatsappUrl: whatsapp,
  }
}
