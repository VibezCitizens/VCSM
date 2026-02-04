// C:\Users\trest\OneDrive\Desktop\VCSM\src\season\lovedrop\utils\lovedropShareLinks.js
// ============================================================================
// LOVE DROP UTILS — SHARE LINKS
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
  // Browser-safe. If SSR/no window, return empty string.
  try {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin
    }
  } catch (e) {
    // ignore
  }
  return ''
}

/**
 * Build canonical public card URL.
 *
 * @param {{
 *  baseUrl?: string|null,   // e.g. https://vibez.xxx (optional)
 *  publicId: string
 * }} input
 */
export function buildLovedropCardUrl(input) {
  const publicId = safeTrim(input?.publicId)
  const baseUrl = safeTrim(input?.baseUrl) || getDefaultBaseUrl()

  if (!publicId) return ''

  // ✅ UPDATED: match routes: /lovedrop/v/:publicId
  if (baseUrl) {
    return `${stripTrailingSlashes(baseUrl)}/lovedrop/v/${publicId}`
  }

  // SSR fallback only
  return `/lovedrop/v/${publicId}`
}

/**
 * Build share text (message + url).
 *
 * @param {{
 *  text?: string|null,
 *  url: string
 * }} input
 */
export function buildLovedropShareText(input) {
  const text = safeTrim(input?.text)
  const url = safeTrim(input?.url)

  if (text && url) return `${text} ${url}`
  if (url) return url
  return text
}

/**
 * mailto share link
 *
 * @param {{
 *  subject?: string|null,
 *  body?: string|null
 * }} input
 */
export function buildMailtoLink(input) {
  const subject = safeTrim(input?.subject) || '💌 LoveDrop for you'
  const body = safeTrim(input?.body)

  // Note: mailto supports subject/body query params
  return `mailto:?subject=${encode(subject)}&body=${encode(body)}`
}

/**
 * SMS deep link
 *
 * iOS Safari quirks:
 * - Some builds prefer "sms:&body="
 * - Others prefer "sms:?&body="
 *
 * We provide both. Use smsPrimary first, fallback to smsAlt if needed.
 *
 * @param {{
 *  body?: string|null
 * }} input
 */
export function buildSmsLinks(input) {
  const body = safeTrim(input?.body)
  return {
    smsPrimary: `sms:&body=${encode(body)}`,
    smsAlt: `sms:?&body=${encode(body)}`,
  }
}

/**
 * WhatsApp share link (wa.me)
 *
 * @param {{
 *  text?: string|null
 * }} input
 */
export function buildWhatsAppLink(input) {
  const text = safeTrim(input?.text)
  return `https://wa.me/?text=${encode(text)}`
}

/**
 * All share links in one call.
 *
 * IMPORTANT:
 * LovedropShareButtons.jsx currently calls:
 *   buildLovedropShareLinks({ publicId, baseUrl, message })
 *
 * So we accept BOTH:
 * - shareText (preferred)
 * - message (alias used by the component)
 *
 * And we return keys the component expects:
 * - mailtoUrl
 * - smsUrl
 * - whatsappUrl
 *
 * @param {{
 *  publicId: string,
 *  baseUrl?: string|null,
 *  shareText?: string|null,     // preferred
 *  message?: string|null,       // alias (used by UI)
 *  emailSubject?: string|null
 * }} input
 */
export function buildLovedropShareLinks(input) {
  const url = buildLovedropCardUrl({
    baseUrl: input?.baseUrl ?? null,
    publicId: input?.publicId,
  })

  const shareText = buildLovedropShareText({
    text: input?.shareText ?? input?.message ?? '',
    url,
  })

  const mailto = buildMailtoLink({
    subject: input?.emailSubject ?? '💌 LoveDrop for you',
    body: shareText,
  })

  const { smsPrimary, smsAlt } = buildSmsLinks({ body: shareText })
  const whatsapp = buildWhatsAppLink({ text: shareText })

  // Clipboard payload
  const copyText = shareText

  // Return keys that LovedropShareButtons.jsx expects
  return {
    url,
    shareText,
    copyText,

    mailtoUrl: mailto,
    smsUrl: smsPrimary,
    smsAltUrl: smsAlt,
    whatsappUrl: whatsapp,
  }
}
