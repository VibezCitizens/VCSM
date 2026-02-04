// src/season/lovedrop/components/LovedropShareButtons.jsx

import React, { useMemo, useState } from 'react'
import { buildLovedropShareLinks } from '@/season/lovedrop/utils/lovedropShareLinks'

/**
 * LovedropShareButtons
 * UI-only share actions. No DAL, no controller.
 *
 * Expects shareLinks util to return:
 * {
 *   url,
 *   shareText,
 *   copyText,
 *   mailtoUrl,
 *   whatsappUrl,
 *   smsUrl,
 * }
 *
 * @param {{
 *  publicId: string,
 *  baseUrl?: string,               // e.g. https://vibez.xxx (optional, util can infer)
 *  message?: string,               // optional custom message
 *  className?: string
 * }} props
 */
export function LovedropShareButtons({
  publicId,
  baseUrl,
  message,
  className = '',
}) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(null)

  const links = useMemo(() => {
    if (!publicId) return null
    return buildLovedropShareLinks({
      publicId,
      baseUrl,
      message,
    })
  }, [publicId, baseUrl, message])

  const onCopy = async () => {
    if (!links?.copyText) return
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(links.copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch (e) {
      // fallback: try older execCommand approach
      try {
        const ta = document.createElement('textarea')
        ta.value = links.copyText
        ta.setAttribute('readonly', '')
        ta.style.position = 'absolute'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        if (!ok) throw new Error('copy failed')
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      } catch (err) {
        setCopyError(err)
      }
    }
  }

  if (!publicId) return null
  if (!links) return null

  return (
    <div className={['w-full', className].join(' ')}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* SMS / iMessage */}
        <a
          className="rounded-lg border px-3 py-2 text-center text-sm hover:bg-gray-50"
          href={links.smsUrl}
        >
          SMS
        </a>

        {/* WhatsApp */}
        <a
          className="rounded-lg border px-3 py-2 text-center text-sm hover:bg-gray-50"
          href={links.whatsappUrl}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>

        {/* Email */}
        <a
          className="rounded-lg border px-3 py-2 text-center text-sm hover:bg-gray-50"
          href={links.mailtoUrl}
        >
          Email
        </a>

        {/* Copy */}
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-center text-sm hover:bg-gray-50"
          onClick={onCopy}
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>

      {/* Optional: show the raw url */}
      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2">
        <div className="truncate text-xs text-gray-600">{links.url}</div>
        <button
          type="button"
          className="shrink-0 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
          onClick={onCopy}
        >
          Copy
        </button>
      </div>

      {copyError ? (
        <div className="mt-2 text-xs text-red-600">
          Copy failed. Long-press the link above and copy it.
        </div>
      ) : null}
    </div>
  )
}

export default LovedropShareButtons
