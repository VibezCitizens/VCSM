// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersSendCardForm.jsx
// ============================================================================
// WANDERS COMPONENT — SEND CARD FORM (and SENT UI variant)
// UI-only: collects a draft payload and emits onDraftChange / onSubmit.
// No DAL, no controllers, no derived permissions.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * @typedef {{
 *  templateKey?: string,
 *  messageText?: string,
 *  isAnonymous?: boolean,
 *  customization?: {
 *    toName?: string|null,
 *    fromName?: string|null,
 *    imageDataUrl?: string|null
 *  }
 * }} WandersDraft
 */

/**
 * @param {{
 *  // Existing API (form)
 *  onSubmit: (draftPayload: {
 *    templateKey: string,
 *    messageText: string,
 *    isAnonymous: boolean,
 *    customization: { toName: string|null, fromName: string|null, imageDataUrl: string|null }
 *  }) => void,
 *  onDraftChange?: (draftPayload: {
 *    templateKey: string,
 *    messageText: string,
 *    isAnonymous: boolean,
 *    customization: { toName: string|null, fromName: string|null, imageDataUrl: string|null }
 *  }) => void,
 *  loading?: boolean,
 *  disabled?: boolean,
 *  initialDraft?: WandersDraft,
 *  allowAnonymousToggle?: boolean,
 *  requireFromNameWhenNotAnonymous?: boolean,
 *
 *  // NEW (optional) — “Sent” UI variant (matches screenshot)
 *  variant?: 'form'|'sent',
 *  shareUrl?: string,                // public card link
 *  mailboxUrl?: string,              // mailbox link (WWOX)
 *  onSendAnother?: () => void,       // “Send another” button
 *  onCreateNewCard?: () => void,     // “Create a Wander Card”
 *  onOpenMailbox?: () => void,       // “Open WWOX”
 *  onCreateAccount?: () => void,     // “Create account”
 *  onLogin?: () => void,             // “Log in”
 * }} props
 */
