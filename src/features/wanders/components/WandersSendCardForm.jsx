// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\components\WandersSendCardForm.jsx
// ============================================================================
// WANDERS COMPONENT — SEND CARD FORM
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
 * }} props
 */
export function WandersSendCardForm({
  onSubmit,
  onDraftChange,
  loading = false,
  disabled = false,
  initialDraft,
  allowAnonymousToggle = false,
  requireFromNameWhenNotAnonymous = true,
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

  const inputBase =
    'w-full rounded-xl border bg-gray-100 px-3.5 py-2.5 text-[15px] leading-6 shadow-sm ' +
    'border-gray-300 text-gray-900 placeholder:text-gray-500 ' +
    'transition duration-150 ' +
    'focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 focus:bg-gray-100 ' +
    'disabled:opacity-60 disabled:cursor-not-allowed'

  const labelBase = 'block text-sm font-medium text-gray-800 mb-1.5'

  const styles = useMemo(
    () => [
      { key: 'classic', label: 'Classic 💌', dotClass: 'bg-gray-900', pillClass: 'bg-white border-gray-200' },
      { key: 'cute', label: 'Cute 💖', dotClass: 'bg-pink-500', pillClass: 'bg-pink-50 border-pink-200' },
      { key: 'spicy', label: 'Spicy 🔥', dotClass: 'bg-red-500', pillClass: 'bg-red-50 border-red-200' },
      { key: 'elegant', label: 'Elegant ✨', dotClass: 'bg-indigo-500', pillClass: 'bg-indigo-50 border-indigo-200' },
      { key: 'mystery', label: 'Mystery 👀', dotClass: 'bg-gray-800', pillClass: 'bg-gray-900 border-gray-700 text-white' },
    ],
    []
  )

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
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3.5 py-2.5">
          <div className="text-sm font-medium text-gray-900">Send anonymously</div>
          <button
            type="button"
            onClick={() => setIsAnonymous((v) => !v)}
            disabled={disabled || loading}
            className={[
              'rounded-full px-3 py-1 text-sm font-semibold transition',
              isAnonymous ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-800',
              disabled || loading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90',
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
              className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {imageDataUrl ? 'Change photo' : 'Add photo'}
            </button>

            {imageDataUrl ? (
              <button
                type="button"
                onClick={removeImage}
                disabled={disabled || loading}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
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
                  active ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-gray-200',
                  s.pillClass,
                  disabled || loading ? 'opacity-60 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold md:text-[13px] md:leading-5">{s.label}</div>
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

        {imageError ? <div className="mt-2 text-xs text-red-600">{imageError}</div> : null}

        {imageDataUrl ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
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
          <div className="mt-2 text-xs text-gray-600">Required when not anonymous.</div>
        ) : null}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || disabled || !canSubmit}
        className="
          w-full rounded-xl bg-pink-600 text-white py-2.5 text-sm font-semibold
          shadow-sm transition
          hover:bg-pink-700
          focus:outline-none focus:ring-2 focus:ring-pink-500/30
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading ? 'Sending…' : 'Send 💌'}
      </button>
    </form>
  )
}

export default WandersSendCardForm
