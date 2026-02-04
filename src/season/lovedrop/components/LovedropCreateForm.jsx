// src/season/lovedrop/components/LovedropCreateForm.jsx

import { useEffect, useMemo, useRef, useState } from 'react'

export function LovedropCreateForm({
  onSubmit,
  onDraftChange,
  loading = false,
  disabled = false,
}) {
  const [toName, setToName] = useState('')
  const [fromName, setFromName] = useState('')
  const [messageText, setMessageText] = useState('')
  const [templateKey, setTemplateKey] = useState('classic')

  // image upload (stored in customization)
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [imageError, setImageError] = useState(null)
  const fileRef = useRef(null)

  // 🔒 FORCE NON-ANONYMOUS FOR NOW
  const isAnonymous = false

  const draftPayload = useMemo(
    () => ({
      toName: toName || null,
      fromName: fromName || null,
      messageText,
      templateKey,
      isAnonymous,
      customization: {
        imageDataUrl: imageDataUrl || null,
      },
    }),
    [toName, fromName, messageText, templateKey, imageDataUrl]
  )

  useEffect(() => {
    if (typeof onDraftChange === 'function') {
      onDraftChange(draftPayload)
    }
  }, [draftPayload, onDraftChange])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!messageText.trim()) return
    if (!fromName.trim()) return

    onSubmit({
      ...draftPayload,
      fromName: fromName.trim(),
      messageText: messageText.trim(),
    })
  }

  const onPickImage = () => {
    setImageError(null)
    if (fileRef.current) fileRef.current.click()
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

  const inputBase =
    'w-full rounded-xl border bg-gray-100 px-3.5 py-2.5 text-[15px] leading-6 shadow-sm ' +
    'border-gray-300 text-gray-900 placeholder:text-gray-500 ' +
    'transition duration-150 ' +
    'focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 focus:bg-gray-100 ' +
    'disabled:opacity-60 disabled:cursor-not-allowed'

  const labelBase = 'block text-sm font-medium text-gray-800 mb-1.5'

  const isFormValid = useMemo(() => {
    return !!messageText.trim() && !!fromName.trim()
  }, [messageText, fromName])

  const styles = useMemo(
    () => [
      {
        key: 'classic',
        label: 'Classic 💌',
        dotClass: 'bg-gray-900',
        pillClass: 'bg-white border-gray-200',
      },
      {
        key: 'cute',
        label: 'Cute 💖',
        dotClass: 'bg-pink-500',
        pillClass: 'bg-pink-50 border-pink-200',
      },
      {
        key: 'spicy',
        label: 'Spicy 🔥',
        dotClass: 'bg-red-500',
        pillClass: 'bg-red-50 border-red-200',
      },
      {
        key: 'elegant',
        label: 'Elegant ✨',
        dotClass: 'bg-indigo-500',
        pillClass: 'bg-indigo-50 border-indigo-200',
      },
      {
        key: 'mystery',
        label: 'Mystery 👀',
        dotClass: 'bg-gray-800',
        pillClass: 'bg-gray-900 border-gray-700 text-white',
      },
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
        />
      </div>

      {/* Customize */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <label className={`${labelBase} mb-0`}>Customize</label>

          {/* Upload controls inline with header */}
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={onPickImage}
              className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-200"
            >
              {imageDataUrl ? 'Change photo' : 'Add photo'}
            </button>

            {imageDataUrl ? (
              <button
                type="button"
                onClick={removeImage}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm transition hover:bg-gray-50"
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
                className={[
                  'group rounded-xl border text-left shadow-sm transition hover:shadow',
                  'px-3 py-2 md:px-2.5 md:py-1.5',
                  active
                    ? 'border-pink-500 ring-2 ring-pink-500/20'
                    : 'border-gray-200',
                  s.pillClass,
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold md:text-[13px] md:leading-5">
                    {s.label}
                  </div>
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

        {imageError ? (
          <div className="mt-2 text-xs text-red-600">{imageError}</div>
        ) : null}

        {imageDataUrl ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <img
              src={imageDataUrl}
              alt="Uploaded"
              className="h-32 w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      {/* From */}
      <div>
        <label className={labelBase}>From *</label>
        <input
          type="text"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          placeholder="Your name"
          className={inputBase}
          required
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || disabled || !isFormValid}
        className="
          w-full rounded-xl bg-pink-600 text-white py-2.5 text-sm font-semibold
          shadow-sm transition
          hover:bg-pink-700
          focus:outline-none focus:ring-2 focus:ring-pink-500/30
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading ? 'Creating…' : 'Create LoveDrop 💌'}
      </button>
    </form>
  )
}

export default LovedropCreateForm