export function WandersSendCardForm({
  // existing
  onSubmit,
  onDraftChange,
  loading = false,
  disabled = false,
  initialDraft,
  allowAnonymousToggle = false,
  requireFromNameWhenNotAnonymous = true,

  // new
  variant = 'form',
  shareUrl = '',
  mailboxUrl = '',
  onSendAnother,
  onCreateNewCard,
  onOpenMailbox,
  onCreateAccount,
  onLogin,
}) {
  const [toName, setToName] = useState(() => initialDraft?.customization?.toName ?? '')
  const [fromName, setFromName] = useState(() => initialDraft?.customization?.fromName ?? '')
  const [messageText, setMessageText] = useState(() => initialDraft?.messageText ?? '')
  const [templateKey, setTemplateKey] = useState(() => initialDraft?.templateKey ?? 'classic')
  const [isAnonymous, setIsAnonymous] = useState(() => initialDraft?.isAnonymous ?? false)

  // image upload stored in customization.imageDataUrl
  const [imageDataUrl, setImageDataUrl] = useState(() => initialDraft?.customization?.imageDataUrl ?? null)
  const [imageError, setImageError] = useState(null)
  const fileRef = useRef(null)

  const draftPayload = useMemo(
    () => ({
      templateKey,
      messageText,
      isAnonymous,
      customization: {
        toName: (toName || '').trim() ? toName : null,
        fromName: (fromName || '').trim() ? fromName : null,
        imageDataUrl: imageDataUrl || null,
      },
    }),
    [toName, fromName, messageText, templateKey, isAnonymous, imageDataUrl]
  )

  useEffect(() => {
    if (typeof onDraftChange === 'function') onDraftChange(draftPayload)
  }, [draftPayload, onDraftChange])

  const onPickImage = () => {
    setImageError(null)
    fileRef.current?.click?.()
  }

  const onFileChange = async (e) => {
    const file = e.target.files?.[0] || null
    if (!file) return

    // allow re-picking same file later
    e.target.value = ''

    if (!file.type?.startsWith('image/')) {
      setImageError('Please choose an image file.')
      return
    }

    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      setImageError('Image is too large (max 2MB).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageDataUrl(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.onerror = () => {
      setImageError('Could not read that file. Try another image.')
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageDataUrl(null)
    setImageError(null)
  }

  const canSubmit = useMemo(() => {
    const hasMsg = !!(messageText || '').trim()
    if (!hasMsg) return false

    if (!requireFromNameWhenNotAnonymous) return true
    if (isAnonymous) return true

    return !!(fromName || '').trim()
  }, [messageText, fromName, isAnonymous, requireFromNameWhenNotAnonymous])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return

    const cleaned = {
      ...draftPayload,
      messageText: (draftPayload.messageText || '').trim(),
      customization: {
        ...draftPayload.customization,
        toName: (draftPayload.customization.toName || '')?.trim?.() ? draftPayload.customization.toName.trim() : null,
        fromName: (draftPayload.customization.fromName || '')?.trim?.() ? draftPayload.customization.fromName.trim() : null,
      },
    }

    onSubmit(cleaned)
  }

  const styles = useMemo(
    () => [
      { key: 'classic', label: 'Classic 💌', dotClass: 'bg-zinc-100/90', pillClass: 'bg-zinc-900/40 border-white/10' },
      { key: 'cute', label: 'Cute 💖', dotClass: 'bg-pink-400', pillClass: 'bg-pink-500/10 border-pink-500/20' },
      { key: 'spicy', label: 'Spicy 🔥', dotClass: 'bg-red-400', pillClass: 'bg-red-500/10 border-red-500/20' },
      { key: 'elegant', label: 'Elegant ✨', dotClass: 'bg-indigo-400', pillClass: 'bg-indigo-500/10 border-indigo-500/20' },
      { key: 'mystery', label: 'Mystery 👀', dotClass: 'bg-zinc-200', pillClass: 'bg-zinc-950 border-white/10 text-white' },
    ],
    []
  )

  // ============================================================================
  // Sent UI (matches screenshot)
  // ============================================================================
  const [copied, setCopied] = useState(false)
  const shareText = useMemo(() => {
    const url = (shareUrl || '').trim()
    return url ? url : ''
  }, [shareUrl])

  const safeClipboardCopy = async (text) => {
    try {
      if (!text) return
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 900)
    } catch {
      // ignore (UI-only)
    }
  }

  const openEmail = () => {
    const body = encodeURIComponent(shareText || '')
    const href = `mailto:?subject=${encodeURIComponent('Wander Card')}&body=${body}`
    window.location.href = href
  }

  const openSMS = () => {
    const body = encodeURIComponent(shareText || '')
    // works on mobile; desktop may do nothing (fine)
    const href = `sms:&body=${body}`
    window.location.href = href
  }

  const Panel = ({ title, subtitle, children }) => (
    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="p-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-white/70">{subtitle}</div> : null}
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )

  const Button = ({ children, onClick, variant = 'ghost', disabled: btnDisabled = false }) => {
    const base =
      'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ' +
      'focus:outline-none focus:ring-2 focus:ring-violet-400/30 disabled:opacity-60 disabled:cursor-not-allowed'
    const v =
      variant === 'primary'
        ? 'bg-violet-600 text-white hover:bg-violet-500'
        : variant === 'soft'
          ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
          : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
    return (
      <button type="button" onClick={onClick} disabled={btnDisabled} className={`${base} ${v}`}>
        {children}
      </button>
    )
  }

  const WideButton = ({ children, onClick, variant = 'soft', disabled: btnDisabled = false }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={btnDisabled}
      className={[
        'w-full rounded-xl px-4 py-2 text-sm font-semibold transition',
        'focus:outline-none focus:ring-2 focus:ring-violet-400/30 disabled:opacity-60 disabled:cursor-not-allowed',
        variant === 'primary'
          ? 'bg-violet-600 text-white hover:bg-violet-500'
          : 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
      ].join(' ')}
    >
      {children}
    </button>
  )

  if (variant === 'sent') {
    return (
      <div className="min-h-[60vh] w-full">
        {/* header */}
        <div className="mb-4">
          <div className="text-xl font-bold text-white">Sent 🎉</div>
          <div className="mt-1 text-sm text-white/70">Your card is ready — share it or manage your inbox.</div>
        </div>

        {/* grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Preview */}
          <Panel title="Preview">
            <div className="overflow-hidden rounded-2xl bg-white shadow-inner">
              <div className="p-6">
                <div className="text-lg font-semibold text-zinc-900 whitespace-pre-wrap break-words">
                  {(messageText || '').trim() || '—'}
                </div>

                <div className="mt-20 text-sm text-zinc-700">
                  — {(fromName || '').trim() || (isAnonymous ? '' : '')}
                </div>
              </div>

              {imageDataUrl ? (
                <div className="border-t border-zinc-200">
                  <img src={imageDataUrl} alt="Uploaded" className="h-40 w-full object-cover" />
                </div>
              ) : null}
            </div>
          </Panel>

          {/* Share */}
          <Panel title="Share" subtitle="Copy the message or share via email or SMS.">
            <div className="text-xs font-semibold text-white/70">Share text</div>
            <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-sm text-white whitespace-pre-wrap break-words">{shareText || '—'}</div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button onClick={() => safeClipboardCopy(shareText)} disabled={!shareText}>
                {copied ? 'Copied' : 'Copy text'}
              </Button>
              <Button onClick={openEmail} disabled={!shareText}>
                Email
              </Button>
              <Button onClick={openSMS} disabled={!shareText}>
                SMS
              </Button>
            </div>

            <div className="mt-3">
              <Button onClick={onSendAnother} disabled={typeof onSendAnother !== 'function'}>
                Send another
              </Button>
            </div>
          </Panel>

          {/* Your WWOX */}
          <Panel title="Your WWOX" subtitle="View your incoming and sent cards.">
            <div className="flex gap-3">
              <WideButton onClick={onOpenMailbox} disabled={typeof onOpenMailbox !== 'function'}>
                Open WWOX
              </WideButton>
              <WideButton
                onClick={() => safeClipboardCopy((mailboxUrl || '').trim())}
                disabled={!(mailboxUrl || '').trim()}
              >
                Copy Link
              </WideButton>
            </div>
          </Panel>

          {/* Send another */}
          <Panel title="Send another" subtitle="Create a new Wander card and share it.">
            <WideButton onClick={onCreateNewCard} disabled={typeof onCreateNewCard !== 'function'}>
              Create a Wander Card
            </WideButton>
          </Panel>
        </div>

        {/* Save bar */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Save your WWOX forever</div>
                <div className="mt-1 text-xs text-white/70">
                  You’re using guest mode right now. Create an account to keep your mailbox across devices and never
                  lose access.
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
                Free
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onCreateAccount}
                disabled={typeof onCreateAccount !== 'function'}
                className="w-full rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Create account
              </button>

              <button
                type="button"
                onClick={onLogin}
                disabled={typeof onLogin !== 'function'}
                className="w-full rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Log in
              </button>
            </div>

            <div className="mt-3 text-[11px] text-white/55">
              Tip: Guest mailboxes can be lost if you clear browser storage or switch devices.
            </div>
          </div>
        </div>

        <div className="mt-2 text-[11px] text-white/50">
          Tip: Save your mailbox link — it always shows your full Wander history.
        </div>
      </div>
    )
  }

  // ============================================================================
  // Form UI (kept functional; switched to dark theme styling to match app)
  // ============================================================================
  const inputBase =
    'w-full rounded-xl border bg-white/5 px-3.5 py-2.5 text-[15px] leading-6 shadow-sm ' +
    'border-white/10 text-white placeholder:text-white/40 ' +
    'transition duration-150 ' +
    'focus:outline-none focus:ring-2 focus:ring-violet-400/25 focus:border-violet-400/40 focus:bg-white/5 ' +
    'disabled:opacity-60 disabled:cursor-not-allowed'

  const labelBase = 'block text-sm font-medium text-white/80 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* To */}
      <div>
        <label className={labelBase}>To</label>
        <input
          type="text"
          value={toName}
          onChange={(e) => setToName(e.target.value)}
          placeholder="Their name (optional)"
          className={inputBase}
          disabled={disabled || loading}
        />
      </div>

      {/* Message */}
      <div>
        <label className={labelBase}>Message *</label>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Write something sweet, funny, or secret…"
          rows={5}
          className={`${inputBase} resize-none`}
          required
          disabled={disabled || loading}
        />
      </div>

      {/* Anonymous toggle (optional) */}
      {allowAnonymousToggle ? (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
          <div className="text-sm font-medium text-white">Send anonymously</div>
          <button
            type="button"
            onClick={() => setIsAnonymous((v) => !v)}
            disabled={disabled || loading}
            className={[
              'rounded-full px-3 py-1 text-sm font-semibold transition border border-white/10',
              isAnonymous ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/80',
              disabled || loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10',
            ].join(' ')}
          >
            {isAnonymous ? 'On' : 'Off'}
          </button>
        </div>
      ) : null}

      {/* Customize */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <label className={`${labelBase} mb-0`}>Customize</label>

          {/* Upload controls inline with header */}
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />

            <button
              type="button"
              onClick={onPickImage}
              disabled={disabled || loading}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {imageDataUrl ? 'Change photo' : 'Add photo'}
            </button>

            {imageDataUrl ? (
              <button
                type="button"
                onClick={removeImage}
                disabled={disabled || loading}
                className="rounded-xl border border-white/10 bg-white/0 px-3 py-1.5 text-xs text-white/80 shadow-sm transition hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>

        {/* Style pills */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-1.5">
          {styles.map((s) => {
            const active = templateKey === s.key
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setTemplateKey(s.key)}
                disabled={disabled || loading}
                className={[
                  'group rounded-xl border text-left shadow-sm transition hover:shadow',
                  'px-3 py-2 md:px-2.5 md:py-1.5',
                  active ? 'border-violet-400/60 ring-2 ring-violet-400/20' : 'border-white/10',
                  s.pillClass,
                  disabled || loading ? 'opacity-60 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold md:text-[13px] md:leading-5 text-white">{s.label}</div>
                  <span
                    className={[
                      'mt-0.5 inline-block rounded-full',
                      'h-2.5 w-2.5 md:h-2 md:w-2',
                      s.dotClass,
                      active ? '' : 'opacity-70',
                    ].join(' ')}
                    aria-hidden
                  />
                </div>
              </button>
            )
          })}
        </div>

        {imageError ? <div className="mt-2 text-xs text-red-300">{imageError}</div> : null}

        {imageDataUrl ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <img src={imageDataUrl} alt="Uploaded" className="h-32 w-full object-cover" />
          </div>
        ) : null}
      </div>

      {/* From */}
      <div>
        <label className={labelBase}>
          From{requireFromNameWhenNotAnonymous && !isAnonymous ? ' *' : ''}
        </label>
        <input
          type="text"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          placeholder={isAnonymous ? 'Your name (optional)' : 'Your name'}
          className={inputBase}
          required={requireFromNameWhenNotAnonymous && !isAnonymous}
          disabled={disabled || loading}
        />
        {requireFromNameWhenNotAnonymous && !isAnonymous && !(fromName || '').trim() ? (
          <div className="mt-2 text-xs text-white/60">Required when not anonymous.</div>
        ) : null}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || disabled || !canSubmit}
        className="
          w-full rounded-xl bg-violet-600 text-white py-2.5 text-sm font-semibold
          shadow-sm transition
          hover:bg-violet-500
          focus:outline-none focus:ring-2 focus:ring-violet-400/30
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading ? 'Sending…' : 'Send 💌'}
      </button>
    </form>
  )
}

export default WandersSendCardForm
